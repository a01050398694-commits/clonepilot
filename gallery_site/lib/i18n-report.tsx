import type { Lang } from "./i18n";

export type ReportDict = {
  nav_gallery_back: string;
  header_eyebrow: (confidence: number) => string;
  cta_run_default: string;
  cta_source_video: string;
  video_meta: (minutes: number, chars: number) => string;
  info_target: string;
  info_problem: string;
  info_solution: string;
  section_value_props: string;
  section_pricing_tiers: string;
  section_revenue_forecast: string;
  forecast_empty_hint: string;
  forecast_scenario: string;
  forecast_signups: string;
  forecast_paid: string;
  forecast_arpu: string;
  forecast_arr: string;
  forecast_scenario_conservative: string;
  forecast_scenario_base: string;
  forecast_scenario_aggressive: string;
  forecast_tam: string;
  forecast_sam: string;
  forecast_som: string;
  forecast_assumptions: string;
  section_competitors: string;
  competitors_empty_hint_prefix: string;
  competitors_empty_hint_suffix: string;
  competitor_traffic_suffix: string;
  section_market_trend: string;
  stat_5_year_trend: string;
  stat_trend_score: string;
  stat_global_searches: string;
  trend_rising: string;
  trend_stable: string;
  trend_declining: string;
  trend_unknown: string;
  market_seed_keyword: string;
  market_sources: string;
  table_keyword: string;
  table_searches: string;
  table_cpc: string;
  table_difficulty: string;
  section_seo_pack: string;
  seo_primary_keyword: string;
  seo_suggested_titles: string;
  seo_meta_desc: string;
  seo_domain_ideas: string;
  section_risks: (count: number) => string;
  risk_high: string;
  risk_med: string;
  risk_low: string;
  risk_mitigation_label: string;
  section_gtm: string;
  gtm_day_label: string;
  section_data_quality: string;
  dq_fallbacks_label: string;
  dq_confidence_explanation: string;
  bottom_cta_eyebrow: string;
  bottom_cta_title: string;
  bottom_cta_body: string;
  bottom_cta_install: string;
  bottom_cta_pricing: string;
};

const EN: ReportDict = {
  nav_gallery_back: "← gallery",
  header_eyebrow: (c) => `Deep analysis · v1 · confidence ${c}/100`,
  cta_run_default: "Run this in MY Claude Code",
  cta_source_video: "▶ Source video",
  video_meta: (m, c) => `${m} min · ${c.toLocaleString()} chars`,
  info_target: "Target",
  info_problem: "Problem",
  info_solution: "Solution",
  section_value_props: "Value props",
  section_pricing_tiers: "Pricing tiers extracted",
  section_revenue_forecast: "Revenue forecast",
  forecast_empty_hint:
    "Set AHREFS_API_KEY in your .env to unlock TAM/SAM/SOM + 3-scenario ARR. (Trend score alone isn't enough signal — needs search-volume + CPC.)",
  forecast_scenario: "Scenario",
  forecast_signups: "Monthly signups",
  forecast_paid: "Paid conv.",
  forecast_arpu: "ARPU (annual)",
  forecast_arr: "ARR",
  forecast_scenario_conservative: "Conservative",
  forecast_scenario_base: "Base",
  forecast_scenario_aggressive: "Aggressive",
  forecast_tam: "TAM (annual)",
  forecast_sam: "SAM (annual)",
  forecast_som: "SOM year 1",
  forecast_assumptions: "Assumptions",
  section_competitors: "Competitors",
  competitors_empty_hint_prefix:
    "No competitors fetched. Set ",
  competitors_empty_hint_suffix:
    " in your .env to scan for 5-8 closest competitors automatically.",
  competitor_traffic_suffix: "/mo",
  section_market_trend: "Market trend",
  stat_5_year_trend: "5-year trend",
  stat_trend_score: "Trend score",
  stat_global_searches: "Global searches/mo",
  trend_rising: "↑ Rising",
  trend_stable: "→ Stable",
  trend_declining: "↓ Declining",
  trend_unknown: "? Unknown",
  market_seed_keyword: "seed keyword",
  market_sources: "sources",
  table_keyword: "Keyword",
  table_searches: "Searches",
  table_cpc: "CPC",
  table_difficulty: "Difficulty",
  section_seo_pack: "SEO starter pack",
  seo_primary_keyword: "primary keyword",
  seo_suggested_titles: "suggested titles",
  seo_meta_desc: "meta description",
  seo_domain_ideas: "domain ideas",
  section_risks: (n) => `Risks (${n})`,
  risk_high: "high",
  risk_med: "med",
  risk_low: "low",
  risk_mitigation_label: "↳ mitigation:",
  section_gtm: "90-day go-to-market",
  gtm_day_label: "day",
  section_data_quality: "Data quality",
  dq_fallbacks_label: "fallbacks used",
  dq_confidence_explanation:
    "Confidence reflects how many data sources contributed. Add API keys to your .env to raise it toward 100.",
  bottom_cta_eyebrow: "▶ Build your own",
  bottom_cta_title: "Want a deep report like this for your favorite video?",
  bottom_cta_body:
    "ClonePilot ships an analyze_deep MCP tool. Drop it in Claude Code, paste a YouTube URL, get this report + a deployed Next.js site.",
  bottom_cta_install: "Install free →",
  bottom_cta_pricing: "See Pro pricing",
};

