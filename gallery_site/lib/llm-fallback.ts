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
      maxOutputTokens: 8192,
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

/** Try primary model, on transient error retry once after backoff, then try secondary model. */
export async function callGeminiTool<T>(opts: {
  apiKey: string;
  model?: string;
  system: string;
  userText: string;
  tool: Anthropic.Tool;
}): Promise<GeminiResult<T>> {
  const primary = opts.model ?? "gemini-2.5-flash";
  const secondary =
    primary === "gemini-2.5-flash" ? "gemini-2.0-flash-exp" : "gemini-2.5-flash";

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
    if (!isTransientStatus(err)) throw err;
    const res = await tryWithRetry(secondary);
    return { ok: true, args: res.args, model: res.model };
  }
}
