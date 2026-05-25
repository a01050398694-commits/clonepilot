export type Lang = "en" | "ko" | "ja" | "zh" | "es";

export type PricingTier = {
  name: string;
  price_usd: number;
  features: string[];
};

export type VideoMeta = {
  url: string;
  video_id: string;
  title: string;
  channel: string;
  duration_sec: number;
};

export type Blueprint = {
  name: string;
  tagline: string;
  target_audience: string;
  problem: string;
  solution: string;
  key_features: string[];
  pricing_model: string;
  pricing_tiers: PricingTier[];
  channels: string[];
  tech_stack: string[];
  differentiation: string;
  cta_primary: string;
  cta_secondary: string;
  social_proof_hint: string;
  video: VideoMeta;
};

export type Source = {
  youtube_url: string;
  video_id: string;
  title: string;
  channel: string;
  duration_sec: number;
  transcript_chars: number;
  transcript_source: string;
  view_count: number | null;
  like_count: number | null;
};

export type KeywordRow = {
  keyword: string;
  monthly_searches: number | null;
  cpc_usd: number | null;
  difficulty: number | null;
};

export type GeoRow = {
  country_code: string;
  share_0_100: number;
};

export type MarketData = {
  category_keyword_seed: string;
  global_monthly_searches: number | null;
  five_year_trend: "rising" | "stable" | "declining" | "unknown";
  trend_score_0_100: number;
  top_keywords: KeywordRow[];
  geo_distribution: GeoRow[];
  data_sources: string[];
};

export type Competitor = {
  name: string;
  url: string;
  positioning: string;
  pricing_summary: string;
  estimated_traffic: number | null;
};

export type ForecastScenario = {
  label: "conservative" | "base" | "aggressive";
  monthly_signups: number;
  paid_conversions: number;
  arpu_usd_annual: number;
  arr_usd: number;
};

export type RevenueForecast = {
  tam_usd_annual: number;
  sam_usd_annual: number;
  som_usd_annual_year1: number;
  scenarios: ForecastScenario[];
  assumptions: string[];
};

export type SeoStarterPack = {
  primary_keyword: string;
  supporting_keywords: string[];
  suggested_titles: string[];
  suggested_meta_description: string;
  domain_suggestions: string[];
};

export type LocalizedCopy = {
  tagline: string;
  hero: string;
  cta: string;
  value_props: string[];
};

export type I18nBlock = {
  default_lang: Lang;
  locales: Partial<Record<Lang, LocalizedCopy>>;
};

export type Risk = {
  risk: string;
  severity: "low" | "med" | "high";
  mitigation: string;
};

export type GTMStep = {
  day: number;
  action: string;
};

export type DataQuality = {
  ahrefs_called: boolean;
  similarweb_called: boolean;
  trends_called: boolean;
  exa_called: boolean;
  youtube_data_called: boolean;
  fallbacks_used: string[];
  confidence_0_100: number;
};

export type DeepAnalysisReport = {
  schema_version: string;
  generated_at: string;
  source: Source;
  blueprint: Blueprint;
  market: MarketData;
  competitors: Competitor[];
  revenue_forecast: RevenueForecast | null;
  seo_starter_pack: SeoStarterPack;
  i18n: I18nBlock;
  risks: Risk[];
  go_to_market_90day: GTMStep[];
  data_quality: DataQuality;
};

export const SUPPORTED_LANGS: Lang[] = ["en", "ko", "ja", "zh", "es"];

export const LANG_LABELS: Record<Lang, string> = {
  en: "EN",
  ko: "KR",
  ja: "JP",
  zh: "ZH",
  es: "ES",
};

export function pickLocale(
  report: DeepAnalysisReport,
  lang: Lang,
): LocalizedCopy | null {
  return (
    report.i18n.locales[lang] ??
    report.i18n.locales[report.i18n.default_lang] ??
    null
  );
}

export function severityClass(s: Risk["severity"]): string {
  switch (s) {
    case "high":
      return "text-red-400 border-red-500/30 bg-red-500/5";
    case "med":
      return "text-amber-400 border-amber-500/30 bg-amber-500/5";
    default:
      return "text-zinc-400 border-zinc-700 bg-zinc-900/50";
  }
}
