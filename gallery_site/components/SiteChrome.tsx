import Link from "next/link";
import { GithubLogo } from "@phosphor-icons/react/dist/ssr";
import { LangToggleGlobal } from "./LangToggleGlobal";
import type { Dict, Lang } from "@/lib/i18n";

export function SiteNav({ lang, d }: { lang: Lang; d: Dict }) {
  return (
    <header className="border-b border-strong/60 backdrop-blur-sm sticky top-0 z-30 bg-bg/85">
      <div className="mx-auto max-w-[1240px] h-14 px-6 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="group shrink-0 text-[15px] font-mono tracking-tight text-ink"
          aria-label="ClonePilot home"
        >
          <span className="font-semibold">Clone</span>
          <span
            className="font-semibold transition-colors"
            style={{ color: "var(--brand)" }}
          >
            P
          </span>
          <span className="font-semibold">ilot</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/install"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface transition"
          >
            {d.nav.install}
          </Link>
          <Link
            href="/pricing"
            className="hidden sm:inline-flex px-3 py-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface transition"
          >
            {d.nav.pricing}
          </Link>
          <Link
            href="/#gallery"
            className="hidden md:inline-flex px-3 py-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-surface transition"
          >
            {d.nav.reports}
          </Link>
          <div className="ml-1">
            <LangToggleGlobal current={lang} />
          </div>
          <a
            href="https://github.com/a01050398694-commits/clonepilot"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center justify-center h-9 w-9 rounded-md border border-strong text-ink-muted hover:text-ink hover:border-strong transition"
            aria-label={d.nav.github_aria}
          >
            <GithubLogo size={16} weight="duotone" />
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ d }: { d: Dict }) {
  return (
    <footer className="border-t border-strong/60">
      <div className="mx-auto max-w-[1240px] px-6 py-10 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 items-center">
        <p className="text-xs text-ink-dim font-mono">{d.footer.line}</p>
        <nav className="flex flex-wrap gap-5 text-xs text-ink-dim font-mono">
          <Link href="/" className="hover:text-ink transition">
            {d.footer.reports}
          </Link>
          <Link href="/install" className="hover:text-ink transition">
            {d.footer.install}
          </Link>
          <Link href="/pricing" className="hover:text-ink transition">
            {d.footer.pricing}
          </Link>
          <a
            href="https://github.com/a01050398694-commits/clonepilot"
            className="hover:text-ink transition"
          >
            {d.footer.github}
          </a>
        </nav>
      </div>
    </footer>
  );
}
