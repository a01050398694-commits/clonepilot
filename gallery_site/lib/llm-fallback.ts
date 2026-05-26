/**
 * Gemini 2.0 Flash fallback for when Anthropic returns budget/usage error.
 * Uses Google's generativelanguage REST API directly — no SDK install.
 *
 * Converts an Anthropic-style EXTRACT_TOOL schema into Gemini's function-
 * declarations format and forces function calling.
 */

import Anthropic from "@anthropic-ai/sdk";

export function isAnthropicBudgetError(err: unknown): boolean {
  const m = err instanceof Error ? err.message : "";
  return (
    m.includes("usage limits") ||
    m.includes("usage_limits") ||
    m.includes("exceeded") ||
    m.includes("billing") ||
    /\b40[39]\b/.test(m)
  );
}

/**
 * Triggers Gemini fallback for ANY Anthropic failure that's recoverable on
 * a different provider — budget caps, transient 5XX, overloaded, network
 * errors. We don't fall back on real auth errors (401 = bad key) because
 * those need human action.
 */
export function shouldFallbackFromAnthropic(err: unknown): boolean {
  if (isAnthropicBudgetError(err)) return true;
  const m = err instanceof Error ? err.message : "";
  // Real auth errors — bad key, missing key — don't fall back
  if (/\b401\b/.test(m) || /authentication|invalid_api_key/i.test(m))
    return false;
  // Everything else — overloaded (529), server errors, timeouts, network — try Gemini
  if (
    /overloaded|rate_?limit|server_error|timeout|fetch failed|ECONNRESET|ETIMEDOUT|abort|ENOTFOUND/i.test(
      m,
    )
  )
    return true;
  if (/\b5\d\d\b/.test(m)) return true;
  if (/\b429\b/.test(m)) return true;
  // Schema validation / tool_use failures — also worth retrying on Gemini
  if (/tool_use|no tool_use|did not return/i.test(m)) return true;
  // Empty / malformed responses
  if (/empty|malformed|did not respond/i.test(m)) return true;
  return false;
}

/* ─── Anthropic tool schema → Gemini function declaration ──────────── */

type JSchema = Record<string, unknown>;

function sanitizeForGemini(schema: JSchema): JSchema {
  // Gemini function-calling does not accept all of JSON Schema. Strip
  // fields it ignores or rejects.
  const out: JSchema = {};
  for (const [k, v] of Object.entries(schema)) {
    if (k === "$schema" || k === "additionalProperties") continue;
    if (v === null || v === undefined) continue;
    if (Array.isArray(v)) {
      out[k] = v.map((x) =>
        typeof x === "object" && x ? sanitizeForGemini(x as JSchema) : x,
      );
    } else if (typeof v === "object") {
      out[k] = sanitizeForGemini(v as JSchema);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function anthropicToolToGemini(tool: Anthropic.Tool) {
  return {
    name: tool.name,
    description: tool.description ?? "",
    parameters: sanitizeForGemini(tool.input_schema as unknown as JSchema),
  };
}

/* ─── Gemini call ──────────────────────────────────────────────────── */

export type GeminiResult<T> = {
  ok: true;
  args: T;
  model: string;
};

/** Collect every Gemini API key the env has — primary + numbered backups.
 * Returned in declaration order. Empty strings filtered out. */
export function geminiKeys(): string[] {
  const all = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GOOGLE_AI_API_KEY,
    process.env.NEXT_PUBLIC_GOOGLE_AI_KEY,
  ]
    .map((k) => (k ?? "").trim())
    .filter(Boolean);
  // Dedup while keeping order.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of all) {
    if (!seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  }
  return out;
}

function isQuotaError(err: unknown): boolean {
  const s = (err as { status?: number })?.status;
  if (s === 429) return true;
  const m = err instanceof Error ? err.message : "";
  return /\b429\b|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(m);
}

async function singleGeminiCall<T>(
  apiKey: string,
  model: string,
  system: string,
  userText: string,
  tool: Anthropic.Tool,
): Promise<{ args: T; model: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    tools: [{ functionDeclarations: [anthropicToolToGemini(tool)] }],
    toolConfig: {
      functionCallingConfig: {
        mode: "ANY",
        allowedFunctionNames: [tool.name],
      },
    },
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 32_768,
    },
  };
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    const err = new Error(`gemini ${r.status}: ${text.slice(0, 300)}`);
    (err as Error & { status?: number }).status = r.status;
    throw err;
  }
  type Part = { functionCall?: { name?: string; args?: unknown }; text?: string };
  type Resp = {
    candidates?: Array<{
      content?: { parts?: Part[] };
      finishReason?: string;
    }>;
    promptFeedback?: unknown;
  };
  const j = (await r.json()) as Resp;
  const parts = j.candidates?.[0]?.content?.parts ?? [];
  const fc = parts.find((p) => p.functionCall?.args);
  if (!fc?.functionCall?.args) {
    throw new Error(
      `gemini returned no function call (finish=${j.candidates?.[0]?.finishReason ?? "?"})`,
    );
  }
  return { args: fc.functionCall.args as T, model };
}

