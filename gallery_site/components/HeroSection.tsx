"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  GithubLogo,
  TerminalWindow,
} from "@phosphor-icons/react/dist/ssr";
import { UrlAnalysisForm } from "@/components/UrlAnalysisForm";
import type { Dict } from "@/lib/i18n";

type Em = React.FC<{ children: React.ReactNode }>;
type Code = React.FC<{ children: React.ReactNode }>;

function EmAccent({ children }: { children: React.ReactNode }) {
  return <span className="text-accent">{children}</span>;
}
function CodeMark({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-ink-muted">{children}</code>;
}

export function HeroSection({
  d,
  reportsShipped,
}: {
  d: Dict;
  reportsShipped: number;
}) {
  const [hasResult, setHasResult] = useState(false);

  return (
    <section className="mx-auto max-w-[1240px] px-6 pt-16 pb-24 md:pt-24 md:pb-32">
      <div
        className={
          hasResult
            ? "grid grid-cols-1 gap-10"
            : "grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-start"
        }
      >
        {!hasResult && (
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-strong bg-surface px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-ink-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              {d.hero.badge}
            </div>

            <h1 className="mt-6 text-[44px] md:text-[64px] leading-[1.02] tracking-tightish font-semibold text-ink">
              {d.hero.titleRich(EmAccent as Em)}
            </h1>

            <p className="mt-7 max-w-[58ch] text-[17px] leading-relaxed text-ink-muted">
              {d.hero.subtitle}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/install"
                className="group inline-flex h-11 items-center gap-2 rounded-lg bg-ink text-bg px-4 text-sm font-semibold hover:bg-white active:translate-y-[1px] transition"
              >
                <TerminalWindow size={16} weight="duotone" />
                {d.hero.cta_install}
              </Link>
              <Link
                href="#gallery"
                className="group inline-flex h-11 items-center gap-2 rounded-lg border border-strong px-4 text-sm font-medium text-ink hover:border-accent/40 hover:text-accent transition"
              >
                {d.hero.cta_see_reports}
                <ArrowUpRight
                  size={14}
                  weight="bold"
                  className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
              <a
                href="https://github.com/a01050398694-commits/clonepilot"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-11 items-center gap-2 rounded-lg border border-strong px-4 text-sm font-medium text-ink-muted hover:border-strong hover:text-ink transition"
              >
                <GithubLogo size={16} weight="duotone" />
                {d.hero.cta_github}
              </a>
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-px bg-[var(--border)] rounded-xl overflow-hidden border border-strong">
              <Stat
                label={d.hero.stat_reports_label}
                value={String(reportsShipped)}
              />
              <Stat label={d.hero.stat_languages_label} value="5" />
              <Stat
                label={d.hero.stat_build_time_label}
                value={d.hero.stat_build_time_value}
                accent="emerald"
              />
            </dl>
          </div>
        )}

        <div
          className={
            hasResult
              ? "lg:max-w-[1100px] lg:mx-auto w-full"
              : "lg:pt-2"
          }
        >
          <UrlAnalysisForm
            d={d.analyze_form}
            onResult={() => setHasResult(true)}
            onReset={() => setHasResult(false)}
          />
          {!hasResult && (
            <p className="mt-4 px-1 text-[11px] text-ink-dim leading-relaxed">
              {d.hero.skip_queueRich(CodeMark as Code)}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald";
}) {
  return (
    <div className="bg-bg px-4 py-4">
      <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-ink-dim">
        {label}
      </p>
      <p
        className={`mt-1.5 font-mono text-2xl tracking-tightish ${
          accent === "emerald" ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