const KO: ReportDict = {
  nav_gallery_back: "← 갤러리",
  header_eyebrow: (c) => `심층 분석 · v1 · 신뢰도 ${c}/100`,
  cta_run_default: "내 Claude Code에서 실행하기",
  cta_source_video: "▶ 원본 영상",
  video_meta: (m, c) => `${m}분 · ${c.toLocaleString()}자`,
  info_target: "타깃",
  info_problem: "문제",
  info_solution: "솔루션",
  section_value_props: "핵심 가치",
  section_pricing_tiers: "추출된 가격 티어",
  section_revenue_forecast: "수익 예측",
  forecast_empty_hint:
    ".env에 AHREFS_API_KEY를 넣으면 TAM/SAM/SOM + 3가지 시나리오 ARR이 열립니다. (트렌드 점수만으로는 신호 부족 — 검색량 + CPC가 필요).",
  forecast_scenario: "시나리오",
  forecast_signups: "월 가입자",
  forecast_paid: "유료 전환",
  forecast_arpu: "연 ARPU",
  forecast_arr: "ARR",
  forecast_scenario_conservative: "보수",
  forecast_scenario_base: "기본",
  forecast_scenario_aggressive: "공격",
  forecast_tam: "TAM (연)",
  forecast_sam: "SAM (연)",
  forecast_som: "1년차 SOM",
  forecast_assumptions: "가정",
  section_competitors: "경쟁사",
  competitors_empty_hint_prefix: "경쟁사 가져오지 못함. .env에 ",
  competitors_empty_hint_suffix:
    "를 넣으면 가장 가까운 경쟁사 5~8개를 자동 스캔합니다.",
  competitor_traffic_suffix: "/월",
  section_market_trend: "시장 트렌드",
  stat_5_year_trend: "5년 트렌드",
  stat_trend_score: "트렌드 점수",
  stat_global_searches: "월 글로벌 검색량",
  trend_rising: "↑ 상승",
  trend_stable: "→ 안정",
  trend_declining: "↓ 하락",
  trend_unknown: "? 미상",
  market_seed_keyword: "시드 키워드",
  market_sources: "출처",
  table_keyword: "키워드",
  table_searches: "검색량",
  table_cpc: "CPC",
  table_difficulty: "난이도",
  section_seo_pack: "SEO 스타터 팩",
  seo_primary_keyword: "메인 키워드",
  seo_suggested_titles: "추천 제목",
  seo_meta_desc: "메타 설명",
  seo_domain_ideas: "도메인 아이디어",
  section_risks: (n) => `위험 (${n}개)`,
  risk_high: "높음",
  risk_med: "중간",
  risk_low: "낮음",
  risk_mitigation_label: "↳ 완화 방안:",
  section_gtm: "90일 진출 전략",
  gtm_day_label: "일차",
  section_data_quality: "데이터 품질",
  dq_fallbacks_label: "사용된 폴백",
  dq_confidence_explanation:
    "신뢰도는 몇 개 데이터 소스가 기여했는지를 반영합니다. .env에 API 키를 추가하면 100에 가까워집니다.",
  bottom_cta_eyebrow: "▶ 직접 빌드해보기",
  bottom_cta_title: "본인이 좋아하는 영상에 대해 이런 심층 리포트를 받고 싶다면?",
  bottom_cta_body:
    "ClonePilot은 analyze_deep MCP 도구를 제공합니다. Claude Code에 설치하고 유튜브 URL만 붙여넣으면 이런 리포트 + 배포된 Next.js 사이트까지 받습니다.",
  bottom_cta_install: "무료 설치 →",
  bottom_cta_pricing: "Pro 가격 보기",
};

