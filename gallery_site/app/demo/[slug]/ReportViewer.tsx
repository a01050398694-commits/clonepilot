"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  type DeepAnalysisReport,
  type Lang,
  type Risk,
  pickLocale,
  severityClass,
  SUPPORTED_LANGS,
} from "@/lib/report";
import { LangToggle } from "@/components/LangToggle";
import { RevenueChart } from "@/components/RevenueChart";

const TREND_COPY: Record<string, string> = {
  rising: "↑ Rising",
  stable: "→ Stable",
  declining: "↓ Declining",
  unknown: "? Unknown",
};

export function ReportViewer({ report }: { report: DeepAnalysisReport }) {
  const available = useMemo(
    () =>
      SUPPORTED_LANGS.filter(
        (l) => report.i18n.locales[l] !== undefined,
      ),
    [report],
  );
  const [lang, setLang] = useState<Lang>(report.i18n.default_lang);
  const locale = pickLocale(report, lang);
  const bp = report.blueprint;
  const v = report.source;
  const thumb = `https://i.ytimg.com/vi/${v.video_id}/maxresdefault.jpg`;
  const dq = report.data_quality;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <nav className="mb-8 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-xs font-mono text-zinc-500 hover:text-cyan-400"
        >
          ← gallery
        </Link>
        <LangToggle
          current={lang}
          available={available}
          onChange={setLang}
        />
      </nav>

      <header className="mb-10">
        <p className="text-cyan-400 font-mono text-xs uppercase tracking-wider mb-3">
          Deep analysis · v1 · confidence {dq.confidence_0_100}/100
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {bp.name}
        </h1>
        <p className="mt-3 text-zinc-300 text-lg leading-relaxed max-w-3xl">
          {locale?.tagline ?? bp.tagline}
        </p>
        {locale?.hero && (
          <p className="mt-4 text-zinc-400 leading-relaxed max-w-3xl">
            {locale.hero}
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/install"
            className="px-5 py-2.5 rounded-md bg-cyan-400 text-zinc-950 font-semibold hover:bg-cyan-300 transition text-sm"
          >
            {locale?.cta ?? "Run this in MY Claude Code"} →
          </Link>
          <a
            href={v.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-md border border-zinc-700 hover:border-cyan-400 transition text-sm"
          >
            ▶ Source video
          </a>
        </div>
      </header>

      <section className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt={v.title} className="w-full aspect-video object-cover" />
          <div className="p-3">
            <p className="text-xs text-zinc-400 line-clamp-2">{v.title}</p>
            <p className="mt-1 text-[10px] font-mono text-zinc-600">
              {v.channel} · {Math.round(v.duration_sec / 60)} min · {v.transcript_chars.toLocaleString()} chars
            </p>
          </div>
        </div>
        <div className="md:col-span-2 grid grid-cols-1 gap-3">
          <InfoRow label="Target" value={bp.target_audience} />
          <InfoRow label="Problem" value={bp.problem} />
          <InfoRow label="Solution" value={bp.solution} />
        </div>
      </section>

      {locale?.value_props && (
        <section className="mb-10">
          <SectionLabel>Value props</SectionLabel>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {locale.value_props.map((vp, i) => (
              <li
                key={i}
                className="p-4 rounded-lg border border-zinc-800 bg-zinc-950 text-sm text-zinc-300 leading-relaxed"
              >
                <span className="text-cyan-400 font-mono mr-2">{String(i + 1).padStart(2, "0")}</span>
                {vp}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-10">
        <SectionLabel>Pricing tiers extracted</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {bp.pricing_tiers.map((t) => (
            <div
              key={t.name}
              className="p-4 rounded-lg border border-zinc-800 bg-zinc-950"
            >
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-semibold">{t.name}</span>
                <span className="font-mono text-cyan-300">
                  {t.price_usd > 0 ? `$${t.price_usd}` : "free"}
                </span>
              </div>
              <ul className="space-y-1 text-xs text-zinc-400">
                {t.features.slice(0, 5).map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionLabel>Revenue forecast</SectionLabel>
        <RevenueChart
          forecast={report.revenue_forecast}
          emptyHint="Set AHREFS_API_KEY in your .env to unlock TAM/SAM/SOM + 3-scenario ARR. (Trend score alone isn't enough signal — needs search-volume + CPC.)"
        />
      </section>

      <section className="mb-10">
        <SectionLabel>Competitors</SectionLabel>
        {report.competitors.length === 0 ? (
          <p className="text-sm text-zinc-500 p-4 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50">
            No competitors fetched. Set <code className="font-mono text-cyan-300">EXA_API_KEY</code> in your .env to scan for 5-8 closest competitors automatically.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.competitors.map((c) => (
              <a
                key={c.url}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-lg border border-zinc-800 bg-zinc-950 hover:border-cyan-400 transition"
              >
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold">{c.name}</span>
                  {c.estimated_traffic != null && (
                    <span className="text-[10px] font-mono text-zinc-500">
                      ~{c.estimated_traffic.toLocaleString()}/mo
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{c.positioning}</p>
                <p className="mt-2 text-[10px] font-mono text-cyan-300">{c.pricing_summary}</p>
              </a>
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <SectionLabel>Market trend</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard
            label="5-year trend"
            value={TREND_COPY[report.market.five_year_trend] ?? "—"}
          />
          <StatCard
            label="Trend score"
            value={`${report.market.trend_score_0_100}/100`}
          />
          <StatCard
            label="Global searches/mo"
            value={
              report.market.global_monthly_searches != null
                ? report.market.global_monthly_searches.toLocaleString()
                : "—"
            }
          />
        </div>
        <p className="mt-3 text-xs text-zinc-600 font-mono">
          seed keyword: <span className="text-cyan-400">{report.market.category_keyword_seed}</span> · sources: {report.market.data_sources.join(", ")}
        </p>
        {report.market.top_keywords.length > 0 && (
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 bg-zinc-900/50">
                <tr>
                  <th className="text-left p-3">Keyword</th>
                  <th className="text-right p-3">Searches</th>
                  <th className="text-right p-3">CPC</th>
                  <th className="text-right p-3">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {report.market.top_keywords.slice(0, 10).map((k) => (
                  <tr key={k.keyword}>
                    <td className="p-3 text-zinc-300">{k.keyword}</td>
                    <td className="p-3 text-right font-mono text-cyan-300">{k.monthly_searches?.toLocaleString() ?? "—"}</td>
                    <td className="p-3 text-right font-mono text-zinc-400">{k.cpc_usd != null ? `$${k.cpc_usd.toFixed(2)}` : "—"}</td>
                    <td className="p-3 text-right font-mono text-zinc-400">{k.difficulty ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-10">
        <SectionLabel>SEO starter pack</SectionLabel>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs font-mono text-zinc-500 mb-2">primary keyword</p>
          <p className="font-mono text-cyan-300 mb-4">{report.seo_starter_pack.primary_keyword}</p>
          <p className="text-xs font-mono text-zinc-500 mb-2">suggested titles</p>
          <ul className="space-y-1 text-sm text-zinc-300 mb-4">
            {report.seo_starter_pack.suggested_titles.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
          <p className="text-xs font-mono text-zinc-500 mb-2">meta description</p>
          <p className="text-sm text-zinc-400 leading-relaxed mb-4">{report.seo_starter_pack.suggested_meta_description}</p>
          <p className="text-xs font-mono text-zinc-500 mb-2">domain ideas</p>
          <div className="flex flex-wrap gap-2">
            {report.seo_starter_pack.domain_suggestions.map((d) => (
              <span
                key={d}
                className="text-[11px] font-mono px-2 py-1 rounded bg-zinc-900 text-cyan-300"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <SectionLabel>Risks ({report.risks.length})</SectionLabel>
        <div className="space-y-3">
          {report.risks.map((r, i) => (
            <RiskCard key={i} risk={r} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <SectionLabel>90-day go-to-market</SectionLabel>
        <ol className="space-y-3">
          {report.go_to_market_90day.map((step, i) => (
            <li
              key={i}
              className="flex gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-950"
            >
              <div className="flex-shrink-0 w-16 text-center">
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">day</p>
                <p className="text-2xl font-bold font-mono text-cyan-400">{step.day}</p>
              </div>
              <p className="flex-1 text-sm text-zinc-300 leading-relaxed">{step.action}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-10">
        <SectionLabel>Data quality</SectionLabel>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex flex-wrap gap-2 mb-4">
            <SourceBadge ok={dq.trends_called} label="Google Trends" />
            <SourceBadge ok={dq.ahrefs_called} label="Ahrefs" />
            <SourceBadge ok={dq.similarweb_called} label="SimilarWeb" />
            <SourceBadge ok={dq.exa_called} label="Exa" />
            <SourceBadge ok={dq.youtube_data_called} label="YouTube Data" />
          </div>
          {dq.fallbacks_used.length > 0 && (
            <>
              <p className="text-xs font-mono text-zinc-500 mb-2">fallbacks used</p>
              <ul className="space-y-1 text-xs text-zinc-400">
                {dq.fallbacks_used.map((f, i) => (
                  <li key={i} className="font-mono">· {f}</li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-4 text-xs text-zinc-600">
            Confidence reflects how many data sources contributed. Add API keys to your .env to raise it toward 100.
          </p>
        </div>
      </section>

      <section className="p-7 rounded-xl border border-cyan-500/40 bg-cyan-500/5 mb-10">
        <p className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
          ▶ Build your own
        </p>
        <h2 className="text-2xl font-bold">
          Want a deep report like this for your favorite video?
        </h2>
        <p className="mt-3 text-zinc-300 text-sm leading-relaxed">
          ClonePilot ships an <code className="font-mono text-cyan-300">analyze_deep</code> MCP tool. Drop it in Claude Code, paste a YouTube URL, get this report + a deployed Next.js site.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/install"
            className="px-5 py-2.5 rounded-md bg-cyan-400 text-zinc-950 font-semibold hover:bg-cyan-300 transition"
          >
            Install free →
          </Link>
          <Link
            href="/pricing"
            className="px-5 py-2.5 rounded-md border border-zinc-700 hover:border-cyan-400 transition text-sm"
          >
            See Pro pricing
          </Link>
        </div>
      </section>

      <footer className="pt-8 border-t border-zinc-900 text-xs text-zinc-600 font-mono flex flex-wrap gap-4 justify-center">
        <Link href="/" className="hover:text-cyan-400">gallery</Link>
        <Link href="/install" className="hover:text-cyan-400">install</Link>
        <Link href="/pricing" className="hover:text-cyan-400">pricing</Link>
        <a href="https://github.com/a01050398694-commits/clonepilot" className="hover:text-cyan-400">github</a>
      </footer>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4">
      {children}
    </h2>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950">
      <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950">
      <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold font-mono text-cyan-300">{value}</p>
    </div>
  );
}

function RiskCard({ risk }: { risk: Risk }) {
  const cls = severityClass(risk.severity);
  return (
    <div className={`p-4 rounded-lg border ${cls}`}>
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider">{risk.severity}</span>
      </div>
      <p className="text-sm text-zinc-200 leading-relaxed">{risk.risk}</p>
      <p className="mt-3 text-xs text-zinc-400 leading-relaxed">
        <span className="font-mono text-zinc-500">↳ mitigation: </span>
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
          ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
          : "border-zinc-800 bg-zinc-950 text-zinc-600"
      }`}
    >
      {ok ? "✓" : "○"} {label}
    </span>
  );
}
