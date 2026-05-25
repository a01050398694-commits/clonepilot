/**
 * Card v2 labels — kept separate from lib/i18n.tsx to avoid surgery on
 * a huge file. Imported alongside the global Dict by UrlAnalysisForm.
 */

import type { Lang } from "./i18n";

export type CardLabels = {
  /* gauges */
  gauge_clone: string;
  gauge_honesty: string;
  gauge_confidence: string;
  gauge_bot_inflation: string;
  gauge_real_proof: string;
  gauge_hype_vs_reality: string;

  /* sections */
  section_verdict: string;
  section_funnel: string;
  section_signals_external: string;
  section_description: string;
  section_comments: string;
  section_top_comments: string;
  section_green_flags: string;
  section_why_buyers_pay: string;
  section_honest_value: string;

  /* funnel */
  funnel_observed_chip: string;
  funnel_inferred_chip: string;
  funnel_empty: string;

  /* signals — short labels for chips */
  sig_reddit: string;
  sig_wayback: string;
  sig_velocity_per_week: string;
  sig_velocity_avg_view: string;

  /* description findings */
  desc_links_label: string;
  desc_course_keywords_label: string;
  desc_price_mentions_label: string;
  desc_course_hint_chip: string;

  /* comments */
  comments_total_label: string;
  comments_avg_length_label: string;
  comments_bot_label: string;
  comments_emoji_label: string;
  comments_praise_label: string;
  comments_empty: string;

  /* small */
  observed_in_video: string;
  inferred_from_genre: string;
  one_paragraph_intro: string;
};

const EN: CardLabels = {
  gauge_clone: "Clone feasibility",
  gauge_honesty: "Honesty",
  gauge_confidence: "Confidence",
  gauge_bot_inflation: "Bot inflation",
  gauge_real_proof: "Verifiable proof",
  gauge_hype_vs_reality: "Hype vs reality",
  section_verdict: "Verdict",
  section_funnel: "Funnel ladder",
  section_signals_external: "External footprint",
  section_description: "Description forensics",
  section_comments: "Comment fingerprint",
  section_top_comments: "Top comments",
  section_green_flags: "Green flags",
  section_why_buyers_pay: "Why buyers pay anyway",
  section_honest_value: "Real value buyers receive",
  funnel_observed_chip: "observed",
  funnel_inferred_chip: "inferred",
  funnel_empty: "No funnel ladder detected.",
  sig_reddit: "Reddit",
  sig_wayback: "First archived",
  sig_velocity_per_week: "uploads/wk",
  sig_velocity_avg_view: "avg view 90d",
  desc_links_label: "Detected links",
  desc_course_keywords_label: "Course keywords",
  desc_price_mentions_label: "Prices in description",
  desc_course_hint_chip: "course-hint",
  comments_total_label: "Comments analyzed",
  comments_avg_length_label: "Avg length",
  comments_bot_label: "Bot-likely",
  comments_emoji_label: "Emoji-only",
  comments_praise_label: "Short praise",
  comments_empty: "No comments fetched (private or disabled).",
  observed_in_video: "observed",
  inferred_from_genre: "inferred",
  one_paragraph_intro: "Read this before you spend money or months.",
};

const KO: CardLabels = {
  gauge_clone: "복제 가능성",
  gauge_honesty: "정직도",
  gauge_confidence: "신뢰도",
  gauge_bot_inflation: "댓글 봇 의심도",
  gauge_real_proof: "검증 가능 증거",
  gauge_hype_vs_reality: "과장 vs 현실",
  section_verdict: "한 줄 판결",
  section_funnel: "강의팔이 사다리",
  section_signals_external: "외부 흔적",
  section_description: "설명란 포렌식",
  section_comments: "댓글 지문",
  section_top_comments: "상위 댓글",
  section_green_flags: "긍정 신호",
  section_why_buyers_pay: "그래도 사람들이 돈 내는 진짜 이유",
  section_honest_value: "사는 사람이 진짜 얻는 가치",
  funnel_observed_chip: "관찰됨",
  funnel_inferred_chip: "추정",
  funnel_empty: "사다리 구조 미감지.",
  sig_reddit: "레딧",
  sig_wayback: "최초 아카이브",
  sig_velocity_per_week: "주당 업로드",
  sig_velocity_avg_view: "90일 평균조회",
  desc_links_label: "감지된 링크",
  desc_course_keywords_label: "강의 키워드",
  desc_price_mentions_label: "설명란 가격 언급",
  desc_course_hint_chip: "강의 의심",
  comments_total_label: "분석된 댓글",
  comments_avg_length_label: "평균 길이",
  comments_bot_label: "봇 의심",
  comments_emoji_label: "이모지만",
  comments_praise_label: "짧은 칭찬",
  comments_empty: "댓글 미수집 (비공개 또는 차단).",
  observed_in_video: "관찰",
  inferred_from_genre: "추정",
  one_paragraph_intro: "돈이나 시간을 쓰기 전에 이거 한 번 읽어.",
};