const JA: ReportDict = {
  nav_gallery_back: "← ギャラリー",
  header_eyebrow: (c) => `深掘り解析 · v1 · 信頼度 ${c}/100`,
  cta_run_default: "自分のClaude Codeで実行",
  cta_source_video: "▶ 元動画",
  video_meta: (m, c) => `${m}分 · ${c.toLocaleString()}文字`,
  info_target: "ターゲット",
  info_problem: "課題",
  info_solution: "ソリューション",
  section_value_props: "バリュープロポジション",
  section_pricing_tiers: "抽出された価格ティア",
  section_revenue_forecast: "収益予測",
  forecast_empty_hint:
    ".envにAHREFS_API_KEYを設定するとTAM/SAM/SOM + 3シナリオARRが開放されます。(トレンドスコア単独ではシグナル不足 — 検索ボリューム + CPCが必要)。",
  forecast_scenario: "シナリオ",
  forecast_signups: "月間サインアップ",
  forecast_paid: "有料転換",
  forecast_arpu: "年間ARPU",
  forecast_arr: "ARR",
  forecast_scenario_conservative: "保守",
  forecast_scenario_base: "ベース",
  forecast_scenario_aggressive: "強気",
  forecast_tam: "TAM (年)",
  forecast_sam: "SAM (年)",
  forecast_som: "1年目SOM",
  forecast_assumptions: "前提",
  section_competitors: "競合",
  competitors_empty_hint_prefix: "競合を取得できませんでした。.envに ",
  competitors_empty_hint_suffix:
    " を設定すると最も近い競合5〜8件を自動スキャンします。",
  competitor_traffic_suffix: "/月",
  section_market_trend: "市場トレンド",
  stat_5_year_trend: "5年トレンド",
  stat_trend_score: "トレンドスコア",
  stat_global_searches: "月間グローバル検索数",
  trend_rising: "↑ 上昇",
  trend_stable: "→ 安定",
  trend_declining: "↓ 下降",
  trend_unknown: "? 不明",
  market_seed_keyword: "シードキーワード",
  market_sources: "ソース",
  table_keyword: "キーワード",
  table_searches: "検索数",
  table_cpc: "CPC",
  table_difficulty: "難易度",
  section_seo_pack: "SEOスターターパック",
  seo_primary_keyword: "主要キーワード",
  seo_suggested_titles: "推奨タイトル",
  seo_meta_desc: "メタディスクリプション",
  seo_domain_ideas: "ドメイン案",
  section_risks: (n) => `リスク (${n}件)`,
  risk_high: "高",
  risk_med: "中",
  risk_low: "低",
  risk_mitigation_label: "↳ 対策:",
  section_gtm: "90日GTM",
  gtm_day_label: "日目",
  section_data_quality: "データ品質",
  dq_fallbacks_label: "使用されたフォールバック",
  dq_confidence_explanation:
    "信頼度は寄与したデータソース数を反映します。.envにAPIキーを追加すると100に近づきます。",
  bottom_cta_eyebrow: "▶ 自分でビルドする",
  bottom_cta_title: "お気に入りの動画でこんな深掘りレポートが欲しい?",
  bottom_cta_body:
    "ClonePilotはanalyze_deep MCPツールを提供します。Claude Codeに入れてYouTube URLを貼るだけでこのレポート+デプロイ済みNext.jsサイトが手に入ります。",
  bottom_cta_install: "無料インストール →",
  bottom_cta_pricing: "Pro料金を見る",
};

