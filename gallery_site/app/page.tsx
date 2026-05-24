import fs from "node:fs";
import path from "node:path";
import { WaitlistForm } from "./WaitlistForm";

export const dynamic = "force-static";
export const revalidate = 60;

type Entry = {
  ok: boolean;
  video_url: string;
  name?: string;
  tagline?: string;
  target?: string;
  pricing_model?: string;
  tiers?: { name: string; price_usd: number; features: string[] }[];
  live_url?: string;
  elapsed_sec?: number;
  generated_at?: string;
  error?: string;
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

function videoIdFromUrl(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export default function Page() {
  const gallery = loadGallery();
  const ok = gallery.entries.filter((e) => e.ok && e.live_url);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-16 max-w-3xl">
        <p className="text-cyan-400 font-mono text-xs uppercase tracking-wider mb-3">
          ClonePilot · MCP server · v0.1.0
        </p>
        <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight">
          Every site below was built from a{" "}
          <span className="text-cyan-400">single YouTube URL</span>.
        </h1>
        <p className="mt-6 text-zinc-400 text-lg leading-relaxed">
          Paste a business video into Claude Code, Claude Desktop, or Cursor.
          ClonePilot analyzes the business, scaffolds a Next.js landing page,
          deploys it to Vercel, and hands you back a live URL — in about 2
          minutes. The cards below are all real, all live, all generated this
          way.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <a
            href="https://github.com/a01050398694-commits/clonepilot"
            className="px-4 py-2 rounded-full bg-cyan-500 text-zinc-950 font-semibold hover:bg-cyan-400 transition"
          >
            View on GitHub →
          </a>
          <a
            href="#waitlist"
            className="px-4 py-2 rounded-full border border-zinc-700 hover:border-cyan-400 transition"
          >
            Get notified when Pro launches
          </a>
        </div>
        <p className="mt-4 text-xs text-zinc-500 font-mono">
          {gallery.ok_count} demos live · {gallery.fail_count} failed · updated{" "}
          {new Date(gallery.updated_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ok.length === 0 ? (
          <div className="col-span-full text-zinc-500 text-center py-24 border border-dashed border-zinc-800 rounded-lg">
            Demos are generating. Refresh in a couple of minutes.
          </div>
        ) : (
          ok.map((e) => {
            const vid = videoIdFromUrl(e.video_url);
            const thumb = vid
              ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`
              : null;
            return (
              <a
                key={e.live_url}
                href={`${e.live_url}?utm_source=gallery&utm_medium=card`}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-lg border border-zinc-800 hover:border-cyan-400 transition overflow-hidden bg-zinc-950"
              >
                {thumb && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={e.name ?? "demo"}
                    className="w-full aspect-video object-cover opacity-80 group-hover:opacity-100 transition"
                  />
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-lg">{e.name}</h3>
                  <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                    {e.tagline}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-400">
                      {e.live_url?.replace("https://", "")}
                    </span>
                    <span className="text-zinc-600">
                      {e.elapsed_sec?.toFixed(0)}s
                    </span>
                  </div>
                  {e.tiers && e.tiers.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {e.tiers.slice(0, 3).map((t) => (
                        <span
                          key={t.name}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 font-mono"
                        >
                          {t.name} ${t.price_usd}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </a>
            );
          })
        )}
      </section>

      <section id="waitlist" className="mt-24 max-w-2xl">
        <h2 className="text-3xl font-bold">Want this for your business?</h2>
        <p className="mt-3 text-zinc-400 leading-relaxed">
          ClonePilot Pro will give you unlimited URL-to-app conversions,
          custom-domain deploys, and a private MCP key. Join the waitlist
          — we&apos;ll email you the day it launches. No credit card.
        </p>
        <div className="mt-6">
          <WaitlistForm />
        </div>
      </section>

      <footer className="mt-24 pt-8 border-t border-zinc-900 text-xs text-zinc-600 font-mono flex flex-wrap gap-4">
        <a href="https://github.com/a01050398694-commits/clonepilot" className="hover:text-cyan-400">github</a>
        <a href="https://github.com/a01050398694-commits/clonepilot/releases/tag/v0.1.0" className="hover:text-cyan-400">v0.1.0</a>
        <a href="https://blogflow-nine.vercel.app" className="hover:text-cyan-400">first demo</a>
        <span className="ml-auto">MIT · built with ClonePilot</span>
      </footer>
    </main>
  );
}
