"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowsClockwise,
  ChartLineUp,
  Lightning,
  Warning,
} from "@phosphor-icons/react";
import type { Dict } from "@/lib/i18n";

type Preview = {
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
    transcript_chars: number;
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
          <Lightning size={20} weight="duotone" className="text-accent animate-pulse" />
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
            <Warning size={14} weight="duotone" className="mt-0.5 flex-shrink-0" />
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

function PreviewCard({
  d,
  preview,
  onRetry,
}: {
  d: Dict["analyze_form"];
  preview: Preview;
  onRetry: () => void;
}) {
  const thumb = `https://i.ytimg.com/vi/${preview.video.id}/hqdefault.jpg`;
  const cls = confidenceClass(preview.confidence_0_100);
  return (
    <div className="rounded-2xl border border-strong bg-surface overflow-hidden shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt={preview.video.title || preview.brand}
          className="w-full aspect-video object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent pointer-events-none" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-accent/15 text-accent border border-accent/30 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.15em]">
          <ChartLineUp size={11} weight="bold" />
          {d.live_badge}
        </span>
      </div>

      <div className="p-6 space-y-5">
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

        <div className="grid grid-cols-2 gap-px bg-[var(--border)] rounded-lg overflow-hidden border border-strong">
          <MiniRow label={d.card_confidence} value={`${preview.confidence_0_100}/100`} className={cls} />
          <MiniRow
            label={d.card_transcript_chars}
            value={preview.video.transcript_chars.toLocaleString()}
          />
        </div>

        <div className="grid gap-3">
          <Field label={d.card_target} value={preview.target_audience} />
          <Field label={d.card_problem} value={preview.problem} />
          <Field label={d.card_solution} value={preview.solution} />
        </div>

        <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/5 p-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--danger)]">
            {d.card_risk}
          </p>
          <p className="mt-1.5 text-sm text-ink leading-relaxed">{preview.top_risk}</p>
        </div>

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

function MiniRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-ink-dim">
        {label}
      </p>
      <p className={`mt-1 font-mono text-sm ${className ?? "text-ink"}`}>{value}</p>
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

function confidenceClass(c: number): string {
  if (c >= 70) return "text-accent";
  if (c >= 40) return "text-amber-400";
  return "text-[var(--danger)]";
}