const ZH: ReportDict = {
  nav_gallery_back: "← 画廊",
  header_eyebrow: (c) => `深度分析 · v1 · 置信度 ${c}/100`,
  cta_run_default: "在我的 Claude Code 里运行",
  cta_source_video: "▶ 原视频",
  video_meta: (m, c) => `${m} 分钟 · ${c.toLocaleString()} 字符`,
  info_target: "目标用户",
  info_problem: "问题",
  info_solution: "方案",
  section_value_props: "核心价值",
  section_pricing_tiers: "提取的定价档位",
  section_revenue_forecast: "收益预测",
  forecast_empty_hint:
    "在 .env 中设置 AHREFS_API_KEY 即可解锁 TAM/SAM/SOM + 3 个场景 ARR。(仅有趋势分数信号不足 —— 需要搜索量 + CPC)。",
  forecast_scenario: "场景",
  forecast_signups: "月注册",
  forecast_paid: "付费转化",
  forecast_arpu: "年 ARPU",
  forecast_arr: "ARR",
  forecast_scenario_conservative: "保守",
  forecast_scenario_base: "基础",
  forecast_scenario_aggressive: "激进",
  forecast_tam: "TAM (年)",
  forecast_sam: "SAM (年)",
  forecast_som: "首年 SOM",
  forecast_assumptions: "假设",
  section_competitors: "竞品",
  competitors_empty_hint_prefix: "未获取到竞品。在 .env 中设置 ",
  competitors_empty_hint_suffix:
    " 即可自动扫描 5~8 个最接近的竞品。",
  competitor_traffic_suffix: "/月",
  section_market_trend: "市场趋势",
  stat_5_year_trend: "五年趋势",
  stat_trend_score: "趋势分数",
  stat_global_searches: "月全球搜索量",
  trend_rising: "↑ 上升",
  trend_stable: "→ 稳定",
  trend_declining: "↓ 下降",
  trend_unknown: "? 未知",
  market_seed_keyword: "种子关键词",
  market_sources: "数据源",
  table_keyword: "关键词",
  table_searches: "搜索量",
  table_cpc: "CPC",
  table_difficulty: "难度",
  section_seo_pack: "SEO 入门包",
  seo_primary_keyword: "主关键词",
  seo_suggested_titles: "推荐标题",
  seo_meta_desc: "meta 描述",
  seo_domain_ideas: "域名建议",
  section_risks: (n) => `风险 (${n} 项)`,
  risk_high: "高",
  risk_med: "中",
  risk_low: "低",
  risk_mitigation_label: "↳ 应对:",
  section_gtm: "90 天 GTM",
  gtm_day_label: "天",
  section_data_quality: "数据质量",
  dq_fallbacks_label: "使用的回退",
  dq_confidence_explanation:
    "置信度反映有多少数据源参与。在 .env 中添加 API 密钥可让它接近 100。",
  bottom_cta_eyebrow: "▶ 自己构建一个",
  bottom_cta_title: "想给你喜欢的视频做一份这样的深度报告吗?",
  bottom_cta_body:
    "ClonePilot 提供 analyze_deep MCP 工具。装到 Claude Code 里, 粘贴一个 YouTube URL, 就能拿到这份报告 + 一个已部署的 Next.js 站点。",
  bottom_cta_install: "免费安装 →",
  bottom_cta_pricing: "查看 Pro 定价",
};

