"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Eye,
  Play,
  Sparkle,
} from "@phosphor-icons/react";

export type ViralVideo = {
  id: string;
  title: string;
  channel: string;
  views: number;
  durationSec: number;
  published: string;
  thumb: string;
};

function fmtViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m`;
}

export function UsViralGallery({ videos }: { videos: ViralVideo[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    function update() {
      if (!el) return;
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function scrollBy(dir: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.9), behavior: "smooth" });
  }

  function analyzeIt(videoId: string) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    // Fill the URL form at top of page + scroll to it + submit
    const inp = document.getElementById("ytUrl") as HTMLInputElement | null;
    if (!inp) {
      window.open(url, "_blank");
      return;
    }
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(inp, url);
    inp.dispatchEvent(new Event("input", { bubbles: true }));
    inp.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      const btn = inp.closest("form")?.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement | null;
      btn?.click();
    }, 600);
  }

  return (
    <div className="relative">
      {/* Edge fade overlays for visual depth */}
      <div
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to right, var(--bg) 0%, transparent 100%)",
          opacity: canLeft ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      />
      <div
        aria-hidden
        className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to left, var(--bg) 0%, transparent 100%)",
          opacity: canRight ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      />

      {/* Arrow controls */}
      <div className="absolute -top-14 right-0 flex items-center gap-2 z-20">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          disabled={!canLeft}
          className="inline-flex h-9 w-9 items-center justify-center border border-strong bg-surface hover:bg-surface-2 disabled:opacity-30 transition"
          style={{ borderRadius: 6 }}
          aria-label="Scroll left"
        >
          <ArrowLeft size={14} weight="bold" />
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          disabled={!canRight}
          className="inline-flex h-9 w-9 items-center justify-center border border-strong bg-surface hover:bg-surface-2 disabled:opacity-30 transition"
          style={{ borderRadius: 6 }}
          aria-label="Scroll right"
        >
          <ArrowRight size={14} weight="bold" />
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="flex overflow-x-auto gap-5 pb-4 snap-x snap-mandatory scroll-smooth"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--border-strong) transparent",
        }}
      >
        {videos.map((v, idx) => (
          <ViralCard
            key={v.id}
            v={v}
            index={idx}
            onAnalyze={() => analyzeIt(v.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ViralCard({
  v,
  index,
  onAnalyze,
}: {
  v: ViralVideo;
  index: number;
  onAnalyze: () => void;
}) {
  return (
    <article
      className="flex-shrink-0 w-[320px] sm:w-[360px] snap-start border border-strong bg-surface overflow-hidden hover:border-bright transition group fade-up"
      style={{ borderRadius: 10, ["--i" as string]: Math.min(index, 8) }}
    >
      <a
        href={`https://www.youtube.com/watch?v=${v.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-video overflow-hidden bg-surface-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={v.thumb}
          alt={v.title}
          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`;
          }}
        />
        {/* duration chip */}
        <span
          className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[11px] font-mono text-ink bg-bg/80 backdrop-blur-sm"
          style={{ borderRadius: 3 }}
        >
          {fmtDuration(v.durationSec)}
        </span>
        {/* views chip */}
        <span
          className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-semibold bg-bg/80 backdrop-blur-sm"
          style={{
            borderRadius: 3,
            color: "var(--brand)",
            border: "1px solid color-mix(in oklab, var(--brand) 40%, transparent)",
          }}
        >
          <Eye size={11} weight="bold" />
          {fmtViews(v.views)}
        </span>
        {/* play overlay */}
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          style={{
            background:
              "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)",
          }}
        >
          <span
            className="inline-flex h-12 w-12 items-center justify-center"
            style={{
              background: "var(--brand)",
              borderRadius: 999,
            }}
          >
            <Play size={20} weight="fill" className="text-bg ml-0.5" />
          </span>
        </span>
      </a>

      <div className="p-4">
        <p className="text-[11px] font-mono uppercase tracking-wider text-ink-dim mb-1.5 truncate">
          {v.channel}
        </p>
        <h3 className="text-[15px] font-semibold text-ink leading-snug line-clamp-2 min-h-[2.6em]">
          {v.title}
        </h3>
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onAnalyze}
            className="flex-1 inline-flex h-9 items-center justify-center gap-1.5 text-bg text-[12px] font-semibold uppercase tracking-wider hover:brightness-110 active:translate-y-[1px] transition"
            style={{ background: "var(--brand)", borderRadius: 6 }}
          >
            <Sparkle size={12} weight="bold" />
            Analyze
          </button>
          <a
            href={`https://www.youtube.com/watch?v=${v.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 px-3 items-center justify-center border border-strong text-[12px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink hover:border-bright transition"
            style={{ borderRadius: 6 }}
          >
            Watch
          </a>
        </div>
      </div>
    </article>
  );
}
