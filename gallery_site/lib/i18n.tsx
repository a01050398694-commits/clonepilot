import type { FC, ReactNode } from "react";

export type Lang = "en" | "ko" | "ja" | "zh" | "es";

export const LANGS: readonly Lang[] = ["en", "ko", "ja", "zh", "es"] as const;

export const LANG_LABELS: Record<Lang, string> = {
  en: "EN",
  ko: "한",
  ja: "日",
  zh: "中",
  es: "ES",
};

export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "中文",
  es: "Español",
};

export const LANG_HTML: Record<Lang, string> = {
  en: "en",
  ko: "ko",
  ja: "ja",
  zh: "zh-CN",
  es: "es",
};

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGS as readonly string[]).includes(v);
}

type Em = FC<{ children: ReactNode }>;

export type Dict = {
  nav: {
    install: string;
    pricing: string;
    reports: string;
    github_aria: string;
  };
  footer: {
    line: string;
    reports: string;
    install: string;
    pricing: string;
    github: string;
  };
  hero: {
    badge: string;
    titleRich: (Em: Em) => ReactNode;
    subtitle: string;
    cta_install: string;
    cta_see_reports: string;
    cta_github: string;
    stat_reports_label: string;
    stat_languages_label: string;
    stat_build_time_label: string;
    stat_build_time_value: string;
    skip_queueRich: (Code: Em) => ReactNode;
  };
  how: {
    eyebrow: string;
    title: string;
    steps: ReadonlyArray<{ title: string; body: string }>;
  };
  gallery: {
    eyebrow: string;
    title: string;
    updated: string;
    empty: string;
    badge_full: string;
    badge_landing: string;
    confidence_label: string;
    trend_label: string;
    languages_label: string;
    top_risk_label: string;
    open_report: string;
    open_demo: string;
    v0_note: string;
  };
  waitlist: {
    eyebrow: string;
    title: string;
    bodyRich: (Em: Em) => ReactNode;
    pricing_hint_prefix: string;
    pricing_hint_link: string;
  };
  analyze_form: {
    live_badge: string;
    label_url: string;
    url_placeholder: string;
    submit: string;
    submitting: string;
    submitting_hint: string;
    disclaimer: string;
    card_brand: string;
    card_tagline: string;
    card_target: string;
    card_problem: string;
    card_solution: string;
    card_confidence: string;
    card_risk: string;
    card_transcript_chars: string;
    card_install_cta: string;
    card_retry: string;
    err_prefix: string;
  };
  waitlist_form: {
    placeholder_email: string;
    submit: string;
    submitting: string;
    ok_title: string;
    /** template with `{n}` placeholder for queue position */
    ok_position_template: string;
    ok_in: string;
    ok_hint: string;
  };
};

