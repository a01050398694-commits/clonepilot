import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { YoutubeTranscript } from "youtube-transcript";
import { Innertube } from "youtubei.js";
import { ProxyAgent, fetch as undiciFetch } from "undici";
// @ts-expect-error google-trends-api ships no types
import googleTrends from "google-trends-api";
import {
  cacheGet,
  cacheSet,
  rateLimitCheck,
  clientIp,
} from "@/lib/analyze-cache";
import {
  callGeminiTool,
  callGroqJson,
  geminiKeys,
  shouldFallbackFromAnthropic,
} from "@/lib/llm-fallback";
import {
  fetchTopComments,
  analyzeCommentStats,
  parseDescription,
  fetchRedditMentions,
  fetchWaybackFirstSeen,
  fetchChannelVelocity,
  fetchTrendsMulti,
  type Comment,
  type FunnelLink,
  type ChannelVelocity,
} from "@/lib/analyze-signals";

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
  channel_handle?: string;
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
  trends_multi: { keyword: string; direction: string; score: number }[];
  hn_mentions: number;
  wiki_found: boolean;
  reddit_mentions: number;
  reddit_top_titles: string[];
  wayback_first_seen: string | null;
  channel_velocity: ChannelVelocity | null;
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

export type FunnelStep = {
  label: string;
  price_usd_estimate: number;
  is_observed: boolean;
};

export type ExecutionStep = {
  week: number;
  title: string;
  what_you_do: string;
  how_long_hours: number;
  critical_success_factor: string;
};

export type MarketingChannel = {
  channel: string;
  exact_tactic: string;
  expected_cac_usd: number;
  expected_signups_per_month: number;
  why_this_works: string;
};

export type MoneyFlow = {
  source: string;
  share_pct: number;
  monthly_estimate_usd: number;
  notes: string;
};

export type LessonChunk = {
  headline: string;
  teaching: string;
  example_or_quote: string;
  why_it_matters: string;
};

export type Framework = {
  name: string;
  steps: string[];
  use_when: string;
};

export type CourseDistilled = {
  one_line_summary: string;
  lesson_chunks: LessonChunk[];
  frameworks_taught: Framework[];
  specific_tactics: string[];
  what_creator_left_out: string[];
  if_you_apply_this: string;
  course_quality_0_100: number;
  reading_time_minutes: number;
};

export type CommentStats = {
  total: number;
  avg_length: number;
  emoji_only_ratio: number;
  generic_praise_ratio: number;
  bot_ratio_0_100: number;
};

export type AnalyzePreview = {
  brand: string;
  tagline: string;
  target_audience: string;
  problem: string;
  solution: string;
  business_model: BusinessModel;
  red_flags: string[];
  green_flags: string[];
  likely_real_revenue_source: string;
  why_buyers_pay: string;
  honest_value_for_buyer: string;
  clone_feasibility_0_100: number;
  honesty_score_0_100: number;
  confidence_0_100: number;
  bot_inflation_0_100: number;
  real_proof_score_0_100: number;
  hype_vs_reality_0_100: number;
  top_risk: string;
  market_reality: MarketReality;
  revenue_forecast: RevenueForecast;
  funnel_ladder: FunnelStep[];
  insider_tips: string[];
  build_path: BuildPath;
  execution_sequence: ExecutionStep[];
  marketing_playbook: MarketingChannel[];
  money_flow: MoneyFlow[];
  course_distilled: CourseDistilled;
  one_paragraph_verdict: string;
  video: VideoMeta;
  signals: SignalBlock;
  related_videos: RelatedVideo[];
  description_findings: {
    funnel_links: FunnelLink[];
    course_keyword_hits: string[];
    price_mentions_usd: number[];
  };
  comment_stats: CommentStats;
};

/* ─── transcript fetching chain (unchanged) ──────────────────────────── */

async function fetchViaPageScrape(
  videoId: string,
): Promise<{ text: string; lang: string; source: string }> {
  const proxyUrl = process.env.BRIGHTDATA_PROXY_URL;
  const dispatcher = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
  const headers = {
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36",
    "accept-language": "ko,en;q=0.8",
  };
  const r = await undiciFetch(
    `https://www.youtube.com/watch?v=${videoId}&hl=ko`,
    {
      headers,
      dispatcher,
      signal: AbortSignal.timeout(20_000),
    },
  );
  if (!r.ok) throw new Error(`yt page ${r.status}`);
  const html = await r.text();
  const m = html.match(/"captionTracks":(\[[^\]]+\])/);
  if (!m) throw new Error("no captionTracks in page html");
  type Track = { baseUrl: string; languageCode: string };
  const tracks = JSON.parse(m[1]) as Track[];
  if (tracks.length === 0) throw new Error("captionTracks empty");
  const pick =
    tracks.find((t) => t.languageCode === "ko") ??
    tracks.find((t) => t.languageCode === "en") ??
    tracks[0];
  const trackUrl = pick.baseUrl.replace(/&fmt=[^&]*/g, "");
  const tr = await undiciFetch(trackUrl, {
    dispatcher,
    signal: AbortSignal.timeout(20_000),
  });
  if (!tr.ok) throw new Error(`caption track ${tr.status}`);
  const xml = await tr.text();
  const texts = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map((mm) =>
    decodeXml(mm[1].replace(/\n/g, " ")),
  );
  const text = texts.join(" ").replace(/\s+/g, " ").trim();
  if (text.length < 50) throw new Error("page-scrape transcript too short");
  return {
    text,
    lang: pick.languageCode,
    source: proxyUrl ? "page-scrape+proxy" : "page-scrape",
  };
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

