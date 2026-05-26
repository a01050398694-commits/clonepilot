import type { FC, ReactNode } from "react";
import type { Lang } from "./i18n";

type Em = FC<{ children: ReactNode }>;

export type PricingDict = {
  back_to_gallery: string;
  header_titleRich: (Em: Em) => ReactNode;
  header_subtitle: string;
  cadence_forever: string;
  cadence_per_month: string;
  cadence_one_time: string;
  most_popular: string;
  tiers: {
    free: {
      target: string;
      bullets: string[];
      cta: string;
    };
    pro: {
      target: string;
      bullets: string[];
      cta: string;
      early_bird: string;
    };
    lifetime: {
      target: string;
      bullets: string[];
      cta: string;
      early_bird: string;
    };
  };
  waitlist_title: string;
  waitlist_body: string;
  upgrade_form: {
    tier_pro: string;
    tier_lifetime: string;
    tier_either: string;
    placeholder_email: string;
    submit: string;
    submitting: string;
    ok_title: string;
    /** template with `{n}` and `{tier}` placeholders */
    ok_position_template: string;
    ok_in: string;
    ok_hint: string;
  };
  faq_title: string;
  faqs: ReadonlyArray<{ q: string; a: string }>;
};

const EN: PricingDict = {
  back_to_gallery: "← gallery",
  header_titleRich: (Em) => (
    <>
      Free to try. <Em>$19/mo</Em> when you ship more than one.
    </>
  ),
  header_subtitle:
    "ClonePilot the MCP server is open-source forever — clone it from GitHub anytime. Pro / Lifetime is the hosted convenience layer: unlimited deploys, deep market analysis (Ahrefs + Exa + SimilarWeb enabled), 5-language reports, revenue forecast, marketing kit, priority queue",
  cadence_forever: "forever",
  cadence_per_month: "per month",
  cadence_one_time: "one-time",
  most_popular: "most popular",
  tiers: {
    free: {
      target: "Try ClonePilot in your Claude Code with one full build per month",
      bullets: [
        "Browse the full gallery (unlimited)",
        "See every business analysis + execution roadmap",
        "Install the MCP into Claude Code / Desktop / Cursor / Codex",
        "1 full build/month (analyze + scaffold + deploy)",
        "Deep analysis preview — analyze_deep MCP tool (Google Trends only, ~55 confidence)",
        "Use your own Anthropic / Vercel keys (BYO)",
      ],
      cta: "Install now (no signup)",
    },
    pro: {
      target: "Indie hackers shipping multiple sites per month",
      bullets: [
        "Everything in Free",
        "Unlimited builds",
        "Deep analysis with all integrations (Ahrefs + Exa + SimilarWeb server-side)",
        "5-language reports (EN/KR/JP/ZH/ES) + revenue forecast (TAM/SAM/SOM)",
        "Custom domain on each deploy",
        "Marketing kit (X + Reddit + Show HN copy)",
        "Priority generation queue (skip the line)",
        "Showcase in the public gallery",
        "Cancel anytime",
      ],
      cta: "Join Pro waitlist",
      early_bird: "Early-bird: $9/mo for the first 100 subscribers",
    },
    lifetime: {
      target:
        "Hate subscriptions? Pay once, own ClonePilot forever — same features as Pro",
      bullets: [
        "Everything in Pro",
        "No monthly fee, ever",
        "Lifetime updates & new features",
        "Lifetime priority queue",
        "Founding-member badge in gallery",
        "Refundable for 7 days",
      ],
      cta: "Join Lifetime waitlist",
      early_bird: "Early-bird: $199 one-time for the first 50 buyers",
    },
  },
  waitlist_title: "Waitlist for Pro / Lifetime",
  waitlist_body:
    "We're still wiring up the payment processor (Korean indie-hacker things — Paddle rejected us, working on Lemon Squeezy). Drop your email + pick a tier and we'll email you the moment checkout goes live with early-bird pricing locked in",
  upgrade_form: {
    tier_pro: "Pro · $19/mo (early-bird $9)",
    tier_lifetime: "Lifetime · $299 (early-bird $199)",
    tier_either: "Either — show me both",
    placeholder_email: "you@startup.com",
    submit: "Lock in early-bird",
    submitting: "Saving…",
    ok_title: "You're on the early-bird list",
    ok_position_template: "You're #{n} on the {tier} early-bird list",
    ok_in: "You're in",
    ok_hint:
      "We'll email you the day checkout opens. Early-bird pricing locked in for you",
  },
  faq_title: "FAQ",
  faqs: [
    {
      q: "Is the MCP itself open-source?",
      a: "Yes. The MCP server code is MIT on GitHub. You can self-host it forever with your own Anthropic + Vercel keys. The Pro/Lifetime tier is the hosted convenience layer (unlimited builds, marketing kit, custom domains, priority queue)",
    },
    {
      q: "What counts as 'one build'?",
      a: "One analyze() + scaffold() + deploy() cycle. So: one YouTube URL → one live site. Re-deploying the same project doesn't count; generating a fresh site does",
    },
    {
      q: "What happens when I exceed the free 1 build/month?",
      a: "You see a friendly message in Claude with a link to the pricing page. analyze() and scaffold() (local-only) still work without limit — you just can't push to Vercel without a Pro key",
    },
    {
      q: "Can I cancel Pro anytime?",
      a: "Yes, instantly, no questions. You keep access through the end of the paid period. After that you drop back to the Free tier",
    },
    {
      q: "Why one-time pricing for Lifetime?",
      a: "Inspired by Marc Lou's ShipFast — some indie hackers hate subscriptions. $299 once (or $199 early-bird) and you own ClonePilot Pro forever. Same features, no monthly fee",
    },
    {
      q: "Refund policy?",
      a: "Pro: cancel anytime, prorated refund of the current month. Lifetime: 7-day money-back, no questions asked",
    },
  ],
};

