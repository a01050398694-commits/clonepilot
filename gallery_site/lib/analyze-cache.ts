/**
 * In-memory cache + IP rate-limit for /api/analyze.
 * Free-tier safe: no Redis, no KV cost. Survives single instance lifetime only,
 * which is fine for the free public preview — Vercel keeps warm containers
 * for popular routes anyway.
 */

type CacheEntry<T> = { value: T; expiresAt: number };

const ANALYZE_CACHE = new Map<string, CacheEntry<unknown>>();
const RATE_LIMIT = new Map<string, number[]>();

const ANALYZE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — same video URL → same answer
const RATE_WINDOW_MS = 60 * 1000;            // 1 minute window
const RATE_MAX_PER_WINDOW = 4;               // 4 requests / IP / minute (free)

export function cacheGet<T>(key: string): T | null {
  const e = ANALYZE_CACHE.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) {
    ANALYZE_CACHE.delete(key);
    return null;
  }
  return e.value as T;
}

export function cacheSet<T>(key: string, value: T): void {
  ANALYZE_CACHE.set(key, { value, expiresAt: Date.now() + ANALYZE_TTL_MS });
  if (ANALYZE_CACHE.size > 500) {
    const oldest = ANALYZE_CACHE.keys().next().value;
    if (oldest) ANALYZE_CACHE.delete(oldest);
  }
}

/** Returns null if allowed, otherwise the retry-after milliseconds. */
export function rateLimitCheck(ip: string): number | null {
  const now = Date.now();
  const arr = (RATE_LIMIT.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX_PER_WINDOW) {
    const oldest = arr[0];
    return RATE_WINDOW_MS - (now - oldest);
  }
  arr.push(now);
  RATE_LIMIT.set(ip, arr);
  if (RATE_LIMIT.size > 1000) {
    const oldest = RATE_LIMIT.keys().next().value;
    if (oldest) RATE_LIMIT.delete(oldest);
  }
  return null;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
