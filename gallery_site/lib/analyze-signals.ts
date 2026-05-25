/**
 * Free-only data sources for the deep analysis.
 * Every source returns a "best effort" — never throws to the caller.
 * Each fetcher hard-times-out so a single slow source can't hang the pipeline.
 */

const T = {
  short: 6_000,
  med: 9_000,
  long: 12_000,
};

function timeout(ms: number): AbortSignal {
  return AbortSignal.timeout(ms);
}

/* ─── YouTube top comments (Data API v3 — 1 quota unit per call) ────── */

export type Comment = {
  author: string;
  text: string;
  likes: number;
  reply_count: number;
};

export async function fetchTopComments(
  videoId: string,
  ytKey: string | undefined,
  limit = 30,
): Promise<Comment[]> {
  if (!ytKey) return [];
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/commentThreads` +
      `?part=snippet&videoId=${videoId}&maxResults=${limit}` +
      `&order=relevance&textFormat=plainText&key=${ytKey}`;
    const r = await fetch(url, { signal: timeout(T.med) });
    if (!r.ok) return [];
    type Item = {
      snippet?: {
        topLevelComment?: {
          snippet?: {
            authorDisplayName?: string;
            textDisplay?: string;
            likeCount?: number;
          };
        };
        totalReplyCount?: number;
      };
    };
    const j = (await r.json()) as { items?: Item[] };
    return (j.items ?? [])
      .map((it) => {
        const s = it.snippet?.topLevelComment?.snippet;
        return {
          author: s?.authorDisplayName ?? "",
          text: (s?.textDisplay ?? "").slice(0, 400),
          likes: s?.likeCount ?? 0,
          reply_count: it.snippet?.totalReplyCount ?? 0,
        };
      })
      .filter((c) => c.text.length > 0);
  } catch {
    return [];
  }
}

/** Quick statistical heuristics for bot detection (no LLM call). */
export function analyzeCommentStats(comments: Comment[]): {
  total: number;
  avg_length: number;
  emoji_only_ratio: number;
  generic_praise_ratio: number;
  bot_ratio_0_100: number;
} {
  if (comments.length === 0) {
    return {
      total: 0,
      avg_length: 0,
      emoji_only_ratio: 0,
      generic_praise_ratio: 0,
      bot_ratio_0_100: 0,
    };
  }
  const avgLen =
    comments.reduce((a, c) => a + c.text.length, 0) / comments.length;

  // generic praise patterns (multilingual)
  const generic = /^(amazing|great|love|awesome|wow|nice|good|thanks|thank you|incredible|best|legend|fire|insane|꿀팁|대박|잘봤|좋아요|최고|감사|gracias|excelente|素晴|すご|太棒|wonderful)\b/i;
  const onlyEmoji = /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+$/u;

  let genericCount = 0;
  let emojiOnly = 0;
  for (const c of comments) {
    const t = c.text.trim();
    if (onlyEmoji.test(t)) emojiOnly++;
    if (t.length < 25 && generic.test(t)) genericCount++;
  }
  const genericRatio = genericCount / comments.length;
  const emojiRatio = emojiOnly / comments.length;
  // Bot-likely score: heavy short-praise OR emoji-only inflation
  const botScore = Math.min(
    100,
    Math.round(genericRatio * 75 + emojiRatio * 35 + (avgLen < 25 ? 20 : 0)),
  );
  return {
    total: comments.length,
    avg_length: Math.round(avgLen),
    emoji_only_ratio: Math.round(emojiRatio * 100),
    generic_praise_ratio: Math.round(genericRatio * 100),
    bot_ratio_0_100: botScore,
  };
}

/* ─── Description parser: funnel ladder + course keywords ───────────── */

export type FunnelLink = {
  url: string;
  domain: string;
  context_snippet: string;
  is_course_hint: boolean;
};

export function parseDescription(
  description: string,
): {
  funnel_links: FunnelLink[];
  course_keyword_hits: string[];
  price_mentions_usd: number[];
} {
  if (!description) return { funnel_links: [], course_keyword_hits: [], price_mentions_usd: [] };

  // URLs
  const urlRe = /https?:\/\/[^\s)\]]+/g;
  const courseHintRe =
    /(course|class|masterclass|coach|consult|workshop|academy|mentor|bootcamp|강의|수업|코칭|컨설팅|アカデミー|講座|课程|coursera|teachable|kajabi|gumroad|stan\.store|cafe24|clay\.run|circle\.so)/i;
  const lines = description.split(/\n/);
  const links: FunnelLink[] = [];
  for (const line of lines) {
    const urls = line.match(urlRe) ?? [];
    for (const u of urls) {
      try {
        const url = new URL(u);
        links.push({
          url: u,
          domain: url.hostname.replace(/^www\./, ""),
          context_snippet: line.replace(u, "").trim().slice(0, 120),
          is_course_hint:
            courseHintRe.test(line) ||
            courseHintRe.test(url.hostname) ||
            courseHintRe.test(url.pathname),
        });
      } catch {
        // skip invalid
      }
    }
  }

  // Price mentions: $19, $197, 19,900원, ¥19800, ₩99000, etc.
  // Normalize to USD ballpark for grouping (rough).
  const priceHits: number[] = [];
  const usdRe = /\$\s?(\d{1,3}(?:[.,]?\d{3})*)/g;
  const krwRe = /(\d{1,3}(?:[,.]?\d{3})+)\s?원/g;
  const jpyRe = /(?:¥|￥)\s?(\d{1,3}(?:[,.]?\d{3})*)/g;
  const cnyRe = /(?:￥|¥)\s?(\d{1,3}(?:[,.]?\d{3})*)/g;
  const eurRe = /€\s?(\d{1,3}(?:[.,]?\d{3})*)/g;
  for (const m of description.matchAll(usdRe)) {
    const n = Number(m[1].replace(/[.,]/g, ""));
    if (n >= 5 && n <= 50_000) priceHits.push(n);
  }
  for (const m of description.matchAll(krwRe)) {
    const n = Number(m[1].replace(/[,.]/g, ""));
    if (n >= 10_000) priceHits.push(Math.round(n / 1300));
  }
  for (const m of description.matchAll(jpyRe)) {
    const n = Number(m[1].replace(/[,.]/g, ""));
    if (n >= 1000) priceHits.push(Math.round(n / 150));
  }
  for (const m of description.matchAll(cnyRe)) {
    const n = Number(m[1].replace(/[,.]/g, ""));
    if (n >= 100) priceHits.push(Math.round(n / 7));
  }
  for (const m of description.matchAll(eurRe)) {
    const n = Number(m[1].replace(/[.,]/g, ""));
    if (n >= 10) priceHits.push(Math.round(n * 1.1));
  }

  // Course keyword frequency
  const kws = [
    "course",
    "강의",
    "코칭",
    "컨설팅",
    "masterclass",
    "academy",
    "bootcamp",
    "mentor",
    "오픈채팅",
    "kakao",
    "discord",
    "telegram",
  ];
  const hits = kws.filter((k) =>
    new RegExp(k, "i").test(description),
  );

  return {
    funnel_links: links,
    course_keyword_hits: hits,
    price_mentions_usd: Array.from(new Set(priceHits)).sort((a, b) => a - b),
  };
}

/* ─── Reddit search (public JSON, no auth) ─────────────────────────── */

export async function fetchRedditMentions(query: string): Promise<{
  count: number;
  top_titles: string[];
}> {
  if (!query || query.length < 2) return { count: 0, top_titles: [] };
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(
      `"${query}"`,
    )}&limit=10&sort=relevance`;
    const r = await fetch(url, {
      headers: {
        "user-agent": "ClonePilot/1.0 (research; contact: clonepilot)",
      },
      signal: timeout(T.med),
    });
    if (!r.ok) return { count: 0, top_titles: [] };
    type Post = { data?: { title?: string; subreddit?: string; ups?: number } };
    const j = (await r.json()) as {
      data?: { dist?: number; children?: Post[] };
    };
    const children = j.data?.children ?? [];
    const titles = children
      .slice(0, 5)
      .map((p) => {
        const d = p.data;
        return d?.title
          ? `r/${d.subreddit ?? "?"} · ${d.title.slice(0, 100)}`
          : "";
      })
      .filter(Boolean);
    return {
      count: j.data?.dist ?? children.length,
      top_titles: titles,
    };
  } catch {
    return { count: 0, top_titles: [] };
  }
}

