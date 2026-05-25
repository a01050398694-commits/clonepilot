import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { YoutubeTranscript } from "youtube-transcript";
import { Innertube } from "youtubei.js";
// @ts-expect-error google-trends-api ships no types
import googleTrends from "google-trends-api";

export const runtime = "nodejs";
export const maxDuration = 60;

const YT_RE =
  /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/;

export type BusinessModel =
  | "real-product"
  | "course-funnel"
  | "affiliate-bait"
  | "personal-brand"
  | "consulting-front"
  | "unclear";

export type VideoMeta = {
  id: string;
  title: string;
  channel: string;
  channel_id?: string;
  channel_subscribers?: number;
  channel_video_count?: number;
  channel_created_at?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
  published_at?: string;
  description_chars: number;
  transcript_chars: number;
  transcript_source: string;
};

export type SignalBlock = {
  trends?: { keyword: string; direction: string; score: number };
  hn_mentions: number;
  wiki_found: boolean;
};

export type AnalyzePreview = {
  brand: string;
  tagline: string;
  target_audience: string;
  problem: string;
  solution: string;
  business_model: BusinessModel;
  red_flags: string[];
  likely_real_revenue_source: string;
  clone_feasibility_0_100: number;
  honesty_score_0_100: number;
  confidence_0_100: number;
  top_risk: string;
  video: VideoMeta;
  signals: SignalBlock;
};

/* ─── transcript fetching chain ───────────────────────────────────────── */

async function fetchViaInnertube(videoId: string) {
  const yt = await Innertube.create({ retrieve_player: false });
  const info = await yt.getInfo(videoId);
  const data = await info.getTranscript();
  type Seg = { snippet?: { text?: string } };
  const segs =
    (data?.transcript?.content?.body?.initial_segments as Seg[] | undefined) ?? [];
  const text = segs
    .map((s) => s.snippet?.text ?? "")
    .filter(Boolean)
    .join(" ");
  if (!text || text.length < 50) throw new Error("innertube empty");
  return { text, lang: "auto", source: "innertube" };
}

async function fetchViaYouTubeTranscript(videoId: string) {
  const segments = await YoutubeTranscript.fetchTranscript(videoId, {
    lang: "ko",
  }).catch(() => YoutubeTranscript.fetchTranscript(videoId));
  if (!segments || segments.length === 0)
    throw new Error("youtube-transcript empty");
  return {
    text: segments.map((s) => s.text).join("\n"),
    lang: "unknown",
    source: "youtube-transcript",
  };
}

async function fetchViaSupadata(videoId: string, key: string) {
  const r = await fetch(
    `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`,
    { headers: { "x-api-key": key }, signal: AbortSignal.timeout(20_000) },
  );
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    throw new Error(`supadata ${r.status}: ${body.slice(0, 120)}`);
  }
  const j = (await r.json()) as { content?: string; text?: string; lang?: string };
  const text = j.content ?? j.text ?? "";
  if (!text) throw new Error("supadata empty");
  return { text, lang: j.lang ?? "unknown", source: "supadata" };
}

async function fetchTranscript(videoId: string, supaKey?: string) {
  const attempts: string[] = [];
  const chain: Array<[
    string,
    () => Promise<{ text: string; lang: string; source: string }>,
  ]> = [
    ["innertube", () => fetchViaInnertube(videoId)],
    ["youtube-transcript", () => fetchViaYouTubeTranscript(videoId)],
  ];
  if (supaKey) chain.push(["supadata", () => fetchViaSupadata(videoId, supaKey)]);
  for (const [name, fn] of chain) {
    try {
      return await fn();
    } catch (e) {
      attempts.push(`${name}: ${e instanceof Error ? e.message : "fail"}`);
    }
  }
  throw new Error(`No transcript provider worked. ${attempts.join(" | ")}`);
}

/* ─── youtube metadata ─────────────────────────────────────────────────── */

async function fetchOEmbed(videoId: string) {
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!r.ok) return { title: "", channel: "" };
    const j = (await r.json()) as { title?: string; author_name?: string };
    return { title: j.title ?? "", channel: j.author_name ?? "" };
  } catch {
    return { title: "", channel: "" };
  }
}

type YTVideoItem = {
  snippet?: {
    title?: string;
    description?: string;
    channelId?: string;
    channelTitle?: string;
    publishedAt?: string;
  };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
};

type YTChannelItem = {
  snippet?: { publishedAt?: string; title?: string };
  statistics?: { subscriberCount?: string; videoCount?: string };
};

