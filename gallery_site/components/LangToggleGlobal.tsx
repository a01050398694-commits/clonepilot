"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CaretDown, Check } from "@phosphor-icons/react";
import { LANGS, type Lang } from "@/lib/i18n";

const COUNTRY_LABEL: Record<Lang, string> = {
  en: "USA",
  ko: "KOREA",
  ja: "JAPAN",
  zh: "CHINA",
  es: "SPAIN",
};

const NATIVE_LABEL: Record<Lang, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  zh: "中文",
  es: "Español",
};

export function LangToggleGlobal({ current }: { current: Lang }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Lang | null>(null);
  const [, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function pick(lang: Lang) {
    if (lang === current || pending) return setOpen(false);
    setPending(lang);
    setOpen(false);
    try {
      await fetch("/api/lang", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      startTransition(() => router.refresh());
    } finally {
      setPending(null);
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="inline-flex items-center gap-2 h-8 px-3 border border-strong bg-surface hover:bg-surface-2 transition text-[12px] font-mono tracking-wider text-ink"
        style={{ borderRadius: 6 }}
      >
        <span className="font-semibold">{COUNTRY_LABEL[current]}</span>
        <CaretDown
          size={11}
          weight="bold"
          className={`text-ink-dim transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[180px] border border-strong bg-surface overflow-hidden"
          style={{
            borderRadius: 8,
            boxShadow:
              "0 16px 40px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          {LANGS.map((lang) => {
            const active = lang === current;
            return (
              <button
                key={lang}
                role="option"
                aria-selected={active}
                type="button"
                onClick={() => pick(lang)}
                className={`group w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left transition ${active ? "" : "hover:bg-surface-2"}`}
                style={
                  active
                    ? { background: "color-mix(in oklab, var(--brand) 12%, transparent)" }
                    : undefined
                }
              >
                <div className="flex flex-col">
                  <span
                    className={`font-mono text-[12px] uppercase tracking-wider ${active ? "font-semibold" : "text-ink"}`}
                    style={active ? { color: "var(--brand)" } : undefined}
                  >
                    {COUNTRY_LABEL[lang]}
                  </span>
                  <span className="text-[11px] text-ink-dim mt-0.5">
                    {NATIVE_LABEL[lang]}
                  </span>
                </div>
                {active && (
                  <Check size={14} weight="bold" style={{ color: "var(--brand)" }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
