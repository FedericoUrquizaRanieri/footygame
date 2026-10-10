export interface RateLimiter {
  check(key: string, now?: number): { ok: boolean; retryAfterSec: number };
}

/**
 * Limitador de ventana fija en memoria. Limitación conocida: en serverless (Vercel) cada instancia
 * tiene su propio contador; para un límite global hay que migrar a un almacén compartido (p. ej. Upstash).
 */
export function createRateLimiter(options: { limit: number; windowMs: number }): RateLimiter {
  const { limit, windowMs } = options;
  const hits = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key, now = Date.now()) {
      if (hits.size > 10_000) {
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
      }
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      return {
        ok: entry.count <= limit,
        retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      };
    },
  };
}

export const nodesLimiter = createRateLimiter({ limit: 120, windowMs: 60_000 });
export const challengeLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });
export const finishLimiter = createRateLimiter({ limit: 20, windowMs: 60_000 });