async function fetchVideoData(
  videoId: string,
  ytKey: string | undefined,
): Promise<YTVideoItem | null> {
  if (!ytKey) return null;
  try {
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${ytKey}`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { items?: YTVideoItem[] };
    return j.items?.[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchChannelData(
  channelId: string,
  ytKey: string,
): Promise<YTChannelItem | null> {
  try {
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${ytKey}`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { items?: YTChannelItem[] };
    return j.items?.[0] ?? null;
  } catch {
    return null;
  }
}

/* ─── google trends ────────────────────────────────────────────────────── */

type GoogleTrendsModule = {
  interestOverTime: (opts: { keyword: string; startTime: Date }) => Promise<string>;
};

async function fetchGoogleTrends(
  keyword: string,
): Promise<{ keyword: string; direction: string; score: number } | null> {
  if (!keyword || keyword.length < 2) return null;
  try {
    const gt = googleTrends as GoogleTrendsModule;
    const raw = await Promise.race([
      gt.interestOverTime({
        keyword,
        startTime: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
      }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("trends timeout")), 8000)),
    ]);
    type Point = { value?: number[] };
    type Parsed = { default?: { timelineData?: Point[] } };
    const parsed = JSON.parse(raw) as Parsed;
    const timeline = parsed.default?.timelineData ?? [];
    if (timeline.length < 4) return null;
    const recent = timeline.slice(-12).map((p) => p.value?.[0] ?? 0);
    const older = timeline.slice(0, 12).map((p) => p.value?.[0] ?? 0);
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const r = avg(recent);
    const o = avg(older);
    const ratio = o > 0 ? r / o : 0;
    const direction = ratio > 1.3 ? "rising" : ratio < 0.7 ? "declining" : "stable";
    return { keyword, direction, score: Math.min(100, Math.round(r)) };
  } catch {
    return null;
  }
}

/* ─── HN + Wikipedia verifiability ─────────────────────────────────────── */

async function fetchHNMentions(query: string): Promise<number> {
  if (!query) return 0;
  try {
    const r = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=1`,
      { signal: AbortSignal.timeout(6_000) },
    );
    if (!r.ok) return 0;
    const j = (await r.json()) as { nbHits?: number };
    return j.nbHits ?? 0;
  } catch {
    return 0;
  }
}

async function fetchWikiExists(query: string): Promise<boolean> {
  if (!query) return false;
  try {
    const r = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(
        query,
      )}&srlimit=1`,
      { signal: AbortSignal.timeout(6_000) },
    );
    if (!r.ok) return false;
    const j = (await r.json()) as { query?: { search?: unknown[] } };
    return (j.query?.search?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

/* ─── Anthropic schema + prompt ────────────────────────────────────────── */

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_business_preview",
  description:
    "Brutally honest analysis. Detect course-seller funnels, affiliate-bait, fake testimonials, artificial scarcity.",
  input_schema: {
    type: "object",
    properties: {
      brand: { type: "string", description: "Brand or product name in original language. Short." },
      tagline: { type: "string", description: "One-line value prop, ≤80 chars, original language." },
      target_audience: { type: "string", description: "Who this is for, 1 sentence." },
      problem: { type: "string", description: "Pain it claims to solve, 1 sentence." },
      solution: { type: "string", description: "How it claims to solve, 1 sentence." },
      business_model: {
        type: "string",
        enum: [
          "real-product",
          "course-funnel",
          "affiliate-bait",
          "personal-brand",
          "consulting-front",
          "unclear",
        ],
        description:
          "Classify the ACTUAL business: real-product (they sell a real product/service used by paying customers), course-funnel (YouTube is bait to sell high-ticket courses/coaching), affiliate-bait (monetized via affiliate kickbacks), personal-brand (selling themselves as influencer), consulting-front (YouTube to drive consulting leads), unclear (can't tell).",
      },
      red_flags: {
        type: "array",
        items: { type: "string" },
        description:
          "Course-seller red flags spotted. Each item should be a concrete observation, NOT a generic warning. Examples: '월 1억 주장 → 스크린샷 외 증빙 없음', '한정 100명 마감임박 압박', '$19 미끼 강의 → $2,000 1대1 코칭 funnel', '댓글 90%가 \"대박이에요!\" 봇 패턴'. Empty array ONLY if you found zero red flags.",
      },
      likely_real_revenue_source: {
        type: "string",
        description:
          "Where the money REALLY comes from — often different from what the video claims. Be specific. Example: '영상은 블로그 광고 수익이라 말하지만 실제로는 70% 강의 판매 + 20% 제휴 + 10% 광고로 추정'.",
      },
      clone_feasibility_0_100: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description:
          "If a user cloned the EXACT activity shown (e.g. start a blog, do this trade), how likely they'd hit the claimed revenue? Course funnels score LOW (10-30) — the real revenue is from the course, not the activity. Real products score higher.",
      },
      honesty_score_0_100: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description:
          "How honest is the creator? 90+ = transparent about revenue source, shows real numbers, mentions difficulty. 50 = vague but plausible. 20 = obvious funnel with inflated claims and hidden upsells. 0 = scam.",
      },
      confidence_0_100: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description:
          "How confident YOU are in this analysis. Higher when transcript is full + external signals (trends/HN/wiki) corroborate. Lower (30-40) when only title+description available.",
      },
      top_risk: {
        type: "string",
        description:
          "The single biggest risk for a cloner. One short sentence, original language. Be specific to THIS business, not generic.",
      },
    },
    required: [
      "brand",
      "tagline",
      "target_audience",
      "problem",
      "solution",
      "business_model",
      "red_flags",
      "likely_real_revenue_source",
      "clone_feasibility_0_100",
      "honesty_score_0_100",
      "confidence_0_100",
      "top_risk",
    ],
  },
};

