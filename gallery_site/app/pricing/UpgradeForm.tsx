"use client";

import { useState } from "react";

const TIERS = [
  { value: "pro", label: "Pro · $19/mo (early-bird $9)" },
  { value: "lifetime", label: "Lifetime · $299 (early-bird $199)" },
  { value: "either", label: "Either — show me both" },
];

export function UpgradeForm() {
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState("pro");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle"
  );
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
      setMsg(
        data.position
          ? `You're #${data.position} on the ${tier} early-bird list.`
          : "You're in."
      );
    } catch (err: unknown) {
      setStatus("err");
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "ok") {
    return (
      <div className="p-6 rounded-xl border border-cyan-500/40 bg-cyan-500/5 text-center">
        <p className="text-cyan-300 font-medium text-lg">
          You&apos;re on the early-bird list.
        </p>
        {msg && <p className="text-zinc-400 text-sm mt-2">{msg}</p>}
        <p className="text-zinc-500 text-xs mt-4">
          We&apos;ll email you the day checkout opens. Early-bird pricing locked
          in for you.
        </p>
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
                ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
                : "border-zinc-800 hover:border-zinc-700 text-zinc-400"
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
          placeholder="you@startup.com"
          className="flex-1 px-4 py-3 rounded-md bg-zinc-950 border border-zinc-800 focus:border-cyan-400 outline-none font-mono text-sm"
          autoComplete="email"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="px-6 py-3 rounded-md bg-cyan-400 text-zinc-950 font-semibold hover:bg-cyan-300 disabled:opacity-50 transition"
        >
          {status === "loading" ? "Saving…" : "Lock in early-bird"}
        </button>
      </div>
      {status === "err" && (
        <p className="text-red-400 text-sm">{msg}</p>
      )}
    </form>
  );
}
