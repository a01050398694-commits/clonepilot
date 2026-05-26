import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import {
  ArrowUpRight,
  TerminalWindow,
  GithubLogo,
} from "@phosphor-icons/react/dist/ssr";
import { WaitlistForm } from "./WaitlistForm";
import { HeroSection } from "@/components/HeroSection";
import { HeroEm, HeroCode, PriceEm } from "@/components/HeroAtoms";
import { SiteNav, SiteFooter } from "@/components/SiteChrome";
import { UsViralGallery, type ViralVideo } from "@/components/UsViralGallery";
import { getLang } from "@/lib/lang";
import { t, type Dict } from "@/lib/i18n";

function loadViralVideos(): ViralVideo[] {
  const file = path.join(process.cwd(), "public", "us-viral-videos.json");
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as ViralVideo[];
  } catch {
    return [];
  }
}

function HeroText({ d, reportsShipped }: { d: Dict; reportsShipped: number }) {
  return (
    <>
      <div
        className="inline-flex items-center gap-2 rounded-full border bg-surface px-3.5 py-1.5 text-[11px] font-mono uppercase tracking-[0.18em]"
        style={{
          borderColor: "color-mix(in oklab, var(--brand) 35%, var(--border-strong))",
          color: "var(--brand)",
        }}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full breathe" style={{ background: "var(--brand)" }} />
        {d.hero.badge}
      </div>

      <h1 className="mt-7 text-[56px] md:text-[88px] leading-[0.95] tracking-tightest font-semibold text-ink">
        {d.hero.titleRich(HeroEm)}
      </h1>

      <p className="mt-7 max-w-[64ch] text-[18px] md:text-[20px] leading-relaxed text-ink-muted mx-auto">
        {d.hero.subtitle}
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/install"
          className="group inline-flex h-11 items-center gap-2 rounded-lg border border-strong px-4 text-sm font-medium text-ink hover:border-bright hover:bg-surface transition"
        >
          <TerminalWindow size={16} weight="duotone" />
          {d.hero.cta_install}
        </Link>
        <Link
          href="#gallery"
          className="group inline-flex h-11 items-center gap-2 rounded-lg border border-strong px-4 text-sm font-medium text-ink-muted hover:text-ink hover:border-bright transition"
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
          className="group inline-flex h-11 items-center gap-2 rounded-lg border border-strong px-4 text-sm font-medium text-ink-muted hover:text-ink hover:border-bright transition"
        >
          <GithubLogo size={16} weight="duotone" />
          {d.hero.cta_github}
        </a>
      </div>
    </>
  );
}

export default async function Page() {
  const lang = await getLang();
  const d = t(lang);
  const viralVideos = loadViralVideos();

  return (
    <div className="min-h-[100dvh]">
      <SiteNav lang={lang} d={d} />

      <HeroSection
        formDict={d.analyze_form}
        lang={lang}
        heroSlot={<HeroText d={d} reportsShipped={viralVideos.length} />}
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

      {/* ─── US VIRAL BUSINESS VIDEOS — slider ─── */}
      <section id="gallery" className="border-t border-strong">
        <div className="mx-auto max-w-[1240px] px-6 py-24">
          <div className="flex items-end justify-between mb-10 gap-6 flex-wrap relative">
            <div>
              <p
                className="text-[11px] font-mono uppercase tracking-[0.18em]"
                style={{ color: "var(--brand)" }}
              >
                Portfolio · 30 US viral business videos
              </p>
              <h2 className="mt-3 text-3xl md:text-5xl font-semibold tracking-tightest text-ink leading-[1.05] max-w-[24ch]">
                Pick any one — see it reverse-engineered in 60 seconds
              </h2>
              <p className="mt-4 max-w-[60ch] text-[16px] text-ink-muted leading-relaxed">
                Every video below crossed 1M views on a US business or
                indie-hacker channel — Joe Rogan x Naval, Y Combinator, Alex
                Hormozi, Iman Gadzhi, Hamza, Graham Stephan. Hit{" "}
                <span style={{ color: "var(--brand)" }}>Analyze</span> and
                ClonePilot rips the business open
              </p>
            </div>
          </div>

          {viralVideos.length === 0 ? (
            <div className="border border-dashed border-strong p-10 text-center" style={{ borderRadius: 8 }}>
              <p className="text-ink-muted">No videos cached yet</p>
            </div>
          ) : (
            <UsViralGallery videos={viralVideos} />
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
