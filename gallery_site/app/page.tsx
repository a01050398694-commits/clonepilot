import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import { WaitlistForm } from "./WaitlistForm";

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
    return { updated_at: new Date().toISOString(), ok_count: 0, fail_count: 0, entries: [] };
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function videoIdFromUrl(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export default function Page() {
  const gallery = loadGallery();
  const ok = gallery.entries.filter((e) => e.ok && e.live_url && e.name);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-14 max-w-3xl">
        <p className="text-cyan-400 font-mono text-xs uppercase tracking-wider mb-3">
          ClonePilot · MCP server · open source
        </p>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
          Paste a YouTube URL.{" "}
          <span className="text-cyan-400">Get a deployed clone</span> in 2 min.
        </h1>
        <p className="mt-6 text-zinc-400 text-lg leading-relaxed">
          ClonePilot is an MCP server. Drop it into Claude Code, Cursor, or
          Codex. Paste any business video URL. Get a Next.js landing page,
          Stripe checkout, email capture, marketing kit, and a live Vercel URL
          — without writing a line of code yourself.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link
            href="/install"
            className="px-5 py-2.5 rounded-full bg-cyan-400 text-zinc-950 font-semibold hover:bg-cyan-300 transition"
          >
            Install free →
          </Link>
          <Link
            href="/pricing"
            className="px-5 py-2.5 rounded-full border border-zinc-700 hover:border-cyan-400 transition"
          >
            See pricing
          </Link>
          <a
            href="https://github.com/a01050398694-commits/clonepilot"
            className="px-5 py-2.5 rounded-full border border-zinc-700 hover:border-cyan-400 transition"
          >
            GitHub →
          </a>
        </div>
        <p className="mt-5 text-xs text-zinc-500 font-mono">
          {gallery.ok_count} demos live · 1 free build/mo · Pro $19/mo
        </p>
      </header>

      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="text-2xl font-bold">Live gallery</h2>
        <p className="text-xs text-zinc-500 font-mono">
          updated{" "}
          {new Date(gallery.updated_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ok.length === 0 ? (
          <div className="col-span-full text-zinc-500 text-center py-24 border border-dashed border-zinc-800 rounded-lg">
            Demos are generating. Refresh in a couple of minutes.
          </div>
        ) : (
          ok.map((e) => <DemoCard key={e.live_url} entry={e} />)
        )}
      </section>

      <section id="waitlist" className="mt-24 max-w-2xl">
        <p className="text-xs font-mono uppercase tracking-wider text-cyan-400 mb-2">
          Pro launch · waitlist
        </p>
        <h2 className="text-3xl font-bold">
          Get notified when Pro / Lifetime opens
        </h2>
        <p className="mt-3 text-zinc-400 leading-relaxed">
          Sorting payment processor approvals in Korea. Drop your email and
          we&apos;ll send the moment checkout opens — early-bird pricing locked
          in ($9/mo Pro or $199 Lifetime). The MCP itself is open-source and
          works free today.
        </p>
        <div className="mt-6">
          <WaitlistForm />
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          Want to pick a specific tier? →{" "}
          <Link href="/pricing#waitlist" className="text-cyan-400 hover:underline">
            full pricing waitlist
          </Link>
        </p>
      </section>

      <footer className="mt-24 pt-8 border-t border-zinc-900 text-xs text-zinc-600 font-mono flex flex-wrap gap-4">
        <Link href="/" className="hover:text-cyan-400">gallery</Link>
        <Link href="/install" className="hover:text-cyan-400">install</Link>
        <Link href="/pricing" className="hover:text-cyan-400">pricing</Link>
        <a href="https://github.com/a01050398694-commits/clonepilot" className="hover:text-cyan-400">github</a>
        <span className="ml-auto">MIT · built with ClonePilot</span>
      </footer>
    </main>
  );
}

function DemoCard({ entry: e }: { entry: Entry }) {
  const vid = videoIdFromUrl(e.video_url);
  const thumb = vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : null;
  const slug = slugify(e.name!);
  const paidTiers = (e.tiers ?? []).filter((t) => t.price_usd > 0);

  return (
    <article className="rounded-xl border border-zinc-800 hover:border-cyan-400/60 transition overflow-hidden bg-zinc-950 flex flex-col">
      <Link href={`/demo/${slug}`} className="block">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={e.name!}
            className="w-full aspect-video object-cover opacity-90 hover:opacity-100 transition"
          />
        )}
        <div className="p-5">
          <h3 className="font-semibold text-lg">{e.name}</h3>
          <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{e.tagline}</p>
        </div>
      </Link>

      <div className="px-5 pb-3 space-y-3 text-xs flex-1">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">
            📊 Analysis
          </p>
          <p className="mt-1 text-zinc-400 line-clamp-2">
            {e.target ?? "—"}
          </p>
          {paidTiers.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {paidTiers.slice(0, 3).map((t) => (
                <span
                  key={t.name}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-cyan-300 font-mono"
                >
                  {t.name} ${t.price_usd}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">
            🛠 Roadmap (Claude executes)
          </p>
          <ol className="mt-1 text-zinc-400 space-y-0.5">
            <li>1. Next.js landing page</li>
            <li>2. Stripe {paidTiers.length}-tier checkout</li>
            <li>3. Email capture + Vercel deploy</li>
            <li>4. Marketing kit (X / Reddit / HN)</li>
            <li className="text-zinc-600">+ 4 more steps...</li>
          </ol>
        </div>
      </div>

      <div className="px-5 pb-5 mt-2 space-y-2">
        <a
          href={`${e.live_url}?utm_source=gallery&utm_medium=card`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between text-xs font-mono text-cyan-400 hover:text-cyan-300"
        >
          <span>⚡ {e.live_url?.replace("https://", "")}</span>
          <span className="text-zinc-600">{e.elapsed_sec?.toFixed(0)}s</span>
        </a>
        <Link
          href={`/demo/${slug}`}
          className="block text-center text-xs font-semibold py-2 rounded-md bg-zinc-900 hover:bg-cyan-400 hover:text-zinc-950 transition"
        >
          View roadmap →
        </Link>
      </div>
    </article>
  );
}