function isTransientStatus(err: unknown): boolean {
  const s = (err as { status?: number })?.status;
  if (s === 429 || s === 500 || s === 502 || s === 503 || s === 504) return true;
  const m = err instanceof Error ? err.message : "";
  return /\b(429|500|502|503|504)\b/.test(m) || /UNAVAILABLE|RESOURCE_EXHAUSTED/.test(m);
}

async function singleGeminiText(
  apiKey: string,
  model: string,
  system: string,
  userText: string,
  responseMimeType?: string,
): Promise<{ text: string; model: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 32_768,
      ...(responseMimeType ? { responseMimeType } : {}),
    },
  };
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    const err = new Error(`gemini ${r.status}: ${text.slice(0, 300)}`);
    (err as Error & { status?: number }).status = r.status;
    throw err;
  }
  type Resp = {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
  };
  const j = (await r.json()) as Resp;
  const text =
    j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) {
    throw new Error(
      `gemini returned empty text (finish=${j.candidates?.[0]?.finishReason ?? "?"})`,
    );
  }
  return { text, model };
}

/** Strip ```json fences and parse. */
function parseJsonLoose<T>(s: string): T {
  const fence = /```(?:json)?\s*([\s\S]*?)```/i.exec(s);
  const body = (fence?.[1] ?? s).trim();
  return JSON.parse(body) as T;
}

/** Return parsed JSON via Gemini's response_mime_type=application/json mode.
 * Walks every available Gemini key + model combination on 429/quota errors. */
export async function callGeminiJson<T>(opts: {
  apiKey?: string;
  model?: string;
  system: string;
  userText: string;
}): Promise<{ ok: true; value: T; model: string }> {
  const primary = opts.model ?? "gemini-2.5-flash";
  const secondary =
    primary === "gemini-2.5-flash" ? "gemini-2.0-flash" : "gemini-2.5-flash";

  // Build key list — if explicit apiKey was passed, use only that; otherwise
  // try every key the env exposes, in declared order.
  const keys = opts.apiKey ? [opts.apiKey] : geminiKeys();
  if (keys.length === 0) throw new Error("No Gemini API key configured");

  let lastErr: unknown = new Error("no attempts");
  for (const key of keys) {
    for (const model of [primary, secondary]) {
      try {
        const res = await singleGeminiText(
          key,
          model,
          opts.system,
          opts.userText,
          "application/json",
        );
        return { ok: true, value: parseJsonLoose<T>(res.text), model: res.model };
      } catch (err) {
        lastErr = err;
        // 429/quota → move on to next key/model immediately
        if (isQuotaError(err)) continue;
        // Other transient → small backoff, retry same combo once
        if (isTransientStatus(err)) {
          await new Promise((r) => setTimeout(r, 1500));
          try {
            const res = await singleGeminiText(
              key,
              model,
              opts.system,
              opts.userText,
              "application/json",
            );
            return { ok: true, value: parseJsonLoose<T>(res.text), model: res.model };
          } catch (err2) {
            lastErr = err2;
            continue;
          }
        }
        // Hard error (4XX schema, etc.) — try next model on same key
      }
    }
  }
  throw lastErr;
}

function isMalformedFC(err: unknown): boolean {
  const m = err instanceof Error ? err.message : "";
  return /MALFORMED_FUNCTION_CALL|no function call/i.test(m);
}

/* ─── Groq (OpenAI-compatible) — 3rd-tier fallback ───────────────────── */

/** Call Groq's chat-completions endpoint with JSON-mode response_format.
 * Groq's free tier is generous and survives when Gemini quotas are spent. */
