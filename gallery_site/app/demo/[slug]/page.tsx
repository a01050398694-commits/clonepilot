import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReportViewer } from "./ReportViewer";
import { loadReport, listReportSlugs } from "@/lib/report.server";

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

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function loadGallery(): Entry[] {
  const file = path.join(process.cwd(), "public", "gallery.json");
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8")).entries ?? [];
}

function findEntry(slug: string): Entry | undefined {
  return loadGallery().find(
    (e) => e.ok && e.name && slugify(e.name) === slug,
  );
}

function videoId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export async function generateStaticParams() {
  const fromGallery = loadGallery()
    .filter((e) => e.ok && e.name)
    .map((e) => ({ slug: slugify(e.name!) }));
  const fromReports = listReportSlugs().map((slug) => ({ slug }));
  const seen = new Set<string>();
  const merged: { slug: string }[] = [];
  for (const x of [...fromReports, ...fromGallery]) {
    if (seen.has(x.slug)) continue;
    seen.add(x.slug);
    merged.push(x);
  }
  return merged;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const report = loadReport(slug);
  if (report) {
    return {
      title: `${report.blueprint.name} — deep analysis · ClonePilot`,
      description: report.blueprint.tagline,
    };
  }
  const e = findEntry(slug);
  if (!e) return { title: "Demo not found — ClonePilot" };
  return {
    title: `${e.name} — built from YouTube in ${e.elapsed_sec?.toFixed(0)}s · ClonePilot`,
    description: e.tagline,
  };
}

function buildRoadmap(e: Entry): { step: string; tool: string }[] {
  const steps: { step: string; tool: string }[] = [
    {
      step: `Fetch the YouTube transcript for "${e.name}" using Supadata + youtube-transcript-api fallback.`,
      tool: "analyze()",
    },
    {
      step: `Call Claude Sonnet with the transcript and structured tool_use to extract a BusinessBlueprint (name, target, problem, solution, pricing tiers, marketing channels).`,
      tool: "analyze()",
    },
  ];
  if (e.tiers && e.tiers.length > 0) {
    steps.push({
      step: `Create Stripe Products + Prices + Payment Links for each paid tier (${e.tiers
        .filter((t) => t.price_usd > 0)
        .map((t) => `${t.name} $${t.price_usd}`)
        .join(", ")}). Falls back to PREVIEW links if Stripe key absent.`,
      tool: "monetize()",
    });
  }
  steps.push({
    step: `Generate a Next.js 15 + Tailwind landing page tailored to ${e.target ?? "the target audience"}. Pricing tiers, hero, features, FAQ — all derived from the blueprint.`,
    tool: "scaffold()",
  });
  steps.push({
    step: `Bake Stripe Buy buttons into pricing tiers + an email-capture form wired to Resend.`,
    tool: "scaffold()",
  });
  steps.push({
    step: `Generate app/icon.svg as a deterministic SVG favicon (brand initial on a hash-derived hue) — no console 404.`,
    tool: "scaffold()",
  });
  steps.push({
    step: `Deploy to Vercel via REST API. Auto-disable Vercel SSO protection (so demo URLs work publicly). Push env vars for Resend before first deploy. Poll until READY.`,
    tool: "deploy()",
  });
  steps.push({
    step: `Generate marketing kit — X thread (≤280 chars per tweet), Show HN post, Reddit r/sideproject post, Product Hunt tagline, LinkedIn post, 4 ad creatives.`,
    tool: "marketing_kit()",
  });
  steps.push({
    step: `(Optional) attach_domain(project, "yourdomain.com") if you want a vanity URL.`,
    tool: "attach_domain()",
  });
  return steps;
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const report = loadReport(slug);
  if (report) {
    return <ReportViewer report={report} />;
  }

  const e = findEntry(slug);
  if (!e) notFound();

  const vid = videoId(e.video_url);
  const thumb = vid ? `https://i.ytimg.com/vi/${vid}/maxresdefault.jpg` : null;
  const roadmap = buildRoadmap(e);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <nav className="mb-12 text-xs font-mono">
        <Link href="/" className="text-zinc-500 hover:text-cyan-400">
          ← gallery
        </Link>
      </nav>

      <header className="mb-12">
        <p className="text-cyan-400 font-mono text-xs uppercase tracking-wider mb-3">
          Built from a YouTube URL · {e.elapsed_sec?.toFixed(0)}s · v0 landing-only
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          {e.name}
        </h1>
        <p className="mt-3 text-zinc-400 text-lg">{e.tagline}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          {e.live_url && (
            <a
              href={`${e.live_url}?utm_source=demo&utm_medium=detail`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-md bg-cyan-400 text-zinc-950 font-semibold hover:bg-cyan-300 transition"
            >
              Open live demo →
            </a>
          )}
          <a
            href={e.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-md border border-zinc-700 hover:border-cyan-400 transition text-sm"
          >
            ▶ Source YouTube video
          </a>
          <Link
            href="/install"
            className="px-5 py-2.5 rounded-md border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 transition text-sm"
          >
            Run this in MY Claude Code
          </Link>
        </div>
      </header>

      {thumb && (
        <div className="mb-12 rounded-xl overflow-hidden border border-zinc-800 aspect-video bg-zinc-950">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt={e.name!} className="w-full h-full object-cover" />
        </div>
      )}

      <section className="mb-12">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4">
          📊 Business analysis (free)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Target audience" value={e.target} />
          <Field label="Pricing model" value={e.pricing_model} mono />
          {e.tiers?.map((t) => (
            <div
              key={t.name}
              className="p-4 rounded-lg border border-zinc-800 bg-zinc-950"
            >
              <div className="flex justify-between items-baseline">
                <span className="font-semibold">{t.name}</span>
                <span className="font-mono text-cyan-300">
                  {t.price_usd > 0 ? `$${t.price_usd}` : "free"}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-zinc-400">
                {t.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4">
          🛠 Execution roadmap (free) — Claude will run these in order
        </h2>
        <ol className="space-y-3">
          {roadmap.map((step, i) => (
            <li
              key={i}
              className="flex gap-4 p-4 rounded-lg border border-zinc-800 bg-zinc-950"
            >
              <span className="text-cyan-400 font-mono text-sm flex-shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <p className="text-sm leading-relaxed text-zinc-300">
                  {step.step}
                </p>
                <p className="mt-2 text-[10px] font-mono text-zinc-600 uppercase">
                  {step.tool}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="p-7 rounded-xl border border-cyan-500/40 bg-cyan-500/5">
        <p className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
          ▶ Run this in YOUR Claude Code
        </p>
        <h2 className="text-2xl font-bold">
          Want a clone of YOUR favorite business video?
        </h2>
        <p className="mt-3 text-zinc-300 text-sm leading-relaxed">
          Install ClonePilot once. Paste a YouTube URL in Claude. Get a live
          site like this one in 2 minutes. Free tier: 1 build/month.
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

      <footer className="mt-16 pt-8 border-t border-zinc-900 text-xs text-zinc-600 font-mono flex flex-wrap gap-4 justify-center">
        <Link href="/" className="hover:text-cyan-400">gallery</Link>
        <Link href="/install" className="hover:text-cyan-400">install</Link>
        <Link href="/pricing" className="hover:text-cyan-400">pricing</Link>
        <a href="https://github.com/a01050398694-commits/clonepilot" className="hover:text-cyan-400">github</a>
      </footer>
    </main>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | undefined;
  mono?: boolean;
}) {
  return (
    <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-950">
      <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-2 text-sm text-zinc-300 ${mono ? "font-mono text-cyan-300" : ""}`}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}
