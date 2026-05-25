import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import {
  ArrowUpRight,
  GithubLogo,
  TerminalWindow,
  ChartLineUp,
  Lightning,
} from "@phosphor-icons/react/dist/ssr";
import { WaitlistForm } from "./WaitlistForm";
import { UrlAnalysisForm } from "@/components/UrlAnalysisForm";
import { listReportSlugs, loadReport } from "@/lib/report.server";

export const dynamic = "force-static";
export const revalidate = 60;

type Tier = { name: string; price_usd: number; features: string[] };
type Entry = {
  ok: boolean;
  video_url: string;
  name?: string;
  tagline?: string;
  target?: string;
  pricing_model?: string;
  tiers?: Tier[];
  live_url?: string;
  elapsed_sec?: number;
  generated_at?: string;
};

type Gallery = {
  updated_at: string;
  ok_count: number;
  fail_count: number;
  entries: Entry[];
};

function loadGallery(): Gallery {
  const file = path.join(process.cwd(), "public", "gallery.json");
  if (!fs.existsSync(file)) {
    return {
      updated_at: new Date().toISOString(),
      ok_count: 0,
      fail_count: 0,
      entries: [],
    };
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function videoIdFromUrl(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

type V1Preview = {
  confidence: number;
  firstHighRisk: string | null;
  trendArrow: string;
};

function buildV1Preview(slug: string): V1Preview | null {
  const r = loadReport(slug);
  if (!r) return null;
  const high = r.risks.find((x) => x.severity === "high");
  const arrow =
    r.market.five_year_trend === "rising"
      ? "↑"
      : r.market.five_year_trend === "declining"
        ? "↓"
        : r.market.five_year_trend === "stable"
          ? "→"
          : "—";
  return {
    confidence: r.data_quality.confidence_0_100,
    firstHighRisk: high?.risk.split("—")[0].trim() ?? null,
    trendArrow: arrow,
  };
}

export default function Page() {
  const gallery = loadGallery();
  const ok = gallery.entries.filter((e) => e.ok && e.live_url && e.name);
  const v1Slugs = new Set(listReportSlugs());
  const v1Previews = new Map<string, V1Preview>();
  for (const slug of v1Slugs) {
    const p = buildV1Preview(slug);
    if (p) v1Previews.set(slug, p);
  }

  return (
    <div className="min-h-[100dvh]">
      <SiteNav />

      {/* ─── HERO ─── */}
      <section className="mx-auto max-w-[1240px] px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-strong bg-surface px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-ink-muted">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              Open-source MCP — v0.1
            </div>

            <h1 className="mt-6 text-[44px] md:text-[64px] leading-[1.02] tracking-tightish font-semibold text-ink">
              YouTube business video,
              <br />
              <span className="text-ink-muted">in.</span>{" "}
              <span className="text-accent">Deployed site,</span> out.
            </h1>

            <p className="mt-7 max-w-[58ch] text-[17px] leading-relaxed text-ink-muted">
              ClonePilot is an open-source MCP for Claude Code, Cursor, and
              Codex. Paste any business video. Get a Next.js landing page,
              Stripe checkout, email capture, a deep market report in five
              languages, and a live Vercel URL.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/install"
                className="group inline-flex h-11 items-center gap-2 rounded-lg bg-ink text-bg px-4 text-sm font-semibold hover:bg-white active:translate-y-[1px] transition"
              >
                <TerminalWindow size={16} weight="duotone" />
                Install for free
              </Link>
              <Link
                href="#gallery"
                className="group inline-flex h-11 items-center gap-2 rounded-lg border border-strong px-4 text-sm font-medium text-ink hover:border-accent/40 hover:text-accent transition"
              >
                See live reports
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
                GitHub
              </a>
            </div>

            <dl className="mt-12 grid grid-cols-3 gap-px bg-[var(--border)] rounded-xl overflow-hidden border border-strong">
              <Stat label="Reports shipped" value={String(v1Previews.size)} />
              <Stat label="Languages" value="5" />
              <Stat
                label="Median build time"
                value="~2m"
                accent="emerald"
              />
            </dl>
          </div>

          <div className="lg:pt-2">
            <UrlAnalysisForm />
            <p className="mt-4 px-1 text-[11px] text-ink-dim leading-relaxed">
              Or skip the queue: install the MCP and run{" "}
              <code className="font-mono text-ink-muted">analyze_deep</code> in
              your own Claude Code right now.
            </p>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="border-t border-strong">
        <div className="mx-auto max-w-[1240px] px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-[0.4fr_1fr] gap-10">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-muted">
                How it works
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tightish">
                Three calls. One live site.
              </h2>
            </div>
            <ol className="divide-y divide-[var(--border)] border-y border-strong">
              {STEPS.map((s, i) => (
                <li
                  key={s.title}
                  className="grid grid-cols-[auto_1fr] gap-6 py-6"
                >
                  <span className="w-10 text-right font-mono text-ink-dim text-sm pt-1">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{s.title}</p>
                    <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ─── GALLERY ─── */}
      <section
        id="gallery"
        className="border-t border-strong"
      >
        <div className="mx-auto max-w-[1240px] px-6 py-20">
          <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-muted">
                Live reports
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tightish">
                Real videos. Real deep-analysis reports.
              </h2>
            </div>
            <p className="text-xs text-ink-dim font-mono">
              Updated{" "}
              {new Date(gallery.updated_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {ok.length === 0 ? (
            <EmptyGallery />
          ) : (
            <BentoGallery
              entries={ok}
              v1Slugs={v1Slugs}
              v1Previews={v1Previews}
            />
          )}
        </div>
      </section>

      {/* ─── WAITLIST ─── */}
      <section
        id="waitlist"
        className="border-t border-strong"
      >
        <div className="mx-auto max-w-[1240px] px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-[0.5fr_1fr] gap-10">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-muted">
                Pro launch
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tightish">
                Email me when Pro opens.
              </h2>
            </div>
            <div>
              <p className="text-[15px] text-ink-muted leading-relaxed max-w-[58ch]">
                The MCP is open-source and free today. Pro is the hosted
                convenience layer — all API keys server-side, unlimited
                builds, custom domains, deep-analysis with every integration
                enabled (Ahrefs, Exa, SimilarWeb), 5-language reports,
                priority queue. Early-bird: <span className="text-ink">$9/mo</span> or{" "}
                <span className="text-ink">$199 lifetime</span>.
              </p>
              <div className="mt-7 max-w-[520px]">
                <WaitlistForm />
              </div>
              <p className="mt-3 text-xs text-ink-dim">
                Want to pick a specific tier? See the full{" "}
                <Link
                  href="/pricing#waitlist"
                  className="text-ink-muted hover:text-accent underline underline-offset-2 decoration-[var(--border-strong)]"
                >
                  pricing page
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

const STEPS = [
  {
    title: "Drop a YouTube URL into Claude Code.",
    body: "Any business video — interview, founder demo, course landing. ClonePilot fetches the transcript via Supadata with a fallback chain.",
  },
  {
    title: "Claude calls analyze_deep — twelve sections, five languages.",
    body: "Blueprint, pricing tiers, market trend, competitors, SEO pack, six prioritized risks, 90-day GTM, and a confidence score that tells you which API keys to add for higher fidelity.",
  },
  {
    title: "scaffold + deploy hand back a live Vercel URL.",
    body: "Next.js 15, Tailwind, Stripe buy buttons, Resend lead capture, and an auto-generated SVG favicon. Median time end-to-end: under two minutes.",
  },
];

function SiteNav() {
  return (
    <header className="border-b border-strong/60 backdrop-blur-sm sticky top-0 z-30 bg-bg/85">
      <div className="mx-auto max-w-[1240px] h-14 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-accent/15 text-accent border border-accent/30">
            <Lightning size={13} weight="fill" />
          </span>
          <span className="text-[15px] font-semibold tracking-tightish text-ink group-hover:text-accent transition">
            ClonePilot
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/install"
            className="px-3 py-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface transition"
          >
            Install
          </Link>
          <Link
            href="/pricing"
            className="px-3 py-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface transition"
          >
            Pricing
          </Link>
          <Link
            href="#gallery"
            className="px-3 py-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface transition"
          >
            Reports
          </Link>
          <a
            href="https://github.com/a01050398694-commits/clonepilot"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center justify-center h-9 w-9 rounded-md border border-strong text-ink-muted hover:text-ink hover:border-strong transition"
            aria-label="GitHub"
          >
            <GithubLogo size={16} weight="duotone" />
          </a>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-strong/60">
      <div className="mx-auto max-w-[1240px] px-6 py-10 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 items-center">
        <p className="text-xs text-ink-dim font-mono">
          MIT-licensed · built with ClonePilot · operated from Seoul
        </p>
        <nav className="flex flex-wrap gap-5 text-xs text-ink-dim font-mono">
          <Link href="/" className="hover:text-ink transition">
            Reports
          </Link>
          <Link href="/install" className="hover:text-ink transition">
            Install
          </Link>
          <Link href="/pricing" className="hover:text-ink transition">
            Pricing
          </Link>
          <a
            href="https://github.com/a01050398694-commits/clonepilot"
            className="hover:text-ink transition"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
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

function EmptyGallery() {
  return (
    <div className="rounded-2xl border border-dashed border-strong bg-surface p-10 text-center">
      <p className="text-ink-muted">
        Reports are still generating. Refresh in a couple of minutes.
      </p>
    </div>
  );
}

function BentoGallery({
  entries,
  v1Slugs,
  v1Previews,
}: {
  entries: Entry[];
  v1Slugs: Set<string>;
  v1Previews: Map<string, V1Preview>;
}) {
  // Promote v1 entries to a featured slot. v0 entries fill the rest.
  const featured = entries.find((e) => v1Slugs.has(slugify(e.name!)));
  const rest = entries.filter((e) => e !== featured);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {featured && (
        <FeaturedReportCard
          entry={featured}
          preview={v1Previews.get(slugify(featured.name!))!}
        />
      )}
      {rest.map((e) => (
        <ReportCard
          key={e.live_url}
          entry={e}
          isV1={v1Slugs.has(slugify(e.name!))}
          preview={v1Previews.get(slugify(e.name!)) ?? null}
        />
      ))}
    </div>
  );
}

function FeaturedReportCard({
  entry,
  preview,
}: {
  entry: Entry;
  preview: V1Preview;
}) {
  const vid = videoIdFromUrl(entry.video_url);
  const thumb = vid ? `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg` : null;
  const slug = slugify(entry.name!);

  return (
    <article className="group lg:col-span-2 lg:row-span-2 relative rounded-2xl border border-strong bg-surface overflow-hidden flex flex-col hover:border-accent/30 transition shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]">
      <span className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-accent/15 text-accent border border-accent/30 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.15em]">
        <ChartLineUp size={11} weight="bold" />
        Full report
      </span>

      <Link href={`/demo/${slug}`} className="block relative">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={entry.name!}
            className="w-full aspect-[16/9] object-cover opacity-95 group-hover:opacity-100 transition"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent pointer-events-none" />
      </Link>

      <div className="p-7 flex-1 flex flex-col">
        <Link href={`/demo/${slug}`} className="block">
          <h3 className="text-2xl font-semibold tracking-tightish text-ink group-hover:text-accent transition">
            {entry.name}
          </h3>
          <p className="mt-2 text-[15px] text-ink-muted leading-relaxed line-clamp-2">
            {entry.tagline}
          </p>
        </Link>

        <div className="mt-5 grid grid-cols-3 gap-px bg-[var(--border)] rounded-lg overflow-hidden border border-strong">
          <MiniStat
            label="Confidence"
            value={`${preview.confidence}/100`}
          />
          <MiniStat label="5-yr trend" value={preview.trendArrow} />
          <MiniStat
            label="Languages"
            value="5"
          />
        </div>

        {preview.firstHighRisk && (
          <p className="mt-5 text-xs text-[var(--danger)]/90 leading-relaxed">
            <span className="font-mono uppercase tracking-[0.15em] text-[var(--danger)] mr-2">
              Top risk
            </span>
            {preview.firstHighRisk}
          </p>
        )}

        <div className="mt-auto pt-7 flex items-center justify-between gap-4">
          <a
            href={`${entry.live_url}?utm_source=gallery&utm_medium=featured`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-ink-dim hover:text-accent transition flex items-center gap-1"
          >
            {entry.live_url?.replace("https://", "")}
            <ArrowUpRight size={11} weight="bold" />
          </a>
          <Link
            href={`/demo/${slug}`}
            className="group/btn inline-flex h-10 items-center gap-1.5 rounded-lg bg-ink text-bg px-4 text-sm font-semibold hover:bg-white active:translate-y-[1px] transition"
          >
            Open report
            <ArrowUpRight
              size={13}
              weight="bold"
              className="transition group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
            />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ReportCard({
  entry,
  isV1,
  preview,
}: {
  entry: Entry;
  isV1: boolean;
  preview: V1Preview | null;
}) {
  const vid = videoIdFromUrl(entry.video_url);
  const thumb = vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : null;
  const slug = slugify(entry.name!);

  return (
    <article className="group relative rounded-2xl border border-strong bg-surface overflow-hidden flex flex-col hover:border-accent/30 transition">
      <span
        className={`absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.15em] ${
          isV1
            ? "bg-accent/15 text-accent border border-accent/30"
            : "bg-surface-2 text-ink-dim border border-strong"
        }`}
      >
        {isV1 ? (
          <>
            <ChartLineUp size={11} weight="bold" />
            Full report
          </>
        ) : (
          <>Landing only</>
        )}
      </span>

      <Link href={`/demo/${slug}`} className="block">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={entry.name!}
            className="w-full aspect-[16/9] object-cover opacity-90 group-hover:opacity-100 transition"
          />
        )}
        <div className="p-5">
          <h3 className="text-lg font-semibold tracking-tightish text-ink group-hover:text-accent transition">
            {entry.name}
          </h3>
          <p className="mt-1.5 text-sm text-ink-muted leading-relaxed line-clamp-2">
            {entry.tagline}
          </p>
        </div>
      </Link>

      {isV1 && preview ? (
        <div className="px-5 pb-4 mt-auto space-y-3">
          <div className="grid grid-cols-2 gap-px bg-[var(--border)] rounded-lg overflow-hidden border border-strong">
            <MiniStat label="Confidence" value={`${preview.confidence}/100`} />
            <MiniStat label="5-yr trend" value={preview.trendArrow} />
          </div>
        </div>
      ) : (
        <div className="px-5 pb-4 mt-auto">
          <p className="text-[11px] text-ink-dim font-mono">
            v0 landing only · no deep report yet
          </p>
        </div>
      )}

      <div className="px-5 pb-5 pt-1 flex items-center justify-between gap-3">
        <a
          href={`${entry.live_url}?utm_source=gallery&utm_medium=card`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-mono text-ink-dim hover:text-accent transition flex items-center gap-1 truncate"
        >
          <span className="truncate">
            {entry.live_url?.replace("https://", "")}
          </span>
          <ArrowUpRight size={11} weight="bold" className="flex-shrink-0" />
        </a>
        <Link
          href={`/demo/${slug}`}
          className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition active:translate-y-[1px] ${
            isV1
              ? "bg-accent text-bg hover:bg-accent-strong"
              : "bg-surface-2 text-ink hover:bg-[var(--border-strong)]"
          }`}
        >
          {isV1 ? "Open report" : "Open demo"}
          <ArrowUpRight size={12} weight="bold" />
        </Link>
      </div>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-ink-dim">
        {label}
      </p>
      <p className="mt-1 font-mono text-sm text-ink">{value}</p>
    </div>
  );
}
