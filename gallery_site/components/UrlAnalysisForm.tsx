"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowsClockwise,
  ChartBar,
  Lightning,
  Warning,
  WarningOctagon,
  Check,
  CurrencyDollar,
  Hammer,
  PlayCircle,
  Lightbulb,
  Crosshair,
  Stairs,
  ChatCircle,
  Eye,
  RssSimple,
  Sparkle,
  FileText,
  Skull,
} from "@phosphor-icons/react";
import { LANG_NAMES, type Dict, type Lang } from "@/lib/i18n";
import { cardLabels } from "@/lib/i18n-card-v2";

/* ─── card-only lang superset (adds Arabic) ────────────────────────── */

export type CardLang = Lang | "ar";
const CARD_LANGS: readonly CardLang[] = ["en", "ko", "ja", "zh", "es", "ar"];
const CARD_LANG_LABELS: Record<CardLang, string> = {
  en: "EN",
  ko: "KO",
  ja: "JA",
  zh: "ZH",
  es: "ES",
  ar: "AR",
};
const CARD_LANG_NAMES: Record<CardLang, string> = {
  ...LANG_NAMES,
  ar: "العربية",
};

/* ─── shared types (mirrors /api/analyze) ──────────────────────────── */

type BusinessModel =
  | "real-product"
  | "course-funnel"
  | "affiliate-bait"
  | "personal-brand"
  | "consulting-front"
  | "unclear";

type Competitor = { name: string; url_hint?: string; why_relevant: string };
type RelatedVideo = {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  view_count?: number;
  published_at?: string;
};
type FunnelStep = {
  label: string;
  price_usd_estimate: number;
  is_observed: boolean;
};
type FunnelLink = {
  url: string;
  domain: string;
  context_snippet: string;
  is_course_hint: boolean;
};
type ChannelVelocity = {
  recent_uploads_90d: number;
  recent_avg_views: number | null;
  uploads_per_week: number;
};

type Preview = {
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
  market_reality: {
    tam_summary: string;
    sam_summary: string;
    som_year1_summary: string;
    trend_summary: string;
    top_competitors: Competitor[];
  };
  revenue_forecast: {
    conservative_arr_usd: number;
    base_arr_usd: number;
    aggressive_arr_usd: number;
    assumptions: string[];
  };
  funnel_ladder: FunnelStep[];
  insider_tips: string[];
  build_path: {
    steps: { title: string; weeks: number }[];
    total_weeks: number;
    estimated_one_time_cost_usd: number;
    estimated_monthly_cost_usd: number;
    stack: string[];
  };
  one_paragraph_verdict: string;
  video: {
    id: string;
    title: string;
    channel: string;
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
  signals: {
    trends?: { keyword: string; direction: string; score: number };
    trends_multi: { keyword: string; direction: string; score: number }[];
    hn_mentions: number;
    wiki_found: boolean;
    reddit_mentions: number;
    reddit_top_titles: string[];
    wayback_first_seen: string | null;
    channel_velocity: ChannelVelocity | null;
  };
  related_videos: RelatedVideo[];
  description_findings: {
    funnel_links: FunnelLink[];
    course_keyword_hits: string[];
    price_mentions_usd: number[];
  };
  comment_stats: {
    total: number;
    avg_length: number;
    emoji_only_ratio: number;
    generic_praise_ratio: number;
    bot_ratio_0_100: number;
  };
};

type Status = "idle" | "loading" | "ok" | "err";

/* ─── outer form ───────────────────────────────────────────────────── */

export function UrlAnalysisForm({
  d,
  lang,
  onResult,
  onReset,
}: {
  d: Dict["analyze_form"];
  lang: Lang;
  onResult?: () => void;
  onReset?: () => void;
}) {
  const [youtubeUrl, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (status === "ok") onResult?.();
    else if (status === "idle") onReset?.();
  }, [status, onResult, onReset]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    setStatus("loading");
    setErr(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ youtubeUrl: youtubeUrl.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setPreview(data.preview as Preview);
      setStatus("ok");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Unknown error");
      setStatus("err");
    }
  }

  function reset() {
    setStatus("idle");
    setPreview(null);
    setErr(null);
    setUrl("");
  }

  if (status === "ok" && preview) {
    return <PreviewCard d={d} lang={lang} preview={preview} onRetry={reset} />;
  }

  if (status === "loading") {
    return <LoadingPanel d={d} />;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border border-strong bg-surface"
      style={{ borderRadius: 2 }}
    >
      {/* terminal-style header bar */}
      <div className="flex items-center justify-between px-5 h-9 border-b border-strong bg-surface-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full breathe" style={{ background: "var(--brand)" }} />
          <p className="text-[10px] font-mono uppercase tracking-wider2 text-ink-muted">
            {d.live_badge}
          </p>
        </div>
        <p className="text-[10px] font-mono tracking-wider text-ink-dim">
          /analyze
        </p>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid gap-2">
          <label
            htmlFor="ytUrl"
            className="text-[10px] font-mono uppercase tracking-wider2 text-ink-muted"
          >
            &gt; {d.label_url}
          </label>
          <input
            id="ytUrl"
            type="url"
            required
            value={youtubeUrl}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={d.url_placeholder}
            className="w-full h-11 px-3 border border-strong bg-bg outline-none font-mono text-sm text-ink placeholder:text-ink-dim focus:border-bright transition"
            style={{ borderRadius: 2 }}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <button
          type="submit"
          className="group w-full h-11 inline-flex items-center justify-center gap-2 bg-ink text-bg font-mono uppercase tracking-wider text-xs hover:bg-white active:translate-y-[1px] transition"
          style={{ borderRadius: 2 }}
        >
          <span>{d.submit}</span>
          <ArrowRight
            size={14}
            weight="bold"
            className="transition group-hover:translate-x-0.5"
          />
        </button>

        {status === "err" && err && (
          <div className="flex items-start gap-2 p-3 border border-strong stripe-danger text-xs text-ink">
            <WarningOctagon size={14} weight="duotone" className="mt-0.5 flex-shrink-0" />
            <span>
              <strong className="font-mono uppercase tracking-wider text-[10px] mr-1">
                {d.err_prefix}
              </strong>
              {err}
            </span>
          </div>
        )}

        <p className="text-[10px] font-mono text-ink-dim leading-relaxed">
          {d.disclaimer}
        </p>
      </div>
    </form>
  );
}