async function fetchViaInnertube(videoId: string) {
  const proxyUrl = process.env.BRIGHTDATA_PROXY_URL;
  type CreateOpts = Parameters<typeof Innertube.create>[0];
  const opts: CreateOpts = { retrieve_player: false };
  if (proxyUrl) {
    const dispatcher = new ProxyAgent(proxyUrl);
    const proxiedFetch = (input: RequestInfo | URL, init?: RequestInit) =>
      fetch(input as RequestInfo, {
        ...(init ?? {}),
        dispatcher,
      } as RequestInit & { dispatcher: ProxyAgent });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (opts as any).fetch = proxiedFetch;
  }
  const yt = await Innertube.create(opts);
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
  return { text, lang: "auto", source: proxyUrl ? "innertube+proxy" : "innertube" };
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
    ["page-scrape", () => fetchViaPageScrape(videoId)],
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
  snippet?: {
    publishedAt?: string;
    title?: string;
    customUrl?: string;
  };
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

/* ─── single google trends (kept for primary keyword backwards compat) ─ */

type GoogleTrendsModule = {
  interestOverTime: (opts: { keyword: string; startTime: Date }) => Promise<string>;
};

async function fetchGoogleTrendsPrimary(
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
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("trends timeout")), 6_000),
      ),
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
    const direction =
      ratio > 1.3 ? "rising" : ratio < 0.7 ? "declining" : "stable";
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

/* ─── Anthropic schema (expanded) ──────────────────────────────────────── */