const KO: PricingDict = {
  back_to_gallery: "← 갤러리",
  header_titleRich: (Em) => (
    <>
      처음엔 무료. 한 달에 두 개 이상 배포하면 <Em>월 $19</Em>.
    </>
  ),
  header_subtitle:
    "ClonePilot MCP 서버 자체는 영원히 오픈소스 — 언제든 GitHub에서 클론 가능합니다. Pro / Lifetime은 호스팅 편의 레이어: 무제한 배포, 심층 시장 분석(Ahrefs + Exa + SimilarWeb 켜진), 5개 언어 리포트, 수익 예측, 마케팅 키트, 우선 처리 큐",
  cadence_forever: "영구",
  cadence_per_month: "월간",
  cadence_one_time: "1회 결제",
  most_popular: "가장 인기",
  tiers: {
    free: {
      target: "본인 Claude Code에서 한 달에 1번 풀 빌드로 ClonePilot 체험",
      bullets: [
        "전체 갤러리 무제한 열람",
        "모든 사업 분석 + 실행 로드맵 확인",
        "Claude Code / Desktop / Cursor / Codex에 MCP 설치",
        "월 1회 풀 빌드 (analyze + scaffold + deploy)",
        "심층 분석 프리뷰 — analyze_deep MCP 도구 (Google Trends만, 신뢰도 약 55)",
        "본인 Anthropic / Vercel 키 사용 (BYO)",
      ],
      cta: "지금 설치 (가입 불필요)",
    },
    pro: {
      target: "한 달에 사이트 여러 개 출시하는 인디 해커용",
      bullets: [
        "Free의 모든 기능",
        "무제한 빌드",
        "모든 통합 켜진 심층 분석 (Ahrefs + Exa + SimilarWeb 서버 사이드)",
        "5개 언어 리포트 (EN/KR/JP/ZH/ES) + 수익 예측 (TAM/SAM/SOM)",
        "배포마다 커스텀 도메인",
        "마케팅 키트 (X + Reddit + Show HN 카피)",
        "우선 생성 큐 (줄 건너뛰기)",
        "공개 갤러리 노출",
        "언제든 해지",
      ],
      cta: "Pro 대기열 등록",
      early_bird: "얼리버드: 처음 100명 한정 월 $9",
    },
    lifetime: {
      target:
        "구독 싫으세요? 한 번 결제하고 ClonePilot 평생 소유 — Pro와 동일 기능",
      bullets: [
        "Pro의 모든 기능",
        "월 요금 영구 없음",
        "평생 업데이트 & 신기능",
        "평생 우선 처리 큐",
        "갤러리 창립 멤버 배지",
        "7일 환불 가능",
      ],
      cta: "Lifetime 대기열 등록",
      early_bird: "얼리버드: 처음 50명 한정 1회 $199",
    },
  },
  waitlist_title: "Pro / Lifetime 대기열",
  waitlist_body:
    "아직 결제 시스템 연결 중입니다 (한국 인디 해커 사정 — Paddle 거절, Lemon Squeezy 작업 중). 이메일 + 원하는 티어 입력해두시면 결제 열리는 순간 얼리버드 가격 잠금 보장하고 메일 드립니다",
  upgrade_form: {
    tier_pro: "Pro · 월 $19 (얼리버드 $9)",
    tier_lifetime: "Lifetime · $299 (얼리버드 $199)",
    tier_either: "둘 다 — 비교해서 보고 싶음",
    placeholder_email: "you@startup.com",
    submit: "얼리버드 잠그기",
    submitting: "저장 중…",
    ok_title: "얼리버드 명단에 등록됐습니다",
    ok_position_template: "{tier} 얼리버드 명단 #{n}입니다",
    ok_in: "등록 완료",
    ok_hint: "결제 열리는 날 메일 드립니다. 얼리버드 가격 잠금 보장",
  },
  faq_title: "자주 묻는 질문",
  faqs: [
    {
      q: "MCP 자체가 오픈소스인가요?",
      a: "네. MCP 서버 코드는 GitHub에 MIT로 공개되어 있습니다. 본인 Anthropic + Vercel 키만 있으면 영구히 self-host 가능합니다. Pro/Lifetime 티어는 호스팅 편의 레이어 (무제한 빌드, 마케팅 키트, 커스텀 도메인, 우선 처리 큐)",
    },
    {
      q: "'1빌드'의 기준이 뭔가요?",
      a: "analyze() + scaffold() + deploy() 1사이클. 즉 유튜브 URL 1개 → 라이브 사이트 1개. 같은 프로젝트 재배포는 카운트 안 됨. 새 사이트 생성만 카운트",
    },
    {
      q: "무료 월 1빌드를 초과하면 어떻게 되나요?",
      a: "Claude 채팅창에 친절한 안내 메시지 + 가격 페이지 링크가 표시됩니다. analyze()와 scaffold() (로컬 전용)는 제한 없이 계속 동작 — Pro 키 없이는 Vercel push만 못 합니다",
    },
    {
      q: "Pro 언제든 해지할 수 있나요?",
      a: "네, 즉시 가능, 묻지 않습니다. 결제 기간 끝까지는 그대로 사용 가능. 이후 Free 티어로 전환됩니다",
    },
    {
      q: "왜 Lifetime은 1회 결제 모델인가요?",
      a: "Marc Lou의 ShipFast에서 영감 — 일부 인디 해커는 구독을 싫어합니다. 1회 $299 (또는 얼리버드 $199)로 ClonePilot Pro 평생 소유. 같은 기능, 월 요금 없음",
    },
    {
      q: "환불 정책은요?",
      a: "Pro: 언제든 해지 가능, 당월 사용분 일할 환불. Lifetime: 7일 내 무조건 환불, 묻지 않음",
    },
  ],
};

