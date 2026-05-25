import type { FC, ReactNode } from "react";
import type { Lang } from "./i18n";

type Em = FC<{ children: ReactNode }>;

export type InstallDict = {
  back_to_gallery: string;
  eyebrow: string;
  title: string;
  subtitleRich: (Em: Em) => ReactNode;
  free_note_prefix: string;
  free_note_link: string;
  free_note_suffix: string;
  config_label: string;
  cost_paid_per_build: string;
  cost_free_videos: string;
  cost_free_vercel: string;
  keys_title: string;
  keys_subtitle: string;
  skip_keys_title: string;
  skip_keys_body: string;
  skip_keys_cta: string;
};

const EN: InstallDict = {
  back_to_gallery: "← gallery",
  eyebrow: "1-minute install · 0 signup",
  title: "Drop this block into your editor.",
  subtitleRich: () => (
    <>
      ClonePilot is an MCP server. You paste a config block once, restart your
      editor, and from then on you can paste any YouTube URL into the chat and
      ask Claude to clone the business.
    </>
  ),
  free_note_prefix:
    "Free tier: 1 full build per month. After that, just see the analysis + roadmap (or",
  free_note_link: "grab Pro",
  free_note_suffix: "for unlimited).",
  config_label: "MCP config",
  cost_paid_per_build: "paid · ~$0.03 per build",
  cost_free_videos: "free tier: 100 videos/mo",
  cost_free_vercel: "free Hobby tier: 100 deploys/day",
  keys_title: "Required keys (Free tier brings their own)",
  keys_subtitle:
    "On the Free tier, you bring 3 keys. On Pro/Lifetime, we provide them — paste a single CLONEPILOT_LICENSE_KEY instead.",
  skip_keys_title: "Want to skip the keys?",
  skip_keys_body:
    "Pro and Lifetime tiers run ClonePilot on our hosted backend — no Anthropic or Vercel keys needed. You paste just one line:",
  skip_keys_cta: "See pricing →",
};

const KO: InstallDict = {
  back_to_gallery: "← 갤러리",
  eyebrow: "1분 설치 · 가입 0",
  title: "에디터에 이 블록을 붙여넣으세요.",
  subtitleRich: () => (
    <>
      ClonePilot은 MCP 서버입니다. 한 번만 설정 블록을 붙여넣고 에디터를
      재시작하면, 이후로는 채팅창에 유튜브 URL을 던지고 Claude한테 "이 사업
      복제해줘"라고 말하면 됩니다.
    </>
  ),
  free_note_prefix:
    "무료 티어: 월 1회 풀 빌드. 그 이후엔 분석 + 로드맵만 볼 수 있어요 (",
  free_note_link: "Pro 잡으면",
  free_note_suffix: "무제한).",
  config_label: "MCP 설정",
  cost_paid_per_build: "유료 · 빌드당 약 $0.03",
  cost_free_videos: "무료 티어: 월 100개 영상",
  cost_free_vercel: "무료 Hobby 티어: 일 100회 배포",
  keys_title: "필수 API 키 (무료 티어는 본인 키 사용)",
  keys_subtitle:
    "무료 티어는 키 3개를 직접 준비합니다. Pro / Lifetime은 우리가 키를 호스팅 — CLONEPILOT_LICENSE_KEY 1줄만 붙여넣으면 됩니다.",
  skip_keys_title: "키 발급이 귀찮으세요?",
  skip_keys_body:
    "Pro와 Lifetime 티어는 우리 호스팅 백엔드에서 ClonePilot이 돕니다 — Anthropic이나 Vercel 키 필요 없음. 이 한 줄만 붙여넣으세요:",
  skip_keys_cta: "가격 보기 →",
};