const EXTRACT_TOOL: Anthropic.Tool = {
  name: "extract_business_preview",
  description:
    "Brutally honest, actionable business analysis. NOT a video summary. The reader is about to spend money or months on this idea — tell them the truth.",
  input_schema: {
    type: "object",
    properties: {
      brand: { type: "string" },
      tagline: { type: "string", description: "≤80 chars." },
      target_audience: { type: "string", description: "≤120 chars." },
      problem: { type: "string", description: "≤120 chars." },
      solution: { type: "string", description: "≤120 chars." },
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
      },
      red_flags: {
        type: "array",
        items: { type: "string" },
        description:
          "Concrete observations using the supplied signals. Each ≤180 chars. Empty array only if literally none.",
      },
      green_flags: {
        type: "array",
        items: { type: "string" },
        description:
          "Concrete positive signals. Each ≤180 chars. Empty array if none.",
      },
      likely_real_revenue_source: {
        type: "string",
        description: "Where the money REALLY comes from. ≤220 chars.",
      },
      why_buyers_pay: {
        type: "string",
        description:
          "Why someone pays the high course price even if the course content is poor — the actual emotional/psychological driver (FOMO, identity, community, status, sunk-cost commitment, etc.). ≤220 chars.",
      },
      honest_value_for_buyer: {
        type: "string",
        description:
          "What the buyer actually receives that has real value (community access, accountability, branded shortcut, etc.) vs what is hype. ≤220 chars.",
      },
      clone_feasibility_0_100: { type: "integer", minimum: 0, maximum: 100 },
      honesty_score_0_100: { type: "integer", minimum: 0, maximum: 100 },
      confidence_0_100: { type: "integer", minimum: 0, maximum: 100 },
      bot_inflation_0_100: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description:
          "How inflated the comment section looks vs organic. Use the supplied comment_stats heuristics + your read of the video.",
      },
      real_proof_score_0_100: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description:
          "How much verifiable proof exists for the revenue claims. Stripe dashboard, audited reports, third-party press, Wikipedia, HN traction, Wayback longevity = high. Bare screenshots = low.",
      },
      hype_vs_reality_0_100: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description:
          "0 = pure hype, 100 = matches reality. Combines revenue claim plausibility, market signals, and channel velocity.",
      },
      top_risk: { type: "string", description: "≤220 chars." },
      market_reality: {
        type: "object",
        properties: {
          tam_summary: { type: "string", description: "≤100 chars." },
          sam_summary: { type: "string", description: "≤100 chars." },
          som_year1_summary: { type: "string", description: "≤100 chars." },
          trend_summary: { type: "string", description: "≤140 chars." },
          top_competitors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                url_hint: { type: "string" },
                why_relevant: { type: "string" },
              },
              required: ["name", "why_relevant"],
            },
          },
        },
        required: [
          "tam_summary",
          "sam_summary",
          "som_year1_summary",
          "trend_summary",
          "top_competitors",
        ],
      },
      revenue_forecast: {
        type: "object",
        properties: {
          conservative_arr_usd: { type: "integer" },
          base_arr_usd: { type: "integer" },
          aggressive_arr_usd: { type: "integer" },
          assumptions: { type: "array", items: { type: "string" } },
        },
        required: [
          "conservative_arr_usd",
          "base_arr_usd",
          "aggressive_arr_usd",
          "assumptions",
        ],
      },
      funnel_ladder: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "Short rung name." },
            price_usd_estimate: { type: "integer" },
            is_observed: {
              type: "boolean",
              description:
                "True if directly observed in description / video / link domains. False if inferred from genre.",
            },
          },
          required: ["label", "price_usd_estimate", "is_observed"],
        },
        description:
          "3-5 rungs in ascending price order. Example: [Free YT, $19 ebook, $497 course, $2,000 coaching, $10,000 mastermind]. If business_model is not a funnel type, return [].",
      },
      execution_sequence: {
        type: "array",
        items: {
          type: "object",
          properties: {
            week: { type: "integer", description: "Week number from start (1, 2, ...)" },
            title: { type: "string", description: "Short milestone label." },
            what_you_do: { type: "string", description: "Exact action — concrete, like a checklist line." },
            how_long_hours: { type: "integer", description: "Approx work-hours this step costs." },
            critical_success_factor: { type: "string", description: "The ONE thing that makes this step succeed or fail." },
          },
          required: ["week", "title", "what_you_do", "how_long_hours", "critical_success_factor"],
        },
        description: "7-12 step playbook from zero to first paying customer. MANDATORY — never empty. If unsure, use generic-but-specific moves for this business genre.",
      },
      marketing_playbook: {
        type: "array",
        items: {
          type: "object",
          properties: {
            channel: { type: "string", description: "Concrete channel name. E.g. 'Reddit r/Entrepreneur', 'Google Ads — long-tail blog SEO', 'Twitter cold DM', 'Instagram reels'." },
            exact_tactic: { type: "string", description: "EXACT play — one short paragraph any operator can copy." },
            expected_cac_usd: { type: "integer", description: "Realistic CAC for this channel in this niche." },
            expected_signups_per_month: { type: "integer", description: "Realistic signups/month if executed at average competence." },
            why_this_works: { type: "string", description: "Why this channel fits THIS business specifically." },
          },
          required: ["channel", "exact_tactic", "expected_cac_usd", "expected_signups_per_month", "why_this_works"],
        },
        description: "4-6 marketing channels with exact tactics. MANDATORY — never empty. Pick the channels most likely to ACTUALLY work for this specific business type, not generic 'do SEO'.",
      },
      money_flow: {
        type: "array",
        items: {
          type: "object",
          properties: {
            source: { type: "string", description: "Revenue source. E.g. 'Pro subscription $19/mo', 'Course $497 one-time', 'Affiliate commission Coupang', 'YouTube AdSense'." },
            share_pct: { type: "integer", description: "Estimated share of total revenue (0-100). All sources should roughly sum to 100." },
            monthly_estimate_usd: { type: "integer", description: "Estimated monthly $ from this source at base-case." },
            notes: { type: "string", description: "Why this source contributes this share — 1 sentence." },
          },
          required: ["source", "share_pct", "monthly_estimate_usd", "notes"],
        },
        description: "5+ revenue sources breaking down where ALL the money actually comes from. MANDATORY. The TRUE breakdown — not what the video claims.",
      },
      course_distilled: {
        type: "object",
        description:
          "Distill the video AS IF it were a paid course. The reader should be able to read this section and feel like they 'took the course' in 3 minutes. MANDATORY — never empty even if transcript is weak.",
        properties: {
          one_line_summary: {
            type: "string",
            description:
              "If the video had to be summarized as a one-line lesson hook (like a course landing page subtitle), what is it? ≤120 chars.",
          },
          lesson_chunks: {
            type: "array",
            description:
              "5-8 distinct lessons the video actually teaches, in the order the creator presents them. Like chapter notes from someone who watched it on 2x and took notes. MANDATORY — never empty.",
            items: {
              type: "object",
              properties: {
                headline: {
                  type: "string",
                  description: "The lesson title — punchy and specific. ≤80 chars.",
                },
                teaching: {
                  type: "string",
                  description:
                    "The core idea taught, in 2-3 sentences. Write it as if YOU are the teacher reteaching it to the reader. Concrete and actionable. ≤400 chars.",
                },
                example_or_quote: {
                  type: "string",
                  description:
                    "A specific example, number, or near-quote the creator uses to illustrate this lesson. If the transcript is weak, infer a plausible illustration. ≤220 chars.",
                },
                why_it_matters: {
                  type: "string",
                  description:
                    "Why this lesson is important for someone trying to clone the business. ≤180 chars.",
                },
              },
              required: ["headline", "teaching", "example_or_quote", "why_it_matters"],
            },
          },
          frameworks_taught: {
            type: "array",
            description:
              "Named frameworks / step-by-step systems the creator teaches. 1-4 frameworks. Empty array only if the video is purely anecdotal.",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description:
                    "The framework name (creator's own if any — e.g. 'Hook → Story → Offer', '4-Quadrant Lead Magnet'). ≤70 chars.",
                },
                steps: {
                  type: "array",
                  items: { type: "string" },
                  description: "3-7 sequential steps. Each ≤140 chars.",
                },
                use_when: {
                  type: "string",
                  description: "When to apply this framework. ≤180 chars.",
                },
              },
              required: ["name", "steps", "use_when"],
            },
          },
          specific_tactics: {
            type: "array",
            items: { type: "string" },
            description:
              "5-10 SPECIFIC tactics with concrete details — exact tool names, prices, link types, percentages, scripts. NO 'be consistent' fluff. E.g. 'Run TikTok Spark Ads at $30/day for first 7 days; pause anything under 2% CTR.' Each ≤220 chars.",
          },
          what_creator_left_out: {
            type: "array",
            items: { type: "string" },
            description:
              "3-5 important things the creator did NOT show you that you NEED to know to actually pull this off. Could be hidden costs, real timeline, tools they actually use vs what they show, etc. Each ≤200 chars.",
          },
          if_you_apply_this: {
            type: "string",
            description:
              "Realistic 6-month outcome if a normal solo operator follows EVERY tactic in this video exactly. Specific numbers, e.g. '~$2,000/mo by month 6 IF you publish 3x/week and survive the first 90 days of zero traction.' ≤300 chars.",
          },
          course_quality_0_100: {
            type: "integer",
            minimum: 0,
            maximum: 100,
            description:
              "How useful is what the video teaches if you ignore the funnel? 0 = pure fluff. 100 = could be a $500 paid course. Separate from honesty_score.",
          },
          reading_time_minutes: {
            type: "integer",
            minimum: 1,
            maximum: 15,
            description: "Approx minutes to read this entire distilled lesson block.",
          },
        },
        required: [
          "one_line_summary",
          "lesson_chunks",
          "frameworks_taught",
          "specific_tactics",
          "what_creator_left_out",
          "if_you_apply_this",
          "course_quality_0_100",
          "reading_time_minutes",
        ],
      },
      insider_tips: {
        type: "array",
        items: { type: "string" },
        description:
          "5 non-obvious operator-level tips. Each ≤220 chars.",
      },
      build_path: {
        type: "object",
        properties: {
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                weeks: { type: "integer" },
              },
              required: ["title", "weeks"],
            },
          },
          total_weeks: { type: "integer" },
          estimated_one_time_cost_usd: { type: "integer" },
          estimated_monthly_cost_usd: { type: "integer" },
          stack: { type: "array", items: { type: "string" } },
        },
        required: [
          "steps",
          "total_weeks",
          "estimated_one_time_cost_usd",
          "estimated_monthly_cost_usd",
          "stack",
        ],
      },
      one_paragraph_verdict: {
        type: "string",
        description:
          "A single paragraph (5-7 sentences) that a friend would tell you over coffee. No corporate fluff. Tell the reader EXACTLY what to do or skip. ≤900 chars.",
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
      "green_flags",
      "likely_real_revenue_source",
      "why_buyers_pay",
      "honest_value_for_buyer",
      "clone_feasibility_0_100",
      "honesty_score_0_100",
      "confidence_0_100",
      "bot_inflation_0_100",
      "real_proof_score_0_100",
      "hype_vs_reality_0_100",
      "top_risk",
      "market_reality",
      "revenue_forecast",
      "funnel_ladder",
      "insider_tips",
      "build_path",
      "execution_sequence",
      "marketing_playbook",
      "money_flow",
      "course_distilled",
      "one_paragraph_verdict",
    ],
  },
};

