"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowsClockwise,
  ChartLineUp,
  ChartBar,
  Lightning,
  TrendUp,
  TrendDown,
  Minus,
  Warning,
  WarningCircle,
  Check,
  CurrencyDollar,
  Hammer,
  PlayCircle,
  Lightbulb,
  Crosshair,
} from "@phosphor-icons/react";
import {
  LANGS,
  LANG_LABELS,
  LANG_NAMES,
  type Dict,
  type Lang,
} from "@/lib/i18n";

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

type Preview = {
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
  insider_tips: string[];
  build_path: {
    steps: { title: string; weeks: number }[];
    total_weeks: number;
    estimated_one_time_cost_usd: number;
    estimated_monthly_cost_usd: number;
    stack: string[];
  };
  video: {
    id: string;
    title: string;
    channel: string;
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
    hn_mentions: number;
    wiki_found: boolean;
  };
  related_videos: RelatedVideo[];
};

type Status = "idle" | "loading" | "ok" | "err";

export function UrlAnalysisForm({
  d,
  onResult,
  onReset,
}: {
  d: Dict["analyze_form"];
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
    return <PreviewCard d={d} preview={preview} onRetry={reset} />;
  }

  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-strong bg-surface p-7 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <Lightning
            size={20}
            weight="duotone"
            className="text-accent animate-pulse"
          />
          <p className="text-base font-medium text-ink">{d.submitting}</p>
        </div>
        <p className="mt-3 text-sm text-ink-muted leading-relaxed">
          {d.submitting_hint}
        </p>
        <div className="mt-5 h-1 w-full rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full w-1/3 bg-accent animate-[loadbar_2s_ease-in-out_infinite]" />
        </div>
        <style>{`@keyframes loadbar { 0%{margin-left:-33%} 100%{margin-left:100%} }`}</style>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-strong bg-surface p-7 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center gap-2 mb-5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-muted">
          {d.live_badge}
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="ytUrl" className="text-xs font-medium text-ink-muted">
            {d.label_url}
          </label>
          <input
            id="ytUrl"
            type="url"
            required
            value={youtubeUrl}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={d.url_placeholder}
            className="w-full h-11 px-3.5 rounded-lg bg-surface-2 border border-strong outline-none font-mono text-sm text-ink placeholder:text-ink-dim focus:border-accent/60 focus:ring-2 focus:ring-[var(--accent-ring)] transition"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <button
          type="submit"
          className="group w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-accent text-bg font-semibold text-sm hover:bg-accent-strong active:translate-y-[1px] transition"
        >
          {d.submit}
          <ArrowRight
            size={16}
            weight="bold"
            className="transition group-hover:translate-x-0.5"
          />
        </button>

        {status === "err" && err && (
          <div className="flex items-start gap-2 text-xs text-[var(--danger)] p-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/5">
            <Warning size={14} weight="duotone" className="mt-0.5 flex-shrink-0" />
            <span>
              <strong>{d.err_prefix}</strong> {err}
            </span>
          </div>
        )}

        <p className="text-[11px] text-ink-dim leading-relaxed">{d.disclaimer}</p>
      </div>
    </form>
  );
}

/* ─── Card ─────────────────────────────────────────────────────────────── */

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

function bmTone(bm: BusinessModel): string {
  if (bm === "course-funnel" || bm === "affiliate-bait") {
    return "border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]";
  }
  if (bm === "real-product") {
    return "border-accent/40 bg-accent/10 text-accent";
  }
  return "border-strong bg-surface-2 text-ink-muted";
}