const SYSTEM_PROMPT = `You are a brutally honest business analyst specializing in detecting "course-seller" funnels on YouTube — creators whose videos are actually marketing funnels for high-ticket courses, coaching, or PDFs, rather than real product businesses. You have seen 10,000+ of these and recognize the patterns at a glance.

RED FLAG PATTERNS YOU AUTO-DETECT:
- "월 X천만원 벌었어요" / "I made $X with this method" — claims with no verifiable proof (screenshots are trivially faked)
- "마감 임박", "오늘만 가격", "한정 100명" — artificial scarcity
- $19 미끼 강의 → $199 mid-tier → $2,000~10,000 1:1 코칭 — classic price ladder
- 후기가 템플릿 같음, before/after 사진에 맥락 없음, 출연자가 유료 광고 흔적
- "누구나 30일 안에 가능" — survivorship bias 가린 약속
- "진짜" 수익 = 강의 판매, 영상이 다루는 활동 (블로깅, 트레이딩 등) 자체는 미끼
- description에 affiliate 링크 / 스폰서 표기 → "이게 내 진짜 수익" 주장과 충돌
- "무료 PDF" 미끼 → 이메일 funnel → 코칭 pitch
- 구독자 급증이 부자연스러움 (예: 가입 6개월에 50만 구독 = 유료 promotion 가능성)
- 댓글이 "대박이에요!" 같은 generic 응답 90% → 봇 inflation

YOUR JOB:
The user is about to invest weeks of work cloning this business. They deserve the TRUTH, not validation. If the underlying activity does not pay the bills and the course does, classify as "course-funnel" and explain in red_flags.

Use the EXTERNAL SIGNALS (channel subscriber count vs channel age, Google Trends for market viability, HN/Wikipedia for verifiability) to cross-check the video's claims. Real businesses leave footprints. Funnels don't.

Output every text field in the SAME LANGUAGE as the video (so a native speaker can read the card). Be merciless and specific, not generic.`;

