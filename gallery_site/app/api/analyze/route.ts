import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { YoutubeTranscript } from "youtube-transcript";
import { Innertube } from "youtubei.js";
// @ts-expect-error google-trends-api ships no types
import googleTrends from "google-trends-api";

export const runtime = "nodejs";
export const maxDuration = 300;

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

export type RelatedVideo = {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  view_count?: number;
  published_at?: string;
};

export type MarketReality = {
  tam_summary: string;
  sam_summary: string;
  som_year1_summary: string;
  trend_summary: string;
  top_competitors: { name: string; url_hint?: string; why_relevant: string }[];
};

export type RevenueForecast = {
  conservative_arr_usd: number;
  base_arr_usd: number;
  aggressive_arr_usd: number;
  assumptions: string[];
};

export type BuildPath = {
  steps: { title: string; weeks: number }[];
  total_weeks: number;
  estimated_one_time_cost_usd: number;
  estimated_monthly_cost_usd: number;
  stack: string[];
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
  market_reality: MarketReality;
  revenue_forecast: RevenueForecast;
  insider_tips: string[];
  build_path: BuildPath;
  video: VideoMeta;
  signals: SignalBlock;
  related_videos: RelatedVideo[];
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

async function fetchRelatedVideos(
  query: string,
  excludeId: string,
  ytKey: string | undefined,
): Promise<RelatedVideo[]> {
  if (!ytKey || !query) return [];
  try {
    const sr = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&relevanceLanguage=en&maxResults=8&q=${encodeURIComponent(query)}&key=${ytKey}`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!sr.ok) return [];
    type SearchItem = {
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        publishedAt?: string;
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
      };
    };
    const sj = (await sr.json()) as { items?: SearchItem[] };
    const candidates = (sj.items ?? [])
      .filter((i) => i.id?.videoId && i.id.videoId !== excludeId)
      .slice(0, 3);
    if (candidates.length === 0) return [];

    const ids = candidates.map((c) => c.id!.videoId!).join(",");
    const sr2 = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids}&key=${ytKey}`,
      { signal: AbortSignal.timeout(8_000) },
    );
    type StatItem = { id?: string; statistics?: { viewCount?: string } };
    const sj2 = sr2.ok ? ((await sr2.json()) as { items?: StatItem[] }) : { items: [] };
    const viewMap = new Map<string, number>();
    for (const it of sj2.items ?? []) {
      if (it.id && it.statistics?.viewCount) {
        viewMap.set(it.id, Number(it.statistics.viewCount));
      }
    }
    return candidates.map((c) => ({
      video_id: c.id!.videoId!,
      title: c.snippet?.title ?? "",
      channel: c.snippet?.channelTitle ?? "",
      thumbnail:
        c.snippet?.thumbnails?.medium?.url ??
        c.snippet?.thumbnails?.default?.url ??
        `https://i.ytimg.com/vi/${c.id!.videoId!}/mqdefault.jpg`,
      view_count: viewMap.get(c.id!.videoId!),
      published_at: c.snippet?.publishedAt,
    }));
  } catch {
    return [];
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
    "Brutally honest, actionable business analysis. NOT a video summary. Tell the user the market reality, real revenue, clone path.",
  input_schema: {
    type: "object",
    properties: {
      brand: { type: "string", description: "Brand or product name. Short. English by default unless transcript clearly demands native." },
      tagline: { type: "string", description: "One-line value prop, ≤80 chars." },
      target_audience: { type: "string", description: "Who this is for, 1 sentence." },
      problem: { type: "string", description: "Pain it claims to solve, 1 sentence." },
      solution: { type: "string", description: "How it claims to solve, 1 sentence." },
      business_model: {
        type: "string",
        enum: ["real-product", "course-funnel", "affiliate-bait", "personal-brand", "consulting-front", "unclear"],
        description: "Classify the ACTUAL business mechanism, not the marketing surface.",
      },
      red_flags: {
        type: "array",
        items: { type: "string" },
        description: "Concrete observations, not generic warnings. Examples: 'Revenue screenshots could be Photoshop', '$19 entry → $2k coaching ladder visible in description'. Empty array ONLY if zero red flags.",
      },
      likely_real_revenue_source: {
        type: "string",
        description: "Where the money REALLY comes from — often different from the claim. Be specific.",
      },
      clone_feasibility_0_100: { type: "integer", minimum: 0, maximum: 100, description: "Likelihood a cloner hits claimed revenue. Course funnels low (10-30) because real revenue = course itself." },
      honesty_score_0_100: { type: "integer", minimum: 0, maximum: 100, description: "How honest is the creator? Transparent revenue source + real numbers = 90+. Obvious funnel + inflated claims = 20." },
      confidence_0_100: { type: "integer", minimum: 0, maximum: 100, description: "Your confidence in THIS analysis. Higher with full transcript + corroborating signals." },
      top_risk: { type: "string", description: "Single biggest risk for cloner. One short sentence. Specific to THIS business." },
      market_reality: {
        type: "object",
        description: "Honest market sizing & competitive landscape. Use your training data + external signals to estimate. If you don't know, say 'cannot estimate without paid data sources'.",
        properties: {
          tam_summary: { type: "string", description: "Total addressable market in one line. Example: 'Global content-marketing SaaS ~$8B annual'." },
          sam_summary: { type: "string", description: "Serviceable subset realistic for this product." },
          som_year1_summary: { type: "string", description: "What a solo cloner could realistically capture year 1." },
          trend_summary: { type: "string", description: "Is the market growing, flat, dying? Why? Cite the Google Trends signal provided." },
          top_competitors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                url_hint: { type: "string", description: "Best-guess domain or .com handle, no protocol." },
                why_relevant: { type: "string", description: "1 line — how they compete with this idea." },
              },
              required: ["name", "why_relevant"],
            },
            description: "3-5 real competitors you know exist. If none come to mind, return empty array.",
          },
        },
        required: ["tam_summary", "sam_summary", "som_year1_summary", "trend_summary", "top_competitors"],
      },
      revenue_forecast: {
        type: "object",
        description: "Solo founder's realistic year-1 ARR estimates in USD. Bottom-up: think traffic × conversion × ARPU. Course funnels should score LOW unless cloner also runs a course.",
        properties: {
          conservative_arr_usd: { type: "integer", description: "Pessimistic case — 10-20% percentile outcome." },
          base_arr_usd: { type: "integer", description: "Median case — most likely outcome." },
          aggressive_arr_usd: { type: "integer", description: "Top 10% case — execution-heavy outcome." },
          assumptions: {
            type: "array",
            items: { type: "string" },
            description: "3-5 explicit assumptions behind the numbers. Example: 'Assumes 5k organic visitors/mo after 6 months', 'Assumes $19/mo ARPU with 3% trial conversion'.",
          },
        },
        required: ["conservative_arr_usd", "base_arr_usd", "aggressive_arr_usd", "assumptions"],
      },
      insider_tips: {
        type: "array",
        items: { type: "string" },
        description: "5 non-obvious operator tips someone who actually ran this business would know. Things the video does NOT say. Specific tactics, common pitfalls, secret growth channels, regulatory traps, etc.",
      },
      build_path: {
        type: "object",
        description: "Realistic build roadmap for a solo founder using AI coding tools. Be concrete.",
        properties: {
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string", description: "Short milestone title." },
                weeks: { type: "integer", description: "Weeks to ship this step." },
              },
              required: ["title", "weeks"],
            },
            description: "4-7 milestones from zero to first-paying-customer.",
          },
          total_weeks: { type: "integer", description: "Sum of weeks across all milestones." },
          estimated_one_time_cost_usd: { type: "integer", description: "Setup costs: domain, design assets, initial ads, etc." },
          estimated_monthly_cost_usd: { type: "integer", description: "Recurring infra: Vercel/Supabase/Stripe/OpenAI/etc." },
          stack: { type: "array", items: { type: "string" }, description: "Recommended stack — concrete tool names. Example: ['Next.js 15', 'Supabase', 'Stripe', 'Resend', 'Claude API']." },
        },
        required: ["steps", "total_weeks", "estimated_one_time_cost_usd", "estimated_monthly_cost_usd", "stack"],
      },
    },
    required: [
      "brand", "tagline", "target_audience", "problem", "solution",
      "business_model", "red_flags", "likely_real_revenue_source",
      "clone_feasibility_0_100", "honesty_score_0_100", "confidence_0_100",
      "top_risk", "market_reality", "revenue_forecast", "insider_tips", "build_path",
    ],
  },
};