const SYSTEM_PROMPT = `You are ClonePilot — a brutally honest analyst + master teacher. You watch a YouTube business video and produce TWO things in one report:

PART A — REVERSE ENGINEER THE BUSINESS (so the reader does NOT waste months on a fake idea):
1. Is this business REAL or am I being sold a dream?
2. If I clone the idea, what's a realistic year-1 revenue I'd actually make?
3. Where does the money really come from — product, course, ads, coaching, affiliates?
4. What did the creator NOT show that I need to know?
5. Why do people actually pay this creator (the psychological mechanism), and what real value do they get?
6. Concretely, how many weeks and dollars to clone this?

PART B — DISTILL THE VIDEO AS IF IT WERE A PAID COURSE (the user's #1 request):
The viewer wants to skip the 45-min video and read a 3-min "I took the course" digest. You must extract:
- The CORE LESSONS the creator actually teaches, in their order — like chapter notes. 5-8 chunks, each with a headline, the teaching (re-taught by YOU as a clear teacher), an example/quote, and why it matters to the cloner.
- Any NAMED FRAMEWORKS or step-by-step systems (1-4 of them) with their actual steps.
- 5-10 SPECIFIC TACTICS — exact tools, prices, scripts, percentages. No "be consistent" fluff.
- 3-5 things the creator LEFT OUT that you need to know to actually pull this off.
- A 6-month realistic outcome forecast if you follow this video to the letter.

The course_distilled section is NOT a summary. You are TEACHING the lesson to the reader. Write as a teacher would: clear, direct, no padding. The reader should close the report feeling they actually learned what the video teaches — including the parts the creator obscured.

COURSE-FUNNEL PATTERNS (auto-detect using ALL supplied signals):
- "월 X천만원 / I made $X" with no verifiable third-party proof
- 마감 임박 / "only 7 spots left" — artificial scarcity
- Description contains links to course platforms (Teachable, Kajabi, Stan, Gumroad, Cafe24, 오픈채팅 link)
- Funnel ladder visible in description: $19 → $199 → $2,000 → $10,000
- Sponsored or paid promotion with weak disclosure
- Comment section: high generic-praise ratio, short comments, emoji-only — bot inflation signal
- Channel age very young vs subscriber count (paid growth)
- Almost no HN/Wiki/Reddit chatter despite "huge" numbers claimed
- Recent uploads pump same product repeatedly

GROUNDING DATA YOU GET:
- transcript (or title+description if transcript fetch failed)
- channel metrics (subs, age, total videos, upload velocity 90d)
- video stats
- Google Trends (1-3 keywords)
- HackerNews mentions, Wikipedia presence
- Reddit search hits (top 5 titles)
- Wayback Machine first-seen date for the channel
- Top 30 YouTube comments + bot-likely heuristic score
- Description parser output: detected links + course keywords + USD-normalized price mentions

USE EVERYTHING. A real business leaves footprints across multiple signals. A funnel does not.

WHY BUYERS PAY (think about this honestly):
Even bad courses sell. Reasons people pay $500-$10k:
- Sunk-cost psychology: paying more makes them follow through
- Community / accountability access
- Identity purchase ("I am someone who took this")
- FOMO from scarcity, deadlines
- Trust transfer from creator's brand
- Aspiration purchase (signaling)
Distinguish these from genuine educational value.

OUTPUT RULES (NON-NEGOTIABLE):
- Default language: English. UI translation is separate.
- Numbers concrete (e.g., "$24,000 ARR" not "modest revenue"). USD only.
- Operator-level non-obvious tips. No generic startup advice.
- one_paragraph_verdict reads like a friend over coffee — direct, no hedging, no corporate fluff.

YOU MUST PRODUCE A COMPLETE REPORT EVERY TIME. NO EXCEPTIONS.
- "Unclear" / "cannot determine" / "need more data" is BANNED. The user sees this and feels cheated.
- If transcript is missing or weak, INFER aggressively from title + description + channel signals + your training data. Use the business genre to fill plausible details.
- business_model: NEVER "unclear" unless the URL is literally not a business video. Pick the closest match.
- execution_sequence: ALWAYS 7-12 steps. Even for vague videos, give a generic-but-specific playbook (e.g. "build MVP in 2 weeks with X stack, test pricing on N customers, double down on the channel that converts").
- marketing_playbook: ALWAYS 4-6 channels. Use what is KNOWN to work for this business genre.
- money_flow: ALWAYS 5+ sources summing roughly to 100%. If the video only mentions one source, break it down further (subscriptions vs annual vs upsells, etc).
- funnel_ladder: If business_model is course-funnel / consulting-front / affiliate-bait / personal-brand, ALWAYS produce 3-5 rungs even if not directly observed. Mark is_observed=false for inferred rungs.
- insider_tips: ALWAYS 5 tips operator-level. Never generic.
- red_flags + green_flags: If transcript is weak, infer from channel velocity, subs, age, comment stats, description patterns.

PLAYBOOK STYLE:
- execution_sequence reads like a step-by-step "hack the business" plan. Week 1: do X for Y hours, success factor is Z. Week 2: do A. Etc.
- marketing_playbook reads like an internal Slack from someone who has run this business. "Drop $500 into r/Entrepreneur ads, expect ~30 signups, CAC $17, this works because that sub trusts personal-brand content."
- money_flow reads like a leaked P&L. Where every dollar comes from, not what they marketed.

COURSE_DISTILLED STYLE (NEW — read this carefully):
- Treat the video like a $500 paid course you just took. Your job is to be the TA who hands the student a perfect study guide so they don't need to rewatch.
- lesson_chunks: 5-8 chunks. Each headline = punchy lesson title ("Why your first 10 customers can't come from cold ads"). teaching = you, the TA, RE-TEACHING the lesson clearly in 2-3 sentences — not paraphrasing the creator, not "the creator says X". Just teach it. example_or_quote = a real example, number, or near-quote the creator used. If transcript is weak, INFER a plausible example based on the genre. why_it_matters = practical relevance to the cloner.
- frameworks_taught: only if the video actually has named systems. If the creator says "the 3-step lead magnet method", capture it. If purely anecdotal, empty.
- specific_tactics: this is where you write GOLD — exact playbook moves. "Run TikTok Spark Ads at $30/day for 7 days, pause anything below 2% CTR." "Use Notion + Tally for first MVP, switch to Webflow only after $5k MRR." NO generic advice — only things an operator could literally execute Monday morning.
- what_creator_left_out: the hidden costs, the timeline reality (creator says "3 weeks", real founders take 5 months), the tools they really use vs what they show, the unpaid hours, the failed iterations.
- if_you_apply_this: realistic forecast. e.g. "Following every step exactly, expect ~$500-2000 MRR by month 6 IF you publish 3x/week AND survive the first 90 days of zero traction. ~70% of people quit by month 3."
- course_quality_0_100: separate from honesty. A scammy funnel can still teach real tactics (high quality, low honesty). A boring real-product video can have low course_quality but high honesty.`;

