"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LANGS, LANG_LABELS, LANG_NAMES, type Lang } from "@/lib/i18n";

export function LangToggleGlobal({ current }: { current: Lang }) {
  const router = useRouter();
  const [pending, setPending] = useState<Lang | null>(null);
  const [, startTransition] = useTransition();

  async function pick(lang: Lang) {
    if (lang === current || pending) return;
    setPending(lang);
    try {
      await fetch("/api/lang", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lang }),
      });
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-0.5 rounded-full border border-strong bg-surface p-0.5"
    >
      {LANGS.map((lang) => {
        const active = lang === current;
        const isPending = pending === lang;
        return (
          <button
            key={lang}
            type="button"
            aria-pressed={active}
            onClick={() => pick(lang)}
            title={LANG_NAMES[lang]}
            className={[
              "px-2.5 py-1 text-[11px] font-mono rounded-full transition select-none",
              active
                ? "bg-ink text-bg font-semibold"
                : "text-ink-muted hover:text-ink hover:bg-surface-2",
              isPending ? "opacity-40 cursor-wait" : "",
            ].join(" ")}
          >
            {LANG_LABELS[lang]}
          </button>
        );
      })}
    </div>
  );
}
