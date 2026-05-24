"""Typed schema for DeepAnalysisReport (Phase 8.1).

Why pydantic: downstream consumers (Project-Pack generator in Phase 8.2,
gallery viewer in Phase 8.4) need a stable contract. Every nullable field
explicitly says "this data source could be absent" — never silently empty.

BusinessBlueprint is re-exported as a sub-field so legacy `scaffold(blueprint)`
and `deploy(repo_path)` keep working unchanged.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl

from clonepilot.blueprint.schema import BusinessBlueprint

# ---- Source / transcript meta --------------------------------------------------


class SourceMeta(BaseModel):
    youtube_url: HttpUrl
    video_id: str
    title: str | None = None
    channel: str | None = None
    duration_sec: int | None = None
    transcript_chars: int
    transcript_source: str  # "youtube-transcript-api" | "supadata"
    view_count: int | None = None
    like_count: int | None = None


# ---- Market data --------------------------------------------------------------


class KeywordVolume(BaseModel):
    keyword: str
    volume: int = Field(ge=0, description="Estimated monthly search volume.")
    kd: float | None = Field(
        default=None, ge=0, le=100, description="Keyword difficulty 0-100 (Ahrefs)."
    )
    cpc_usd: float | None = Field(
        default=None, ge=0, description="Cost per click in USD (Ahrefs)."
    )


class GeoShare(BaseModel):
    country: str = Field(description="ISO-3166 alpha-2 code, e.g. 'US'.")
    share_pct: float = Field(ge=0, le=100)
    monthly_searches: int | None = Field(default=None, ge=0)


TrendDirection = Literal["rising", "stable", "declining", "unknown"]


class MarketData(BaseModel):
    category_keyword_seed: str = Field(
        description="The single seed keyword the market query was built on."
    )
    global_monthly_searches: int | None = Field(
        default=None, ge=0, description="Sum across geos. None if no source returned data."
    )
    five_year_trend: TrendDirection = "unknown"
    trend_score_0_100: int = Field(
        default=50,
        ge=0,
        le=100,
        description="Composite of Trends slope + Ahrefs volume history. 50 = neutral.",
    )
    top_keywords: list[KeywordVolume] = Field(default_factory=list)
    geo_distribution: list[GeoShare] = Field(default_factory=list)
    data_sources: list[str] = Field(
        default_factory=list,
        description="Which adapters contributed, e.g. ['ahrefs_keywords_explorer', 'google_trends'].",
    )


# ---- Competitors --------------------------------------------------------------


class Competitor(BaseModel):
    name: str
    url: HttpUrl
    monthly_visits_est: int | None = Field(
        default=None, ge=0, description="Best estimate from SimilarWeb/Ahrefs."
    )
    traffic_source: str | None = Field(
        default=None, description="'similarweb' | 'ahrefs_site_metrics' | 'estimate'."
    )
    pricing_starting_usd: float | None = Field(
        default=None, ge=0, description="Lowest published paid tier we could find."
    )
    wedge_against: str | None = Field(
        default=None,
        description="One sentence on how the analyzed business beats this competitor.",
    )


# ---- Revenue forecast ---------------------------------------------------------


class ForecastAssumptions(BaseModel):
    global_searches_monthly: int = Field(ge=0)
    category_capture_pct: float = Field(ge=0, le=1)
    visitor_to_signup_pct: float = Field(ge=0, le=1)
    signup_to_paid_pct: float = Field(ge=0, le=1)
    blended_arpu_monthly_usd: float = Field(ge=0)
    monthly_churn_pct: float = Field(ge=0, le=1)
    servable_geo_share: float = Field(ge=0, le=1)


class ForecastScenario(BaseModel):
    mrr_month_12_usd: float = Field(ge=0)
    arr_year_1_usd: float = Field(ge=0)
    warning: str | None = None


class RevenueForecast(BaseModel):
    currency: Literal["USD"] = "USD"
    tam_annual: float = Field(ge=0, description="Total addressable market, annual USD.")
    sam_annual: float = Field(ge=0, description="Serviceable addressable, annual USD.")
    som_annual_year1: float = Field(
        ge=0, description="Realistic year-1 capture in USD."
    )
    assumptions: ForecastAssumptions
    scenarios: dict[Literal["conservative", "base", "aggressive"], ForecastScenario]
    breakeven_paid_users: int = Field(ge=0)
    notes: str = ""


# ---- SEO starter pack ---------------------------------------------------------


class SeoStarterPack(BaseModel):
    primary_keyword: str
    supporting_keywords: list[str] = Field(default_factory=list)
    suggested_titles: list[str] = Field(default_factory=list)
    suggested_meta_description: str
    domain_suggestions: list[str] = Field(default_factory=list)


# ---- i18n ---------------------------------------------------------------------

LangCode = Literal["en", "ko", "ja", "zh", "es"]


class LocalizedCopy(BaseModel):
    tagline: str
    hero: str = Field(description="2-3 sentence hero paragraph.")
    cta: str = Field(description="Primary call-to-action label.")
    value_props: list[str] = Field(
        min_length=3, max_length=6, description="Bullet value props in target language."
    )


class I18nBundle(BaseModel):
    default_lang: LangCode = "en"
    locales: dict[LangCode, LocalizedCopy] = Field(default_factory=dict)


# ---- Risks + GTM --------------------------------------------------------------

Severity = Literal["low", "med", "high"]


class Risk(BaseModel):
    risk: str
    severity: Severity
    mitigation: str


class GTMStep(BaseModel):
    day: int = Field(ge=0, le=365)
    action: str


# ---- Data quality -------------------------------------------------------------


class DataQuality(BaseModel):
    ahrefs_called: bool = False
    similarweb_called: bool = False
    trends_called: bool = False
    exa_called: bool = False
    youtube_data_called: bool = False
    fallbacks_used: list[str] = Field(default_factory=list)
    confidence_0_100: int = Field(default=50, ge=0, le=100)


# ---- Top-level report ---------------------------------------------------------


class DeepAnalysisReport(BaseModel):
    """Full deep-analysis output. Every external-data field is nullable."""

    schema_version: Literal["1.0"] = "1.0"
    generated_at: datetime
    source: SourceMeta
    blueprint: BusinessBlueprint
    market: MarketData | None = None
    competitors: list[Competitor] = Field(default_factory=list)
    revenue_forecast: RevenueForecast | None = None
    seo_starter_pack: SeoStarterPack | None = None
    i18n: I18nBundle | None = None
    risks: list[Risk] = Field(default_factory=list)
    go_to_market_90day: list[GTMStep] = Field(default_factory=list)
    data_quality: DataQuality