const JA: PricingDict = {
  back_to_gallery: "← ギャラリー",
  header_titleRich: (Em) => (
    <>
      お試しは無料。月に2件以上出すなら <Em>$19/月</Em>。
    </>
  ),
  header_subtitle:
    "ClonePilot MCPサーバー自体は永久にオープンソース — いつでもGitHubからクローン可能。Pro / Lifetimeはホスティング便利層: 無制限デプロイ、深掘り市場分析(Ahrefs + Exa + SimilarWebオン)、5言語レポート、収益予測、マーケティングキット、優先キュー",
  cadence_forever: "永続",
  cadence_per_month: "月額",
  cadence_one_time: "買い切り",
  most_popular: "人気No.1",
  tiers: {
    free: {
      target: "自分のClaude Codeで月1回のフルビルドでClonePilotを試す",
      bullets: [
        "ギャラリー全件を無制限閲覧",
        "全てのビジネス分析+実行ロードマップを確認",
        "Claude Code / Desktop / Cursor / CodexにMCPをインストール",
        "月1回のフルビルド(analyze + scaffold + deploy)",
        "深掘り分析プレビュー — analyze_deep MCPツール(Google Trendsのみ、信頼度約55)",
        "自前のAnthropic / Vercelキー使用(BYO)",
      ],
      cta: "今すぐインストール(登録不要)",
    },
    pro: {
      target: "月に複数サイトを出すインディーハッカー向け",
      bullets: [
        "Freeの全機能",
        "無制限ビルド",
        "全統合オンの深掘り分析(Ahrefs + Exa + SimilarWebサーバー側)",
        "5言語レポート(EN/KR/JP/ZH/ES)+収益予測(TAM/SAM/SOM)",
        "デプロイごとのカスタムドメイン",
        "マーケティングキット(X + Reddit + Show HNコピー)",
        "優先生成キュー(列をスキップ)",
        "公開ギャラリーで露出",
        "いつでも解約",
      ],
      cta: "Proウェイトリストに登録",
      early_bird: "アーリーバード: 先着100名 $9/月",
    },
    lifetime: {
      target:
        "サブスク嫌い?一度払って永久所有 — Pro同等機能",
      bullets: [
        "Proの全機能",
        "月額料金は永久にゼロ",
        "生涯アップデート & 新機能",
        "生涯優先キュー",
        "ギャラリーにファウンダーバッジ",
        "7日間返金可",
      ],
      cta: "Lifetimeウェイトリストに登録",
      early_bird: "アーリーバード: 先着50名 1回 $199",
    },
  },
  waitlist_title: "Pro / Lifetimeウェイトリスト",
  waitlist_body:
    "決済プロセッサ準備中(韓国インディーハッカー事情 — Paddleに断られ、Lemon Squeezy対応中)。メール+希望ティアを入れていただければ、決済オープン時にアーリーバード価格保証でご連絡します",
  upgrade_form: {
    tier_pro: "Pro · $19/月(アーリーバード $9)",
    tier_lifetime: "Lifetime · $299(アーリーバード $199)",
    tier_either: "両方 — 比較したい",
    placeholder_email: "you@startup.com",
    submit: "アーリーバードを確保",
    submitting: "保存中…",
    ok_title: "アーリーバードリストに登録しました",
    ok_position_template: "{tier}アーリーバードリスト #{n}です",
    ok_in: "登録完了",
    ok_hint: "決済オープン日にメールします。アーリーバード価格保証",
  },
  faq_title: "よくある質問",
  faqs: [
    {
      q: "MCP自体はオープンソース?",
      a: "はい。MCPサーバーのコードはGitHubにMITで公開。自前のAnthropic + Vercelキーで永久にセルフホスト可能。Pro/Lifetimeはホスティング便利層(無制限ビルド、マーケティングキット、カスタムドメイン、優先キュー)",
    },
    {
      q: "「1ビルド」の定義は?",
      a: "analyze() + scaffold() + deploy() 1サイクル。つまりYouTube URL 1本 → ライブサイト 1本。同じプロジェクトの再デプロイはカウント外。新規サイト生成のみカウント",
    },
    {
      q: "無料の月1ビルドを超えるとどうなる?",
      a: "Claudeに親切なメッセージ+料金ページのリンクが表示されます。analyze()とscaffold()(ローカルのみ)は無制限で動作 — Proキーなしではvercelへのpushのみができません",
    },
    {
      q: "Proはいつでも解約できる?",
      a: "はい、即時、理由を聞きません。決済期間の終わりまで使用可能。その後はFreeティアに戻ります",
    },
    {
      q: "なぜLifetimeは買い切り?",
      a: "Marc Louの ShipFast に触発 — 一部のインディーハッカーはサブスクが嫌い。1回 $299(またはアーリーバード $199)でClonePilot Proを永久所有。同機能、月額なし",
    },
    {
      q: "返金ポリシーは?",
      a: "Pro: いつでも解約、当月利用分の日割り返金。Lifetime: 7日間無条件返金、理由を聞きません",
    },
  ],
};

