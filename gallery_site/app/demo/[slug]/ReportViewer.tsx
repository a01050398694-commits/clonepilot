"use client";

import Link from "next/link";
import {
  type DeepAnalysisReport,
  type Risk,
  pickLocale,
} from "@/lib/report";
import type { Lang } from "@/lib/i18n";
import { tReport, type ReportDict } from "@/lib/i18n-report";

export function ReportViewer({
  report,
  lang,
}: {
  report: DeepAnalysisReport;
  lang: Lang;
}) {
  const r = tReport(lang);
  const locale = pickLocale(report, lang);
  const bp = report.blueprint;
  const v = report.source;
  const thumb = `https://i.ytimg.com/vi/${v.video_id}/maxresdefault.jpg`;
  const dq = report.data_quality;
  const trendCopy: Record<string, string> = {
    rising: r.trend_rising,
    stable: r.trend_stable,
    declining: r.trend_declining,
    unknown: r.trend_unknown,
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <nav className="mb-8 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-xs font-mono text-ink-dim hover:text-accent"
        >
          {r.nav_gallery_back}
        </Link>
      </nav>

      <header className="mb-10">
        <p className="text-accent font-mono text-xs uppercase tracking-wider mb-3">
          {r.header_eyebrow(dq.confidence_0_100)}
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {bp.name}
        </h1>
        <p className="mt-3 text-ink text-lg leading-relaxed max-w-3xl">
          {locale?.tagline ?? bp.tagline}
        </p>
        {locale?.hero && (
          <p className="mt-4 text-ink-muted leading-relaxed max-w-3xl">
            {locale.hero}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/install"
            className="px-5 py-2.5 rounded-md bg-accent text-bg font-semibold hover:bg-accent-strong transition text-sm"
          >
            {locale?.cta ?? r.cta_run_default} →
          </Link>
          <a
            href={v.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-md border border-strong hover:border-accent transition text-sm"
          >
            {r.cta_source_video}
          </a>
        </div>
      </header>

      <section className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 rounded-xl overflow-hidden border border-strong bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt={v.title} className="w-full aspect-video object-cover" />
          <div className="p-3">
            <p className="text-xs text-ink-muted line-clamp-2">{v.title}</p>
            <p className="mt-1 text-[10px] font-mono text-ink-dim">
              {v.channel} · {r.video_meta(Math.round(v.duration_sec / 60), v.transcript_chars)}
            </p>
          </div>
        </div>
        <div className="md:col-span-2 grid grid-cols-1 gap-3">
          <InfoRow label={r.info_target} value={bp.target_audience} />
          <InfoRow label={r.info_problem} value={bp.problem} />
          <InfoRow label={r.info_solution} value={bp.solution} />
        </div>
      </section>

      {locale?.value_props && (
        <section className="mb-10">
          <SectionLabel>{r.section_value_props}</SectionLabel>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {locale.value_props.map((vp, i) => (
              <li
                key={i}
                className="p-4 rounded-lg border border-strong bg-surface text-sm text-ink leading-relaxed"
              >
                <span className="text-accent font-mono mr-2">{String(i + 1).padStart(2, "0")}</span>
                {vp}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-10">
        <SectionLabel>{r.section_pricing_tiers}</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {bp.pricing_tiers.map((t) => (
            <div
              key={t.name}
              className="p-4 rounded-lg border border-strong bg-surface"
            >
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-semibold">{t.name}</span>
                <span className="font-mono text-accent">
                  {t.price_usd > 0 ? `$${t.price_usd}` : "free"}
                </span>
              </div>
              <ul className="space-y-1 text-xs text-ink-muted">
                {t.features.slice(0, 5).map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionLabel>{r.section_revenue_forecast}</SectionLabel>
        {report.revenue_forecast ? (
          <ForecastBlock f={report.revenue_forecast} r={r} />
        ) : (
          <p className="text-sm text-ink-dim p-4 rounded-lg border border-dashed border-strong bg-surface/50">
            {r.forecast_empty_hint}
          </p>
        )}
      </section>

      <section className="mb-10">
        <SectionLabel>{r.section_competitors}</SectionLabel>
        {report.competitors.length === 0 ? (
          <p className="text-sm text-ink-dim p-4 rounded-lg border border-dashed border-strong bg-surface/50">
            {r.competitors_empty_hint_prefix}
            <code className="font-mono text-accent">EXA_API_KEY</code>
            {r.competitors_empty_hint_suffix}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.competitors.map((c) => (
              <a
                key={c.url}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border border-strong bg-surface hover:border-accent transition"
              >
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold">{c.name}</span>
                  {c.estimated_traffic != null && (
                    <span className="text-[10px] font-mono text-ink-dim">
                      ~{c.estimated_traffic.toLocaleString()}{r.competitor_traffic_suffix}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-ink-muted leading-relaxed">{c.positioning}</p>
                <p className="mt-2 text-[10px] font-mono text-accent">{c.pricing_summary}</p>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <SectionLabel>{r.section_market_trend}</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            label={r.stat_5_year_trend}
            value={trendCopy[report.market.five_year_trend] ?? "—"}
          />
          <StatCard
            label={r.stat_trend_score}
            value={`${report.market.trend_score_0_100}/100`}
          />
          <StatCard
            label={r.stat_global_searches}
            value={
              report.market.global_monthly_searches != null
                ? report.market.global_monthly_searches.toLocaleString()
                : "—"
            }
          />
        </div>
        <p className="mt-3 text-xs text-ink-dim font-mono">
          {r.market_seed_keyword}: <span className="text-accent">{report.market.category_keyword_seed}</span> · {r.market_sources}: {report.market.data_sources.join(", ")}
        </p>
        {report.market.top_keywords.length > 0 && (
          <div className="mt-4 rounded-xl border border-strong bg-surface overflow-hidden">
            <table className="w-full text-xs">
              <thead className="text-[10px] font-mono uppercase tracking-wider text-ink-dim bg-surface-2/50">
                <tr>
                  <th className="text-left p-3">{r.table_keyword}</th>
                  <th className="text-right p-3">{r.table_searches}</th>
                  <th className="text-right p-3">{r.table_cpc}</th>
                  <th className="text-right p-3">{r.table_difficulty}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {report.market.top_keywords.slice(0, 10).map((k) => (
                  <tr key={k.keyword}>
                    <td className="p-3 text-ink">{k.keyword}</td>
                    <td className="p-3 text-right font-mono text-accent">{k.monthly_searches?.toLocaleString() ?? "—"}</td>
                    <td className="p-3 text-right font-mono text-ink-muted">{k.cpc_usd != null ? `$${k.cpc_usd.toFixed(2)}` : "—"}</td>
                    <td className="p-3 text-right font-mono text-ink-muted">{k.difficulty ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-10">
        <SectionLabel>{r.section_seo_pack}</SectionLabel>
        <div className="rounded-xl border border-strong bg-surface p-5">
          <p className="text-xs font-mono text-ink-dim mb-2">{r.seo_primary_keyword}</p>
          <p className="font-mono text-accent mb-4">{report.seo_starter_pack.primary_keyword}</p>
          <p className="text-xs font-mono text-ink-dim mb-2">{r.seo_suggested_titles}</p>
          <ul className="space-y-1 text-sm text-ink mb-4">
            {report.seo_starter_pack.suggested_titles.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
          <p className="text-xs font-mono text-ink-dim mb-2">{r.seo_meta_desc}</p>
          <p className="text-sm text-ink-muted leading-relaxed mb-4">{report.seo_starter_pack.suggested_meta_description}</p>
          <p className="text-xs font-mono text-ink-dim mb-2">{r.seo_domain_ideas}</p>
          <div className="flex flex-wrap gap-2">
            {report.seo_starter_pack.domain_suggestions.map((d) => (
              <span
                key={d}
                className="text-[11px] font-mono px-2 py-1 rounded bg-surface-2 text-accent"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <SectionLabel>{r.section_risks(report.risks.length)}</SectionLabel>
        <div className="space-y-3">
          {report.risks.map((risk, i) => (
            <RiskCard key={i} risk={risk} r={r} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionLabel>{r.section_gtm}</SectionLabel>
        <ol className="space-y-3">
          {report.go_to_market_90day.map((step, i) => (
            <li
              key={i}
              className="flex gap-4 p-4 rounded-lg border border-strong bg-surface"
            >
              <div className="flex-shrink-0 w-16 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-ink-dim">{r.gtm_day_label}</p>
                <p className="text-2xl font-bold font-mono text-accent">{step.day}</p>
              </div>
              <p className="flex-1 text-sm text-ink leading-relaxed">{step.action}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-10">
        <SectionLabel>{r.section_data_quality}</SectionLabel>
        <div className="rounded-xl border border-strong bg-surface p-5">
          <div className="flex flex-wrap gap-2 mb-4">
            <SourceBadge ok={dq.trends_called} label="Google Trends" />
            <SourceBadge ok={dq.ahrefs_called} label="Ahrefs" />
            <SourceBadge ok={dq.similarweb_called} label="SimilarWeb" />
            <SourceBadge ok={dq.exa_called} label="Exa" />
            <SourceBadge ok={dq.youtube_data_called} label="YouTube Data" />
          </div>
          {dq.fallbacks_used.length > 0 && (
            <>
              <p className="text-xs font-mono text-ink-dim mb-2">{r.dq_fallbacks_label}</p>
              <ul className="space-y-1 text-xs text-ink-muted">
                {dq.fallbacks_used.map((f, i) => (
                  <li key={i} className="font-mono">· {f}</li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-4 text-xs text-ink-dim">
            {r.dq_confidence_explanation}
          </p>
        </div>
      </section>

      <section className="p-7 rounded-xl border border-accent/40 bg-accent/5 mb-10">
        <p className="text-xs font-mono uppercase tracking-wider text-accent mb-2">
          {r.bottom_cta_eyebrow}
        </p>
        <h2 className="text-2xl font-bold">
          {r.bottom_cta_title}
        </h2>
        <p className="mt-3 text-ink text-sm leading-relaxed">
          {r.bottom_cta_body}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/install"
            className="px-5 py-2.5 rounded-md bg-accent text-bg font-semibold hover:bg-accent-strong transition"
          >
            {r.bottom_cta_install}
          </Link>
          <Link
            href="/pricing"
            className="px-5 py-2.5 rounded-md border border-strong hover:border-accent transition text-sm"
          >
            {r.bottom_cta_pricing}
          </Link>
        </div>
      </section>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-mono uppercase tracking-wider text-ink-dim mb-4">
      {children}
    </h2>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg border border-strong bg-surface">
      <p className="text-[10px] font-mono uppercase tracking-wider text-ink-dim">{label}</p>
      <p className="mt-2 text-sm text-ink leading-relaxed">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg border border-strong bg-surface">
      <p className="text-[10px] font-mono uppercase tracking-wider text-ink-dim">{label}</p>
      <p className="mt-2 text-2xl font-bold font-mono text-accent">{value}</p>
    </div>
  );
}

function severityCls(s: Risk["severity"]): string {
  switch (s) {
    case "high":
      return "text-[var(--danger)] border-[var(--danger)]/30 bg-[var(--danger)]/5";
    case "med":
      return "text-amber-400 border-amber-500/30 bg-amber-500/5";
    default:
      return "text-ink-muted border-strong bg-surface/50";
  }
}

function severityLabel(s: Risk["severity"], r: ReportDict): string {
  if (s === "high") return r.risk_high;
  if (s === "med") return r.risk_med;
  return r.risk_low;
}

function RiskCard({ risk, r }: { risk: Risk; r: ReportDict }) {
  return (
    <div className={`p-4 rounded-lg border ${severityCls(risk.severity)}`}>
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider">{severityLabel(risk.severity, r)}</span>
      </div>
      <p className="text-sm text-ink leading-relaxed">{risk.risk}</p>
      <p className="mt-3 text-xs text-ink-muted leading-relaxed">
        <span className="font-mono text-ink-dim">{r.risk_mitigation_label} </span>
        {risk.mitigation}
      </p>
    </div>
  );
}

function SourceBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`text-[11px] font-mono px-2.5 py-1 rounded-full border ${
        ok
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-strong bg-surface text-ink-dim"
      }`}
    >
      {ok ? "✓" : "○"} {label}
    </span>
  );
}

function ForecastBlock({
  f,
  r,
}: {
  f: NonNullable<DeepAnalysisReport["revenue_forecast"]>;
  r: ReportDict;
}) {
  const scenarioLabel = (k: string) =>
    k === "conservative"
      ? r.forecast_scenario_conservative
      : k === "aggressive"
        ? r.forecast_scenario_aggressive
        : r.forecast_scenario_base;
  const dollarFmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(0)}k`
        : `$${n.toLocaleString()}`;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label={r.forecast_tam} value={dollarFmt(f.tam_usd_annual)} />
        <StatCard label={r.forecast_sam} value={dollarFmt(f.sam_usd_annual)} />
        <StatCard label={r.forecast_som} value={dollarFmt(f.som_usd_annual_year1)} />
      </div>
      <div className="rounded-xl border border-strong bg-surface overflow-hidden">
        <table className="w-full text-xs">
          <thead className="text-[10px] font-mono uppercase tracking-wider text-ink-dim bg-surface-2/50">
            <tr>
              <th className="text-left p-3">{r.forecast_scenario}</th>
              <th className="text-right p-3">{r.forecast_signups}</th>
              <th className="text-right p-3">{r.forecast_paid}</th>
              <th className="text-right p-3">{r.forecast_arpu}</th>
              <th className="text-right p-3">{r.forecast_arr}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {f.scenarios.map((s) => (
              <tr key={s.label}>
                <td className="p-3 text-ink">{scenarioLabel(s.label)}</td>
                <td className="p-3 text-right font-mono text-ink-muted">{s.monthly_signups.toLocaleString()}</td>
                <td className="p-3 text-right font-mono text-ink-muted">{s.paid_conversions.toLocaleString()}</td>
                <td className="p-3 text-right font-mono text-ink-muted">${s.arpu_usd_annual}</td>
                <td className="p-3 text-right font-mono text-accent">{dollarFmt(s.arr_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {f.assumptions.length > 0 && (
        <div>
          <p className="text-xs font-mono text-ink-dim mb-2">{r.forecast_assumptions}</p>
          <ul className="space-y-1 text-xs text-ink-muted">
            {f.assumptions.map((a, i) => (
              <li key={i} className="font-mono">· {a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
