import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import {
  ArrowUpRight,
  ChartLineUp,
  TerminalWindow,
  GithubLogo,
} from "@phosphor-icons/react/dist/ssr";
import { WaitlistForm } from "./WaitlistForm";
import { HeroSection } from "@/components/HeroSection";
import { HeroEm, HeroCode, PriceEm } from "@/components/HeroAtoms";
import { SiteNav, SiteFooter } from "@/components/SiteChrome";
import { listReportSlugs, loadReport } from "@/lib/report.server";
import { getLang } from "@/lib/lang";
import { t, LANG_HTML, type Dict } from "@/lib/i18n";

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

function HeroText({ d, reportsShipped }: { d: Dict; reportsShipped: number }) {
  return (
    <>
      <div className="inline-flex items-center gap-2 rounded-full border border-strong bg-surface px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-ink-muted">
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--brand)" }} />
        {d.hero.badge}
      </div>

      <h1 className="mt-6 text-[44px] md:text-[64px] leading-[1.02] tracking-tightish font-semibold text-ink">
        {d.hero.titleRich(HeroEm)}
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
        <Stat label={d.hero.stat_reports_label} value={String(reportsShipped)} />
        <Stat label={d.hero.stat_languages_label} value="5" />
        <Stat
          label={d.hero.stat_build_time_label}
          value={d.hero.stat_build_time_value}
          accent="emerald"
        />
      </dl>
    </>
  );
}

export default async function Page() {
  const lang = await getLang();
  const d = t(lang);
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
      <SiteNav lang={lang} d={d} />

      <HeroSection
        formDict={d.analyze_form}
        lang={lang}
        heroSlot={<HeroText d={d} reportsShipped={v1Previews.size} />}
        skipQueueSlot={d.hero.skip_queueRich(HeroCode)}
      />

      {/* ─── HOW IT WORKS ─── */}
      <section className="border-t border-strong">
        <div className="mx-auto max-w-[1240px] px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-[0.4fr_1fr] gap-10">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-muted">
                {d.how.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tightish">
                {d.how.title}
              </h2>
            </div>
            <ol className="divide-y divide-[var(--border)] border-y border-strong">
              {d.how.steps.map((s, i) => (
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
                {d.gallery.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tightish">
                {d.gallery.title}
              </h2>
            </div>
            <p className="text-xs text-ink-dim font-mono">
              {d.gallery.updated}{" "}
              {new Date(gallery.updated_at).toLocaleString(LANG_HTML[lang], {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {ok.length === 0 ? (
            <EmptyGallery d={d} />
          ) : (
            <BentoGallery
              entries={ok}
              v1Slugs={v1Slugs}
              v1Previews={v1Previews}
              d={d}
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
                {d.waitlist.eyebrow}
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tightish">
                {d.waitlist.title}
              </h2>
            </div>
            <div>
              <p className="text-[15px] text-ink-muted leading-relaxed max-w-[58ch]">
                {d.waitlist.bodyRich(PriceEm)}
              </p>
              <div className="mt-7 max-w-[520px]">
                <WaitlistForm d={d.waitlist_form} />
              </div>
              <p className="mt-3 text-xs text-ink-dim">
                {d.waitlist.pricing_hint_prefix}{" "}
                <Link
                  href="/pricing#waitlist"
                  className="text-ink-muted hover:text-accent underline underline-offset-2 decoration-[var(--border-strong)]"
                >
                  {d.waitlist.pricing_hint_link}
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter d={d} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

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

function EmptyGallery({ d }: { d: Dict }) {
  return (
    <div className="rounded-2xl border border-dashed border-strong bg-surface p-10 text-center">
      <p className="text-ink-muted">{d.gallery.empty}</p>
    </div>
  );
}

function BentoGallery({
  entries,
  v1Slugs,
  v1Previews,
  d,
}: {
  entries: Entry[];
  v1Slugs: Set<string>;
  v1Previews: Map<string, V1Preview>;
  d: Dict;
}) {
  const featured = entries.find((e) => v1Slugs.has(slugify(e.name!)));
  const rest = entries.filter((e) => e !== featured);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {featured && (
        <FeaturedReportCard
          entry={featured}
          preview={v1Previews.get(slugify(featured.name!))!}
          d={d}
        />
      )}
      {rest.map((e) => (
        <ReportCard
          key={e.live_url}
          entry={e}
          isV1={v1Slugs.has(slugify(e.name!))}
          preview={v1Previews.get(slugify(e.name!)) ?? null}
          d={d}
        />
      ))}
    </div>
  );
}

function FeaturedReportCard({
  entry,
  preview,
  d,
}: {
  entry: Entry;
  preview: V1Preview;
  d: Dict;
}) {
  const vid = videoIdFromUrl(entry.video_url);
  const thumb = vid ? `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg` : null;
  const slug = slugify(entry.name!);

  return (
    <article className="group lg:col-span-2 lg:row-span-2 relative rounded-2xl border border-strong bg-surface overflow-hidden flex flex-col hover:border-accent/30 transition shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)]">
      <span className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-accent/15 text-accent border border-accent/30 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.15em]">
        <ChartLineUp size={11} weight="bold" />
        {d.gallery.badge_full}
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
            label={d.gallery.confidence_label}
            value={`${preview.confidence}/100`}
          />
          <MiniStat label={d.gallery.trend_label} value={preview.trendArrow} />
          <MiniStat
            label={d.gallery.languages_label}
            value="5"
          />
        </div>

        {preview.firstHighRisk && (
          <p className="mt-5 text-xs text-[var(--danger)]/90 leading-relaxed">
            <span className="font-mono uppercase tracking-[0.15em] text-[var(--danger)] mr-2">
              {d.gallery.top_risk_label}
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
            {d.gallery.open_report}
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
  d,
}: {
  entry: Entry;
  isV1: boolean;
  preview: V1Preview | null;
  d: Dict;
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
            {d.gallery.badge_full}
          </>
        ) : (
          <>{d.gallery.badge_landing}</>
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
            <MiniStat label={d.gallery.confidence_label} value={`${preview.confidence}/100`} />
            <MiniStat label={d.gallery.trend_label} value={preview.trendArrow} />
          </div>
        </div>
      ) : (
        <div className="px-5 pb-4 mt-auto">
          <p className="text-[11px] text-ink-dim font-mono">{d.gallery.v0_note}</p>
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
          {isV1 ? d.gallery.open_report : d.gallery.open_demo}
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
