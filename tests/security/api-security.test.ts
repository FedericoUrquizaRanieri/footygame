import { afterAll, describe, expect, it } from "vitest";
import { GET as clubSeasonStep } from "@/app/api/nodes/club-season/[id]/route";
import { GET as playerStep } from "@/app/api/nodes/player/[id]/route";
import { GET as today } from "@/app/api/challenge/today/route";
import { POST as finish } from "@/app/api/challenge/finish/route";
import { closePool } from "@/server/db";
import { hasDb, request, uniqueIp } from "../helpers/db";

afterAll(closePool);

const player = (id: string, init: RequestInit = {}) =>
  playerStep(request(`/api/nodes/player/${encodeURIComponent(id)}`, init), {
    params: Promise.resolve({ id }),
  });

// S-05: las entradas inválidas se rechazan ANTES de tocar la base (no requieren DB).
describe("S-05 validación de entradas", () => {
  const malicious = [
    "abc",
    "-1",
    "0",
    "1.5",
    "1e3",
    "1;drop table players",
    "1 or 1=1",
    "1' or '1'='1",
    "../../etc/passwd",
    "99999999999999999999",
    "",
    "%00",
  ];

  it.each(malicious)("jugador %j -> 400", async (id) => {
    const res = await player(id);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_id" });
  });

  it.each(malicious)("club-temporada %j -> 400", async (id) => {
    const res = await clubSeasonStep(request(`/api/nodes/club-season/${encodeURIComponent(id)}`), {
      params: Promise.resolve({ id }),
    });
    expect(res.status).toBe(400);
  });
});

// S-06: rate limiting (tampoco toca la base: el id inválido corta antes).
describe("S-06 rate limiting", () => {
  it("tras 120 pedidos por minuto desde una IP responde 429 con Retry-After", async () => {
    const ip = uniqueIp();
    let last: Response | undefined;
    for (let i = 0; i < 121; i++) {
      last = await player("abc", { headers: { "x-forwarded-for": ip } });
    }
    expect(last!.status).toBe(429);
    expect(Number(last!.headers.get("retry-after"))).toBeGreaterThan(0);
    // otra IP no se ve afectada
    expect((await player("abc")).status).toBe(400);
  });

  it("finish tiene un límite más estricto (20 por minuto)", async () => {
    const ip = uniqueIp();
    let last: Response | undefined;
    for (let i = 0; i < 21; i++) {
      last = await finish(
        request("/api/challenge/finish", {
          method: "POST",
          body: "{}",
          headers: { "x-forwarded-for": ip },
        }),
      );
    }
    expect(last!.status).toBe(429);
  });
});

describe("pedidos cross-site", () => {
  it("se rechazan con 403 cuando el navegador declara Sec-Fetch-Site: cross-site", async () => {
    const res = await player("1", { headers: { "sec-fetch-site": "cross-site" } });
    expect(res.status).toBe(403);
  });

  it("same-origin pasa la defensa", async () => {
    const res = await player("abc", { headers: { "sec-fetch-site": "same-origin" } });
    expect(res.status).toBe(400); // pasó el guard y falló por id inválido
  });
});

describe("S-12 los errores no filtran detalles internos", () => {
  it("son códigos simples", async () => {
    const text = await (await player("abc")).text();
    expect(text).not.toMatch(/stack|postgres|pg_|relation|select |at \w+\.\w+/i);
  });
});

describe.skipIf(!hasDb)("S-07 las respuestas no exponen la solución ni datos internos", () => {
  it("challenge/today", async () => {
    const text = await (await today(request("/api/challenge/today"))).text();
    expect(text).not.toMatch(/optimal|market_value|name_search|source|photo/i);
  });

  it("nodes/player", async () => {
    const text = await (await player("1")).text();
    expect(text).not.toMatch(/optimal|market_value|name_search|source|password|url/i);
  });
});
