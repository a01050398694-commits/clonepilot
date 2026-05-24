"use client";

import { useState } from "react";

export function ConfigSnippet({ json }: { json: object }) {
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(json, null, 2);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — Safari can throw on insecure context
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={copy}
        className="absolute top-3 right-3 text-xs font-mono px-2.5 py-1 rounded bg-zinc-800 hover:bg-cyan-400 hover:text-zinc-950 transition"
      >
        {copied ? "copied ✓" : "copy"}
      </button>
      <pre className="p-5 font-mono text-xs leading-relaxed overflow-x-auto text-zinc-300 bg-zinc-950">
        <code>{text}</code>
      </pre>
    </div>
  );
}
