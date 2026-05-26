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

      <div className="relative mx-auto max-w-[1100px] px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        {hasResult ? (
          // After result — narrower form-only container
          <div className="w-full lg:max-w-[1100px] mx-auto">
            <UrlAnalysisForm
              d={formDict}
              lang={lang}
              onResult={() => setHasResult(true)}
              onReset={() => setHasResult(false)}
            />
          </div>
        ) : (
          // Centered hero — text on top, form below
          <div className="flex flex-col items-center text-center">
            <div className="max-w-[820px]">{heroSlot}</div>
            <div className="w-full max-w-[680px] mt-12">
              <UrlAnalysisForm
                d={formDict}
                lang={lang}
                onResult={() => setHasResult(true)}
                onReset={() => setHasResult(false)}
              />
              <div className="mt-4 px-1 text-[12px] text-ink-dim leading-relaxed text-center">
                {skipQueueSlot}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