const ES: ReportDict = {
  nav_gallery_back: "← galería",
  header_eyebrow: (c) => `Análisis profundo · v1 · confianza ${c}/100`,
  cta_run_default: "Ejecuta esto en MI Claude Code",
  cta_source_video: "▶ Vídeo original",
  video_meta: (m, c) => `${m} min · ${c.toLocaleString()} caracteres`,
  info_target: "Público",
  info_problem: "Problema",
  info_solution: "Solución",
  section_value_props: "Propuestas de valor",
  section_pricing_tiers: "Tiers de precio extraídos",
  section_revenue_forecast: "Pronóstico de ingresos",
  forecast_empty_hint:
    "Configura AHREFS_API_KEY en tu .env para desbloquear TAM/SAM/SOM + 3 escenarios de ARR. (Sólo la trend score no es señal suficiente — hace falta volumen de búsqueda + CPC).",
  forecast_scenario: "Escenario",
  forecast_signups: "Signups mensuales",
  forecast_paid: "Conv. pagadas",
  forecast_arpu: "ARPU anual",
  forecast_arr: "ARR",
  forecast_scenario_conservative: "Conservador",
  forecast_scenario_base: "Base",
  forecast_scenario_aggressive: "Agresivo",
  forecast_tam: "TAM (anual)",
  forecast_sam: "SAM (anual)",
  forecast_som: "SOM año 1",
  forecast_assumptions: "Supuestos",
  section_competitors: "Competencia",
  competitors_empty_hint_prefix:
    "No se obtuvieron competidores. Configura ",
  competitors_empty_hint_suffix:
    " en tu .env para escanear automáticamente 5-8 competidores más cercanos.",
  competitor_traffic_suffix: "/mes",
  section_market_trend: "Tendencia de mercado",
  stat_5_year_trend: "Tendencia 5 años",
  stat_trend_score: "Trend score",
  stat_global_searches: "Búsquedas globales/mes",
  trend_rising: "↑ Subiendo",
  trend_stable: "→ Estable",
  trend_declining: "↓ Bajando",
  trend_unknown: "? Desconocido",
  market_seed_keyword: "keyword semilla",
  market_sources: "fuentes",
  table_keyword: "Keyword",
  table_searches: "Búsquedas",
  table_cpc: "CPC",
  table_difficulty: "Dificultad",
  section_seo_pack: "Pack SEO inicial",
  seo_primary_keyword: "keyword principal",
  seo_suggested_titles: "títulos sugeridos",
  seo_meta_desc: "meta description",
  seo_domain_ideas: "ideas de dominio",
  section_risks: (n) => `Riesgos (${n})`,
  risk_high: "alto",
  risk_med: "medio",
  risk_low: "bajo",
  risk_mitigation_label: "↳ mitigación:",
  section_gtm: "GTM a 90 días",
  gtm_day_label: "día",
  section_data_quality: "Calidad de datos",
  dq_fallbacks_label: "fallbacks usados",
  dq_confidence_explanation:
    "La confianza refleja cuántas fuentes de datos contribuyeron. Añade API keys a tu .env para subirla hacia 100.",
  bottom_cta_eyebrow: "▶ Construye el tuyo",
  bottom_cta_title: "¿Quieres un reporte profundo así para tu vídeo favorito?",
  bottom_cta_body:
    "ClonePilot incluye la herramienta MCP analyze_deep. Suéltala en Claude Code, pega una URL de YouTube y obtén este reporte + un sitio Next.js desplegado.",
  bottom_cta_install: "Instalar gratis →",
  bottom_cta_pricing: "Ver precios Pro",
};

const DICT: Record<Lang, ReportDict> = { en: EN, ko: KO, ja: JA, zh: ZH, es: ES };

export function tReport(lang: Lang): ReportDict {
  return DICT[lang];
}