/* ─── Wayback Machine (channel's first archive snapshot) ───────────── */

export async function fetchWaybackFirstSeen(
  channelHandle: string,
): Promise<string | null> {
  if (!channelHandle) return null;
  try {
    const url =
      `https://web.archive.org/cdx/search/cdx?url=youtube.com/@${encodeURIComponent(
        channelHandle,
      )}&output=json&limit=1&fl=timestamp&filter=statuscode:200`;
    const r = await fetch(url, { signal: timeout(T.short) });
    if (!r.ok) return null;
    const j = (await r.json()) as string[][];
    if (j.length < 2) return null;
    const ts = j[1][0];
    if (!/^\d{14}$/.test(ts)) return null;
    return `${ts.slice(0, 4)}-${ts.slice(4, 6)}-${ts.slice(6, 8)}`;
  } catch {
    return null;
  }
}

/* ─── Channel upload velocity (uses YouTube Data API search.list) ──── */

export type ChannelVelocity = {
  recent_uploads_90d: number;
  recent_avg_views: number | null;
  uploads_per_week: number;
};

export async function fetchChannelVelocity(
  channelId: string,
  ytKey: string | undefined,
): Promise<ChannelVelocity | null> {
  if (!ytKey || !channelId) return null;
  try {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const sr = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=id&type=video&channelId=${channelId}&publishedAfter=${since}&maxResults=20&key=${ytKey}`,
      { signal: timeout(T.med) },
    );
    if (!sr.ok) return null;
    type SItem = { id?: { videoId?: string } };
    const sj = (await sr.json()) as { items?: SItem[]; pageInfo?: { totalResults?: number } };
    const ids = (sj.items ?? [])
      .map((i) => i.id?.videoId)
      .filter((x): x is string => !!x)
      .slice(0, 15);
    const recent = sj.pageInfo?.totalResults ?? ids.length;
    let avgViews: number | null = null;
    if (ids.length > 0) {
      const vr = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.join(
          ",",
        )}&key=${ytKey}`,
        { signal: timeout(T.med) },
      );
      type VItem = { statistics?: { viewCount?: string } };
      if (vr.ok) {
        const vj = (await vr.json()) as { items?: VItem[] };
        const counts =
          vj.items?.map((it) => Number(it.statistics?.viewCount ?? 0)) ?? [];
        if (counts.length > 0)
          avgViews = Math.round(
            counts.reduce((a, b) => a + b, 0) / counts.length,
          );
      }
    }
    return {
      recent_uploads_90d: recent,
      recent_avg_views: avgViews,
      uploads_per_week: Math.round((recent / 90) * 7 * 10) / 10,
    };
  } catch {
    return null;
  }
}

