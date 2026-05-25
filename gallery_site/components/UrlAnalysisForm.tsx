"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Warning } from "@phosphor-icons/react";

type Status = "idle" | "loading" | "ok" | "err";

export function UrlAnalysisForm() {
  const [youtubeUrl, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [position, setPosition] = useState<number | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@") || !youtubeUrl.trim()) return;
    setStatus("loading");
    setMsg(null);
    try {
      const res = await fetch("/api/analyze-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          youtubeUrl: youtubeUrl.trim(),
          source: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "request failed");
      setStatus("ok");
      setPosition(typeof data.position === "number" ? data.position : null);
    } catch (err: unknown) {
      setStatus("err");
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-strong bg-surface p-7">
        <div className="flex items-center gap-3">
          <CheckCircle
            size={22}
            weight="duotone"
            className="text-accent"
          />
          <p className="text-base font-medium text-ink">
            Queued{position != null ? ` — position #${position}` : ""}.
          </p>
        </div>
        <p className="mt-3 text-sm text-ink-muted leading-relaxed">
          We will email the deep-analysis report to{" "}
          <span className="font-mono text-ink">{email}</span> once it finishes.
          Usually under 24 hours during the manual-batch phase. The live API
          will drop this to under five minutes.
        </p>
        <p className="mt-4 text-xs text-ink-dim">
          Want it instantly? The MCP is open-source — install once and run it
          inside your Claude Code yourself.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-strong bg-surface p-7 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center gap-2 mb-5">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-muted">
          Live analysis queue
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <label
            htmlFor="ytUrl"
            className="text-xs font-medium text-ink-muted"
          >
            YouTube business video
          </label>
          <input
            id="ytUrl"
            type="url"
            required
            value={youtubeUrl}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full h-11 px-3.5 rounded-lg bg-surface-2 border border-strong outline-none font-mono text-sm text-ink placeholder:text-ink-dim focus:border-accent/60 focus:ring-2 focus:ring-[var(--accent-ring)] transition"
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <div className="grid gap-2">
          <label
            htmlFor="email"
            className="text-xs font-medium text-ink-muted"
          >
            Where to send the report
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@startup.com"
            className="w-full h-11 px-3.5 rounded-lg bg-surface-2 border border-strong outline-none font-mono text-sm text-ink placeholder:text-ink-dim focus:border-accent/60 focus:ring-2 focus:ring-[var(--accent-ring)] transition"
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="group w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-accent text-bg font-semibold text-sm hover:bg-accent-strong active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {status === "loading" ? "Queuing…" : "Run deep analysis"}
          <ArrowRight
            size={16}
            weight="bold"
            className="transition group-hover:translate-x-0.5"
          />
        </button>

        {status === "err" && msg && (
          <div className="flex items-start gap-2 text-xs text-[var(--danger)]">
            <Warning size={14} weight="duotone" className="mt-0.5" />
            <span>{msg}</span>
          </div>
        )}

        <p className="text-[11px] text-ink-dim leading-relaxed">
          One free deep-analysis report per email. No card required. We email
          the report and nothing else.
        </p>
      </div>
    </form>
  );
}