/* ─── loading panel ────────────────────────────────────────────────── */

function LoadingPanel({ d }: { d: Dict["analyze_form"] }) {
  const [lines, setLines] = useState<string[]>([]);
  const steps = useMemo(
    () => [
      "fetch:video.metadata",
      "fetch:transcript.chain",
      "fetch:channel.velocity",
      "fetch:youtube.comments x30",
      "fetch:google.trends x3",
      "fetch:reddit.search",
      "fetch:hn.algolia",
      "fetch:wikipedia.search",
      "fetch:wayback.first-seen",
      "parse:description.funnel",
      "stat:comment.bot-heuristic",
      "llm:reverse-engineer.business",
    ],
    [],
  );
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      i = Math.min(i + 1, steps.length);
      setLines(steps.slice(0, i));
    }, 700);
    return () => clearInterval(t);
  }, [steps]);

  return (
    <div className="border border-strong bg-surface" style={{ borderRadius: 2 }}>
      <div className="flex items-center justify-between px-5 h-9 border-b border-strong bg-surface-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full breathe" style={{ background: "var(--brand)" }} />
          <p className="text-[10px] font-mono uppercase tracking-wider2 text-ink-muted">
            {d.submitting}
          </p>
        </div>
        <p className="text-[10px] font-mono tracking-wider text-ink-dim">
          ~30–60s
        </p>
      </div>
      <div className="p-6">
        <p className="text-xs text-ink-muted font-mono mb-4">
          {d.submitting_hint}
        </p>
        <div className="font-mono text-[11px] space-y-1 min-h-[180px]">
          {lines.map((l, i) => (
            <p
              key={l}
              className="text-ink-muted fade-up"
              style={{ ["--i" as string]: i }}
            >
              <span className="text-ink-dim">[{String(i + 1).padStart(2, "0")}]</span>{" "}
              {l}
              <span className="text-ink">{" ✓"}</span>
            </p>
          ))}
          {lines.length < 12 && (
            <p className="text-ink">
              <span className="text-ink-dim">
                [{String(lines.length + 1).padStart(2, "0")}]
              </span>{" "}
              <span className="text-ink-muted">running</span>
              <span className="term-cursor" />
            </p>
          )}
        </div>
        <div className="mt-4 h-px w-full bg-strong" />
        <div
          className="mt-4 h-1 w-full overflow-hidden border border-strong ind-bar"
          style={{ borderRadius: 1 }}
        >
          <span />
        </div>
      </div>
    </div>
  );
}

/* ─── label + tone helpers ─────────────────────────────────────────── */

function bmLabel(bm: BusinessModel, d: Dict["analyze_form"]): string {
  switch (bm) {
    case "real-product":
      return d.bm_real_product;
    case "course-funnel":
      return d.bm_course_funnel;
    case "affiliate-bait":
      return d.bm_affiliate_bait;
    case "personal-brand":
      return d.bm_personal_brand;
    case "consulting-front":
      return d.bm_consulting_front;
    default:
      return d.bm_unclear;
  }
}

function bmIcon(bm: BusinessModel) {
  if (bm === "course-funnel" || bm === "affiliate-bait")
    return <Skull size={18} weight="duotone" />;
  if (bm === "real-product")
    return <Sparkle size={18} weight="duotone" />;
  return <Eye size={18} weight="duotone" />;
}

function bmStampClass(bm: BusinessModel): string {
  // Monochrome: danger = striped, positive = solid white, neutral = hollow.
  if (bm === "course-funnel" || bm === "affiliate-bait")
    return "stripe-danger text-ink border border-bright";
  if (bm === "real-product")
    return "stamp-solid border border-bright";
  return "bg-surface-2 text-ink border border-strong";
}

function fmtNum(n?: number | null): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function fmtUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

function gaugeShade(value: number): string {
  // Monochrome shading by value: high = white, mid = gray, low = dim gray.
  if (value >= 70) return "#ffffff";
  if (value >= 40) return "#a0a0a0";
  return "#5a5a5a";
}

