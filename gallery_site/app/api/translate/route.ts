import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { isLang, type Lang } from "@/lib/i18n";

export const runtime = "nodejs";
export const maxDuration = 120;

const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  ko: "Korean (한국어)",
  ja: "Japanese (日本語)",
  zh: "Simplified Chinese (简体中文)",
  es: "Spanish (Español)",
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
          "The translated preview object. Must have the same shape as the input — only translate string values that are sentences or words a user reads. Do NOT translate: enum values like 'course-funnel', URLs, video ids, transcript_source identifiers.",
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
  if (!isLang(targetLang)) {
    return NextResponse.json({ error: "bad targetLang" }, { status: 400 });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing ANTHROPIC_API_KEY." },
      { status: 503 },
    );
  }
  if (targetLang === "en") {
    return NextResponse.json({ ok: true, translated: preview });
  }

  const model =
    process.env.CLONEPILOT_MODEL_TRANSLATE?.trim() ||
    "claude-haiku-4-5-20251001";

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model,
      max_tokens: 4000,
      tools: [TRANSLATE_TOOL],
      tool_choice: { type: "tool", name: TRANSLATE_TOOL.name },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Translate this business-analysis JSON to ${LANG_NAMES[targetLang]}. Native, professional tone — not literal translation.

DO NOT TRANSLATE:
- enum values: "course-funnel", "real-product", "affiliate-bait", "personal-brand", "consulting-front", "unclear"
- URLs, video_id, transcript_source identifiers
- Numbers, booleans
- Stack item names (Next.js, Supabase, Stripe, etc.)

DO TRANSLATE every sentence and phrase a human reads (brand, tagline, target_audience, problem, solution, red_flags, likely_real_revenue_source, top_risk, market_reality.*, revenue_forecast.assumptions, insider_tips, build_path.steps[*].title, related_videos[*].title and channel stay as-is — already in original language).

Input:
${JSON.stringify(preview).slice(0, 18000)}

Call return_translated_preview with the same JSON shape, strings translated.`,
            },
          ],
        },
      ],
    });

    const toolUse = resp.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json({ error: "no tool_use" }, { status: 502 });
    }
    const result = (toolUse.input as { translated?: unknown }).translated;
    if (!result) {
      return NextResponse.json({ error: "empty translated" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, translated: result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
