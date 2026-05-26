"use client";

import { useState, type ReactNode } from "react";
import { UrlAnalysisForm } from "@/components/UrlAnalysisForm";
import type { Dict, Lang } from "@/lib/i18n";

export function HeroSection({
  heroSlot,
  skipQueueSlot,
  formDict,
  lang,
}: {
  heroSlot: ReactNode;
  skipQueueSlot: ReactNode;
  formDict: Dict["analyze_form"];
  lang: Lang;
}) {
  // CRITICAL: never re-mount UrlAnalysisForm conditionally — that resets its
  // status/preview state. Toggle visibility via CSS instead.
  const [hasResult, setHasResult] = useState(false);

  return (
    <section className="relative overflow-hidden">
      {/* Soft coral radial backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(900px 600px at 50% 0%, color-mix(in oklab, var(--brand) 18%, transparent) 0%, transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(500px 320px at 88% 8%, color-mix(in oklab, var(--brand) 12%, transparent) 0%, transparent 70%)",
        }}
      />

      <div
        className={
          hasResult
            ? "relative mx-auto max-w-[1100px] px-6 pt-16 pb-16"
            : "relative mx-auto max-w-[1100px] px-6 pt-24 pb-20 md:pt-32 md:pb-28"
        }
      >
        <div
          className={
            hasResult
              ? "flex flex-col items-center"
              : "flex flex-col items-center text-center"
          }
        >
          {/* Hero text — hidden when result is shown, but DOM-stable */}
          <div
            className={`max-w-[820px] ${hasResult ? "hidden" : ""}`}
          >
            {heroSlot}
          </div>

          {/* The form — ALWAYS mounted. Only its wrapper width changes. */}
          <div
            className={
              hasResult
                ? "w-full lg:max-w-[1100px]"
                : "w-full max-w-[680px] mt-12"
            }
          >
            <UrlAnalysisForm
              d={formDict}
              lang={lang}
              onResult={() => setHasResult(true)}
              onReset={() => setHasResult(false)}
            />
            <div
              className={`mt-4 px-1 text-[12px] text-ink-dim leading-relaxed text-center ${hasResult ? "hidden" : ""}`}
            >
              {skipQueueSlot}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
