"""Competitor discovery via Exa search + LLM price extraction.

Pipeline:
  1. Exa `/search` for "<seed> tools 2026" → 5–10 candidate URLs
  2. For each: httpx.get the URL itself (homepage) + a /pricing variant
  3. Ask Claude to extract `{name, pricing_starting_usd, wedge_against}` per
     site, with the seed-business context in the prompt so wedge claims are
     grounded.

Fail-soft pattern:
  - No EXA_API_KEY → return [] immediately.
  - Network failure on any individual site → that site is skipped, not the
    whole list.
  - Claude refusal / non-JSON → site dropped from output.
"""

from __future__ import annotations

from dataclasses import dataclass

import httpx
from anthropic import Anthropic

from clonepilot.analysis.schema import Competitor
from clonepilot.blueprint.schema import BusinessBlueprint
from clonepilot.config import Config

_EXA_SEARCH = "https://api.exa.ai/search"
_CANDIDATE_LIMIT = 8
_FETCH_TIMEOUT = 12.0
_MAX_HTML_CHARS = 8000  # Per site, before Claude sees it.


@dataclass(frozen=True)
class CompetitorCandidate:
    url: str
    title: str
    homepage_text: str
    pricing_text: str


def fetch_competitors(
    cfg: Config,
    blueprint: BusinessBlueprint,
    seed_keyword: str,
) -> list[Competitor]:
    if not cfg.exa_api_key:
        return []

    try:
        candidates = _exa_search(cfg.exa_api_key, seed_keyword)
    except httpx.HTTPError:
        return []
    if not candidates:
        return []

    enriched = [_fetch_site(c) for c in candidates]
    enriched = [c for c in enriched if c is not None]
    if not enriched:
        return []

    if not cfg.anthropic_api_key:
        # Without Claude we'd just emit raw URLs; the schema requires a name
        # field, so degrade to empty and let confidence drop.
        return []

    try:
        return _extract_competitors(cfg, blueprint, enriched)
    except Exception:  # noqa: BLE001 — defensive, fail-soft on any LLM hiccup
        return []


def _exa_search(api_key: str, seed: str) -> list[dict]:
    query = f"best {seed} tools and competitors"
    resp = httpx.post(
        _EXA_SEARCH,
        headers={"x-api-key": api_key, "Content-Type": "application/json"},
        json={
            "query": query,
            "type": "neural",
            "numResults": _CANDIDATE_LIMIT,
            "useAutoprompt": True,
            "category": "company",
        },
        timeout=20.0,
    )
    if resp.status_code != 200:
        return []
    return resp.json().get("results", [])


def _fetch_site(result: dict) -> CompetitorCandidate | None:
    url = result.get("url")
    title = result.get("title") or ""
    if not url:
        return None

    home = _safe_get(url)
    if not home:
        return None
    pricing = _safe_get(_pricing_variant(url))
    return CompetitorCandidate(
        url=url,
        title=title,
        homepage_text=_strip_html(home)[:_MAX_HTML_CHARS],
        pricing_text=_strip_html(pricing or "")[:_MAX_HTML_CHARS],
    )


def _pricing_variant(url: str) -> str:
    base = url.rstrip("/")
    return f"{base}/pricing"


def _safe_get(url: str) -> str | None:
    try:
        resp = httpx.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; ClonePilot/1.0; +https://clonepilot.dev)"
            },
            follow_redirects=True,
            timeout=_FETCH_TIMEOUT,
        )
        if resp.status_code != 200:
            return None
        return resp.text
    except httpx.HTTPError:
        return None
    except Exception:  # noqa: BLE001
        return None


def _strip_html(html: str) -> str:
    """Cheap HTML-to-text. We don't need fidelity — Claude is robust to noise."""
    if not html:
        return ""
    import re

    text = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.IGNORECASE)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _extract_competitors(
    cfg: Config,
    blueprint: BusinessBlueprint,
    candidates: list[CompetitorCandidate],
) -> list[Competitor]:
    """Ask Claude to extract one Competitor record per candidate site."""
    client = Anthropic(api_key=cfg.require_anthropic())

    bp_summary = (
        f"Product being analyzed: {blueprint.name} — {blueprint.tagline}\n"
        f"Target: {blueprint.target_audience}\n"
        f"Differentiation it claims: {blueprint.differentiation}\n"
    )

    sites_block = "\n\n".join(
        f"### CANDIDATE #{i + 1}\n"
        f"URL: {c.url}\n"
        f"Search title: {c.title}\n"
        f"HOMEPAGE TEXT:\n{c.homepage_text}\n"
        f"PRICING PAGE TEXT:\n{c.pricing_text or '(not available)'}"
        for i, c in enumerate(candidates)
    )

    system = (
        "You map competitors against a target product. For each candidate site, "
        "decide whether it is a real direct competitor (not a blog post, news "
        "article, marketplace listing, or unrelated SaaS). Drop irrelevant ones. "
        "Extract: brand name, lowest paid tier price in USD per month (use null "
        "if unclear or if the product is free-only), and a one-sentence wedge "
        "the target product can use against this competitor. Call submit_competitors once."
    )

    tool_schema = {
        "type": "object",
        "properties": {
            "competitors": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "url": {"type": "string"},
                        "pricing_starting_usd": {"type": ["number", "null"]},
                        "wedge_against": {"type": "string"},
                    },
                    "required": ["name", "url", "wedge_against"],
                },
            }
        },
        "required": ["competitors"],
    }

    response = client.messages.create(
        model=cfg.model_blueprint,
        max_tokens=2048,
        system=system,
        tools=[
            {
                "name": "submit_competitors",
                "description": "Submit the filtered + enriched competitor list.",
                "input_schema": tool_schema,
            }
        ],
        tool_choice={"type": "tool", "name": "submit_competitors"},
        messages=[{"role": "user", "content": bp_summary + "\n\n" + sites_block}],
    )

    payload = _find_tool_use_payload(response)
    items = payload.get("competitors", [])

    out: list[Competitor] = []
    for item in items:
        url = item.get("url")
        name = item.get("name")
        if not url or not name:
            continue
        try:
            out.append(
                Competitor(
                    name=name,
                    url=url,
                    pricing_starting_usd=item.get("pricing_starting_usd"),
                    wedge_against=item.get("wedge_against"),
                )
            )
        except Exception:  # noqa: BLE001 — pydantic url validation can refuse
            continue
    return out


def _find_tool_use_payload(response) -> dict:
    for block in response.content:
        if getattr(block, "type", None) == "tool_use":
            return dict(block.input)
    return {}