const EN: Dict = {
  nav: { install: "Install", pricing: "Pricing", reports: "Reports", github_aria: "GitHub" },
  footer: {
    line: "MIT-licensed · built with ClonePilot · operated from Seoul",
    reports: "Reports",
    install: "Install",
    pricing: "Pricing",
    github: "GitHub",
  },
  hero: {
    badge: "Open-source MCP — v0.1",
    titleRich: (Em) => (
      <>
        YouTube business video,
        <br />
        <span className="text-ink-muted">in.</span>{" "}
        <Em>Deployed site,</Em> out.
      </>
    ),
    subtitle:
      "ClonePilot is an open-source MCP for Claude Code, Cursor, and Codex. Paste any business video. Get a Next.js landing page, Stripe checkout, email capture, a deep market report in five languages, and a live Vercel URL.",
    cta_install: "Install for free",
    cta_see_reports: "See live reports",
    cta_github: "GitHub",
    stat_reports_label: "Reports shipped",
    stat_languages_label: "Languages",
    stat_build_time_label: "Median build time",
    stat_build_time_value: "~2m",
    skip_queueRich: (Code) => (
      <>
        Or skip the queue: install the MCP and run <Code>analyze_deep</Code> in
        your own Claude Code right now.
      </>
    ),
  },
  how: {
    eyebrow: "How it works",
    title: "Three calls. One live site.",
    steps: [
      {
        title: "Drop a YouTube URL into Claude Code.",
        body: "Any business video — interview, founder demo, course landing. ClonePilot fetches the transcript via Supadata with a fallback chain.",
      },
      {
        title: "Claude calls analyze_deep — twelve sections, five languages.",
        body: "Blueprint, pricing tiers, market trend, competitors, SEO pack, six prioritized risks, 90-day GTM, and a confidence score that tells you which API keys to add for higher fidelity.",
      },
      {
        title: "scaffold + deploy hand back a live Vercel URL.",
        body: "Next.js 15, Tailwind, Stripe buy buttons, Resend lead capture, and an auto-generated SVG favicon. Median time end-to-end: under two minutes.",
      },
    ],
  },
  gallery: {
    eyebrow: "Live reports",
    title: "Real videos. Real deep-analysis reports.",
    updated: "Updated",
    empty: "Reports are still generating. Refresh in a couple of minutes.",
    badge_full: "Full report",
    badge_landing: "Landing only",
    confidence_label: "Confidence",
    trend_label: "5-yr trend",
    languages_label: "Languages",
    top_risk_label: "Top risk",
    open_report: "Open report",
    open_demo: "Open demo",
    v0_note: "v0 landing only · no deep report yet",
  },
  waitlist: {
    eyebrow: "Pro launch",
    title: "Email me when Pro opens.",
    bodyRich: (Em) => (
      <>
        The MCP is open-source and free today. Pro is the hosted convenience
        layer — all API keys server-side, unlimited builds, custom domains,
        deep-analysis with every integration enabled (Ahrefs, Exa, SimilarWeb),
        5-language reports, priority queue. Early-bird: <Em>$9/mo</Em> or{" "}
        <Em>$199 lifetime</Em>.
      </>
    ),
    pricing_hint_prefix: "Want to pick a specific tier? See the full",
    pricing_hint_link: "pricing page",
  },
  analyze_form: {
    live_badge: "Live analysis",
    label_url: "YouTube business video",
    url_placeholder: "https://www.youtube.com/watch?v=...",
    submit: "Analyze video",
    submitting: "Analyzing…",
    submitting_hint:
      "Usually 30–60 seconds. AI is reading the transcript right now.",
    disclaimer:
      "Free preview. No signup. The MCP itself is open-source — install once and run the full 12-section report inside your own Claude Code.",
    card_brand: "Brand",
    card_tagline: "Tagline",
    card_target: "Target",
    card_problem: "Problem",
    card_solution: "Solution",
    card_confidence: "Confidence",
    card_risk: "Top risk",
    card_transcript_chars: "transcript chars analyzed",
    card_install_cta: "Get the full 12-section report",
    card_retry: "Analyze another video",
    err_prefix: "Analysis failed:",
  },
  waitlist_form: {
    placeholder_email: "you@startup.com",
    submit: "Join waitlist",
    submitting: "Saving…",
    ok_title: "You are on the list.",
    ok_position_template: "You are #{n} on the list.",
    ok_in: "You are in.",
    ok_hint: "One email when Pro launches. Nothing else.",
  },
};