/* ─── Multi-keyword Google Trends (uses google-trends-api) ─────────── */

type GoogleTrendsModule = {
  interestOverTime: (opts: { keyword: string; startTime: Date }) => Promise<string>;
};

export async function fetchTrendsMulti(
  keywords: string[],
  trends: GoogleTrendsModule,
): Promise<
  Array<{ keyword: string; direction: string; score: number }>
> {
  const out: Array<{ keyword: string; direction: string; score: number }> = [];
  for (const kw of keywords.slice(0, 3)) {
    if (!kw || kw.length < 2) continue;
    try {
      const raw = await Promise.race([
        trends.interestOverTime({
          keyword: kw,
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
      if (timeline.length < 4) continue;
      const recent = timeline.slice(-12).map((p) => p.value?.[0] ?? 0);
      const older = timeline.slice(0, 12).map((p) => p.value?.[0] ?? 0);
      const avg = (arr: number[]) =>
        arr.reduce((a, b) => a + b, 0) / arr.length;
      const r = avg(recent);
      const o = avg(older);
      const ratio = o > 0 ? r / o : 0;
      const direction =
        ratio > 1.3 ? "rising" : ratio < 0.7 ? "declining" : "stable";
      out.push({ keyword: kw, direction, score: Math.min(100, Math.round(r)) });
    } catch {
      // skip this keyword
    }
  }
  return out;
}
