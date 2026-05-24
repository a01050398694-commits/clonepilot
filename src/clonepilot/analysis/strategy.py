"""Strategy adapter — risks + 90-day go-to-market plan from one Claude call.

Why bundle risks and GTM together: they share the same context (blueprint +
market + competitors). One tool_use call → two outputs → half the tokens.
"""

from __future__ import annotations

from anthropic import Anthropic

from clonepilot.analysis.schema import (
    Competitor,
    GTMStep,
    MarketData,
    Risk,
)
from clonepilot.blueprint.schema import BusinessBlueprint
from clonepilot.config import Config


def generate_strategy(
    cfg: Config,
    blueprint: BusinessBlueprint,
    market: MarketData | None,
    competitors: list[Competitor],
) -> tuple[list[Risk], list[GTMStep]]:
    """Return (risks, gtm_90day_steps). Falls back to ([], []) on any failure."""
    if not cfg.anthropic_api_key:
        return ([], [])

    client = Anthropic(api_key=cfg.require_anthropic())

    market_brief = (
        f"Seed keyword: {market.category_keyword_seed}\n"
        f"Global monthly searches: {market.global_monthly_searches}\n"
        f"Trend: {market.five_year_trend} (score {market.trend_score_0_100}/100)\n"
        if market
        else "Market data: unavailable.\n"
    )

    comp_brief = (
        "Competitors:\n"
        + "\n".join(
            f"- {c.name} (${c.pricing_starting_usd or 'unknown'}/mo): {c.wedge_against or ''}"
            for c in competitors
        )
        if competitors
        else "Competitors: no data fetched.\n"
    )

    bp_brief = (
        f"Product: {blueprint.name} — {blueprint.tagline}\n"
        f"Target: {blueprint.target_audience}\n"
        f"Differentiation: {blueprint.differentiation}\n"
        f"Primary channels: {', '.join(blueprint.channels)}\n"
    )

    system = (
        "You are a startup strategist. Given a product brief, market signal, "
        "and competitor map, output (1) the top 4-6 real risks ranked by severity, "
        "each with a concrete mitigation, and (2) a 90-day go-to-market plan as "
        "8-12 dated steps (day 1, 7, 14, 30, 45, 60, 75, 90). Be specific — "
        "name actual platforms, channels, and tactics, not generic advice. "
        "Call submit_strategy once."
    )

    user = (
        bp_brief + "\n" + market_brief + "\n" + comp_brief + "\n"
        "Generate risks and a 90-day GTM. Call submit_strategy now."
    )

    tool_schema = {
        "type": "object",
        "properties": {
            "risks": {
                "type": "array",
                "minItems": 3,
                "maxItems": 8,
                "items": {
                    "type": "object",
                    "properties": {
                        "risk": {"type": "string"},
                        "severity": {"type": "string", "enum": ["low", "med", "high"]},
                        "mitigation": {"type": "string"},
                    },
                    "required": ["risk", "severity", "mitigation"],
                },
            },
            "go_to_market_90day": {
                "type": "array",
                "minItems": 6,
                "maxItems": 14,
                "items": {
                    "type": "object",
                    "properties": {
                        "day": {"type": "integer", "minimum": 0, "maximum": 365},
                        "action": {"type": "string"},
                    },
                    "required": ["day", "action"],
                },
            },
        },
        "required": ["risks", "go_to_market_90day"],
    }

    try:
        # Bigger budget — Korean/Japanese characters are 2 tokens each and the
        # 6 risks + 12 GTM steps can easily blow past 2500. Truncation drops
        # whichever section comes second in the JSON, silently giving empty.
        response = client.messages.create(
            model=cfg.model_blueprint,
            max_tokens=6000,
            system=system,
            tools=[
                {
                    "name": "submit_strategy",
                    "description": "Submit ranked risks and a dated 90-day GTM plan.",
                    "input_schema": tool_schema,
                }
            ],
            tool_choice={"type": "tool", "name": "submit_strategy"},
            messages=[{"role": "user", "content": user}],
        )
    except Exception:  # noqa: BLE001
        return ([], [])

    payload = _find_tool_use_payload(response)

    risks: list[Risk] = []
    for r in payload.get("risks", []):
        try:
            risks.append(Risk(**r))
        except Exception:  # noqa: BLE001
            continue

    steps: list[GTMStep] = []
    for s in payload.get("go_to_market_90day", []):
        try:
            steps.append(GTMStep(**s))
        except Exception:  # noqa: BLE001
            continue
    steps.sort(key=lambda x: x.day)

    return (risks, steps)


def _find_tool_use_payload(response) -> dict:
    for block in response.content:
        if getattr(block, "type", None) == "tool_use":
            return dict(block.input)
    return {}
