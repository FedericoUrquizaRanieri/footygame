import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/server/rate-limit";

describe("createRateLimiter", () => {
  const T = 1_000_000;

  it("permite hasta el límite y bloquea el siguiente pedido", () => {
    const rl = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect([1, 2, 3].map(() => rl.check("ip", T).ok)).toEqual([true, true, true]);
    expect(rl.check("ip", T).ok).toBe(false);
  });

  it("informa cuántos segundos faltan para poder reintentar", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 60_000 });
    rl.check("ip", T);
    expect(rl.check("ip", T + 20_000)).toEqual({ ok: false, retryAfterSec: 40 });
  });

  it("se reinicia al terminar la ventana", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 60_000 });
    rl.check("ip", T);
    expect(rl.check("ip", T + 1000).ok).toBe(false);
    expect(rl.check("ip", T + 60_000).ok).toBe(true);
  });

  it("cada clave tiene su propio contador", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 60_000 });
    rl.check("a", T);
    expect(rl.check("a", T).ok).toBe(false);
    expect(rl.check("b", T).ok).toBe(true);
  });
});
