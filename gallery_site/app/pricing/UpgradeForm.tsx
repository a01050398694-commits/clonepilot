"use client";

import { useState } from "react";
import type { PricingDict } from "@/lib/i18n-pricing";

export function UpgradeForm({ d }: { d: PricingDict["upgrade_form"] }) {
  const TIERS = [
    { value: "pro", label: d.tier_pro },
    { value: "lifetime", label: d.tier_lifetime },
    { value: "either", label: d.tier_either },
  ];

  const [email, setEmail] = useState("");
  const [tier, setTier] = useState("pro");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle"
  );
  const [position, setPosition] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/upgrade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          tier,
          source:
            typeof window !== "undefined" ? window.location.search : "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "signup failed");
      setStatus("ok");
      setPosition(typeof data.position === "number" ? data.position : null);
    } catch (err: unknown) {
      setStatus("err");
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "ok") {
    return (
      <div className="p-6 rounded-xl border border-accent/40 bg-accent/5 text-center">
        <p className="text-accent font-medium text-lg">{d.ok_title}</p>
        <p className="text-ink-muted text-sm mt-2">
          {position != null
            ? d.ok_position_template
                .replace("{n}", String(position))
                .replace("{tier}", tier)
            : d.ok_in}
        </p>
        <p className="text-ink-dim text-xs mt-4">{d.ok_hint}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TIERS.map((t) => (
          <label
            key={t.value}
            className={`p-3 rounded-md border cursor-pointer text-xs text-center font-mono transition ${
              tier === t.value
                ? "border-accent bg-accent/10 text-accent"
                : "border-strong hover:border-[var(--border-strong)] text-ink-muted"
            }`}
          >
            <input
              type="radio"
              name="tier"
              value={t.value}
              checked={tier === t.value}
              onChange={() => setTier(t.value)}
              className="sr-only"
            />
            {t.label}
          </label>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={d.placeholder_email}
          className="flex-1 px-4 py-3 rounded-md bg-surface-2 border border-strong focus:border-accent outline-none font-mono text-sm"
          autoComplete="email"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-3 rounded-md bg-accent text-bg font-semibold hover:bg-accent-strong disabled:opacity-50 transition"
        >
          {status === "loading" ? d.submitting : d.submit}
        </button>
      </div>
      {status === "err" && (
        <p className="text-[var(--danger)] text-sm">{msg}</p>
      )}
    </form>
  );
}
