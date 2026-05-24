"""Unit tests for the bottom-up revenue forecast.

Why pure-calc tests live in tests/: every forecast number is downstream of two
inputs (searches, ARPU) plus default conversion rates. Locking those formulas
prevents silent drift when defaults are tuned.
"""

from __future__ import annotations

from clonepilot.analysis.forecast import DEFAULTS, compute_forecast
from clonepilot.analysis.schema import (
    Competitor,
    GeoShare,
    KeywordVolume,
    MarketData,
)


def _market(volume: int = 165_000, trend: int = 50) -> MarketData:
    return MarketData(
        category_keyword_seed="ai blog writer",
        global_monthly_searches=volume,
        five_year_trend="stable",
        trend_score_0_100=trend,
        top_keywords=[
            KeywordVolume(keyword="ai blog writer", volume=33_000, kd=62, cpc_usd=4.12),
        ],
        geo_distribution=[
            GeoShare(country="US", share_pct=41),
            GeoShare(country="IN", share_pct=11),
            GeoShare(country="GB", share_pct=7),
        ],
        data_sources=["ahrefs_keywords_explorer"],
    )


def _competitor(price: float = 39.0) -> Competitor:
    return Competitor(
        name="Jasper",
        url="https://jasper.ai",
        monthly_visits_est=2_400_000,
        traffic_source="similarweb",
        pricing_starting_usd=price,
        wedge_against="Niche over general copywriting.",
    )


def test_returns_none_without_searches() -> None:
    forecast = compute_forecast(market=None, competitors=[_competitor()], pricing_arpu_fallback_usd=29)
    assert forecast is None


def test_returns_none_without_any_arpu_signal() -> None:
    forecast = compute_forecast(market=_market(), competitors=[], pricing_arpu_fallback_usd=None)
    assert forecast is None


def test_tam_sam_som_chain_holds() -> None:
    forecast = compute_forecast(
        market=_market(), competitors=[_competitor()], pricing_arpu_fallback_usd=None
    )
    assert forecast is not None
    assert forecast.tam_annual > forecast.sam_annual > forecast.som_annual_year1 > 0


def test_competitor_price_wins_over_fallback() -> None:
    forecast = compute_forecast(
        market=_market(), competitors=[_competitor(price=99)], pricing_arpu_fallback_usd=10
    )
    assert forecast is not None
    assert forecast.assumptions.blended_arpu_monthly_usd == 99


def test_fallback_arpu_used_when_no_competitors() -> None:
    forecast = compute_forecast(
        market=_market(), competitors=[], pricing_arpu_fallback_usd=29
    )
    assert forecast is not None
    assert forecast.assumptions.blended_arpu_monthly_usd == 29


def test_category_capture_capped() -> None:
    forecast = compute_forecast(
        market=_market(trend=100), competitors=[_competitor()], pricing_arpu_fallback_usd=None
    )
    assert forecast is not None
    assert forecast.assumptions.category_capture_pct <= DEFAULTS["category_capture_max"]


def test_three_scenarios_ordered() -> None:
    forecast = compute_forecast(
        market=_market(), competitors=[_competitor()], pricing_arpu_fallback_usd=None
    )
    assert forecast is not None
    cons = forecast.scenarios["conservative"].mrr_month_12_usd
    base = forecast.scenarios["base"].mrr_month_12_usd
    aggr = forecast.scenarios["aggressive"].mrr_month_12_usd
    assert cons < base < aggr


def test_breakeven_positive() -> None:
    forecast = compute_forecast(
        market=_market(), competitors=[_competitor(price=39)], pricing_arpu_fallback_usd=None
    )
    assert forecast is not None
    assert forecast.breakeven_paid_users > 0
