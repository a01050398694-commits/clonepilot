"""Deep-analysis orchestration — composes all adapters into one report.

Each stage is independent and fail-soft:
  S0 transcript → S1 video meta → S2 blueprint → S3 seed keywords →
  S4 Ahrefs market → S5 Trends → S6 Exa competitors → S7 forecast →
  S8 SEO pack → S9 i18n → S10 risks + GTM → S11 confidence

A failed stage logs into data_quality.fallbacks_used and may degrade
confidence_0_100, but never aborts the report. The caller always gets a
fully-structured DeepAnalysisReport.
"""

from __future__ import annotations

from datetime import datetime, timezone

import httpx
from anthropic import Anthropic

from clonepilot.analysis.competitors import fetch_competitors
from clonepilot.analysis.forecast import compute_forecast
from clonepilot.analysis.i18n import DEFAULT_LANGS, generate_i18n
from clonepilot.analysis.keywords import fetch_keywords
from clonepilot.analysis.schema import (
    DataQuality,
    DeepAnalysisReport,
    GeoShare,
    KeywordVolume,
    MarketData,
    SourceMeta,
)
from clonepilot.analysis.seo import generate_seo_pack
from clonepilot.analysis.strategy import generate_strategy
from clonepilot.analysis.trends import fetch_trends
from clonepilot.blueprint.extractor import extract_blueprint
from clonepilot.blueprint.schema import BusinessBlueprint, VideoSource
from clonepilot.blueprint.transcript import fetch_transcript
from clonepilot.blueprint.youtube import extract_video_id
from clonepilot.config import Config


def run_deep_analysis(youtube_url: str, cfg: Config | None = None) -> DeepAnalysisReport:
    cfg = cfg or Config.load()
    fallbacks: list[str] = []
    dq = DataQuality()

    # ---- S0 transcript ----
    video_id = extract_video_id(youtube_url)
    canonical_url = f"https://www.youtube.com/watch?v={video_id}"
    transcript = fetch_transcript(video_id, cfg)

    # ---- S1 video meta (oEmbed + optional YouTube Data API) ----
    video_meta = _fetch_video_meta(video_id, canonical_url, cfg, dq, fallbacks)

    # ---- S2 blueprint (Claude tool_use) ----
    blueprint = extract_blueprint(
        transcript_text=transcript.text,
        video=video_meta,
        cfg=cfg,
    )

    # ---- S3 seed keywords (LLM-derived) ----
    seed_keywords = _derive_seed_keywords(cfg, blueprint, fallbacks)
    primary_keyword = seed_keywords[0] if seed_keywords else blueprint.name.lower()

    # ---- S4 Ahrefs market data ----
    ahrefs = fetch_keywords(cfg.ahrefs_api_key, seed_keywords, primary_keyword)
    if ahrefs is None:
        fallbacks.append("ahrefs: skipped (no key or HTTP failure)")
    else:
        dq.ahrefs_called = True

    # ---- S5 Google Trends ----
    trends = fetch_trends(primary_keyword)
    if trends is None:
        fallbacks.append("trends: skipped (rate-limited or network)")
    else:
        dq.trends_called = True

    market = _compose_market(primary_keyword, ahrefs, trends)

    # ---- S6 Exa competitors ----
    competitors = fetch_competitors(cfg, blueprint, primary_keyword)
    if not competitors:
        fallbacks.append("exa: 0 competitors fetched (no key, no results, or LLM refusal)")
    else:
        dq.exa_called = True

    # ---- S7 forecast ----
    fallback_arpu = _median_blueprint_price(blueprint)
    forecast = compute_forecast(market, competitors, fallback_arpu)
    if forecast is None:
        fallbacks.append("forecast: not computed (no search volume + no ARPU signal)")

    # ---- S8 SEO pack ----
    supporting = market.top_keywords if market else []
    seo_pack = generate_seo_pack(cfg, blueprint, primary_keyword, supporting)
    if seo_pack is None:
        fallbacks.append("seo_pack: skipped (no Anthropic key or LLM failure)")

    # ---- S9 i18n ----
    i18n = generate_i18n(cfg, blueprint, DEFAULT_LANGS)
    if i18n is None:
        fallbacks.append("i18n: skipped (no Anthropic key or LLM failure)")

    # ---- S10 risks + 90-day GTM ----
    risks, gtm = generate_strategy(cfg, blueprint, market, competitors)
    if not risks and not gtm:
        fallbacks.append("strategy: empty (no Anthropic key or LLM failure)")

    # ---- S11 confidence ----
    dq.fallbacks_used = fallbacks
    dq.confidence_0_100 = _confidence(dq, market, competitors, forecast, i18n, risks)

    return DeepAnalysisReport(
        generated_at=datetime.now(timezone.utc),
        source=SourceMeta(
            youtube_url=canonical_url,
            video_id=video_id,
            title=video_meta.title,
            channel=video_meta.channel,
            duration_sec=video_meta.duration_sec,
            transcript_chars=len(transcript.text),
            transcript_source=transcript.source,
        ),
        blueprint=blueprint,
        market=market,
        competitors=competitors,
        revenue_forecast=forecast,
        seo_starter_pack=seo_pack,
        i18n=i18n,
        risks=risks,
        go_to_market_90day=gtm,
        data_quality=dq,
    )


