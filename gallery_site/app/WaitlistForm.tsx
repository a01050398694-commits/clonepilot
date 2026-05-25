"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle",
  );
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          source: typeof window !== "undefined" ? window.location.search : "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "signup failed");
      setStatus("ok");
      setMsg(
        data.position ? `You are #${data.position} on the list.` : "You are in.",
      );
    } catch (err: unknown) {
      setStatus("err");
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-xl border border-strong bg-surface p-5">
        <div className="flex items-center gap-2">
          <CheckCircle size={18} weight="duotone" className="text-accent" />
          <p className="text-ink font-medium">You are on the list.</p>
        </div>
        {msg && <p className="text-ink-muted text-sm mt-1">{msg}</p>}
        <p className="text-ink-dim text-xs mt-3">
          One email when Pro launches. Nothing else.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@startup.com"
        className="flex-1 h-11 px-3.5 rounded-lg bg-surface-2 border border-strong outline-none font-mono text-sm text-ink placeholder:text-ink-dim focus:border-accent/60 focus:ring-2 focus:ring-[var(--accent-ring)] transition"
        autoComplete="email"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-11 px-5 inline-flex items-center justify-center gap-2 rounded-lg bg-accent text-bg font-semibold text-sm hover:bg-accent-strong active:translate-y-[1px] disabled:opacity-50 transition"
      >
        {status === "loading" ? "Saving…" : (
          <>
            Join waitlist
            <ArrowRight size={16} weight="bold" />
          </>
        )}
      </button>
      {status === "err" && (
        <p className="text-[var(--danger)] text-xs sm:basis-full">{msg}</p>
      )}
    </form>
  );
}
