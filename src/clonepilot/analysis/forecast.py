"""Bottom-up revenue forecast — pure calculation, no API calls.

Why bottom-up: top-down "AI market is $X trillion" numbers are useless at the
per-business resolution. We anchor every value in real measurable inputs:
keyword search volume (from Ahrefs/Trends), ARPU (from competitor pricing we
fetched), and industry-standard SaaS conversion funnels. Every assumption is
emitted in the report so the user can challenge the math.

All defaults live in DEFAULTS and can be overridden via .env without touching
this file (see Config.forecast_overrides if you add tuning later).
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from clonepilot.analysis.schema import (
    Competitor,
    ForecastAssumptions,
    ForecastScenario,
    MarketData,
    RevenueForecast,
)

# Industry-standard SaaS funnel defaults. Tunable per-project later.
DEFAULTS = {
    "category_capture_max": 0.05,  # Cap on year-1 category capture for a new entrant.
    "visitor_to_signup_pct": 0.03,  # SaaS landing-page average 2–4%.
    "signup_to_paid_pct": 0.04,  # B2C SaaS average 3–6%.
    "monthly_churn_pct": 0.06,  # Indie SaaS average 5–8%.
    "monthly_fixed_cost_usd": 200,  # Vercel + Supabase + Anthropic baseline.
    "servable_geo_share_default": 0.65,  # If we have no geo data, assume English-speaking + EU + JP/KR ≈ 65%.
}


@dataclass(frozen=True)
class ForecastInputs:
    """Resolved inputs after merging MarketData + Competitors + tier ARPU."""

    global_searches_monthly: int
    blended_arpu_monthly_usd: float
    servable_geo_share: float
    trend_score_0_100: int


def compute_forecast(
    market: MarketData | None,
    competitors: list[Competitor],
    pricing_arpu_fallback_usd: float | None,
) -> RevenueForecast | None:
    """Compute TAM/SAM/SOM + 3 scenarios.

    Returns None when we have neither a search-volume signal nor any ARPU
    signal — without those two anchors any number we emit would be invented.
    """
    inputs = _resolve_inputs(market, competitors, pricing_arpu_fallback_usd)
    if inputs is None:
        return None

    assumptions = ForecastAssumptions(
        global_searches_monthly=inputs.global_searches_monthly,
        category_capture_pct=_realistic_capture(inputs.trend_score_0_100),
        visitor_to_signup_pct=DEFAULTS["visitor_to_signup_pct"],
        signup_to_paid_pct=DEFAULTS["signup_to_paid_pct"],
        blended_arpu_monthly_usd=inputs.blended_arpu_monthly_usd,
        monthly_churn_pct=DEFAULTS["monthly_churn_pct"],
        servable_geo_share=inputs.servable_geo_share,
    )

    annual_intent = inputs.global_searches_monthly * 12
    annual_arpu = inputs.blended_arpu_monthly_usd * 12

    tam = (
        annual_intent
        * assumptions.visitor_to_signup_pct
        * assumptions.signup_to_paid_pct
        * annual_arpu
    )
    sam = tam * inputs.servable_geo_share
    som = sam * assumptions.category_capture_pct

    base_mrr_m12 = som / 12
    scenarios = {
        "conservative": ForecastScenario(
            mrr_month_12_usd=round(base_mrr_m12 * 0.3, 2),
            arr_year_1_usd=round(base_mrr_m12 * 0.3 * 12, 2),
        ),
        "base": ForecastScenario(
            mrr_month_12_usd=round(base_mrr_m12, 2),
            arr_year_1_usd=round(base_mrr_m12 * 12, 2),
        ),
        "aggressive": ForecastScenario(
            mrr_month_12_usd=round(base_mrr_m12 * 2.5, 2),
            arr_year_1_usd=round(base_mrr_m12 * 2.5 * 12, 2),
        ),
    }

    monthly_fixed = DEFAULTS["monthly_fixed_cost_usd"]
    effective_arpu = inputs.blended_arpu_monthly_usd * (1 - assumptions.monthly_churn_pct)
    breakeven = math.ceil(monthly_fixed / effective_arpu) if effective_arpu > 0 else 0

    return RevenueForecast(
        tam_annual=round(tam, 2),
        sam_annual=round(sam, 2),
        som_annual_year1=round(som, 2),
        assumptions=assumptions,
        scenarios=scenarios,
        breakeven_paid_users=breakeven,
        notes=_compose_notes(inputs, assumptions),
    )


def _resolve_inputs(
    market: MarketData | None,
    competitors: list[Competitor],
    pricing_arpu_fallback_usd: float | None,
) -> ForecastInputs | None:
    searches = (market.global_monthly_searches if market else None) or 0
    if searches <= 0:
        return None

    arpu = _blended_arpu(competitors, pricing_arpu_fallback_usd)
    if arpu is None or arpu <= 0:
        return None

    geo_share = DEFAULTS["servable_geo_share_default"]
    if market and market.geo_distribution:
        top5 = sorted(market.geo_distribution, key=lambda g: g.share_pct, reverse=True)[:5]
        share = sum(g.share_pct for g in top5) / 100
        if share > 0:
            geo_share = min(max(share, 0.1), 1.0)

    return ForecastInputs(
        global_searches_monthly=searches,
        blended_arpu_monthly_usd=arpu,
        servable_geo_share=geo_share,
        trend_score_0_100=market.trend_score_0_100 if market else 50,
    )


def _blended_arpu(
    competitors: list[Competitor],
    pricing_arpu_fallback_usd: float | None,
) -> float | None:
    """Median competitor entry price > blueprint's own median tier > nothing."""
    prices = [c.pricing_starting_usd for c in competitors if c.pricing_starting_usd]
    if prices:
        return _median(prices)
    return pricing_arpu_fallback_usd


def _median(xs: list[float]) -> float:
    s = sorted(xs)
    n = len(s)
    if n == 0:
        return 0.0
    mid = n // 2
    return s[mid] if n % 2 else (s[mid - 1] + s[mid]) / 2


def _realistic_capture(trend_score: int) -> float:
    """Map trend_score [0,100] → realistic year-1 category capture, capped."""
    raw = 0.02 * (trend_score / 100)
    return min(raw, DEFAULTS["category_capture_max"])


def _compose_notes(inputs: ForecastInputs, assumptions: ForecastAssumptions) -> str:
    parts = [
        f"Anchored on {inputs.global_searches_monthly:,} global monthly searches and a ${inputs.blended_arpu_monthly_usd:.2f} blended ARPU.",
        f"Base scenario assumes {assumptions.category_capture_pct * 100:.2f}% year-1 category capture.",
        "No paid acquisition modelled.",
    ]
    return " ".join(parts)