const ZH: PricingDict = {
  back_to_gallery: "← 画廊",
  header_titleRich: (Em) => (
    <>
      免费试用。一个月出多个站点时 <Em>$19/月</Em>。
    </>
  ),
  header_subtitle:
    "ClonePilot MCP 服务器永远开源 —— 随时从 GitHub 克隆。Pro / Lifetime 是托管便利层: 无限部署、深度市场分析(Ahrefs + Exa + SimilarWeb 启用)、五语言报告、收益预测、营销套件、优先队列",
  cadence_forever: "永久",
  cadence_per_month: "月付",
  cadence_one_time: "一次性",
  most_popular: "最受欢迎",
  tiers: {
    free: {
      target: "在你自己的 Claude Code 里以每月一次完整构建试用 ClonePilot",
      bullets: [
        "无限浏览完整画廊",
        "查看每个商业分析 + 执行路线图",
        "把 MCP 装到 Claude Code / Desktop / Cursor / Codex",
        "每月 1 次完整构建(analyze + scaffold + deploy)",
        "深度分析预览 —— analyze_deep MCP 工具(仅 Google Trends, 置信度约 55)",
        "使用你自己的 Anthropic / Vercel 密钥(BYO)",
      ],
      cta: "立即安装(无需注册)",
    },
    pro: {
      target: "每月出多个站点的独立开发者",
      bullets: [
        "包含 Free 的全部功能",
        "无限构建",
        "全集成开启的深度分析(Ahrefs + Exa + SimilarWeb 服务端)",
        "五语言报告(EN/KR/JP/ZH/ES)+ 收益预测(TAM/SAM/SOM)",
        "每次部署自定义域名",
        "营销套件(X + Reddit + Show HN 文案)",
        "优先生成队列(跳过排队)",
        "公开画廊展示",
        "随时取消",
      ],
      cta: "加入 Pro 等候名单",
      early_bird: "早鸟价: 前 100 名订阅者 $9/月",
    },
    lifetime: {
      target:
        "讨厌订阅?一次付费, 永久拥有 ClonePilot —— 功能与 Pro 相同",
      bullets: [
        "包含 Pro 的全部功能",
        "永久无月费",
        "终身更新 & 新功能",
        "终身优先队列",
        "画廊创始成员徽章",
        "7 天可退款",
      ],
      cta: "加入 Lifetime 等候名单",
      early_bird: "早鸟价: 前 50 名买家 $199 一次性",
    },
  },
  waitlist_title: "Pro / Lifetime 等候名单",
  waitlist_body:
    "支付处理还在接入中(韩国独立开发者的事情 —— Paddle 拒了我们, 正在搞 Lemon Squeezy)。留下邮箱并选个档位, 收银台一上线我们就锁定早鸟价邮件通知你",
  upgrade_form: {
    tier_pro: "Pro · $19/月(早鸟 $9)",
    tier_lifetime: "Lifetime · $299(早鸟 $199)",
    tier_either: "都行 —— 都给我看",
    placeholder_email: "you@startup.com",
    submit: "锁定早鸟价",
    submitting: "保存中…",
    ok_title: "已加入早鸟名单",
    ok_position_template: "{tier} 早鸟名单第 #{n} 位",
    ok_in: "已加入",
    ok_hint: "收银台开放当天发邮件给你。早鸟价为你锁定",
  },
  faq_title: "常见问题",
  faqs: [
    {
      q: "MCP 本身是开源的吗?",
      a: "是的。MCP 服务器代码 MIT 许可发布在 GitHub。可以用你自己的 Anthropic + Vercel 密钥永久自托管。Pro/Lifetime 档位是托管便利层(无限构建、营销套件、自定义域名、优先队列)",
    },
    {
      q: "「一次构建」是什么?",
      a: "一次 analyze() + scaffold() + deploy() 循环。也就是: 一个 YouTube URL → 一个上线站点。重新部署同一项目不算; 生成新站点才算",
    },
    {
      q: "超过免费的每月 1 次构建会怎样?",
      a: "Claude 里会出现友好提示 + 定价页链接。analyze() 和 scaffold()(本地)仍可无限使用 —— 只是没有 Pro 密钥就推不到 Vercel",
    },
    {
      q: "Pro 能随时取消吗?",
      a: "可以, 即时, 不问原因。付费周期内保留访问权。之后回到 Free 档",
    },
    {
      q: "为什么 Lifetime 是一次性定价?",
      a: "灵感来自 Marc Lou 的 ShipFast —— 部分独立开发者讨厌订阅。$299 一次(或早鸟 $199), 永久拥有 ClonePilot Pro。同样功能, 没有月费",
    },
    {
      q: "退款政策?",
      a: "Pro: 随时取消, 按当月使用按比例退款。Lifetime: 7 天无理由退款",
    },
  ],
};