export async function callGroqJson<T>(opts: {
  apiKey?: string;
  model?: string;
  system: string;
  userText: string;
}): Promise<{ ok: true; value: T; model: string }> {
  const apiKey = (opts.apiKey ?? process.env.GROQ_API_KEY ?? "").trim();
  if (!apiKey) throw new Error("No GROQ_API_KEY configured");
  const model = opts.model ?? "llama-3.3-70b-versatile";
  const body = {
    model,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.userText },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: 16_384,
  };
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(180_000),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    const err = new Error(`groq ${r.status}: ${text.slice(0, 300)}`);
    (err as Error & { status?: number }).status = r.status;
    throw err;
  }
  type Resp = {
    choices?: Array<{
      message?: { content?: string };
      finish_reason?: string;
    }>;
  };
  const j = (await r.json()) as Resp;
  const text = j.choices?.[0]?.message?.content ?? "";
  if (!text) {
    throw new Error(
      `groq empty (finish=${j.choices?.[0]?.finish_reason ?? "?"})`,
    );
  }
  return { ok: true, value: parseJsonLoose<T>(text), model };
}

/** Convenience: try Gemini (multi-key) first, then Groq as final safety net.
 * Returns whichever completes. */
export async function callJsonResilient<T>(opts: {
  system: string;
  userText: string;
  geminiModel?: string;
  groqModel?: string;
  schemaHint?: string;
}): Promise<{ ok: true; value: T; provider: "gemini" | "groq"; model: string }> {
  try {
    const g = await callGeminiJson<T>({
      model: opts.geminiModel,
      system: opts.system,
      userText: opts.userText,
    });
    return { ok: true, value: g.value, provider: "gemini", model: g.model };
  } catch (geminiErr) {
    if (!process.env.GROQ_API_KEY) throw geminiErr;
    console.error(
      "[llm-fallback] Gemini exhausted, trying Groq —",
      geminiErr instanceof Error ? geminiErr.message : geminiErr,
    );
    const groqText =
      opts.schemaHint
        ? `${opts.userText}\n\nIMPORTANT — your output MUST be a single JSON object matching this schema:\n${opts.schemaHint}\n\nReturn the JSON object now.`
        : opts.userText;
    const g = await callGroqJson<T>({
      model: opts.groqModel,
      system: opts.system,
      userText: groqText,
    });
    return { ok: true, value: g.value, provider: "groq", model: g.model };
  }
}

/** Try every available Gemini key × (primary, secondary) model combo.
 * On 429/quota → next combo. On MALFORMED_FUNCTION_CALL → JSON-mode fallback. */
export async function callGeminiTool<T>(opts: {
  apiKey?: string;
  model?: string;
  system: string;
  userText: string;
  tool: Anthropic.Tool;
}): Promise<GeminiResult<T>> {
  const primary = opts.model ?? "gemini-2.5-flash";
  const secondary =
    primary === "gemini-2.5-flash" ? "gemini-2.0-flash" : "gemini-2.5-flash";

  const keys = opts.apiKey ? [opts.apiKey] : geminiKeys();
  if (keys.length === 0) throw new Error("No Gemini API key configured");

  let lastErr: unknown = new Error("no attempts");
  let malformed = false;
  for (const key of keys) {
    for (const model of [primary, secondary]) {
      try {
        const res = await singleGeminiCall<T>(
          key,
          model,
          opts.system,
          opts.userText,
          opts.tool,
        );
        return { ok: true, args: res.args, model: res.model };
      } catch (err) {
        lastErr = err;
        if (isMalformedFC(err)) {
          malformed = true;
          continue;
        }
        if (isQuotaError(err)) continue;
        if (isTransientStatus(err)) {
          await new Promise((r) => setTimeout(r, 1500));
          try {
            const res = await singleGeminiCall<T>(
              key,
              model,
              opts.system,
              opts.userText,
              opts.tool,
            );
            return { ok: true, args: res.args, model: res.model };
          } catch (err2) {
            lastErr = err2;
            if (isMalformedFC(err2)) malformed = true;
            continue;
          }
        }
        // Other 4XX schema errors — try next model
      }
    }
  }

  // If every key/model combo failed AND at least one was MALFORMED_FUNCTION_CALL,
  // fall back to JSON mode with the schema embedded in the prompt.
  if (malformed) {
    console.error("[llm-fallback] All function-call attempts failed (malformed). Falling back to JSON mode.");
    const schemaHint = JSON.stringify(opts.tool.input_schema);
    const jsonPrompt = `${opts.userText}

IMPORTANT — your output MUST be a single JSON object matching this schema (no markdown, no commentary, JUST the JSON):
${schemaHint}

Return the JSON object now.`;
    const res = await callGeminiJson<T>({
      model: secondary,
      system: opts.system,
      userText: jsonPrompt,
    });
    return { ok: true, args: res.value, model: res.model };
  }

  throw lastErr;
}
