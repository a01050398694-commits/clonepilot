import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isLang, type Lang } from "@/lib/i18n";
import { callGeminiTool, isAnthropicBudgetError } from "@/lib/llm-fallback";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Card translate accepts an extra "ar" tier for the language toggle. */
export type CardLang = Lang | "ar";
const CARD_LANGS: readonly CardLang[] = ["en", "ko", "ja", "zh", "es", "ar"] as const;

function isCardLang(v: unknown): v is CardLang {
  return typeof v === "string" && (CARD_LANGS as readonly string[]).includes(v);
}

const LANG_NAMES: Record<CardLang, string> = {
  en: "English",
  ko: "Korean (한국어)",
  ja: "Japanese (日本語)",
  zh: "Simplified Chinese (简体中文)",
  es: "Spanish (Español)",
  ar: "Arabic (العربية)",
};

const NATIVE_TONE_HINT: Record<CardLang, string> = {
  en:
    "Direct, punchy, founder-friend tone. Avoid corporate words. Use contractions.",
  ko:
    "친한 후배에게 카톡으로 알려주는 톤. 반말 OK. 번역체 절대 금지 — '~할 수 있습니다', '~로 인해', '~에 의해' 같이 한국어로 일상에서 안 쓰는 어색한 표현은 자연스러운 구어체로 바꾸기. 강의팔이/funnel 같은 단어는 한국어 그대로 두기. USD 금액은 그대로 두고 옆에 한국 원화 환산을 ('약 ₩XXX만원' 형태) 짧게 붙이기.",
  ja:
    "テック系の友人にDMで送るくらい自然な日本語。直訳調禁止 — 「〜することができる」「〜による」のような硬い表現は省く。USD金額はそのままで、必要なら丸めて括弧で日本円換算を併記。",
  zh:
    "像跟创业的朋友发微信一样自然的简体中文。生硬的翻译腔禁止 — 例如「能够」「通过」「由于」这类外语直译的表达,要替换成中文里真正会说的话。美元金额保留,可在括号内补上人民币粗略换算。",
  es:
    "Tono de amigo emprendedor en español neutro. Tuteo. Sin tecnicismos forzados. Sin traducciones literales del inglés (evita 'reemplazar' por 'replace', 'permite' robótico, etc.). Cifras en USD se mantienen; si ayuda, añade entre paréntesis una aproximación local.",
  ar:
    "نبرة صديق ريادي مباشرة، عربية فصحى مبسطة (وسط بين الفصحى المعاصرة واللهجة الإعلامية). تجنّب الترجمة الحرفية والكلمات الإنكليزية المُعرّبة قسرياً. اترك المبالغ بالدولار كما هي.",
};

const TRANSLATE_TOOL: Anthropic.Tool = {
  name: "return_translated_preview",
  description:
    "Return the same JSON structure with all human-readable strings translated to the target language. Keep keys, numbers, booleans, enum values (business_model), URLs, and video_id unchanged.",
  input_schema: {
    type: "object",
    properties: {
      translated: {
        type: "object",
        description:
          "The translated preview object. Identical shape — only translate string values a user reads.",
      },
    },
    required: ["translated"],
  },
};

type Body = { preview?: unknown; targetLang?: unknown };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const preview = body.preview;
  const targetLang = body.targetLang;
  if (!preview || typeof preview !== "object") {
    return NextResponse.json({ error: "missing preview" }, { status: 400 });
  }
  // Accept either global Lang or CardLang (which adds "ar").
  const lang: CardLang | null = isCardLang(targetLang)
    ? targetLang
    : isLang(targetLang)
      ? targetLang
      : null;
  if (!lang) {
    return NextResponse.json({ error: "bad targetLang" }, { status: 400 });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ANTHROPIC_API_KEY." },
      { status: 503 },
    );
  }
  if (lang === "en") {
    return NextResponse.json({ ok: true, translated: preview });
  }

  // Strip non-translatable bulk from the input — pure data fields the LLM
  // does not need to see (and that we will splice back in on the client side
  // would also be an option, but keeping the structure intact for the LLM
  // and merging the omitted fields after is simpler).
  const p = preview as Record<string, unknown>;
  const slimmed = {
    ...p,
    related_videos: undefined,
    description_findings: undefined,
    comment_stats: undefined,
    signals: undefined,
    video: undefined,
  };

  const model =
    process.env.CLONEPILOT_MODEL_TRANSLATE?.trim() ||
    "claude-haiku-4-5-20251001";

  const userText = (() => {
    return `Translate this business-analysis JSON into ${LANG_NAMES[lang]}.

TONE & STYLE (MANDATORY):
${NATIVE_TONE_HINT[lang]}

This is NOT a literal translation. Rewrite each string idiomatically as a native speaker would say it — same meaning, same punch, no translationese. A reader must not be able to tell it was translated from English.

DO NOT TRANSLATE:
- enum values: "course-funnel", "real-product", "affiliate-bait", "personal-brand", "consulting-front", "unclear"
- URLs, video_id, channel handle, transcript_source identifiers, domain strings
- Numbers, booleans, scores
- Stack item names (Next.js, Supabase, Stripe, Tailwind, etc.)
- Brand names (keep as-is unless they have an obvious native spelling)

DO TRANSLATE every sentence and phrase a human reads: brand description, tagline, target_audience, problem, solution, red_flags[*], green_flags[*], likely_real_revenue_source, why_buyers_pay, honest_value_for_buyer, top_risk, market_reality.* (all 4 string fields), market_reality.top_competitors[*].why_relevant, revenue_forecast.assumptions[*], insider_tips[*], build_path.steps[*].title, funnel_ladder[*].label, one_paragraph_verdict.

Input JSON (some fields may be absent — translate only present ones; keep schema identical):
${JSON.stringify(slimmed).slice(0, 18_000)}

Call return_translated_preview now with the full translated object.`;
  })();

  try {
    let result: unknown;
    try {
      const client = new Anthropic({ apiKey });
      const resp = await client.messages.create({
        model,
        max_tokens: 8000,
        tools: [TRANSLATE_TOOL],
        tool_choice: { type: "tool", name: TRANSLATE_TOOL.name },
        messages: [{ role: "user", content: [{ type: "text", text: userText }] }],
      });
      const toolUse = resp.content.find((c) => c.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        throw new Error("no tool_use");
      }
      result = (toolUse.input as { translated?: unknown }).translated;
    } catch (err) {
      const geminiKey =
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_AI_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_AI_KEY ||
        "";
      if (!isAnthropicBudgetError(err) || !geminiKey) {
        throw err;
      }
      console.error(
        "[/api/translate] Anthropic budget hit, fall back to Gemini",
        err instanceof Error ? err.message : err,
      );
      const g = await callGeminiTool<{ translated?: unknown }>({
        apiKey: geminiKey,
        model:
          process.env.CLONEPILOT_MODEL_FALLBACK?.trim() || "gemini-2.0-flash",
        system: "You are a professional translator. Follow the user instructions exactly.",
        userText,
        tool: TRANSLATE_TOOL,
      });
      result = g.args.translated;
    }
    if (!result) {
      return NextResponse.json({ error: "empty translated" }, { status: 502 });
    }
    // Merge back the untranslated heavy fields (related videos, signals, etc.)
    // so the client can display them without losing data.
    const merged = {
      ...(result as Record<string, unknown>),
      video: p.video,
      signals: p.signals,
      related_videos: p.related_videos,
      description_findings: p.description_findings,
      comment_stats: p.comment_stats,
    };
    return NextResponse.json({ ok: true, translated: merged });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
