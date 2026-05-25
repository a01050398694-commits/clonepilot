import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { YoutubeTranscript } from "youtube-transcript";

export const runtime = "nodejs";
export const maxDuration = 60;

const YT_RE =
  /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/;

export type AnalyzePreview = {
  brand: string;
  tagline: string;
  target_audience: string;
  problem: string;
  solution: string;
  confidence_0_100: number;
  top_risk: string;
  video: {
    id: string;
    title: string;
    channel: string;
    duration_sec: number;
    transcript_chars: number;
  };
};

type SupadataResponse = {
  content?: string;
  text?: string;
  lang?: string;
};

type YouTubeOEmbed = {
  title?: string;
  author_name?: string;
};

async function fetchSupadata(
  videoId: string,
  apiKey: string,
): Promise<{ text: string; lang: string; source: string }> {
  const res = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`,
    {
      headers: { "x-api-key": apiKey },
      signal: AbortSignal.timeout(20_000),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`supadata ${res.status}: ${body.slice(0, 200)}`);
  }
  const j = (await res.json()) as SupadataResponse;
  const text = j.content ?? j.text ?? "";
  if (!text) throw new Error("supadata returned empty transcript");
  return { text, lang: j.lang ?? "unknown", source: "supadata" };
}

async function fetchYouTubeTranscript(
  videoId: string,
): Promise<{ text: string; lang: string; source: string }> {
  const segments = await YoutubeTranscript.fetchTranscript(videoId, {
    lang: "ko",
  }).catch(() => YoutubeTranscript.fetchTranscript(videoId));
  if (!segments || segments.length === 0) {
    throw new Error("youtube-transcript returned empty");
  }
  const text = segments.map((s) => s.text).join("\n");
  return { text, lang: "unknown", source: "youtube-transcript" };
}

async function fetchTranscript(
  videoId: string,
  supaKey: string | undefined,
): Promise<{ text: string; lang: string; source: string }> {
  const attempts: string[] = [];
  try {
    return await fetchYouTubeTranscript(videoId);
  } catch (e) {
    attempts.push(`youtube-transcript: ${e instanceof Error ? e.message : "fail"}`);
  }
  if (supaKey) {
    try {
      return await fetchSupadata(videoId, supaKey);
    } catch (e) {
      attempts.push(`supadata: ${e instanceof Error ? e.message : "fail"}`);
    }
  } else {
    attempts.push("supadata: SUPADATA_API_KEY missing");
  }
  throw new Error(`No transcript provider worked. ${attempts.join(" | ")}`);
}

async function fetchOEmbed(videoId: string): Promise<{ title: string; channel: string }> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!res.ok) return { title: "", channel: "" };
    const j = (await res.json()) as YouTubeOEmbed;
    return { title: j.title ?? "", channel: j.author_name ?? "" };
  } catch {
    return { title: "", channel: "" };
  }
}

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_business_preview",
  description:
    "Extract a concise business preview from a YouTube transcript. Be honest — if the video isn't really a business pitch, set confidence low and explain in top_risk.",
  input_schema: {
    type: "object",
    properties: {
      brand: {
        type: "string",
        description: "Brand/product name. Short, in the original language of the video.",
      },
      tagline: {
        type: "string",
        description: "One-line value proposition. ≤80 chars. Original language.",
      },
      target_audience: {
        type: "string",
        description: "Who this is for. 1 sentence.",
      },
      problem: {
        type: "string",
        description: "Pain this solves. 1 sentence.",
      },
      solution: {
        type: "string",
        description: "How it solves the pain. 1 sentence.",
      },
      confidence_0_100: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description:
          "How confident you are this is a real, build-able business. 0–30 if the video is unrelated. 40–60 if it's a real business but transcript is short or vague. 70–100 if it's a clear, well-documented business case.",
      },
      top_risk: {
        type: "string",
        description:
          "The single biggest risk for someone cloning this business. One short sentence in the original language.",
      },
    },
    required: [
      "brand",
      "tagline",
      "target_audience",
      "problem",
      "solution",
      "confidence_0_100",
      "top_risk",
    ],
  },
};

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const youtubeUrl = String((body as { youtubeUrl?: unknown })?.youtubeUrl ?? "").trim();
  const m = youtubeUrl.match(YT_RE);
  if (!m) {
    return NextResponse.json(
      { error: "Not a valid YouTube URL." },
      { status: 400 },
    );
  }
  const videoId = m[1];

  const supaKey = process.env.SUPADATA_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json(
      { error: "Server missing ANTHROPIC_API_KEY in Vercel env." },
      { status: 503 },
    );
  }

  try {
    const meta = await fetchOEmbed(videoId);
    let transcript: { text: string; lang: string; source: string };
    let transcriptError: string | null = null;
    try {
      transcript = await fetchTranscript(videoId, supaKey);
    } catch (e) {
      transcriptError = e instanceof Error ? e.message : "transcript failed";
      transcript = {
        text: `(No transcript available. Analyze from title only.)\nTitle: ${meta.title}\nChannel: ${meta.channel}`,
        lang: "unknown",
        source: "title-only",
      };
    }

    const fullChars = transcript.text.length;
    const clip = transcript.text.slice(0, 12_000);
    const model =
      process.env.CLONEPILOT_MODEL_BLUEPRINT?.trim() || "claude-sonnet-4-6";

    const client = new Anthropic({ apiKey: anthropicKey });
    const resp = await client.messages.create({
      model,
      max_tokens: 1500,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: EXTRACT_TOOL.name },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are analyzing a YouTube business video to give a quick build-it-yourself preview.

Video title: ${meta.title || "(unknown)"}
Channel: ${meta.channel || "(unknown)"}
Transcript source: ${transcript.source}
Transcript language: ${transcript.lang}
${transcriptError ? `\nNOTE: Transcript fetch failed (${transcriptError}). You are seeing TITLE ONLY. Cap confidence at 35 and explicitly mention this limitation in top_risk.\n` : ""}
Transcript (first ${clip.length} of ${fullChars} chars):
---
${clip}
---

Call extract_business_preview with your honest take. Keep every field in the SAME LANGUAGE as the title/transcript so a native speaker can read the card.`,
            },
          ],
        },
      ],
    });

    const toolUse = resp.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "Anthropic did not return a tool_use block." },
        { status: 502 },
      );
    }
    const args = toolUse.input as Omit<AnalyzePreview, "video">;

    const preview: AnalyzePreview = {
      ...args,
      video: {
        id: videoId,
        title: meta.title,
        channel: meta.channel,
        duration_sec: 0,
        transcript_chars: fullChars,
      },
    };

    return NextResponse.json({ ok: true, preview });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