const JA: CardLabels = {
  gauge_clone: "クローン実現性",
  gauge_honesty: "正直度",
  gauge_confidence: "信頼度",
  gauge_bot_inflation: "コメント水増し疑い",
  gauge_real_proof: "検証可能な証拠",
  gauge_hype_vs_reality: "誇大 vs 現実",
  section_verdict: "結論ひと段落",
  section_funnel: "ファネル階段",
  section_signals_external: "外部足跡",
  section_description: "概要欄フォレンジック",
  section_comments: "コメント指紋",
  section_top_comments: "上位コメント",
  section_green_flags: "好材料",
  section_why_buyers_pay: "それでも買う本当の理由",
  section_honest_value: "買う人が本当に得るもの",
  funnel_observed_chip: "観測",
  funnel_inferred_chip: "推定",
  funnel_empty: "階段構造は検出されず。",
  sig_reddit: "Reddit",
  sig_wayback: "初アーカイブ",
  sig_velocity_per_week: "週あたり投稿",
  sig_velocity_avg_view: "90日平均視聴",
  desc_links_label: "検出リンク",
  desc_course_keywords_label: "講座キーワード",
  desc_price_mentions_label: "概要欄の価格言及",
  desc_course_hint_chip: "講座疑い",
  comments_total_label: "解析コメント数",
  comments_avg_length_label: "平均長さ",
  comments_bot_label: "ボット疑い",
  comments_emoji_label: "絵文字のみ",
  comments_praise_label: "短い称賛",
  comments_empty: "コメント未取得(非公開または無効)。",
  observed_in_video: "観測",
  inferred_from_genre: "推定",
  one_paragraph_intro: "金や時間を投下する前に、これだけ読んでくれ。",
};

const ZH: CardLabels = {
  gauge_clone: "复制可行性",
  gauge_honesty: "诚信度",
  gauge_confidence: "置信度",
  gauge_bot_inflation: "评论水军疑似度",
  gauge_real_proof: "可验证证据",
  gauge_hype_vs_reality: "炒作 vs 现实",
  section_verdict: "一句话定论",
  section_funnel: "课程销售阶梯",
  section_signals_external: "外部痕迹",
  section_description: "简介取证",
  section_comments: "评论指纹",
  section_top_comments: "热门评论",
  section_green_flags: "正面信号",
  section_why_buyers_pay: "买家照样付钱的真实原因",
  section_honest_value: "买家真正能拿到的东西",
  funnel_observed_chip: "已观察",
  funnel_inferred_chip: "推断",
  funnel_empty: "未检测到阶梯结构。",
  sig_reddit: "Reddit",
  sig_wayback: "首次存档",
  sig_velocity_per_week: "周上传量",
  sig_velocity_avg_view: "90 天均观看",
  desc_links_label: "检测到链接",
  desc_course_keywords_label: "课程关键词",
  desc_price_mentions_label: "简介中提及的价格",
  desc_course_hint_chip: "疑似课程",
  comments_total_label: "已分析评论",
  comments_avg_length_label: "平均长度",
  comments_bot_label: "疑似机器人",
  comments_emoji_label: "纯表情",
  comments_praise_label: "短赞美",
  comments_empty: "未抓到评论(私有或被禁)。",
  observed_in_video: "已观察",
  inferred_from_genre: "推断",
  one_paragraph_intro: "在你花钱花时间之前,先看这段。",
};

const ES: CardLabels = {
  gauge_clone: "Viabilidad de clonar",
  gauge_honesty: "Honestidad",
  gauge_confidence: "Confianza",
  gauge_bot_inflation: "Inflación de bots",
  gauge_real_proof: "Prueba verificable",
  gauge_hype_vs_reality: "Hype vs realidad",
  section_verdict: "Veredicto en un párrafo",
  section_funnel: "Escalera del embudo",
  section_signals_external: "Huellas externas",
  section_description: "Forense de descripción",
  section_comments: "Huella de comentarios",
  section_top_comments: "Comentarios destacados",
  section_green_flags: "Señales positivas",
  section_why_buyers_pay: "Por qué la gente paga igual",
  section_honest_value: "Valor real que recibe el comprador",
  funnel_observed_chip: "observado",
  funnel_inferred_chip: "inferido",
  funnel_empty: "No se detectó escalera.",
  sig_reddit: "Reddit",
  sig_wayback: "Primer archivo",
  sig_velocity_per_week: "subidas/sem",
  sig_velocity_avg_view: "media 90d",
  desc_links_label: "Enlaces detectados",
  desc_course_keywords_label: "Keywords de curso",
  desc_price_mentions_label: "Precios en la descripción",
  desc_course_hint_chip: "sospecha curso",
  comments_total_label: "Comentarios analizados",
  comments_avg_length_label: "Longitud media",
  comments_bot_label: "Probable bot",
  comments_emoji_label: "Solo emoji",
  comments_praise_label: "Elogio corto",
  comments_empty: "Sin comentarios (privado o desactivado).",
  observed_in_video: "observado",
  inferred_from_genre: "inferido",
  one_paragraph_intro: "Léelo antes de gastar dinero o meses.",
};

export const CARD_LABELS: Record<Lang, CardLabels> = {
  en: EN,
  ko: KO,
  ja: JA,
  zh: ZH,
  es: ES,
};

export function cardLabels(lang: Lang): CardLabels {
  return CARD_LABELS[lang] ?? EN;
}