function fmtNum(n?: number): string {
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

function PreviewCard({
  d,
  preview: rawPreview,
  onRetry,
}: {
  d: Dict["analyze_form"];
  preview: Preview;
  onRetry: () => void;
}) {
  const [cardLang, setCardLang] = useState<Lang>("en");
  const [translated, setTranslated] = useState<Preview | null>(null);
  const [translating, setTranslating] = useState<Lang | null>(null);

  const preview = translated ?? rawPreview;
  const cacheKey = (lang: Lang) => `cp_translate:${rawPreview.video.id}:${lang}`;

  async function pickLang(target: Lang) {
    if (target === cardLang || translating) return;
    if (target === "en") {
      setCardLang("en");
      setTranslated(null);
      return;
    }
    // sessionStorage cache hit
    try {
      const cached = sessionStorage.getItem(cacheKey(target));
      if (cached) {
        setTranslated(JSON.parse(cached) as Preview);
        setCardLang(target);
        return;
      }
    } catch {
      /* sessionStorage unavailable — ignore */
    }
    setTranslating(target);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ preview: rawPreview, targetLang: target }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.translated) {
        setTranslated(data.translated as Preview);
        setCardLang(target);
        try {
          sessionStorage.setItem(cacheKey(target), JSON.stringify(data.translated));
        } catch {
          /* quota or disabled — ignore */
        }
      }
    } finally {
      setTranslating(null);
    }
  }

  const v = preview.video;
  const s = preview.signals;
  const m = preview.market_reality;
  const f = preview.revenue_forecast;
  const b = preview.build_path;
  const thumb = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
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
    <div className="rounded-2xl border border-strong bg-surface overflow-hidden shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
      {/* ─── HERO ─── */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt={v.title || preview.brand}
          className="w-full aspect-video object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent pointer-events-none" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-accent/15 text-accent border border-accent/30 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.15em]">
          <ChartLineUp size={11} weight="bold" />
          {d.live_badge}
        </span>
        {translating && (
          <div className="absolute inset-0 bg-bg/75 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6">
            <Lightning
              size={28}
              weight="duotone"
              className="text-accent animate-pulse"
            />
            <p className="text-base font-medium text-ink">
              {d.card_translating}
            </p>
            <p className="text-xs text-ink-muted">
              ~5–10s · {LANG_NAMES[translating]}
            </p>
            <div className="w-48 h-1 rounded-full bg-surface-2 overflow-hidden">
              <div className="h-full w-1/2 bg-accent animate-[loadbar_1.4s_ease-in-out_infinite]" />
            </div>
          </div>
        )}
      </div>

      {/* Lang toggle row — visible, labeled */}
      <div className="px-6 py-3 border-b border-strong/40 bg-surface-2/30 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-dim">
          {d.card_translate_label}
        </p>
        <div className="inline-flex items-center gap-1 rounded-full border border-strong bg-surface p-1">
          {LANGS.map((l) => {
            const active = l === cardLang;
            const isLoading = translating === l;
            return (
              <button
                key={l}
                type="button"
                onClick={() => pickLang(l)}
                title={LANG_NAMES[l]}
                className={[
                  "px-3 py-1 text-xs font-mono rounded-full transition select-none",
                  active
                    ? "bg-ink text-bg font-semibold"
                    : "text-ink-muted hover:text-ink hover:bg-surface-2",
                  isLoading ? "opacity-40 cursor-wait" : "",
                ].join(" ")}
              >
                {LANG_LABELS[l]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="divide-y divide-strong/40">
        {/* Brand + tagline */}
        <Section>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-dim">
            {d.card_brand}
          </p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tightish text-ink">
            {preview.brand}
          </h3>
          <p className="mt-1 text-sm text-ink-muted leading-relaxed">
            {preview.tagline}
          </p>

          <div
            className={`mt-4 rounded-xl border px-4 py-3 ${bmTone(preview.business_model)}`}
          >
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-80">
              {d.card_business_model}
            </p>
            <p className="mt-1 text-base font-semibold">
              {bmLabel(preview.business_model, d)}
            </p>
            <p className="mt-1 text-xs leading-relaxed opacity-90">
              <strong>{d.card_real_revenue}:</strong>{" "}
              {preview.likely_real_revenue_source}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-px bg-[var(--border)] rounded-lg overflow-hidden border border-strong">
            <Gauge
              label={d.card_clone_feasibility}
              value={preview.clone_feasibility_0_100}
            />
            <Gauge label={d.card_honesty} value={preview.honesty_score_0_100} />
            <Gauge label={d.card_confidence} value={preview.confidence_0_100} />
          </div>
        </Section>

        {/* Market reality */}
        <Section icon={<Crosshair size={14} weight="duotone" />} title={d.section_market}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KV label={d.market_tam} value={m.tam_summary} />
            <KV label={d.market_sam} value={m.sam_summary} />
            <KV label={d.market_som} value={m.som_year1_summary} />
          </div>
          <p className="mt-3 text-xs text-ink-muted leading-relaxed">
            <strong className="text-ink-dim font-mono uppercase text-[10px] mr-1">
              {d.market_trend}:
            </strong>
            {m.trend_summary}
          </p>
          {m.top_competitors.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-dim mb-2">
                {d.market_competitors}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {m.top_competitors.map((c) => (
                  <div
                    key={c.name}
                    className="p-2.5 rounded-lg border border-strong bg-surface-2/40"
                  >
                    <p className="text-sm font-semibold text-ink">{c.name}</p>
                    {c.url_hint && (
                      <p className="text-[10px] font-mono text-accent">
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

        {/* Revenue forecast */}
        <Section
          icon={<CurrencyDollar size={14} weight="duotone" />}
          title={d.section_forecast}
        >
          <div className="space-y-2">
            <ForecastBar
              label={d.forecast_conservative}
              value={f.conservative_arr_usd}
              max={fMax}
              tone="dim"
            />
            <ForecastBar
              label={d.forecast_base}
              value={f.base_arr_usd}
              max={fMax}
              tone="accent"
            />
            <ForecastBar
              label={d.forecast_aggressive}
              value={f.aggressive_arr_usd}
              max={fMax}
              tone="bright"
            />
          </div>
          {f.assumptions.length > 0 && (
            <details className="mt-3 group">
              <summary className="cursor-pointer text-[10px] font-mono uppercase tracking-[0.18em] text-ink-dim hover:text-ink">
                {d.forecast_assumptions} ({f.assumptions.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {f.assumptions.map((a, i) => (
                  <li
                    key={i}
                    className="text-xs text-ink-muted leading-relaxed flex gap-2"
                  >
                    <span className="text-ink-dim">·</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Section>

        {/* Red flags or "no flags" */}
        {preview.red_flags.length > 0 ? (
          <Section
            icon={<WarningCircle size={14} weight="duotone" className="text-[var(--danger)]" />}
            title={`${d.card_red_flags} (${preview.red_flags.length})`}
            tone="danger"
          >
            <ul className="space-y-1.5">
              {preview.red_flags.map((f, i) => (
                <li
                  key={i}
                  className="text-xs text-ink leading-relaxed flex gap-2"
                >
                  <span className="text-[var(--danger)] flex-shrink-0">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </Section>
        ) : (
          <Section>
            <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs text-accent flex items-center gap-2">
              <Check size={14} weight="bold" />
              {d.card_no_red_flags}
            </div>
          </Section>
        )}

        {/* Insider tips */}
        {preview.insider_tips.length > 0 && (
          <Section
            icon={<Lightbulb size={14} weight="duotone" />}
            title={d.section_tips}
          >
            <ol className="space-y-2">
              {preview.insider_tips.map((tip, i) => (
                <li
                  key={i}
                  className="text-xs text-ink leading-relaxed flex gap-3"
                >
                  <span className="font-mono text-accent flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {/* Build path */}
        <Section
          icon={<Hammer size={14} weight="duotone" />}
          title={d.section_build}
        >
          <div className="grid grid-cols-3 gap-px bg-[var(--border)] rounded-lg overflow-hidden border border-strong">
            <KStat label={d.build_total_weeks} value={`${b.total_weeks} w`} />
            <KStat
              label={d.build_one_time_cost}
              value={fmtUSD(b.estimated_one_time_cost_usd)}
            />
            <KStat
              label={d.build_monthly_cost}
              value={`${fmtUSD(b.estimated_monthly_cost_usd)}/mo`}
            />
          </div>

          <ol className="mt-3 space-y-1.5">
            {b.steps.map((step, i) => (
              <li
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-strong bg-surface-2/30"
              >
                <span className="font-mono text-[10px] text-ink-dim w-6 flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-xs text-ink flex-1 leading-tight">
                  {step.title}
                </span>
                <span className="font-mono text-[10px] text-accent flex-shrink-0">
                  {step.weeks}w
                </span>
              </li>
            ))}
          </ol>

          {b.stack.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-dim mb-2">
                {d.build_stack}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {b.stack.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-strong bg-surface-2 text-ink-muted"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Related videos */}
        {preview.related_videos.length > 0 && (
          <Section
            icon={<PlayCircle size={14} weight="duotone" />}
            title={d.section_related}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {preview.related_videos.map((rv) => (
                <a
                  key={rv.video_id}
                  href={`https://www.youtube.com/watch?v=${rv.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-strong overflow-hidden hover:border-accent/40 transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={rv.thumbnail}
                    alt={rv.title}
                    className="w-full aspect-video object-cover"
                  />
                  <div className="p-2">
                    <p className="text-xs text-ink leading-tight line-clamp-2">
                      {rv.title}
                    </p>
                    <p className="text-[10px] text-ink-dim mt-1 truncate">
                      {rv.channel}
                      {rv.view_count != null
                        ? ` · ${fmtNum(rv.view_count)} ${d.sig_views}`
                        : ""}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </Section>
        )}

        {/* Top risk */}
        <Section
          icon={<Warning size={14} weight="duotone" className="text-amber-400" />}
          title={d.card_risk}
          tone="warn"
        >
          <p className="text-sm text-ink leading-relaxed">{preview.top_risk}</p>
        </Section>

        {/* Signals */}
        <Section
          icon={<ChartBar size={14} weight="duotone" />}
          title={d.card_signals}
        >
          <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
            <Chip>{`▶ ${fmtNum(v.view_count)} ${d.sig_views}`}</Chip>
            {v.like_count != null && (
              <Chip>{`♥ ${fmtNum(v.like_count)} ${d.sig_likes}`}</Chip>
            )}
            {v.channel_subscribers != null && (
              <Chip>{`◎ ${fmtNum(v.channel_subscribers)} ${d.sig_subs}`}</Chip>
            )}
            {ageYears != null && (
              <Chip>{`${ageYears.toFixed(1)} ${d.sig_channel_age_years}`}</Chip>
            )}
            {s.trends && (
              <Chip
                tone={
                  s.trends.direction === "rising"
                    ? "good"
                    : s.trends.direction === "declining"
                      ? "bad"
                      : "neutral"
                }
              >
                <TrendIcon direction={s.trends.direction} />
                {`${d.sig_trend} ${s.trends.score}`}
              </Chip>
            )}
            <Chip tone={s.hn_mentions > 0 ? "good" : "neutral"}>
              {`${d.sig_hn} ${s.hn_mentions}`}
            </Chip>
            <Chip tone={s.wiki_found ? "good" : "neutral"}>
              {s.wiki_found ? d.sig_wiki_yes : d.sig_wiki_no}
            </Chip>
            <Chip>{`${d.sig_transcript_via} ${v.transcript_source}`}</Chip>
          </div>
        </Section>

        {/* Clone CTA */}
        <Section tone="accent">
          <div className="rounded-xl border border-accent/40 bg-accent/5 p-5">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-accent flex items-center gap-1.5">
              <Lightning size={11} weight="bold" />
              {d.section_clone_cta}
            </p>
            <h4 className="mt-2 text-lg font-semibold text-ink">
              {d.clone_cta_title}
            </h4>
            <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">
              {d.clone_cta_body}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/install"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent text-bg px-4 text-sm font-semibold hover:bg-accent-strong active:translate-y-[1px] transition"
              >
                {d.clone_cta_btn}
              </Link>
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-strong px-4 text-sm font-medium text-ink-muted hover:text-ink hover:border-accent/40 transition"
              >
                <ArrowsClockwise size={14} weight="bold" />
                {d.card_retry}
              </button>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

/* ─── small atoms ─────────────────────────────────────────────────────── */

function Section({
  icon,
  title,
  children,
  tone,
}: {
  icon?: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  tone?: "danger" | "warn" | "accent";
}) {
  const toneCls =
    tone === "danger"
      ? "bg-[var(--danger)]/5"
      : tone === "warn"
        ? "bg-amber-500/5"
        : tone === "accent"
          ? "bg-accent/5"
          : "";
  return (
    <div className={`p-6 ${toneCls}`}>
      {title && (
        <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-dim mb-3 flex items-center gap-1.5">
          {icon}
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg border border-strong bg-surface-2/40">
      <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink-dim">
        {label}
      </p>
      <p className="mt-1 text-xs text-ink leading-relaxed">{value}</p>
    </div>
  );
}

function KStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-3 py-2.5 text-center">
      <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-ink-dim">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm font-semibold text-accent">{value}</p>
    </div>
  );
}

function Gauge({ label, value }: { label: string; value: number }) {
  const tone =
    value >= 70
      ? "text-accent"
      : value >= 40
        ? "text-amber-400"
        : "text-[var(--danger)]";
  const bar =
    value >= 70 ? "bg-accent" : value >= 40 ? "bg-amber-400" : "bg-[var(--danger)]";
  return (
    <div className="bg-surface px-3 py-2.5">
      <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-ink-dim">
        {label}
      </p>
      <p className={`mt-1 font-mono text-base font-semibold ${tone}`}>
        {value}
        <span className="text-ink-dim text-xs">/100</span>
      </p>
      <div className="mt-1 h-1 rounded-full bg-surface-2 overflow-hidden">
        <div className={`h-full ${bar}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ForecastBar({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number;
  max: number;
  tone: "dim" | "accent" | "bright";
}) {
  const pct = Math.max(2, Math.round((value / max) * 100));
  const barCls =
    tone === "bright"
      ? "bg-gradient-to-r from-accent to-[var(--accent-strong)]"
      : tone === "accent"
        ? "bg-accent"
        : "bg-accent/40";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-[11px] font-mono uppercase tracking-[0.15em] text-ink-muted">
          {label}
        </span>
        <span className="font-mono text-sm font-semibold text-ink">
          {fmtUSD(value)}{" "}
          <span className="text-[10px] text-ink-dim">ARR</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className={`h-full ${barCls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "good" | "bad" | "neutral";
}) {
  const cls =
    tone === "good"
      ? "border-accent/40 bg-accent/5 text-accent"
      : tone === "bad"
        ? "border-[var(--danger)]/40 bg-[var(--danger)]/5 text-[var(--danger)]"
        : "border-strong bg-surface-2 text-ink-muted";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${cls}`}
    >
      {children}
    </span>
  );
}

function TrendIcon({ direction }: { direction: string }) {
  if (direction === "rising") return <TrendUp size={10} weight="bold" />;
  if (direction === "declining") return <TrendDown size={10} weight="bold" />;
  return <Minus size={10} weight="bold" />;
}