const KO: Dict = {
  nav: { install: "설치", pricing: "가격", reports: "리포트", github_aria: "GitHub" },
  footer: {
    line: "MIT 라이선스 · ClonePilot으로 빌드 · 서울에서 운영",
    reports: "리포트",
    install: "설치",
    pricing: "가격",
    github: "GitHub",
  },
  hero: {
    badge: "오픈소스 MCP — v0.1",
    titleRich: (Em) => (
      <>
        유튜브 사업 영상을 넣으면,
        <br />
        <span className="text-ink-muted">바로</span>{" "}
        <Em>배포된 사이트</Em>가 나옵니다.
      </>
    ),
    subtitle:
      "ClonePilot은 Claude Code · Cursor · Codex용 오픈소스 MCP입니다. 사업 영상 아무거나 붙여넣으면 Next.js 랜딩페이지, Stripe 결제, 이메일 수집, 5개 언어 시장 리포트, 그리고 실제로 도는 Vercel 주소까지 받아갑니다.",
    cta_install: "무료로 설치",
    cta_see_reports: "실제 리포트 보기",
    cta_github: "GitHub",
    stat_reports_label: "출시된 리포트",
    stat_languages_label: "지원 언어",
    stat_build_time_label: "평균 빌드 시간",
    stat_build_time_value: "약 2분",
    skip_queueRich: (Code) => (
      <>
        줄 서기 싫으면? MCP를 직접 설치해서 본인 Claude Code에서{" "}
        <Code>analyze_deep</Code>을 바로 돌리세요.
      </>
    ),
  },
  how: {
    eyebrow: "동작 방식",
    title: "MCP 호출 3번. 라이브 사이트 1개.",
    steps: [
      {
        title: "Claude Code에 유튜브 URL을 던집니다.",
        body: "사업 영상이면 뭐든 — 인터뷰, 창업자 데모, 강의 랜딩페이지. ClonePilot이 Supadata와 폴백 체인으로 자막을 가져옵니다.",
      },
      {
        title: "Claude가 analyze_deep을 호출 — 12개 섹션, 5개 언어.",
        body: "사업 구조, 가격 티어, 시장 트렌드, 경쟁사, SEO 팩, 우선순위 위험 6개, 90일 진출 전략, 그리고 어떤 API 키를 추가해야 정확도가 올라가는지 알려주는 신뢰도 점수까지.",
      },
      {
        title: "scaffold + deploy로 실제 Vercel 주소가 손에 잡힙니다.",
        body: "Next.js 15, Tailwind, Stripe 결제 버튼, Resend 리드 수집, 자동 생성된 SVG 파비콘까지. 처음부터 끝까지 보통 2분 미만.",
      },
    ],
  },
  gallery: {
    eyebrow: "최신 리포트",
    title: "실제 영상. 진짜 심층 분석 리포트.",
    updated: "업데이트",
    empty: "리포트 생성 중입니다. 몇 분 뒤 새로고침해주세요.",
    badge_full: "풀 리포트",
    badge_landing: "랜딩만",
    confidence_label: "신뢰도",
    trend_label: "5년 트렌드",
    languages_label: "언어",
    top_risk_label: "최대 위험",
    open_report: "리포트 열기",
    open_demo: "데모 열기",
    v0_note: "v0 랜딩 전용 · 아직 심층 리포트 없음",
  },
  waitlist: {
    eyebrow: "Pro 출시",
    title: "Pro 열리면 알려드립니다.",
    bodyRich: (Em) => (
      <>
        MCP 자체는 오늘부터 오픈소스로 무료입니다. Pro는 호스팅 편의 레이어 —
        API 키 전부 서버 쪽, 무제한 빌드, 커스텀 도메인, 모든 통합 켜진 심층
        분석(Ahrefs · Exa · SimilarWeb), 5개 언어 리포트, 우선 처리 큐. 얼리버드:{" "}
        <Em>월 $9</Em> 또는 <Em>평생 $199</Em>.
      </>
    ),
    pricing_hint_prefix: "특정 티어를 미리 찍어두고 싶다면 전체",
    pricing_hint_link: "가격 페이지",
  },
  analyze_form: {
    live_badge: "실시간 분석",
    label_url: "유튜브 사업 영상",
    url_placeholder: "https://www.youtube.com/watch?v=...",
    submit: "분석 시작",
    submitting: "분석 중…",
    submitting_hint: "보통 30~60초 걸립니다. AI가 자막을 읽고 있어요.",
    disclaimer:
      "무료 미리보기. 가입 불필요. MCP 자체는 오픈소스 — 한 번 설치하면 본인 Claude Code에서 12섹션 풀 리포트를 직접 돌릴 수 있습니다.",
    card_brand: "브랜드",
    card_tagline: "한 줄 소개",
    card_target: "타깃",
    card_problem: "문제",
    card_solution: "솔루션",
    card_confidence: "신뢰도",
    card_risk: "최대 위험",
    card_transcript_chars: "자 자막 분석함",
    card_install_cta: "12섹션 풀 리포트 받기",
    card_retry: "다른 영상 분석",
    err_prefix: "분석 실패:",
  },
  waitlist_form: {
    placeholder_email: "you@startup.com",
    submit: "대기열 등록",
    submitting: "저장 중…",
    ok_title: "대기열에 등록됐습니다.",
    ok_position_template: "대기 순번 #{n}입니다.",
    ok_in: "등록 완료.",
    ok_hint: "Pro 출시 때 메일 1통만 보냅니다. 그 외 없음.",
  },
};