def _fetch_video_meta(
    video_id: str,
    canonical_url: str,
    cfg: Config,
    dq: DataQuality,
    fallbacks: list[str],
) -> VideoSource:
    title = channel = None
    duration_sec = None

    # oEmbed: no key required, gives title + channel.
    try:
        oembed = httpx.get(
            "https://www.youtube.com/oembed",
            params={"url": canonical_url, "format": "json"},
            timeout=10.0,
        )
        if oembed.status_code == 200:
            data = oembed.json()
            title = data.get("title")
            channel = data.get("author_name")
    except httpx.HTTPError:
        fallbacks.append("oembed: HTTP failed")

    # YouTube Data API: optional, gives duration + view/like counts.
    if cfg.youtube_api_key:
        try:
            resp = httpx.get(
                "https://www.googleapis.com/youtube/v3/videos",
                params={
                    "part": "contentDetails,statistics",
                    "id": video_id,
                    "key": cfg.youtube_api_key,
                },
                timeout=15.0,
            )
            if resp.status_code == 200:
                items = resp.json().get("items", [])
                if items:
                    dq.youtube_data_called = True
                    duration_sec = _parse_iso_duration(
                        items[0].get("contentDetails", {}).get("duration")
                    )
        except httpx.HTTPError:
            fallbacks.append("youtube_data: HTTP failed")

    return VideoSource(
        url=canonical_url,
        video_id=video_id,
        title=title,
        channel=channel,
        duration_sec=duration_sec,
    )


def _parse_iso_duration(iso: str | None) -> int | None:
    """Minimal ISO-8601 PT#H#M#S → seconds. Returns None for malformed input."""
    if not iso or not iso.startswith("PT"):
        return None
    import re

    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", iso)
    if not m:
        return None
    h, mi, s = (int(x) if x else 0 for x in m.groups())
    total = h * 3600 + mi * 60 + s
    return total or None


def _derive_seed_keywords(
    cfg: Config, blueprint: BusinessBlueprint, fallbacks: list[str]
) -> list[str]:
    """Ask Claude for 3-5 seed search keywords this product would target."""
    if not cfg.anthropic_api_key:
        fallbacks.append("seed_keywords: anthropic key missing, using product name only")
        return [blueprint.name.lower()]

    client = Anthropic(api_key=cfg.require_anthropic())
    system = (
        "Extract 3-5 short search keywords (2-4 words each) that the target "
        "audience would type into Google to discover this product. Prefer "
        "category-defining keywords over brand names. Return as a JSON array."
    )
    user = (
        f"Product: {blueprint.name} — {blueprint.tagline}\n"
        f"Audience: {blueprint.target_audience}\n"
        f"Solution: {blueprint.solution}\n"
        f"Features: {', '.join(blueprint.key_features)}"
    )

    tool_schema = {
        "type": "object",
        "properties": {
            "keywords": {
                "type": "array",
                "items": {"type": "string"},
                "minItems": 3,
                "maxItems": 6,
            }
        },
        "required": ["keywords"],
    }

    try:
        response = client.messages.create(
            model=cfg.model_blueprint,
            max_tokens=400,
            system=system,
            tools=[
                {
                    "name": "submit_keywords",
                    "description": "Submit seed search keywords.",
                    "input_schema": tool_schema,
                }
            ],
            tool_choice={"type": "tool", "name": "submit_keywords"},
            messages=[{"role": "user", "content": user}],
        )
        for block in response.content:
            if getattr(block, "type", None) == "tool_use":
                kws = block.input.get("keywords") or []
                clean = [k.strip().lower() for k in kws if isinstance(k, str) and k.strip()]
                if clean:
                    return clean
    except Exception:  # noqa: BLE001
        fallbacks.append("seed_keywords: LLM failure")

    return [blueprint.name.lower()]


def _compose_market(
    primary_keyword: str,
    ahrefs_result,
    trends_result,
) -> MarketData | None:
    if ahrefs_result is None and trends_result is None:
        return None

    top_keywords: list[KeywordVolume] = []
    geo_distribution: list[GeoShare] = []
    global_searches: int | None = None
    sources: list[str] = []
    direction = "unknown"
    score = 50

    if ahrefs_result is not None:
        top_keywords = ahrefs_result.keywords
        geo_distribution = ahrefs_result.geo_distribution
        global_searches = ahrefs_result.global_monthly_searches
        sources.append("ahrefs_keywords_explorer")

    if trends_result is not None:
        direction = trends_result.direction
        score = trends_result.score_0_100
        if not geo_distribution and trends_result.geo_distribution:
            geo_distribution = trends_result.geo_distribution
        sources.append("google_trends")

    return MarketData(
        category_keyword_seed=primary_keyword,
        global_monthly_searches=global_searches,
        five_year_trend=direction,
        trend_score_0_100=score,
        top_keywords=top_keywords,
        geo_distribution=geo_distribution,
        data_sources=sources,
    )


def _median_blueprint_price(bp: BusinessBlueprint) -> float | None:
    """Median price of paid tiers in the blueprint — last-resort ARPU anchor."""
    paid = [t.price_usd for t in bp.pricing_tiers if t.price_usd > 0]
    if not paid:
        return None
    paid.sort()
    mid = len(paid) // 2
    return paid[mid] if len(paid) % 2 else (paid[mid - 1] + paid[mid]) / 2


def _confidence(
    dq: DataQuality,
    market: MarketData | None,
    competitors: list,
    forecast,
    i18n,
    risks: list,
) -> int:
    """Combine which adapters succeeded into a 0-100 confidence score.

    Weights tuned so the user can read confidence as "how anchored to real
    external data is this report" — pure LLM output without any market signal
    floors at ~30.
    """
    score = 30  # Baseline: we always have transcript + blueprint.
    if dq.ahrefs_called:
        score += 20
    if dq.trends_called:
        score += 10
    if dq.exa_called and competitors:
        score += 15
    if forecast is not None:
        score += 10
    if i18n is not None and len(i18n.locales) >= 4:
        score += 10
    if risks and len(risks) >= 3:
        score += 5
    return min(score, 100)