const ES: PricingDict = {
  back_to_gallery: "← galería",
  header_titleRich: (Em) => (
    <>
      Gratis para probar. <Em>$19/mes</Em> cuando despliegues más de uno.
    </>
  ),
  header_subtitle:
    "El servidor MCP de ClonePilot es open-source para siempre — clónalo de GitHub cuando quieras. Pro / Lifetime es la capa de conveniencia alojada: deploys ilimitados, análisis profundo de mercado (Ahrefs + Exa + SimilarWeb activos), reportes en 5 idiomas, pronóstico de ingresos, marketing kit, cola prioritaria",
  cadence_forever: "siempre",
  cadence_per_month: "al mes",
  cadence_one_time: "pago único",
  most_popular: "más popular",
  tiers: {
    free: {
      target: "Prueba ClonePilot en tu Claude Code con un build completo al mes",
      bullets: [
        "Navega toda la galería (ilimitado)",
        "Mira cada análisis de negocio + roadmap de ejecución",
        "Instala el MCP en Claude Code / Desktop / Cursor / Codex",
        "1 build completo/mes (analyze + scaffold + deploy)",
        "Vista previa del análisis profundo — herramienta MCP analyze_deep (sólo Google Trends, ~55 de confianza)",
        "Usa tus propias keys de Anthropic / Vercel (BYO)",
      ],
      cta: "Instala ahora (sin registro)",
    },
    pro: {
      target: "Indie hackers que despliegan varios sitios al mes",
      bullets: [
        "Todo lo de Free",
        "Builds ilimitados",
        "Análisis profundo con todas las integraciones (Ahrefs + Exa + SimilarWeb en servidor)",
        "Reportes en 5 idiomas (EN/KR/JP/ZH/ES) + pronóstico de ingresos (TAM/SAM/SOM)",
        "Dominio propio en cada deploy",
        "Marketing kit (copy para X + Reddit + Show HN)",
        "Cola de generación prioritaria (sáltate la fila)",
        "Aparición en la galería pública",
        "Cancela cuando quieras",
      ],
      cta: "Apuntarme a la lista Pro",
      early_bird: "Early-bird: $9/mes para los primeros 100 suscriptores",
    },
    lifetime: {
      target:
        "¿Odias las suscripciones? Paga una vez, posee ClonePilot para siempre — mismas funciones que Pro",
      bullets: [
        "Todo lo de Pro",
        "Sin mensualidad, jamás",
        "Actualizaciones y novedades de por vida",
        "Cola prioritaria de por vida",
        "Insignia de miembro fundador en la galería",
        "Reembolsable durante 7 días",
      ],
      cta: "Apuntarme a la lista Lifetime",
      early_bird: "Early-bird: $199 una sola vez para los primeros 50 compradores",
    },
  },
  waitlist_title: "Lista de espera para Pro / Lifetime",
  waitlist_body:
    "Todavía estamos cableando el procesador de pagos (cosas de indie hacker coreano — Paddle nos rechazó, trabajamos en Lemon Squeezy). Deja tu email + elige un tier y te avisaremos en el momento en que abra el checkout con el precio early-bird bloqueado para ti",
  upgrade_form: {
    tier_pro: "Pro · $19/mes (early-bird $9)",
    tier_lifetime: "Lifetime · $299 (early-bird $199)",
    tier_either: "Cualquiera — muéstrame ambos",
    placeholder_email: "you@startup.com",
    submit: "Bloquear precio early-bird",
    submitting: "Guardando…",
    ok_title: "Estás en la lista early-bird",
    ok_position_template: "Eres el #{n} en la lista early-bird de {tier}",
    ok_in: "Listo",
    ok_hint:
      "Te enviaremos un email el día que abra el checkout. Precio early-bird bloqueado para ti",
  },
  faq_title: "FAQ",
  faqs: [
    {
      q: "¿El MCP en sí es open-source?",
      a: "Sí. El código del servidor MCP está bajo MIT en GitHub. Puedes self-hostearlo para siempre con tus propias keys de Anthropic + Vercel. El tier Pro/Lifetime es la capa de conveniencia alojada (builds ilimitados, marketing kit, dominios propios, cola prioritaria)",
    },
    {
      q: "¿Qué cuenta como 'un build'?",
      a: "Un ciclo de analyze() + scaffold() + deploy(). Es decir: una URL de YouTube → un sitio en vivo. Re-desplegar el mismo proyecto no cuenta; generar un sitio nuevo sí",
    },
    {
      q: "¿Qué pasa si supero el build gratis del mes?",
      a: "Ves un mensaje amable en Claude con un enlace a la página de precios. analyze() y scaffold() (sólo locales) siguen funcionando sin límite — sólo que no podrás hacer push a Vercel sin una key Pro",
    },
    {
      q: "¿Puedo cancelar Pro cuando quiera?",
      a: "Sí, al instante, sin preguntas. Conservas el acceso hasta el final del periodo pagado. Después vuelves al tier Free",
    },
    {
      q: "¿Por qué Lifetime es de pago único?",
      a: "Inspirado en ShipFast de Marc Lou — a algunos indie hackers les odian las suscripciones. $299 una vez (o $199 early-bird) y posees ClonePilot Pro para siempre. Mismas funciones, sin mensualidad",
    },
    {
      q: "¿Política de reembolsos?",
      a: "Pro: cancela cuando quieras, reembolso prorrateado del mes en curso. Lifetime: devolución del dinero a los 7 días, sin preguntas",
    },
  ],
};

const DICT: Record<Lang, PricingDict> = { en: EN, ko: KO, ja: JA, zh: ZH, es: ES };

export function tPricing(lang: Lang): PricingDict {
  return DICT[lang];
}
