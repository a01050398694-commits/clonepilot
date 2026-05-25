"use client";

import { useState, type ReactNode } from "react";
import { UrlAnalysisForm } from "@/components/UrlAnalysisForm";
import type { Dict } from "@/lib/i18n";

export function HeroSection({
  heroSlot,
  skipQueueSlot,
  formDict,
}: {
  heroSlot: ReactNode;
  skipQueueSlot: ReactNode;
  formDict: Dict["analyze_form"];
}) {
  const [hasResult, setHasResult] = useState(false);

  return (
    <section className="mx-auto max-w-[1240px] px-6 pt-16 pb-24 md:pt-24 md:pb-32">
      <div
        className={
          hasResult
            ? "flex flex-col gap-6"
            : "grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-start"
        }
      >
        {!hasResult && <div>{heroSlot}</div>}

        <div
          className={
            hasResult
              ? "w-full lg:max-w-[1100px] lg:mx-auto"
              : "lg:pt-2"
          }
        >
          <UrlAnalysisForm
            d={formDict}
            onResult={() => setHasResult(true)}
            onReset={() => setHasResult(false)}
          />
          {!hasResult && (
            <div className="mt-4 px-1 text-[11px] text-ink-dim leading-relaxed">
              {skipQueueSlot}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
