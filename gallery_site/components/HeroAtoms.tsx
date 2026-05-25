"use client";

import type { ReactNode } from "react";

export function HeroEm({ children }: { children: ReactNode }) {
  return <span className="text-accent">{children}</span>;
}

export function HeroCode({ children }: { children: ReactNode }) {
  return <code className="font-mono text-ink-muted">{children}</code>;
}

export function PriceEm({ children }: { children: ReactNode }) {
  return <span className="text-ink">{children}</span>;
}
