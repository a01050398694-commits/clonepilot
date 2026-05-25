"use client";

import { LANG_LABELS, SUPPORTED_LANGS, type Lang } from "@/lib/report";

export function LangToggle({
  current,
  available,
  onChange,
}: {
  current: Lang;
  available: Lang[];
  onChange: (next: Lang) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-1 rounded-full border border-zinc-800 bg-zinc-950/80 p-1 backdrop-blur"
    >
      {SUPPORTED_LANGS.map((lang) => {
        const enabled = available.includes(lang);
        const active = lang === current;
        return (
          <button
            key={lang}
            type="button"
            aria-pressed={active}
            disabled={!enabled}
            onClick={() => enabled && onChange(lang)}
            className={[
              "px-2.5 py-1 text-[11px] font-mono rounded-full transition",
              active
                ? "bg-cyan-400 text-zinc-950 font-semibold"
                : enabled
                  ? "text-zinc-400 hover:text-cyan-300 hover:bg-zinc-900"
                  : "text-zinc-700 cursor-not-allowed",
            ].join(" ")}
            title={enabled ? `Switch to ${LANG_LABELS[lang]}` : `${LANG_LABELS[lang]} unavailable`}
          >
            {LANG_LABELS[lang]}
          </button>
        );
      })}
    </div>
  );
}