const JA: Dict = {
  nav: { install: "インストール", pricing: "料金", reports: "レポート", github_aria: "GitHub" },
  footer: {
    line: "MITライセンス · ClonePilotで構築 · ソウル運営",
    reports: "レポート",
    install: "インストール",
    pricing: "料金",
    github: "GitHub",
  },
  hero: {
    badge: "オープンソースMCP — v0.1",
    titleRich: (Em) => (
      <>
        YouTubeのビジネス動画を入れたら、
        <br />
        <span className="text-ink-muted">そのまま</span>{" "}
        <Em>デプロイ済みのサイト</Em>が出てきます。
      </>
    ),
    subtitle:
      "ClonePilotはClaude Code・Cursor・Codex向けのオープンソースMCPです。ビジネス動画を貼り付けるだけで、Next.jsランディング、Stripe決済、メール収集、5言語の市場レポート、実際に動くVercel URLが返ってきます。",
    cta_install: "無料でインストール",
    cta_see_reports: "実際のレポートを見る",
    cta_github: "GitHub",
    stat_reports_label: "公開レポート数",
    stat_languages_label: "対応言語",
    stat_build_time_label: "中央ビルド時間",
    stat_build_time_value: "約2分",
    skip_queueRich: (Code) => (
      <>
        順番待ちが嫌なら、MCPを自分でインストールして、自分のClaude Codeで{" "}
        <Code>analyze_deep</Code>を直接実行できます。
      </>
    ),
  },
  how: {
    eyebrow: "仕組み",
    title: "MCPコール3回。ライブサイト1個。",
    steps: [
      {
        title: "Claude CodeにYouTube URLを貼ります。",
        body: "ビジネス動画なら何でも — インタビュー、創業者デモ、講座ランディング。ClonePilotがSupadataとフォールバック群でトランスクリプトを取得します。",
      },
      {
        title: "Claudeがanalyze_deepを実行 — 12セクション・5言語。",
        body: "ビジネス設計図、料金ティア、市場トレンド、競合、SEOパック、優先度付きリスク6件、90日のGTM、そして精度を上げるために追加すべきAPIキーを示す信頼度スコアまで。",
      },
      {
        title: "scaffold + deployで実際のVercel URLが手に入ります。",
        body: "Next.js 15、Tailwind、Stripe決済ボタン、Resendリード収集、自動生成のSVGファビコンまで。端から端まで通常2分未満。",
      },
    ],
  },
  gallery: {
    eyebrow: "最新レポート",
    title: "本物の動画。本物の深掘りレポート。",
    updated: "更新",
    empty: "レポート生成中です。数分後に再読み込みしてください。",
    badge_full: "フルレポート",
    badge_landing: "ランディングのみ",
    confidence_label: "信頼度",
    trend_label: "5年トレンド",
    languages_label: "言語",
    top_risk_label: "最大リスク",
    open_report: "レポートを開く",
    open_demo: "デモを開く",
    v0_note: "v0ランディングのみ · 深掘りレポートはまだ",
  },
  waitlist: {
    eyebrow: "Pro公開",
    title: "Pro公開時に通知します。",
    bodyRich: (Em) => (
      <>
        MCP本体は今日からオープンソースで無料。Proはホスティング版 — APIキーは
        全てサーバー側、無制限ビルド、独自ドメイン、全統合オンの深掘り分析
        (Ahrefs · Exa · SimilarWeb)、5言語レポート、優先キュー。アーリーバード:{" "}
        <Em>$9/月</Em>または<Em>$199で生涯</Em>。
      </>
    ),
    pricing_hint_prefix: "特定のティアを選びたい?全",
    pricing_hint_link: "料金ページ",
  },
  analyze_form: {
    live_badge: "リアルタイム解析",
    label_url: "YouTubeのビジネス動画",
    url_placeholder: "https://www.youtube.com/watch?v=...",
    submit: "解析開始",
    submitting: "解析中…",
    submitting_hint: "通常30〜60秒。AIがトランスクリプトを読んでいます。",
    disclaimer:
      "無料プレビュー。登録不要。MCP本体はオープンソース — 一度入れれば自分のClaude Code内で12セクションのフルレポートを直接実行できます。",
    card_brand: "ブランド",
    card_tagline: "キャッチコピー",
    card_target: "ターゲット",
    card_problem: "課題",
    card_solution: "ソリューション",
    card_confidence: "信頼度",
    card_risk: "最大リスク",
    card_transcript_chars: "文字を解析",
    card_install_cta: "12セクションのフルレポート取得",
    card_retry: "別の動画を解析",
    err_prefix: "解析失敗:",
  },
  waitlist_form: {
    placeholder_email: "you@startup.com",
    submit: "ウェイトリストに登録",
    submitting: "保存中…",
    ok_title: "ウェイトリストに登録しました。",
    ok_position_template: "ウェイトリスト #{n} です。",
    ok_in: "登録完了。",
    ok_hint: "Pro公開時にメール1通のみ。それ以外送りません。",
  },
};