/* ─── PreviewCard ──────────────────────────────────────────────────── */

function PreviewCard({
  d,
  lang,
  preview: rawPreview,
  onRetry,
}: {
  d: Dict["analyze_form"];
  lang: Lang;
  preview: Preview;
  onRetry: () => void;
}) {
  const [cardLang, setCardLang] = useState<CardLang>("en");
  const [translatedByLang, setTranslatedByLang] = useState<
    Partial<Record<CardLang, Preview>>
  >({ en: rawPreview });
  const [translating, setTranslating] = useState<CardLang | null>(null);

  const preview: Preview = translatedByLang[cardLang] ?? rawPreview;
  const cl = cardLabels(lang); // labels (site lang)

  const isRtl = cardLang === "ar";

  async function pickLang(target: CardLang) {
    if (target === cardLang) return;
    if (translatedByLang[target]) {
      setCardLang(target);
      return;
    }
    setTranslating(target);
    setCardLang(target);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ preview: rawPreview, targetLang: target }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.translated) {
        setTranslatedByLang((prev) => ({
          ...prev,
          [target]: data.translated as Preview,
        }));
      } else {
        setCardLang("en");
      }
    } catch {
      setCardLang("en");
    } finally {
      setTranslating(null);
    }
  }

  const v = preview.video;
  const s = preview.signals;
  const m = preview.market_reality;
  const f = preview.revenue_forecast;
  const b = preview.build_path;
  const cs = preview.comment_stats;
  const df = preview.description_findings;
  const thumb = `https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`;
  const ageYears = v.channel_created_at
    ? (Date.now() - new Date(v.channel_created_at).getTime()) /
      (365 * 24 * 60 * 60 * 1000)
    : null;
  const fMax = Math.max(
    f.conservative_arr_usd,
    f.base_arr_usd,
    f.aggressive_arr_usd,
    1,
  );

  return (
    <div
      className="border border-strong bg-surface overflow-hidden"
      style={{ borderRadius: 2 }}
    >
      {/* ─── HEADER (terminal style) ─── */}
      <div className="flex items-center justify-between px-5 h-9 border-b border-strong bg-surface-2 font-mono text-[10px] uppercase tracking-wider2">
        <div className="flex items-center gap-2 text-ink-muted">
          <span className="inline-block h-1.5 w-1.5 rounded-full breathe" style={{ background: "var(--brand)" }} />
          <span>{d.live_badge}</span>
          <span className="text-ink-dim">·</span>
          <span className="text-ink-dim">{v.id}</span>
        </div>
        <div className="flex items-center gap-1 text-ink-dim">
          <span>~{Math.max(40, Math.round(v.transcript_chars / 350))}s</span>
        </div>
      </div>

      {/* ─── HERO: thumbnail + business model stamp ─── */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt={v.title || preview.brand}
          className="w-full aspect-video object-cover grayscale contrast-[1.15]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent pointer-events-none" />
        {/* Hacker corner brackets */}
        <span aria-hidden className="absolute top-2 left-2 w-4 h-4 border-l border-t border-bright pointer-events-none" />
        <span aria-hidden className="absolute top-2 right-2 w-4 h-4 border-r border-t border-bright pointer-events-none" />
        <span aria-hidden className="absolute bottom-2 left-2 w-4 h-4 border-l border-b border-bright pointer-events-none" />
        <span aria-hidden className="absolute bottom-2 right-2 w-4 h-4 border-r border-b border-bright pointer-events-none" />
        {/* Tiny target reticle top-right of thumbnail */}
        <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2 py-0.5 bg-bg/70 backdrop-blur-sm border border-strong" style={{ borderRadius: 1 }}>
          <span className="inline-block h-1 w-1 rounded-full breathe" style={{ background: "var(--brand)" }} />
          <span className="text-[9px] font-mono uppercase tracking-wider2 text-ink">decoded</span>
        </div>
        {/* Business model stamp — striped if course-funnel, solid if real-product */}
        <div
          className={`absolute bottom-4 left-4 right-4 sm:right-auto px-4 py-3 inline-flex items-center gap-3 ${bmStampClass(preview.business_model)}`}
          style={{ borderRadius: 2 }}
        >
          <span className="flex-shrink-0">{bmIcon(preview.business_model)}</span>
          <div>
            <p className="text-[9px] font-mono uppercase tracking-wider2 opacity-70">
              {d.card_business_model}
            </p>
            <p className="text-lg sm:text-xl font-bold font-mono tracking-tight uppercase">
              {bmLabel(preview.business_model, d).replace(/^🚩\s*/, "")}
            </p>
          </div>
        </div>
        {translating && (
          <div className="absolute inset-0 bg-bg/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6">
            <p className="font-mono uppercase tracking-wider text-xs text-ink-muted">
              {d.card_translating}
            </p>
            <p className="font-mono text-xl text-ink">{CARD_LANG_NAMES[translating]}</p>
            <p className="font-mono text-[10px] text-ink-dim uppercase tracking-wider2">
              ~{translating === "ar" || translating === "zh" ? "30–60s" : "10–25s"}
            </p>
            <div
              className="w-48 h-1 border border-strong overflow-hidden ind-bar"
              style={{ borderRadius: 1 }}
            >
              <span />
            </div>
          </div>
        )}
      </div>

      {/* ─── LANG TOGGLE row ─── */}
      <div className="px-5 py-3 border-b border-strong bg-surface-2/40 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[10px] font-mono uppercase tracking-wider2 text-ink-dim">
          &gt; {d.card_translate_label}
        </p>
        <div
          className="inline-flex items-center border border-strong bg-bg p-0.5"
          style={{ borderRadius: 2 }}
        >
          {CARD_LANGS.map((l) => {
            const active = l === cardLang;
            const isLoading = translating === l;
            return (
              <button
                key={l}
                type="button"
                onClick={() => pickLang(l)}
                title={CARD_LANG_NAMES[l]}
                className={[
                  "px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider transition select-none",
                  active
                    ? "bg-ink text-bg"
                    : "text-ink-muted hover:text-ink hover:bg-surface-2",
                  isLoading ? "opacity-40 cursor-wait" : "",
                ].join(" ")}
                style={{ borderRadius: 1 }}
              >
                {CARD_LANG_LABELS[l]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── BODY: stagger fade-up sections ─── */}
      <div
        className="divide-y divide-[var(--border)]"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* 01 — BRAND + VERDICT */}
        <Section i={0} tone="amber">
          <p
            className="text-[10px] font-mono uppercase tracking-wider2"
            style={{ color: "var(--sec-amber)" }}
          >
            [01] {d.card_brand}
          </p>
          <h3 className="mt-1 text-3xl sm:text-4xl font-bold tracking-tightest text-ink leading-none">
            {preview.brand}
          </h3>
          <p className="mt-3 text-base text-ink-muted leading-relaxed">
            {preview.tagline}
          </p>

          <div
            className="mt-6 border px-4 py-4 relative overflow-hidden"
            style={{
              borderRadius: 2,
              borderColor: "color-mix(in oklab, var(--sec-amber) 35%, var(--border-strong))",
              background: "color-mix(in oklab, var(--sec-amber) 6%, var(--surface))",
            }}
          >
            <p
              className="text-[10px] font-mono uppercase tracking-wider2 flex items-center gap-1.5"
              style={{ color: "var(--sec-amber)" }}
            >
              <FileText size={11} weight="bold" />
              {cl.section_verdict}
            </p>
            <p className="mt-2 text-[15px] text-ink leading-relaxed">
              {preview.one_paragraph_verdict}
            </p>
          </div>
        </Section>

        {/* 02 — three strips: real revenue · why buyers pay · honest value */}
        <Section i={1} tone="amber">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border)] border border-strong" style={{ borderRadius: 2 }}>
            <StripCol
              label={d.card_real_revenue}
              body={preview.likely_real_revenue_source}
            />
            <StripCol
              label={cl.section_why_buyers_pay}
              body={preview.why_buyers_pay}
            />
            <StripCol
              label={cl.section_honest_value}
              body={preview.honest_value_for_buyer}
            />
          </div>
        </Section>

        {/* 03 — 6 GAUGES */}
        <Section i={2} eyebrow={`[02] ${d.card_signals}`} tone="neutral">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            <CircleGauge label={cl.gauge_clone} value={preview.clone_feasibility_0_100} />
            <CircleGauge label={cl.gauge_honesty} value={preview.honesty_score_0_100} />
            <CircleGauge label={cl.gauge_confidence} value={preview.confidence_0_100} />
            <CircleGauge label={cl.gauge_hype_vs_reality} value={preview.hype_vs_reality_0_100} />
            <CircleGauge
              label={cl.gauge_bot_inflation}
              value={preview.bot_inflation_0_100}
              inverted
            />
            <CircleGauge label={cl.gauge_real_proof} value={preview.real_proof_score_0_100} />
          </div>
        </Section>

        {/* 04 — FUNNEL LADDER */}
        <Section
          i={3}
          eyebrow={`[03] ${cl.section_funnel}`}
          icon={<Stairs size={12} weight="duotone" />}
          tone="red"
        >
          {preview.funnel_ladder.length === 0 ? (
            <p className="text-xs text-ink-dim font-mono">{cl.funnel_empty}</p>
          ) : (
            <FunnelLadder steps={preview.funnel_ladder} cl={cl} />
          )}
        </Section>

        {/* 05 — MARKET REALITY */}
        <Section
          i={4}
          eyebrow={`[04] ${d.section_market}`}
          icon={<Crosshair size={12} weight="duotone" />}
          tone="blue"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--border)] border border-strong" style={{ borderRadius: 2 }}>
            <Cell label={d.market_tam} value={m.tam_summary} />
            <Cell label={d.market_sam} value={m.sam_summary} />
            <Cell label={d.market_som} value={m.som_year1_summary} />
          </div>
          <p className="mt-3 text-xs text-ink-muted leading-relaxed">
            <span className="text-ink-dim font-mono uppercase text-[10px] mr-1 tracking-wider2">
              {d.market_trend}
            </span>
            {m.trend_summary}
          </p>
          {m.top_competitors.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-mono uppercase tracking-wider2 text-ink-dim mb-2">
                &gt; {d.market_competitors}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[var(--border)] border border-strong" style={{ borderRadius: 2 }}>
                {m.top_competitors.map((c) => (
                  <div key={c.name} className="bg-surface p-3">
                    <p className="text-sm font-semibold text-ink font-mono">
                      {c.name}
                    </p>
                    {c.url_hint && (
                      <p className="text-[10px] font-mono text-ink-muted truncate">
                        {c.url_hint}
                      </p>
                    )}
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      {c.why_relevant}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* 06 — REVENUE FORECAST */}
        <Section
          i={5}
          eyebrow={`[05] ${d.section_forecast}`}
          icon={<CurrencyDollar size={12} weight="duotone" />}
          tone="green"
        >
          <div className="space-y-2">
            <ForecastBar label={d.forecast_conservative} value={f.conservative_arr_usd} max={fMax} weight="dim" />
            <ForecastBar label={d.forecast_base} value={f.base_arr_usd} max={fMax} weight="mid" />
            <ForecastBar label={d.forecast_aggressive} value={f.aggressive_arr_usd} max={fMax} weight="bright" />
          </div>
          {f.assumptions.length > 0 && (
            <details className="mt-3 group">
              <summary className="cursor-pointer text-[10px] font-mono uppercase tracking-wider2 text-ink-dim hover:text-ink list-none flex items-center gap-1">
                <span className="group-open:rotate-90 transition-transform">▶</span>
                {d.forecast_assumptions} ({f.assumptions.length})
              </summary>
              <ul className="mt-2 space-y-1 pl-3">
                {f.assumptions.map((a, i) => (
                  <li key={i} className="text-xs text-ink-muted leading-relaxed flex gap-2">
                    <span className="text-ink-dim font-mono">·</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Section>

        {/* 07 — RED FLAGS + GREEN FLAGS (side by side when both present) */}
        {(preview.red_flags.length > 0 || preview.green_flags.length > 0) && (
          <Section i={6} tone="red">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {preview.red_flags.length > 0 ? (
                <FlagPanel
                  eyebrow={`[06] ${d.card_red_flags} (${preview.red_flags.length})`}
                  flags={preview.red_flags}
                  variant="danger"
                />
              ) : (
                <div className="border border-strong p-4 flex items-center gap-2 text-xs text-ink-muted" style={{ borderRadius: 2 }}>
                  <Check size={14} weight="bold" />
                  {d.card_no_red_flags}
                </div>
              )}
              {preview.green_flags.length > 0 && (
                <FlagPanel
                  eyebrow={`[07] ${cl.section_green_flags} (${preview.green_flags.length})`}
                  flags={preview.green_flags}
                  variant="positive"
                />
              )}
            </div>
          </Section>
        )}

        {/* 08 — INSIDER TIPS */}
        {preview.insider_tips.length > 0 && (
          <Section
            i={7}
            eyebrow={`[08] ${d.section_tips}`}
            icon={<Lightbulb size={12} weight="duotone" />}
            tone="yellow"
          >
            <ol className="space-y-2">
              {preview.insider_tips.map((tip, i) => (
                <li key={i} className="text-sm text-ink leading-relaxed flex gap-3">
                  <span className="font-mono text-ink-dim flex-shrink-0 w-8 text-right">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="flex-1">{tip}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* 09 — BUILD PATH */}
        <Section
          i={8}
          eyebrow={`[09] ${d.section_build}`}
          icon={<Hammer size={12} weight="duotone" />}
          tone="cyan"
        >
          <div className="grid grid-cols-3 gap-px bg-[var(--border)] border border-strong" style={{ borderRadius: 2 }}>
            <StatCell label={d.build_total_weeks} value={`${b.total_weeks}w`} />
            <StatCell label={d.build_one_time_cost} value={fmtUSD(b.estimated_one_time_cost_usd)} />
            <StatCell label={d.build_monthly_cost} value={`${fmtUSD(b.estimated_monthly_cost_usd)}/mo`} />
          </div>

          <Timeline steps={b.steps} />

          {b.stack.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-mono uppercase tracking-wider2 text-ink-dim mb-2">
                &gt; {d.build_stack}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {b.stack.map((sk) => (
                  <span
                    key={sk}
                    className="text-[10px] font-mono px-2 py-0.5 border border-strong text-ink-muted bg-surface-2"
                    style={{ borderRadius: 1 }}
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* 10 — EXTERNAL FOOTPRINT */}
        <Section
          i={9}
          eyebrow={`[10] ${cl.section_signals_external}`}
          icon={<RssSimple size={12} weight="duotone" />}
          tone="violet"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--border)] border border-strong" style={{ borderRadius: 2 }}>
            <StatCell label="Trend" value={s.trends ? `${s.trends.direction} ${s.trends.score}` : "—"} />
            <StatCell label="HN" value={`${s.hn_mentions}`} />
            <StatCell label={cl.sig_reddit} value={`${s.reddit_mentions}`} />
            <StatCell label="Wiki" value={s.wiki_found ? "yes" : "no"} />
            <StatCell label={cl.sig_wayback} value={s.wayback_first_seen ?? "—"} />
            <StatCell
              label={cl.sig_velocity_per_week}
              value={s.channel_velocity ? `${s.channel_velocity.uploads_per_week}` : "—"}
            />
            <StatCell
              label={cl.sig_velocity_avg_view}
              value={s.channel_velocity?.recent_avg_views != null ? fmtNum(s.channel_velocity.recent_avg_views) : "—"}
            />
            <StatCell label="Subs" value={fmtNum(v.channel_subscribers)} />
          </div>
          {s.reddit_top_titles.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-mono uppercase tracking-wider2 text-ink-dim mb-1">
                &gt; reddit.top
              </p>
              <ul className="space-y-1">
                {s.reddit_top_titles.slice(0, 5).map((t, i) => (
                  <li key={i} className="text-xs font-mono text-ink-muted leading-snug">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s.trends_multi.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-mono">
              {s.trends_multi.map((t) => (
                <span
                  key={t.keyword}
                  className="inline-flex items-center gap-1 px-2 py-0.5 border border-strong bg-surface-2 text-ink-muted"
                  style={{ borderRadius: 1 }}
                >
                  {t.direction === "rising" ? "↑" : t.direction === "declining" ? "↓" : "→"}
                  <span>{t.keyword}</span>
                  <span className="text-ink-dim">{t.score}</span>
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* 11 — DESCRIPTION FORENSICS */}
        <Section
          i={10}
          eyebrow={`[11] ${cl.section_description}`}
          icon={<FileText size={12} weight="duotone" />}
          tone="orange"
        >
          <div className="grid grid-cols-3 gap-px bg-[var(--border)] border border-strong mb-3" style={{ borderRadius: 2 }}>
            <StatCell label={cl.desc_links_label} value={`${df.funnel_links.length}`} />
            <StatCell label={cl.desc_course_keywords_label} value={`${df.course_keyword_hits.length}`} />
            <StatCell label={cl.desc_price_mentions_label} value={`${df.price_mentions_usd.length}`} />
          </div>

          {df.funnel_links.length > 0 && (
            <div className="border border-strong overflow-hidden" style={{ borderRadius: 2 }}>
              <table className="w-full text-[11px] font-mono">
                <thead className="bg-surface-2 text-ink-dim uppercase tracking-wider2">
                  <tr>
                    <th className="text-left px-3 py-1.5 w-40">domain</th>
                    <th className="text-left px-3 py-1.5">context</th>
                    <th className="text-right px-3 py-1.5 w-24">type</th>
                  </tr>
                </thead>
                <tbody>
                  {df.funnel_links.slice(0, 10).map((l, i) => (
                    <tr
                      key={i}
                      className={`border-t border-strong ${l.is_course_hint ? "stripe-danger" : ""}`}
                    >
                      <td className="px-3 py-1.5 text-ink truncate max-w-[160px]">
                        {l.domain}
                      </td>
                      <td className="px-3 py-1.5 text-ink-muted truncate max-w-[280px]">
                        {l.context_snippet || "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        {l.is_course_hint ? (
                          <span className="text-ink">{cl.desc_course_hint_chip}</span>
                        ) : (
                          <span className="text-ink-dim">link</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {df.price_mentions_usd.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {df.price_mentions_usd.slice(0, 10).map((p) => (
                <span
                  key={p}
                  className="text-[10px] font-mono px-2 py-0.5 border border-bright text-ink bg-surface-2"
                  style={{ borderRadius: 1 }}
                >
                  ${p.toLocaleString()}
                </span>
              ))}
            </div>
          )}

          {df.course_keyword_hits.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {df.course_keyword_hits.map((k) => (
                <span
                  key={k}
                  className="text-[10px] font-mono px-2 py-0.5 border border-strong text-ink-muted bg-surface-2"
                  style={{ borderRadius: 1 }}
                >
                  #{k}
                </span>
              ))}
            </div>
          )}
        </Section>

        {/* 12 — COMMENT FINGERPRINT */}
        <Section
          i={11}
          eyebrow={`[12] ${cl.section_comments}`}
          icon={<ChatCircle size={12} weight="duotone" />}
          tone="gray"
        >
          {cs.total === 0 ? (
            <p className="text-xs text-ink-dim font-mono">{cl.comments_empty}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[var(--border)] border border-strong" style={{ borderRadius: 2 }}>
              <StatCell label={cl.comments_total_label} value={`${cs.total}`} />
              <StatCell label={cl.comments_avg_length_label} value={`${cs.avg_length}`} />
              <StatCell label={cl.comments_bot_label} value={`${cs.bot_ratio_0_100}/100`} />
              <StatCell label={cl.comments_emoji_label} value={`${cs.emoji_only_ratio}%`} />
            </div>
          )}
        </Section>

        {/* 13 — RELATED VIDEOS */}
        {preview.related_videos.length > 0 && (
          <Section
            i={12}
            eyebrow={`[13] ${d.section_related}`}
            icon={<PlayCircle size={12} weight="duotone" />}
            tone="gray"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[var(--border)] border border-strong" style={{ borderRadius: 2 }}>
              {preview.related_videos.map((rv) => (
                <a
                  key={rv.video_id}
                  href={`https://www.youtube.com/watch?v=${rv.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-surface hover:bg-surface-2 transition group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={rv.thumbnail}
                    alt={rv.title}
                    className="w-full aspect-video object-cover grayscale group-hover:grayscale-0 transition"
                  />
                  <div className="p-3">
                    <p className="text-xs text-ink leading-tight line-clamp-2">
                      {rv.title}
                    </p>
                    <p className="text-[10px] font-mono text-ink-dim mt-1 truncate">
                      {rv.channel}
                      {rv.view_count != null ? ` · ${fmtNum(rv.view_count)} ${d.sig_views}` : ""}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* 14 — TOP RISK */}
        <Section
          i={13}
          eyebrow={`[14] ${d.card_risk}`}
          icon={<Warning size={12} weight="duotone" />}
          tone="red"
        >
          <p className="text-sm text-ink leading-relaxed">{preview.top_risk}</p>
        </Section>

        {/* 15 — RAW SIGNALS CHIPS */}
        <Section
          i={14}
          eyebrow={`[15] raw.signals`}
          icon={<ChartBar size={12} weight="duotone" />}
          tone="gray"
        >
          <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
            <Chip>{`▶ ${fmtNum(v.view_count)} ${d.sig_views}`}</Chip>
            {v.like_count != null && <Chip>{`♥ ${fmtNum(v.like_count)} ${d.sig_likes}`}</Chip>}
            {v.channel_subscribers != null && <Chip>{`◎ ${fmtNum(v.channel_subscribers)} ${d.sig_subs}`}</Chip>}
            {ageYears != null && <Chip>{`${ageYears.toFixed(1)} ${d.sig_channel_age_years}`}</Chip>}
            <Chip>{`${d.sig_transcript_via} ${v.transcript_source}`}</Chip>
          </div>
        </Section>

        {/* 16 — CTA */}
        <div className="px-6 py-7 stripe-danger">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider2 text-ink-dim flex items-center gap-1.5">
                <Lightning size={11} weight="bold" />
                {d.section_clone_cta}
              </p>
              <h4 className="mt-2 text-lg font-semibold text-ink font-mono">
                {d.clone_cta_title}
              </h4>
              <p className="mt-1 text-xs text-ink-muted leading-relaxed max-w-[60ch]">
                {d.clone_cta_body}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 flex-shrink-0">
              <Link
                href="/install"
                className="inline-flex h-10 items-center gap-2 bg-ink text-bg px-4 text-xs font-mono uppercase tracking-wider hover:bg-white active:translate-y-[1px] transition"
                style={{ borderRadius: 2 }}
              >
                {d.clone_cta_btn}
              </Link>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex h-10 items-center gap-2 border border-strong px-4 text-xs font-mono uppercase tracking-wider text-ink-muted hover:text-ink hover:border-bright transition"
                style={{ borderRadius: 2 }}
              >
                <ArrowsClockwise size={12} weight="bold" />
                {d.card_retry}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── small atoms ─────────────────────────────────────────────────── */

type SectionTone =
  | "amber"
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "cyan"
  | "violet"
  | "orange"
  | "gray"
  | "neutral";

const TONE_VAR: Record<SectionTone, string | null> = {
  amber: "var(--sec-amber)",
  red: "var(--sec-red)",
  blue: "var(--sec-blue)",
  green: "var(--sec-green)",
  yellow: "var(--sec-yellow)",
  cyan: "var(--sec-cyan)",
  violet: "var(--sec-violet)",
  orange: "var(--sec-orange)",
  gray: "var(--sec-gray)",
  neutral: null,
};

function Section({
  i,
  eyebrow,
  icon,
  tone = "neutral",
  children,
}: {
  i: number;
  eyebrow?: string;
  icon?: React.ReactNode;
  tone?: SectionTone;
  children: React.ReactNode;
}) {
  const toneColor = TONE_VAR[tone];
  return (
    <div
      className="p-6 fade-up relative"
      style={{ ["--i" as string]: i }}
    >
      {toneColor && (
        <span
          aria-hidden
          className="absolute left-0 top-6 bottom-6 w-px"
          style={{ background: toneColor, opacity: 0.55 }}
        />
      )}
      {eyebrow && (
        <p
          className="text-[10px] font-mono uppercase tracking-wider2 mb-3 flex items-center gap-1.5"
          style={{ color: toneColor ?? "var(--text-dim)" }}
        >
          {icon}
          {eyebrow}
        </p>
      )}
      {children}
    </div>
  );
}

function StripCol({ label, body }: { label: string; body: string }) {
  return (
    <div className="bg-surface p-4">
      <p className="text-[10px] font-mono uppercase tracking-wider2 text-ink-dim">
        {label}
      </p>
      <p className="mt-2 text-sm text-ink leading-relaxed">{body}</p>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-3">
      <p className="text-[10px] font-mono uppercase tracking-wider2 text-ink-dim">
        {label}
      </p>
      <p className="mt-1 text-xs text-ink leading-relaxed">{value}</p>
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <p className="text-[9px] font-mono uppercase tracking-wider2 text-ink-dim truncate">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-sm font-semibold text-ink truncate tabnums">
        {value}
      </p>
    </div>
  );
}

function CircleGauge({
  label,
  value,
  inverted = false,
}: {
  label: string;
  value: number;
  inverted?: boolean;
}) {
  // For "inverted" gauges (where lower is better — e.g. bot inflation),
  // shade by (100 - value) but still display the raw value.
  const shadeValue = inverted ? 100 - value : value;
  const ringColor = gaugeShade(shadeValue);
  const deg = Math.max(0, Math.min(100, value)) * 3.6;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative h-20 w-20 rounded-full"
        style={{
          background: `conic-gradient(${ringColor} ${deg}deg, var(--surface-2) ${deg}deg 360deg)`,
        }}
      >
        <div className="absolute inset-[5px] rounded-full bg-bg flex items-center justify-center flex-col">
          <span className="font-mono text-xl font-bold text-ink tabnums">
            {value}
          </span>
        </div>
      </div>
      <p className="text-[9px] font-mono uppercase tracking-wider2 text-ink-dim text-center leading-tight max-w-[8ch]">
        {label}
      </p>
    </div>
  );
}

function ForecastBar({
  label,
  value,
  max,
  weight,
}: {
  label: string;
  value: number;
  max: number;
  weight: "dim" | "mid" | "bright";
}) {
  const pct = Math.max(2, Math.round((value / max) * 100));
  const barCls =
    weight === "bright"
      ? "bg-ink"
      : weight === "mid"
        ? "bg-[#b5b5b5]"
        : "bg-[#5a5a5a]";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-wider2 text-ink-muted">
          {label}
        </span>
        <span className="font-mono text-sm font-semibold text-ink tabnums">
          {fmtUSD(value)}
          <span className="text-[10px] text-ink-dim ml-1">ARR</span>
        </span>
      </div>
      <div className="h-1.5 border border-strong bg-bg overflow-hidden" style={{ borderRadius: 1 }}>
        <div className={`h-full ${barCls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 border border-strong px-2 py-0.5 bg-surface-2 text-ink-muted"
      style={{ borderRadius: 1 }}
    >
      {children}
    </span>
  );
}

function FunnelLadder({
  steps,
  cl,
}: {
  steps: FunnelStep[];
  cl: ReturnType<typeof cardLabels>;
}) {
  const max = Math.max(...steps.map((s) => s.price_usd_estimate), 1);
  return (
    <ol className="space-y-1">
      {steps.map((s, i) => {
        const pct = Math.max(8, Math.round((s.price_usd_estimate / max) * 100));
        return (
          <li
            key={i}
            className={`flex items-center gap-3 border ${s.is_observed ? "border-bright" : "border-strong border-dashed"} bg-surface-2 px-3 py-2`}
            style={{ borderRadius: 2 }}
          >
            <span className="font-mono text-[10px] text-ink-dim w-6 flex-shrink-0 tabnums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="flex-1 text-sm text-ink leading-tight font-mono">
              {s.label}
            </span>
            <div className="hidden sm:block w-32 h-1 bg-bg border border-strong overflow-hidden" style={{ borderRadius: 1 }}>
              <div
                className={s.is_observed ? "h-full bg-ink" : "h-full bg-[#5a5a5a]"}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-sm font-semibold text-ink w-20 text-right flex-shrink-0 tabnums">
              {fmtUSD(s.price_usd_estimate)}
            </span>
            <span
              className={`text-[9px] font-mono uppercase tracking-wider2 ${s.is_observed ? "text-ink" : "text-ink-dim"} w-16 text-right flex-shrink-0`}
            >
              {s.is_observed ? cl.funnel_observed_chip : cl.funnel_inferred_chip}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function FlagPanel({
  eyebrow,
  flags,
  variant,
}: {
  eyebrow: string;
  flags: string[];
  variant: "danger" | "positive";
}) {
  const wrap =
    variant === "danger"
      ? "border-strong stripe-danger"
      : "border-bright bg-surface-2";
  const bullet = variant === "danger" ? "■" : "□";
  const eyeColor = variant === "danger" ? "var(--sec-red)" : "var(--sec-green)";
  return (
    <div className={`border ${wrap} p-4`} style={{ borderRadius: 2 }}>
      <p
        className="text-[10px] font-mono uppercase tracking-wider2 mb-2"
        style={{ color: eyeColor }}
      >
        {eyebrow}
      </p>
      <ul className="space-y-1.5">
        {flags.map((f, i) => (
          <li key={i} className="text-xs text-ink leading-relaxed flex gap-2">
            <span className="font-mono text-ink-muted flex-shrink-0">{bullet}</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Timeline({ steps }: { steps: { title: string; weeks: number }[] }) {
  return (
    <ol className="mt-4 relative pl-5">
      <span className="absolute left-2 top-2 bottom-2 w-px bg-strong" aria-hidden />
      {steps.map((s, i) => (
        <li key={i} className="relative pb-3 last:pb-0">
          <span className="absolute -left-3.5 top-1 inline-block h-2 w-2 bg-ink" />
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-ink leading-tight">{s.title}</span>
            <span className="font-mono text-[10px] text-ink-muted flex-shrink-0 tabnums">
              {s.weeks}w
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