const JA: InstallDict = {
  back_to_gallery: "← ギャラリー",
  eyebrow: "1分インストール · 登録なし",
  title: "このブロックをエディタに貼り付けてください。",
  subtitleRich: () => (
    <>
      ClonePilotはMCPサーバーです。設定ブロックを一度貼り付けてエディタを
      再起動するだけで、以降はチャット欄にYouTube URLを貼って
      Claudeに「このビジネスをクローンして」と頼むだけです。
    </>
  ),
  free_note_prefix:
    "無料ティア: 月1回のフルビルド。それ以降は解析+ロードマップのみ閲覧可能(",
  free_note_link: "Proを取得",
  free_note_suffix: "で無制限)。",
  config_label: "MCP設定",
  cost_paid_per_build: "有料 · ビルドあたり約$0.03",
  cost_free_videos: "無料ティア: 月100本",
  cost_free_vercel: "無料Hobbyティア: 1日100デプロイ",
  keys_title: "必須キー (無料ティアは自分のキーを使用)",
  keys_subtitle:
    "無料ティアでは3つのキーを自前で用意。Pro/Lifetimeはこちらで用意します — CLONEPILOT_LICENSE_KEY 1行を貼り付けるだけ。",
  skip_keys_title: "キー発行を省きたい?",
  skip_keys_body:
    "ProとLifetimeはホスティングバックエンドでClonePilotが動きます — AnthropicやVercelのキー不要。この1行を貼り付けるだけ:",
  skip_keys_cta: "料金を見る →",
};

const ZH: InstallDict = {
  back_to_gallery: "← 画廊",
  eyebrow: "1 分钟安装 · 0 注册",
  title: "把这段配置粘进你的编辑器。",
  subtitleRich: () => (
    <>
      ClonePilot 是一个 MCP 服务器。粘贴一次配置块、重启编辑器, 之后就可以在
      聊天框里粘任意 YouTube URL, 让 Claude 帮你克隆这个生意。
    </>
  ),
  free_note_prefix: "免费档: 每月 1 次完整构建。之后只能看分析 + 路线图(或",
  free_note_link: "升级 Pro",
  free_note_suffix: "无限制)。",
  config_label: "MCP 配置",
  cost_paid_per_build: "付费 · 每次构建约 $0.03",
  cost_free_videos: "免费档: 100 个视频/月",
  cost_free_vercel: "免费 Hobby 档: 100 次部署/天",
  keys_title: "必需的 API 密钥 (免费档自带)",
  keys_subtitle:
    "免费档需要自己准备 3 个密钥。Pro / Lifetime 我们提供 —— 只需粘贴一行 CLONEPILOT_LICENSE_KEY。",
  skip_keys_title: "想跳过密钥?",
  skip_keys_body:
    "Pro 和 Lifetime 档在我们托管的后端运行 ClonePilot —— 无需 Anthropic 或 Vercel 密钥。只需粘贴这一行:",
  skip_keys_cta: "查看定价 →",
};

const ES: InstallDict = {
  back_to_gallery: "← galería",
  eyebrow: "Instalación en 1 minuto · 0 registros",
  title: "Pega este bloque en tu editor.",
  subtitleRich: () => (
    <>
      ClonePilot es un servidor MCP. Pegas un bloque de configuración una vez,
      reinicias el editor, y desde entonces puedes pegar cualquier URL de
      YouTube en el chat y pedirle a Claude que clone el negocio.
    </>
  ),
  free_note_prefix:
    "Tier gratis: 1 build completo al mes. Después, solo el análisis + roadmap (o",
  free_note_link: "consigue Pro",
  free_note_suffix: "para builds ilimitados).",
  config_label: "Config MCP",
  cost_paid_per_build: "de pago · ~$0.03 por build",
  cost_free_videos: "tier gratis: 100 vídeos/mes",
  cost_free_vercel: "tier Hobby gratis: 100 deploys/día",
  keys_title: "API keys requeridas (el tier gratis las pones tú)",
  keys_subtitle:
    "En el tier gratis pones tus 3 keys. En Pro/Lifetime las ponemos nosotros — solo pegas una línea: CLONEPILOT_LICENSE_KEY.",
  skip_keys_title: "¿Quieres evitar las keys?",
  skip_keys_body:
    "Los tiers Pro y Lifetime ejecutan ClonePilot en nuestro backend — no necesitas keys de Anthropic ni de Vercel. Solo pegas esta línea:",
  skip_keys_cta: "Ver precios →",
};

const DICT: Record<Lang, InstallDict> = { en: EN, ko: KO, ja: JA, zh: ZH, es: ES };

export function tInstall(lang: Lang): InstallDict {
  return DICT[lang];
}