/* ─── main POST handler ────────────────────────────────────────────────── */

export async function POST(req: Request) {
  const ip = clientIp(req);
  const retryMs = rateLimitCheck(ip);
  if (retryMs != null) {
    return NextResponse.json(
      {
        error: `Rate limit. Try again in ${Math.ceil(retryMs / 1000)}s.`,
        retry_after_ms: retryMs,
      },
      { status: 429 },
    );
  }

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

  const cached = cacheGet<AnalyzePreview>(videoId);
  if (cached) {
    return NextResponse.json({
      ok: true,
      preview: cached,
      _debug: { source: "cache" },
    });
  }

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
    /* ── stage 1: video + channel + transcript (sequential where data depends) */
    const [oembed, videoData] = await Promise.all([
      fetchOEmbed(videoId),
      fetchVideoData(videoId, ytKey),
    ]);
    const channelId = videoData?.snippet?.channelId;
    const channelData =
      channelId && ytKey ? await fetchChannelData(channelId, ytKey) : null;
    const channelHandle =
      channelData?.snippet?.customUrl?.replace(/^@/, "") ?? "";

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

    /* ── stage 2: parallel free signals */
    const brandCandidate =
      oembed.title.split(/[—\-:|]/)[0].trim().slice(0, 60) ||
      videoData?.snippet?.title?.slice(0, 60) ||
      oembed.channel;

    const desc = videoData?.snippet?.description ?? "";
    const descFindings = parseDescription(desc);

    const trendsModule = googleTrends as GoogleTrendsModule;
    const trendKeywords = [
      brandCandidate,
      ...descFindings.course_keyword_hits.slice(0, 2),
    ].filter(Boolean);

    const [
      trends,
      trendsMulti,
      hnCount,
      wikiFound,
      relatedVideos,
      topComments,
      reddit,
      waybackFirst,
      velocity,
    ] = await Promise.all([
      fetchGoogleTrendsPrimary(brandCandidate),
      fetchTrendsMulti(trendKeywords, trendsModule),
      fetchHNMentions(brandCandidate),
      fetchWikiExists(brandCandidate),
      fetchRelatedVideos(brandCandidate, videoId, ytKey),
      fetchTopComments(videoId, ytKey, 30),
      fetchRedditMentions(brandCandidate),
      channelHandle
        ? fetchWaybackFirstSeen(channelHandle)
        : Promise.resolve(null),
      channelId ? fetchChannelVelocity(channelId, ytKey) : Promise.resolve(null),
    ]);

    const commentStats = analyzeCommentStats(topComments);

    /* ── stage 3: build grounding block + call LLM */
    const stats = videoData?.statistics ?? {};
    const chStats = channelData?.statistics ?? {};
    const chSnip = channelData?.snippet ?? {};

    const videoMeta: VideoMeta = {
      id: videoId,
      title: oembed.title || videoData?.snippet?.title || "",
      channel: oembed.channel || videoData?.snippet?.channelTitle || "",
      channel_id: channelId,
      channel_handle: channelHandle || undefined,
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
      description_chars: desc.length,
      transcript_chars: transcript.text.length,
      transcript_source: transcript.source,
    };

    const signals: SignalBlock = {
      trends: trends ?? undefined,
      trends_multi: trendsMulti,
      hn_mentions: hnCount,
      wiki_found: wikiFound,
      reddit_mentions: reddit.count,
      reddit_top_titles: reddit.top_titles,
      wayback_first_seen: waybackFirst,
      channel_velocity: velocity,
    };

    const channelAgeYears = chSnip.publishedAt
      ? (Date.now() - new Date(chSnip.publishedAt).getTime()) /
        (365 * 24 * 60 * 60 * 1000)
      : null;

    const fmtNum = (n: number | undefined) =>
      n == null ? "?" : n.toLocaleString();

    const linksSummary = descFindings.funnel_links
      .slice(0, 10)
      .map(
        (l, i) =>
          `  ${i + 1}. [${l.domain}]${l.is_course_hint ? " (COURSE-HINT)" : ""} — ${l.context_snippet.slice(0, 60)}`,
      )
      .join("\n");

    const commentSummary = topComments
      .slice(0, 15)
      .map(
        (c, i) =>
          `  ${i + 1}. (${c.likes}♥) ${c.text.replace(/\s+/g, " ").slice(0, 130)}`,
      )
      .join("\n");

    const trendsLine =
      trendsMulti.length > 0
        ? trendsMulti
            .map(
              (t) =>
                `"${t.keyword}" ${t.direction} (score ${t.score}/100)`,
            )
            .join(" · ")
        : "no signal";

    const groundingBlock = `EXTERNAL SIGNALS (use ALL of these):

VIDEO:
- Published ${videoMeta.published_at?.slice(0, 10) ?? "?"} · views ${fmtNum(videoMeta.view_count)} · likes ${fmtNum(videoMeta.like_count)} · comments ${fmtNum(videoMeta.comment_count)}

CHANNEL "${videoMeta.channel}":
- subs ${fmtNum(videoMeta.channel_subscribers)} · total videos ${fmtNum(videoMeta.channel_video_count)}
- joined ${chSnip.publishedAt?.slice(0, 10) ?? "?"}${channelAgeYears != null ? ` (age ${channelAgeYears.toFixed(1)} yrs)` : ""}
- handle @${channelHandle || "?"}
- wayback-machine first archive: ${waybackFirst ?? "never"}
- recent 90d uploads: ${velocity?.recent_uploads_90d ?? "?"} (avg view ${fmtNum(velocity?.recent_avg_views ?? undefined)}, ${velocity?.uploads_per_week ?? "?"}/wk)

EXTERNAL FOOTPRINT:
- Google Trends (5yr): ${trendsLine}
- HackerNews mentions: ${hnCount}
- Wikipedia: ${wikiFound ? "page exists" : "no page"}
- Reddit hits for "${brandCandidate}": ${reddit.count} ${reddit.top_titles.length > 0 ? "(" + reddit.top_titles.slice(0, 3).join(" | ").slice(0, 200) + ")" : ""}

VIDEO DESCRIPTION (${desc.length} chars):
${desc.slice(0, 1000).replace(/\n/g, " | ")}

DESCRIPTION PARSER:
- Detected ${descFindings.funnel_links.length} link(s)${descFindings.funnel_links.length > 0 ? ":\n" + linksSummary : ""}
- Course-genre keywords found: ${descFindings.course_keyword_hits.join(", ") || "none"}
- USD-normalized prices mentioned: ${descFindings.price_mentions_usd.join(", ") || "none"}

COMMENT STATS (top ${commentStats.total}):
- Avg length: ${commentStats.avg_length} chars
- Emoji-only: ${commentStats.emoji_only_ratio}%
- Generic short praise: ${commentStats.generic_praise_ratio}%
- Bot-likely heuristic score: ${commentStats.bot_ratio_0_100}/100

TOP COMMENTS:
${commentSummary || "  (none fetched)"}

${transcriptError ? `\n!! TRANSCRIPT FETCH FAILED: ${transcriptError}\nYou have ONLY title + description below. Cap confidence at 35 and call this out in top_risk.\n` : `Transcript source: ${transcript.source} (${videoMeta.transcript_chars.toLocaleString()} chars)`}
`;

    const clip = transcript.text.slice(0, 14_000);
    const model =
      process.env.CLONEPILOT_MODEL_BLUEPRINT?.trim() ||
      "claude-haiku-4-5-20251001";

    const userText = `Analyze this YouTube business video. Reverse-engineer the business, NOT the video.

${groundingBlock}

TRANSCRIPT (first ${clip.length} chars):
---
${clip}
---

Call extract_business_preview now. Output English. Be concise but punchy — operator-level not corporate. Required fields all present.`;

    type ExtractArgs = Omit<
      AnalyzePreview,
      | "video"
      | "signals"
      | "related_videos"
      | "description_findings"
      | "comment_stats"
    >;

    let args: ExtractArgs;
    let providerUsed = "anthropic";
    let modelUsed = model;

    const allGeminiKeys = geminiKeys();
    const hasGemini = allGeminiKeys.length > 0;
    const geminiPrimary =
      process.env.CLONEPILOT_GEMINI_PRIMARY?.trim() === "1" && hasGemini;

    try {
      if (geminiPrimary) {
        throw new Error("gemini-primary: skipping anthropic");
      }
      const client = new Anthropic({ apiKey: anthropicKey });
      const resp = await client.messages.create({
        model,
        max_tokens: 16_000,
        system: SYSTEM_PROMPT,
        tools: [EXTRACT_TOOL],
        tool_choice: { type: "tool", name: EXTRACT_TOOL.name },
        messages: [{ role: "user", content: [{ type: "text", text: userText }] }],
      });
      const toolUse = resp.content.find((c) => c.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") {
        throw new Error("Anthropic did not return tool_use.");
      }
      args = toolUse.input as ExtractArgs;
    } catch (err) {
      const isPrimarySkip =
        err instanceof Error && err.message.startsWith("gemini-primary:");
      if (!isPrimarySkip && (!shouldFallbackFromAnthropic(err) || !hasGemini)) {
        throw err;
      }
      if (!hasGemini) throw err;
      console.error(
        "[/api/analyze] Anthropic failed, falling back to Gemini —",
        err instanceof Error ? err.message : err,
      );
      try {
        const g = await callGeminiTool<ExtractArgs>({
          model: process.env.CLONEPILOT_MODEL_FALLBACK?.trim() || "gemini-2.5-flash",
          system: SYSTEM_PROMPT,
          userText,
          tool: EXTRACT_TOOL,
        });
        args = g.args;
        providerUsed = "gemini";
        modelUsed = g.model;
      } catch (geminiErr) {
        // Last-resort: Groq Llama 3.3 via OpenAI-compatible JSON mode.
        if (!process.env.GROQ_API_KEY) throw geminiErr;
        console.error(
          "[/api/analyze] Gemini exhausted, trying Groq —",
          geminiErr instanceof Error ? geminiErr.message : geminiErr,
        );
        const schemaHint = JSON.stringify(EXTRACT_TOOL.input_schema);
        const groqUser = `${userText}\n\nIMPORTANT — your output MUST be a single JSON object exactly matching this schema (no markdown, no commentary, JUST the JSON):\n${schemaHint}\n\nReturn the JSON object now.`;
        const gr = await callGroqJson<ExtractArgs>({
          system: SYSTEM_PROMPT,
          userText: groqUser,
        });
        args = gr.value;
        providerUsed = "groq";
        modelUsed = gr.model;
      }
    }
    const preview: AnalyzePreview = {
      ...args,
      video: videoMeta,
      signals,
      related_videos: relatedVideos,
      description_findings: descFindings,
      comment_stats: commentStats,
    };

    cacheSet(videoId, preview);

    return NextResponse.json({
      ok: true,
      preview,
      _debug: {
        transcript_source: transcript.source,
        transcript_error: transcriptError,
        provider_used: providerUsed,
        model_used: modelUsed,
        source: "fresh",
      },
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "unknown error";
    console.error("[/api/analyze] failed", err);
    // Friendly mapping — never expose raw "gemini 429: quota exceeded" or
    // "Anthropic 529 overloaded" to a non-technical user.
    let friendly = raw;
    let status = 500;
    if (/quota|429|RESOURCE_EXHAUSTED|rate.?limit/i.test(raw)) {
      friendly =
        "All AI providers are momentarily at capacity. Please retry in about 60 seconds.";
      status = 503;
    } else if (/5\d\d|overloaded|timeout|fetch failed/i.test(raw)) {
      friendly =
        "The AI provider is overloaded right now. Please try again in a minute.";
      status = 503;
    } else if (/transcript|no captionTracks|captions/i.test(raw)) {
      friendly =
        "Couldn't pull a transcript for this video. Try a different video or wait — title + description fallback should still work.";
      status = 422;
    }
    return NextResponse.json(
      { error: friendly, _raw: raw },
      { status },
    );
  }
}