/* ─── main POST handler ────────────────────────────────────────────────── */

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const youtubeUrl = String(
    (body as { youtubeUrl?: unknown })?.youtubeUrl ?? "",
  ).trim();
  const m = youtubeUrl.match(YT_RE);
  if (!m)
    return NextResponse.json(
      { error: "Not a valid YouTube URL." },
      { status: 400 },
    );
  const videoId = m[1];

  const supaKey = process.env.SUPADATA_API_KEY;
  const ytKey = process.env.YOUTUBE_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    return NextResponse.json(
      { error: "Missing ANTHROPIC_API_KEY." },
      { status: 503 },
    );
  }

  try {
    const [oembed, videoData] = await Promise.all([
      fetchOEmbed(videoId),
      fetchVideoData(videoId, ytKey),
    ]);
    const channelId = videoData?.snippet?.channelId;
    const channelData =
      channelId && ytKey ? await fetchChannelData(channelId, ytKey) : null;

    let transcript: { text: string; lang: string; source: string };
    let transcriptError: string | null = null;
    try {
      transcript = await fetchTranscript(videoId, supaKey);
    } catch (e) {
      transcriptError = e instanceof Error ? e.message : "fail";
      const desc = videoData?.snippet?.description ?? "";
      transcript = {
        text: `(No transcript fetched. Title + description only.)\nTITLE: ${oembed.title}\nDESCRIPTION:\n${desc}`,
        lang: "unknown",
        source: "title+desc",
      };
    }

    const brandCandidate =
      oembed.title.split(/[—\-:|]/)[0].trim().slice(0, 60) ||
      videoData?.snippet?.title?.slice(0, 60) ||
      oembed.channel;

    const [trends, hnCount, wikiFound] = await Promise.all([
      fetchGoogleTrends(brandCandidate),
      fetchHNMentions(brandCandidate),
      fetchWikiExists(brandCandidate),
    ]);

    const stats = videoData?.statistics ?? {};
    const chStats = channelData?.statistics ?? {};
    const chSnip = channelData?.snippet ?? {};
    const description = videoData?.snippet?.description ?? "";

    const videoMeta: VideoMeta = {
      id: videoId,
      title: oembed.title || videoData?.snippet?.title || "",
      channel: oembed.channel || videoData?.snippet?.channelTitle || "",
      channel_id: channelId,
      channel_subscribers: chStats.subscriberCount
        ? Number(chStats.subscriberCount)
        : undefined,
      channel_video_count: chStats.videoCount
        ? Number(chStats.videoCount)
        : undefined,
      channel_created_at: chSnip.publishedAt,
      view_count: stats.viewCount ? Number(stats.viewCount) : undefined,
      like_count: stats.likeCount ? Number(stats.likeCount) : undefined,
      comment_count: stats.commentCount ? Number(stats.commentCount) : undefined,
      published_at: videoData?.snippet?.publishedAt,
      description_chars: description.length,
      transcript_chars: transcript.text.length,
      transcript_source: transcript.source,
    };
    const signals: SignalBlock = {
      trends: trends ?? undefined,
      hn_mentions: hnCount,
      wiki_found: wikiFound,
    };

    const channelAgeYears = chSnip.publishedAt
      ? (Date.now() - new Date(chSnip.publishedAt).getTime()) /
        (365 * 24 * 60 * 60 * 1000)
      : null;
    const signalBlock = `EXTERNAL SIGNALS:
- Video: published ${videoMeta.published_at?.slice(0, 10) ?? "?"} · views ${videoMeta.view_count?.toLocaleString() ?? "?"} · likes ${videoMeta.like_count?.toLocaleString() ?? "?"} · comments ${videoMeta.comment_count?.toLocaleString() ?? "?"}
- Channel: "${videoMeta.channel}" · subs ${videoMeta.channel_subscribers?.toLocaleString() ?? "?"} · total videos ${videoMeta.channel_video_count ?? "?"} · joined ${chSnip.publishedAt?.slice(0, 10) ?? "?"}${channelAgeYears != null ? ` (age ${channelAgeYears.toFixed(1)} yrs)` : ""}
- Google Trends keyword "${brandCandidate}": ${trends ? `${trends.direction} (score ${trends.score}/100 over 5 yrs)` : "no signal"}
- HackerNews mentions of brand: ${hnCount}
- Wikipedia page for brand: ${wikiFound ? "exists" : "none"}
- Video description: ${description.length} chars${description.length > 0 ? "\n  " + description.slice(0, 800).replace(/\n/g, "\n  ") : ""}
${transcriptError ? `\n⚠️  TRANSCRIPT FETCH FAILED: ${transcriptError}\nYou have ONLY title + description below. Cap confidence at 35 and call this out in top_risk.` : `\nTranscript source: ${transcript.source} (${videoMeta.transcript_chars.toLocaleString()} chars total)`}
`;

    const clip = transcript.text.slice(0, 12_000);
    const model =
      process.env.CLONEPILOT_MODEL_BLUEPRINT?.trim() || "claude-sonnet-4-6";

    const client = new Anthropic({ apiKey: anthropicKey });
    const resp = await client.messages.create({
      model,
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: EXTRACT_TOOL.name },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this YouTube business video for course-seller patterns and real-business viability.

${signalBlock}
TRANSCRIPT (first ${clip.length} chars):
---
${clip}
---

Call extract_business_preview with your brutally honest take. All text fields MUST be in the SAME LANGUAGE as the video's title/transcript.`,
            },
          ],
        },
      ],
    });

    const toolUse = resp.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return NextResponse.json(
        { error: "Anthropic did not return tool_use." },
        { status: 502 },
      );
    }
    const args = toolUse.input as Omit<AnalyzePreview, "video" | "signals">;
    const preview: AnalyzePreview = { ...args, video: videoMeta, signals };
    return NextResponse.json({ ok: true, preview });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
