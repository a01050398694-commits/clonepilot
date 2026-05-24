"use client";

import { useState } from "react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle"
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
      setMsg(data.position ? `You're #${data.position} on the list.` : "You're in.");
    } catch (err: unknown) {
      setStatus("err");
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "ok") {
    return (
      <div className="p-5 rounded-lg border border-cyan-500/40 bg-cyan-500/5">
        <p className="text-cyan-300 font-medium">Thanks — you&apos;re on the list.</p>
        {msg && <p className="text-zinc-400 text-sm mt-1">{msg}</p>}
        <p className="text-zinc-500 text-xs mt-3">
          We&apos;ll email you the day Pro launches. No spam, no other emails.
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
        className="flex-1 px-4 py-3 rounded-md bg-zinc-950 border border-zinc-800 focus:border-cyan-400 outline-none font-mono text-sm"
        autoComplete="email"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-3 rounded-md bg-cyan-500 text-zinc-950 font-semibold hover:bg-cyan-400 disabled:opacity-50 transition"
      >
        {status === "loading" ? "Saving…" : "Join waitlist"}
      </button>
      {status === "err" && (
        <p className="text-red-400 text-sm sm:basis-full">{msg}</p>
      )}
    </form>
  );
}
