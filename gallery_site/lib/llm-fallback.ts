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
 * Useful when the target schema is too loose for function-calling. */
export async function callGeminiJson<T>(opts: {
  apiKey: string;
  model?: string;
  system: string;
  userText: string;
}): Promise<{ ok: true; value: T; model: string }> {
  const primary = opts.model ?? "gemini-2.5-flash";
  const secondary =
    primary === "gemini-2.5-flash" ? "gemini-2.0-flash" : "gemini-2.5-flash";

  const tryWithRetry = async (model: string) => {
    try {
      return await singleGeminiText(
        opts.apiKey,
        model,
        opts.system,
        opts.userText,
        "application/json",
      );
    } catch (err) {
      if (!isTransientStatus(err)) throw err;
      await new Promise((r) => setTimeout(r, 2500));
      return singleGeminiText(
        opts.apiKey,
        model,
        opts.system,
        opts.userText,
        "application/json",
      );
    }
  };

  let res;
  try {
    res = await tryWithRetry(primary);
  } catch (err) {
    if (!isTransientStatus(err)) throw err;
    res = await tryWithRetry(secondary);
  }
  return { ok: true, value: parseJsonLoose<T>(res.text), model: res.model };
}

function isMalformedFC(err: unknown): boolean {
  const m = err instanceof Error ? err.message : "";
  return /MALFORMED_FUNCTION_CALL|no function call/i.test(m);
}

/** Try primary model, on transient error retry once after backoff, then try
 * secondary model. On MALFORMED_FUNCTION_CALL (Gemini fails to emit valid
 * function args), fall back to JSON-mode plain generation with the same
 * schema described in the prompt. */
export async function callGeminiTool<T>(opts: {
  apiKey: string;
  model?: string;
  system: string;
  userText: string;
  tool: Anthropic.Tool;
}): Promise<GeminiResult<T>> {
  const primary = opts.model ?? "gemini-2.5-flash";
  const secondary =
    primary === "gemini-2.5-flash" ? "gemini-2.0-flash" : "gemini-2.5-flash";

  const tryWithRetry = async (
    model: string,
  ): Promise<{ args: T; model: string }> => {
    try {
      return await singleGeminiCall<T>(
        opts.apiKey,
        model,
        opts.system,
        opts.userText,
        opts.tool,
      );
    } catch (err) {
      if (!isTransientStatus(err)) throw err;
      await new Promise((r) => setTimeout(r, 2500));
      return singleGeminiCall<T>(
        opts.apiKey,
        model,
        opts.system,
        opts.userText,
        opts.tool,
      );
    }
  };

  try {
    const res = await tryWithRetry(primary);
    return { ok: true, args: res.args, model: res.model };
  } catch (err) {
    // Transient → retry on secondary model
    if (isTransientStatus(err)) {
      try {
        const res = await tryWithRetry(secondary);
        return { ok: true, args: res.args, model: res.model };
      } catch (err2) {
        if (!isMalformedFC(err2)) throw err2;
        // continue to JSON mode below
      }
    } else if (!isMalformedFC(err)) {
      throw err;
    }

    // MALFORMED_FUNCTION_CALL fallback — ask Gemini to return the args
    // object directly via JSON mode. The tool's input_schema describes the
    // shape; we embed it in the prompt so the model knows the contract.
    console.error("[llm-fallback] Gemini function call failed, falling back to JSON mode");
    const schemaHint = JSON.stringify(opts.tool.input_schema);
    const jsonPrompt = `${opts.userText}

IMPORTANT — your output MUST be a single JSON object matching this schema (no markdown, no commentary, JUST the JSON):
${schemaHint}

Return the JSON object now.`;
    const res = await callGeminiJson<T>({
      apiKey: opts.apiKey,
      model: secondary,
      system: opts.system,
      userText: jsonPrompt,
    });
    return { ok: true, args: res.value, model: res.model };
  }
}
