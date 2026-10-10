import { z } from "zod";
import type { RateLimiter } from "./rate-limit";

export function json(body: unknown, status = 200, cacheControl = "no-store"): Response {
  return Response.json(body, { status, headers: { "Cache-Control": cacheControl } });
}

export const errorResponse = (status: number, error: string, extra?: HeadersInit): Response =>
  Response.json({ error }, { status, headers: { "Cache-Control": "no-store", ...extra } });

/** IP del cliente. Requiere un proxy de confianza (Vercel pisa x-forwarded-for) para ser fiable. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

/**
 * Defensas comunes a las rutas internas: rechaza pedidos cross-site del navegador y aplica el rate limit.
 * Devuelve una Response si hay que cortar, o null si el pedido puede seguir.
 */
export function guard(request: Request, limiter: RateLimiter, bucket: string): Response | null {
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return errorResponse(403, "forbidden");
  const result = limiter.check(`${bucket}:${clientIp(request)}`);
  if (!result.ok)
    return errorResponse(429, "rate_limited", { "Retry-After": String(result.retryAfterSec) });
  return null;
}

const idSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

/** Parsea un id numérico de la URL; solo acepta dígitos. Devuelve null si es inválido. */
export function parseId(raw: string): number | null {
  if (!/^\d{1,15}$/.test(raw)) return null;
  const parsed = idSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
