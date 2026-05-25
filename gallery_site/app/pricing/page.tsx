import Link from "next/link";
import { UpgradeForm } from "./UpgradeForm";
import { SiteNav, SiteFooter } from "@/components/SiteChrome";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import { tPricing, type PricingDict } from "@/lib/i18n-pricing";

export const metadata = {
  title: "Pricing — ClonePilot",
  description:
    "Free: 1 build/month. Pro $19/month or Lifetime $299 one-time. Cancel anytime.",
};

type TierKey = "free" | "pro" | "lifetime";
type TierConfig = {
  key: TierKey;
  name: string;
  price: string;
  highlighted: boolean;
};

const TIER_CONFIGS: TierConfig[] = [
  { key: "free", name: "Free", price: "$0", highlighted: false },
  { key: "pro", name: "Pro", price: "$19", highlighted: true },
  { key: "lifetime", name: "Lifetime", price: "$299", highlighted: false },
];

function cadence(key: TierKey, p: PricingDict): string {
  if (key === "free") return p.cadence_forever;
  if (key === "pro") return p.cadence_per_month;
  return p.cadence_one_time;
}

function ctaHref(key: TierKey): string {
  return key === "free" ? "/install" : "#waitlist";
}

export default async function PricingPage() {
  const lang = await getLang();
  const d = t(lang);
  const p = tPricing(lang);

  return (
    <div className="min-h-[100dvh]">
      <SiteNav lang={lang} d={d} />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <nav className="mb-12 text-xs font-mono">
          <Link href="/" className="text-ink-dim hover:text-accent">
            {p.back_to_gallery}
          </Link>
        </nav>

        <header className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {p.header_titleRich(({ children }) => (
              <span className="text-accent">{children}</span>
            ))}
          </h1>
          <p className="mt-5 text-ink-muted leading-relaxed">
            {p.header_subtitle}
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIER_CONFIGS.map((t) => {
            const td = p.tiers[t.key];
            const earlyBird =
              "early_bird" in td ? (td as { early_bird: string }).early_bird : null;
            return (
              <div
                key={t.key}
                className={`p-7 rounded-xl border ${
                  t.highlighted
                    ? "border-accent bg-accent/5 relative"
                    : "border-strong bg-surface"
                }`}
              >
                {t.highlighted && (
                  <span className="absolute -top-3 left-7 text-[10px] font-mono uppercase tracking-wider bg-accent text-bg px-2 py-0.5 rounded">
                    {p.most_popular}
                  </span>
                )}
                <h3 className="text-sm font-mono uppercase tracking-wider text-ink-dim">
                  {t.name}
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{t.price}</span>
                  <span className="text-sm text-ink-dim">
                    {cadence(t.key, p)}
                  </span>
                </div>
                {earlyBird && (
                  <p className="mt-1 text-xs text-accent font-mono">
                    {earlyBird}
                  </p>
                )}
                <p className="mt-4 text-sm text-ink-muted">{td.target}</p>

                <ul className="mt-6 space-y-2 text-sm">
                  {td.bullets.map((b) => (
                    <li key={b} className="flex gap-2">
                      <span className="text-accent mt-0.5">✓</span>
                      <span className="text-ink">{b}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={ctaHref(t.key)}
                  className={`mt-7 block text-center px-4 py-3 rounded-md font-semibold transition ${
                    t.highlighted
                      ? "bg-accent text-bg hover:bg-accent-strong"
                      : "border border-strong hover:border-accent"
                  }`}
                >
                  {td.cta}
                </Link>
              </div>
            );
          })}
        </section>

        <section id="waitlist" className="mt-24 max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-center">{p.waitlist_title}</h2>
          <p className="mt-3 text-ink-muted text-center leading-relaxed">
            {p.waitlist_body}
          </p>
          <div className="mt-8">
            <UpgradeForm d={p.upgrade_form} />
          </div>
        </section>

        <section className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold">{p.faq_title}</h2>
          <div className="mt-6 space-y-6 text-sm">
            {p.faqs.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </section>
      </main>
      <SiteFooter d={d} />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-strong/60 pb-4">
      <summary className="cursor-pointer font-semibold text-ink list-none flex justify-between">
        <span>{q}</span>
        <span className="text-ink-dim group-open:rotate-45 transition">+</span>
      </summary>
      <p className="mt-3 text-ink-muted leading-relaxed">{a}</p>
    </details>
  );
}