const SYSTEM_PROMPT = `You are ClonePilot — a brutally honest business analyst who tells solo founders the TRUTH about YouTube business videos so they don't waste weeks building the wrong thing.

YOU ARE NOT A VIDEO SUMMARIZER. The user does not want to know what was said. They want to know:
1. **Is this market real and growing, or am I being sold a dream?**
2. **What's the realistic year-1 revenue I could actually make?**
3. **Who really competes here? What did the video conveniently not mention?**
4. **What would an actual operator (who's been doing this for 5 years) tell me that the video skipped?**
5. **How many weeks and dollars to clone this, concretely?**
6. **Is the creator a real builder or a course-seller funnel?**

COURSE-SELLER PATTERNS (auto-detect):
- "월 X천만원 / I made $X" — claims with no verifiable proof (screenshots are trivially faked)
- 마감 임박 / limited spots — artificial scarcity
- $19 → $199 → $2k → $10k coaching ladder visible in description
- Templated testimonials, sponsored video with hidden disclosure
- "Anyone in 30 days" — survivorship bias hidden
- The "real" revenue is selling the course; the activity (blogging, trading) is bait
- description affiliate links contradicting "this is my real income"
- Channel grew unnaturally fast vs channel age (paid promotion signal)
- 90%+ generic "amazing video!" comments (bot inflation)

GROUNDING DATA YOU GET:
- video transcript (or title+desc if transcript fetch failed)
- channel metrics (subs, age, total videos)
- Google Trends signal for the brand keyword
- HackerNews mention count, Wikipedia presence
- video stats (views, likes, comments, published date)

USE EVERYTHING. A real business leaves footprints across all of these. A funnel doesn't.

OUTPUT RULES:
- Default OUTPUT LANGUAGE: English. The site's UI language is separate and handled client-side.
- Numbers must be concrete (e.g. "$24,000 ARR" not "modest revenue").
- Tips must be operator-level non-obvious (e.g. "Most blog-affiliate businesses die at month 4 because Google's spam-update hit AI content hardest in March 2025 — diversify to email list by month 2").
- Be merciless. The user is about to spend weeks. Truth > validation.`;

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

    const [trends, hnCount, wikiFound, relatedVideos] = await Promise.all([
      fetchGoogleTrends(brandCandidate),
      fetchHNMentions(brandCandidate),
      fetchWikiExists(brandCandidate),
      fetchRelatedVideos(brandCandidate, videoId, ytKey),
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

    const clip = transcript.text.slice(0, 14_000);
    const model =
      process.env.CLONEPILOT_MODEL_BLUEPRINT?.trim() || "claude-sonnet-4-6";

    const client = new Anthropic({ apiKey: anthropicKey });
    const resp = await client.messages.create({
      model,
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: "tool", name: EXTRACT_TOOL.name },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this YouTube business video. Deliver actionable market intel — NOT a video summary.

${signalBlock}
TRANSCRIPT (first ${clip.length} chars):
---
${clip}
---

Call extract_business_preview now. Be CONCISE — short sentences, no fluff. Required: brand, tagline (≤80 chars), target_audience (≤120), problem (≤120), solution (≤120), business_model, 3-5 red_flags (each ≤150 chars), likely_real_revenue_source (≤200), 3 numeric scores, top_risk (≤200), market_reality (each summary ≤80, 3-4 competitors), revenue_forecast (3 numbers + 3-5 short assumptions), 5 insider_tips (each ≤200), build_path (4-6 steps, stack 5-8 items). Output in English. Aim for 2500 output tokens total.`,
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
    const args = toolUse.input as Omit<
      AnalyzePreview,
      "video" | "signals" | "related_videos"
    >;
    const preview: AnalyzePreview = {
      ...args,
      video: videoMeta,
      signals,
      related_videos: relatedVideos,
    };
    return NextResponse.json({ ok: true, preview });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
