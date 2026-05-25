"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowsClockwise,
  ChartLineUp,
  Lightning,
  TrendUp,
  TrendDown,
  Minus,
  Warning,
  WarningCircle,
  Check,
} from "@phosphor-icons/react";
import type { Dict } from "@/lib/i18n";

type BusinessModel =
  | "real-product"
  | "course-funnel"
  | "affiliate-bait"
  | "personal-brand"
  | "consulting-front"
  | "unclear";

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
};

type Status = "idle" | "loading" | "ok" | "err";

export function UrlAnalysisForm({ d }: { d: Dict["analyze_form"] }) {
  const [youtubeUrl, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
          <label
            htmlFor="ytUrl"
            className="text-xs font-medium text-ink-muted"
          >
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
            <Warning
              size={14}
              weight="duotone"
              className="mt-0.5 flex-shrink-0"
            />
            <span>
              <strong>{d.err_prefix}</strong> {err}
            </span>
          </div>
        )}

        <p className="text-[11px] text-ink-dim leading-relaxed">
          {d.disclaimer}
        </p>
      </div>
    </form>
  );
}

/* ─── card ─────────────────────────────────────────────────────────── */

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

function fmt(n?: number): string {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function PreviewCard({
  d,
  preview,
  onRetry,
}: {
  d: Dict["analyze_form"];
  preview: Preview;
  onRetry: () => void;
}) {
  const v = preview.video;
  const s = preview.signals;
  const thumb = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
  const ageYears = v.channel_created_at
    ? (Date.now() - new Date(v.channel_created_at).getTime()) /
      (365 * 24 * 60 * 60 * 1000)
    : null;

  return (
    <div className="rounded-2xl border border-strong bg-surface overflow-hidden shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt={v.title || preview.brand}
          className="w-full aspect-video object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent pointer-events-none" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-accent/15 text-accent border border-accent/30 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.15em]">
          <ChartLineUp size={11} weight="bold" />
          {d.live_badge}
        </span>
      </div>

      <div className="p-6 space-y-5">
        {/* Brand + tagline */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-dim">
            {d.card_brand}
          </p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tightish text-ink">
            {preview.brand}
          </h3>
          <p className="mt-1 text-sm text-ink-muted leading-relaxed">
            {preview.tagline}
          </p>
        </div>

        {/* Business model big badge */}
        <div
          className={`rounded-xl border px-4 py-3 ${bmTone(preview.business_model)}`}
        >
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] opacity-80">
            {d.card_business_model}
          </p>
          <p className="mt-1 text-base font-semibold">
            {bmLabel(preview.business_model, d)}
          </p>
          <p className="mt-1 text-xs leading-relaxed opacity-90">
            {preview.likely_real_revenue_source}
          </p>
        </div>

        {/* Gauges row */}
        <div className="grid grid-cols-3 gap-px bg-[var(--border)] rounded-lg overflow-hidden border border-strong">
          <Gauge
            label={d.card_clone_feasibility}
            value={preview.clone_feasibility_0_100}
          />
          <Gauge
            label={d.card_honesty}
            value={preview.honesty_score_0_100}
          />
          <Gauge
            label={d.card_confidence}
            value={preview.confidence_0_100}
          />
        </div>

        {/* Target / Problem / Solution */}
        <div className="grid gap-3">
          <Field label={d.card_target} value={preview.target_audience} />
          <Field label={d.card_problem} value={preview.problem} />
          <Field label={d.card_solution} value={preview.solution} />
        </div>

        {/* Red flags */}
        {preview.red_flags.length > 0 ? (
          <div className="rounded-lg border border-[var(--danger)]/40 bg-[var(--danger)]/5 p-4">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--danger)] flex items-center gap-1.5">
              <WarningCircle size={11} weight="bold" />
              {d.card_red_flags} ({preview.red_flags.length})
            </p>
            <ul className="mt-2 space-y-1.5">
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
          </div>
        ) : (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-xs text-accent flex items-center gap-2">
            <Check size={14} weight="bold" />
            {d.card_no_red_flags}
          </div>
        )}

        {/* Top risk */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-amber-400">
            {d.card_risk}
          </p>
          <p className="mt-1.5 text-sm text-ink leading-relaxed">
            {preview.top_risk}
          </p>
        </div>

        {/* External signals */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-dim mb-2">
            {d.card_signals}
          </p>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
            <Chip>{`▶ ${fmt(v.view_count)} ${d.sig_views}`}</Chip>
            {v.like_count != null && (
              <Chip>{`♥ ${fmt(v.like_count)} ${d.sig_likes}`}</Chip>
            )}
            {v.channel_subscribers != null && (
              <Chip>{`◎ ${fmt(v.channel_subscribers)} ${d.sig_subs}`}</Chip>
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
        </div>

        {/* CTA */}
        <div className="pt-3 border-t border-strong/60 flex flex-wrap gap-3 items-center">
          <Link
            href="/install"
            className="group inline-flex h-10 items-center gap-2 rounded-lg bg-ink text-bg px-4 text-sm font-semibold hover:bg-white active:translate-y-[1px] transition"
          >
            {d.card_install_cta}
            <ArrowRight size={14} weight="bold" />
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
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg border border-strong bg-surface-2/40">
      <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink-dim">
        {label}
      </p>
      <p className="mt-1 text-sm text-ink leading-relaxed">{value}</p>
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
        <div
          className={`h-full ${
            value >= 70
              ? "bg-accent"
              : value >= 40
                ? "bg-amber-400"
                : "bg-[var(--danger)]"
          }`}
          style={{ width: `${value}%` }}
        />
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
  if (direction === "rising")
    return <TrendUp size={10} weight="bold" />;
  if (direction === "declining")
    return <TrendDown size={10} weight="bold" />;
  return <Minus size={10} weight="bold" />;
}