const ZH: Dict = {
  nav: { install: "安装", pricing: "定价", reports: "报告", github_aria: "GitHub" },
  footer: {
    line: "MIT 许可 · 用 ClonePilot 构建 · 首尔运营",
    reports: "报告",
    install: "安装",
    pricing: "定价",
    github: "GitHub",
  },
  hero: {
    badge: "开源 MCP — v0.1",
    titleRich: (Em) => (
      <>
        丢一个 YouTube 商业视频进去,
        <br />
        <span className="text-ink-muted">直接</span>{" "}
        <Em>拿到已部署的网站</Em>。
      </>
    ),
    subtitle:
      "ClonePilot 是面向 Claude Code、Cursor 和 Codex 的开源 MCP。粘贴任意商业视频,即可获得 Next.js 落地页、Stripe 收款、邮件抓取、五种语言的市场报告,以及一个真正在线的 Vercel 网址。",
    cta_install: "免费安装",
    cta_see_reports: "查看实时报告",
    cta_github: "GitHub",
    stat_reports_label: "已发布报告",
    stat_languages_label: "支持语言",
    stat_build_time_label: "中位构建时间",
    stat_build_time_value: "约 2 分钟",
    skip_queueRich: (Code) => (
      <>
        不想排队?自己装上 MCP, 在自己的 Claude Code 里直接跑{" "}
        <Code>analyze_deep</Code>。
      </>
    ),
  },
  how: {
    eyebrow: "工作方式",
    title: "三次调用。一个上线站点。",
    steps: [
      {
        title: "把 YouTube 链接丢进 Claude Code。",
        body: "任何商业视频都行 —— 访谈、创始人演示、课程落地页。ClonePilot 通过 Supadata 加备用方案抓取字幕。",
      },
      {
        title: "Claude 调用 analyze_deep —— 十二个板块, 五种语言。",
        body: "蓝图、定价分层、市场趋势、竞品、SEO 包、六项优先级风险、90 天 GTM, 还有一个告诉你该补哪些 API 密钥提升精度的置信度分数。",
      },
      {
        title: "scaffold + deploy 直接给你一个上线的 Vercel 网址。",
        body: "Next.js 15、Tailwind、Stripe 收款按钮、Resend 线索收集, 还有自动生成的 SVG 网站图标。端到端中位时间不到两分钟。",
      },
    ],
  },
  gallery: {
    eyebrow: "实时报告",
    title: "真实视频。真实深度分析报告。",
    updated: "更新",
    empty: "报告生成中。请几分钟后刷新。",
    badge_full: "完整报告",
    badge_landing: "仅落地页",
    confidence_label: "置信度",
    trend_label: "五年趋势",
    languages_label: "语言",
    top_risk_label: "最大风险",
    open_report: "打开报告",
    open_demo: "打开演示",
    v0_note: "v0 仅落地页 · 暂无深度报告",
  },
  waitlist: {
    eyebrow: "Pro 上线",
    title: "Pro 开放时通知我。",
    bodyRich: (Em) => (
      <>
        MCP 今天起开源免费。Pro 是托管便利层 —— API 密钥全部在服务端、无限构建、
        自定义域名、全集成开启的深度分析(Ahrefs · Exa · SimilarWeb)、五语言报告、
        优先队列。早鸟价: <Em>$9/月</Em> 或 <Em>$199 终身</Em>。
      </>
    ),
    pricing_hint_prefix: "想锁定具体方案?查看完整",
    pricing_hint_link: "定价页",
  },
  analyze_form: {
    live_badge: "实时分析",
    label_url: "YouTube 商业视频",
    url_placeholder: "https://www.youtube.com/watch?v=...",
    submit: "开始分析",
    submitting: "分析中…",
    submitting_hint: "通常 30~60 秒。AI 正在阅读字幕。",
    disclaimer:
      "免费预览。无需注册。MCP 本身开源 —— 装一次就能在自己的 Claude Code 里直接运行 12 个板块的完整报告。",
    card_brand: "品牌",
    card_tagline: "一句话介绍",
    card_target: "目标用户",
    card_problem: "问题",
    card_solution: "方案",
    card_confidence: "置信度",
    card_risk: "最大风险",
    card_transcript_chars: "字字幕已分析",
    card_install_cta: "获取 12 个板块的完整报告",
    card_retry: "分析其他视频",
    err_prefix: "分析失败:",
  },
  waitlist_form: {
    placeholder_email: "you@startup.com",
    submit: "加入等候名单",
    submitting: "保存中…",
    ok_title: "已加入等候名单。",
    ok_position_template: "等候名单 #{n}。",
    ok_in: "已加入。",
    ok_hint: "Pro 上线时仅发送一封邮件。除此之外没有别的。",
  },
};

