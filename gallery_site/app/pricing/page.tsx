import Link from "next/link";
import { UpgradeForm } from "./UpgradeForm";

export const metadata = {
  title: "Pricing — ClonePilot",
  description:
    "Free: 1 build/month. Pro $19/month or Lifetime $299 one-time. Cancel anytime.",
};

const TIERS = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    target: "Try ClonePilot in your Claude Code with one full build per month.",
    bullets: [
      "Browse the full gallery (unlimited)",
      "See every business analysis + execution roadmap",
      "Install the MCP into Claude Code / Desktop / Cursor / Codex",
      "1 full build/month (analyze + scaffold + deploy)",
      "Deep analysis preview — analyze_deep MCP tool (Google Trends only, ~55 confidence)",
      "Use your own Anthropic / Vercel keys (BYO)",
    ],
    cta: "Install now (no signup)",
    href: "/install",
    highlighted: false,
    tier: "free",
  },
  {
    name: "Pro",
    price: "$19",
    cadence: "per month",
    earlyBirdNote: "Early-bird: $9/mo for the first 100 subscribers",
    target: "Indie hackers shipping multiple sites per month.",
    bullets: [
      "Everything in Free",
      "Unlimited builds",
      "Deep analysis with all integrations (Ahrefs + Exa + SimilarWeb server-side)",
      "5-language reports (EN/KR/JP/ZH/ES) + revenue forecast (TAM/SAM/SOM)",
      "Custom domain on each deploy",
      "Marketing kit (X + Reddit + Show HN copy)",
      "Priority generation queue (skip the line)",
      "Showcase in the public gallery",
      "Cancel anytime",
    ],
    cta: "Join Pro waitlist",
    href: "#waitlist",
    highlighted: true,
    tier: "pro",
  },
  {
    name: "Lifetime",
    price: "$299",
    cadence: "one-time",
    earlyBirdNote: "Early-bird: $199 one-time for the first 50 buyers",
    target:
      "Hate subscriptions? Pay once, own ClonePilot forever — same features as Pro.",
    bullets: [
      "Everything in Pro",
      "No monthly fee, ever",
      "Lifetime updates & new features",
      "Lifetime priority queue",
      "Founding-member badge in gallery",
      "Refundable for 7 days",
    ],
    cta: "Join Lifetime waitlist",
    href: "#waitlist",
    highlighted: false,
    tier: "lifetime",
  },
];

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <nav className="mb-12 text-xs font-mono">
        <Link href="/" className="text-zinc-500 hover:text-cyan-400">
          ← gallery
        </Link>
      </nav>

      <header className="text-center max-w-2xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Free to try. <span className="text-cyan-400">$19/mo</span> when you
          ship more than one.
        </h1>
        <p className="mt-5 text-zinc-400 leading-relaxed">
          ClonePilot the MCP server is open-source forever — clone it from
          GitHub anytime. Pro / Lifetime is the hosted convenience layer:
          unlimited deploys, deep market analysis (Ahrefs + Exa + SimilarWeb
          enabled), 5-language reports, revenue forecast, marketing kit,
          priority queue.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`p-7 rounded-xl border ${
              t.highlighted
                ? "border-cyan-400 bg-cyan-500/5 relative"
                : "border-zinc-800 bg-zinc-950"
            }`}
          >
            {t.highlighted && (
              <span className="absolute -top-3 left-7 text-[10px] font-mono uppercase tracking-wider bg-cyan-400 text-zinc-950 px-2 py-0.5 rounded">
                most popular
              </span>
            )}
            <h3 className="text-sm font-mono uppercase tracking-wider text-zinc-500">
              {t.name}
            </h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold">{t.price}</span>
              <span className="text-sm text-zinc-500">{t.cadence}</span>
            </div>
            {t.earlyBirdNote && (
              <p className="mt-1 text-xs text-cyan-400 font-mono">
                {t.earlyBirdNote}
              </p>
            )}
            <p className="mt-4 text-sm text-zinc-400">{t.target}</p>

            <ul className="mt-6 space-y-2 text-sm">
              {t.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="text-cyan-400 mt-0.5">✓</span>
                  <span className="text-zinc-300">{b}</span>
                </li>
              ))}
            </ul>

            <Link
              href={t.href}
              className={`mt-7 block text-center px-4 py-3 rounded-md font-semibold transition ${
                t.highlighted
                  ? "bg-cyan-400 text-zinc-950 hover:bg-cyan-300"
                  : "border border-zinc-700 hover:border-cyan-400"
              }`}
            >
              {t.cta}
            </Link>
          </div>
        ))}
      </section>

      <section id="waitlist" className="mt-24 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center">
          Waitlist for Pro / Lifetime
        </h2>
        <p className="mt-3 text-zinc-400 text-center leading-relaxed">
          We&apos;re still wiring up the payment processor (Korean indie-hacker
          things — Paddle rejected us, working on Lemon Squeezy). Drop your
          email + pick a tier and we&apos;ll email you the moment checkout goes
          live with early-bird pricing locked in.
        </p>
        <div className="mt-8">
          <UpgradeForm />
        </div>
      </section>

      <section className="mt-24 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold">FAQ</h2>
        <div className="mt-6 space-y-6 text-sm">
          <FaqItem
            q="Is the MCP itself open-source?"
            a="Yes. The MCP server code is MIT on GitHub. You can self-host it forever with your own Anthropic + Vercel keys. The Pro/Lifetime tier is the hosted convenience layer (unlimited builds, marketing kit, custom domains, priority queue)."
          />
          <FaqItem
            q="What counts as 'one build'?"
            a="One analyze() + scaffold() + deploy() cycle. So: one YouTube URL → one live site. Re-deploying the same project doesn't count; generating a fresh site does."
          />
          <FaqItem
            q="What happens when I exceed the free 1 build/month?"
            a="You see a friendly message in Claude with a link to the pricing page. analyze() and scaffold() (local-only) still work without limit — you just can't push to Vercel without a Pro key."
          />
          <FaqItem
            q="Can I cancel Pro anytime?"
            a="Yes, instantly, no questions. You keep access through the end of the paid period. After that you drop back to the Free tier."
          />
          <FaqItem
            q="Why one-time pricing for Lifetime?"
            a="Inspired by Marc Lou's ShipFast — some indie hackers hate subscriptions. $299 once (or $199 early-bird) and you own ClonePilot Pro forever. Same features, no monthly fee."
          />
          <FaqItem
            q="Refund policy?"
            a="Pro: cancel anytime, prorated refund of the current month. Lifetime: 7-day money-back, no questions asked."
          />
        </div>
      </section>

      <footer className="mt-24 pt-8 border-t border-zinc-900 text-xs text-zinc-600 font-mono flex flex-wrap gap-4 justify-center">
        <Link href="/" className="hover:text-cyan-400">gallery</Link>
        <Link href="/install" className="hover:text-cyan-400">install</Link>
        <Link href="/pricing" className="hover:text-cyan-400">pricing</Link>
        <a href="https://github.com/a01050398694-commits/clonepilot" className="hover:text-cyan-400">github</a>
      </footer>
    </main>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-zinc-900 pb-4">
      <summary className="cursor-pointer font-semibold text-zinc-200 list-none flex justify-between">
        <span>{q}</span>
        <span className="text-zinc-600 group-open:rotate-45 transition">+</span>
      </summary>
      <p className="mt-3 text-zinc-400 leading-relaxed">{a}</p>
    </details>
  );
}