const ES: Dict = {
  nav: { install: "Instalar", pricing: "Precios", reports: "Reportes", github_aria: "GitHub" },
  footer: {
    line: "Licencia MIT · construido con ClonePilot · operado desde Seúl",
    reports: "Reportes",
    install: "Instalar",
    pricing: "Precios",
    github: "GitHub",
  },
  hero: {
    badge: "MCP open-source — v0.1",
    titleRich: (Em) => (
      <>
        Mete un vídeo de negocio de YouTube,
        <br />
        <span className="text-ink-muted">y sale</span>{" "}
        <Em>una web desplegada</Em>.
      </>
    ),
    subtitle:
      "ClonePilot es un MCP open-source para Claude Code, Cursor y Codex. Pega cualquier vídeo de negocio. Obtén una landing en Next.js, checkout con Stripe, captura de emails, un reporte de mercado en cinco idiomas y una URL de Vercel en vivo.",
    cta_install: "Instalar gratis",
    cta_see_reports: "Ver reportes en vivo",
    cta_github: "GitHub",
    stat_reports_label: "Reportes publicados",
    stat_languages_label: "Idiomas",
    stat_build_time_label: "Tiempo medio de build",
    stat_build_time_value: "~2 min",
    skip_queueRich: (Code) => (
      <>
        ¿Saltar la cola? Instala el MCP y ejecuta <Code>analyze_deep</Code> en
        tu propio Claude Code ahora mismo.
      </>
    ),
  },
  how: {
    eyebrow: "Cómo funciona",
    title: "Tres llamadas. Un sitio en vivo.",
    steps: [
      {
        title: "Suelta una URL de YouTube en Claude Code.",
        body: "Cualquier vídeo de negocio: entrevista, demo de fundador, landing de curso. ClonePilot obtiene el transcript vía Supadata con una cadena de fallback.",
      },
      {
        title: "Claude llama a analyze_deep — doce secciones, cinco idiomas.",
        body: "Blueprint, niveles de precio, tendencia de mercado, competencia, paquete SEO, seis riesgos priorizados, GTM a 90 días y un puntaje de confianza que te dice qué API keys añadir para más precisión.",
      },
      {
        title: "scaffold + deploy te devuelven una URL de Vercel en vivo.",
        body: "Next.js 15, Tailwind, botones de pago de Stripe, captura de leads con Resend y un favicon SVG auto-generado. Tiempo total: menos de dos minutos.",
      },
    ],
  },
  gallery: {
    eyebrow: "Reportes en vivo",
    title: "Vídeos reales. Reportes de análisis profundo reales.",
    updated: "Actualizado",
    empty: "Los reportes aún se están generando. Refresca en unos minutos.",
    badge_full: "Reporte completo",
    badge_landing: "Sólo landing",
    confidence_label: "Confianza",
    trend_label: "Tendencia 5 años",
    languages_label: "Idiomas",
    top_risk_label: "Riesgo principal",
    open_report: "Abrir reporte",
    open_demo: "Abrir demo",
    v0_note: "v0 sólo landing · sin reporte profundo todavía",
  },
  waitlist: {
    eyebrow: "Lanzamiento Pro",
    title: "Avísame cuando abra Pro.",
    bodyRich: (Em) => (
      <>
        El MCP es open-source y gratis hoy. Pro es la capa de conveniencia
        alojada — todas las API keys en el servidor, builds ilimitados, dominios
        propios, análisis profundo con todas las integraciones activas (Ahrefs,
        Exa, SimilarWeb), reportes en 5 idiomas, cola prioritaria. Early-bird:{" "}
        <Em>$9/mes</Em> o <Em>$199 de por vida</Em>.
      </>
    ),
    pricing_hint_prefix: "¿Quieres elegir un tier específico? Ve la",
    pricing_hint_link: "página de precios",
  },
  analyze_form: {
    live_badge: "Análisis en vivo",
    label_url: "Vídeo de negocio en YouTube",
    url_placeholder: "https://www.youtube.com/watch?v=...",
    submit: "Analizar vídeo",
    submitting: "Analizando…",
    submitting_hint:
      "Normalmente 30–60 segundos. La IA está leyendo el transcript.",
    disclaimer:
      "Vista previa gratis. Sin registro. El MCP en sí es open-source — instálalo una vez y ejecuta el reporte completo de 12 secciones dentro de tu propio Claude Code.",
    card_brand: "Marca",
    card_tagline: "Lema",
    card_target: "Público",
    card_problem: "Problema",
    card_solution: "Solución",
    card_confidence: "Confianza",
    card_risk: "Riesgo principal",
    card_transcript_chars: "caracteres de transcript analizados",
    card_install_cta: "Conseguir el reporte completo de 12 secciones",
    card_retry: "Analizar otro vídeo",
    err_prefix: "Análisis fallido:",
  },
  waitlist_form: {
    placeholder_email: "you@startup.com",
    submit: "Unirme a la lista",
    submitting: "Guardando…",
    ok_title: "Estás en la lista.",
    ok_position_template: "Eres el #{n} de la lista.",
    ok_in: "Listo.",
    ok_hint: "Un único email cuando Pro se lance. Nada más.",
  },
};

export const DICT: Record<Lang, Dict> = { en: EN, ko: KO, ja: JA, zh: ZH, es: ES };

export function t(lang: Lang): Dict {
  return DICT[lang];
}
