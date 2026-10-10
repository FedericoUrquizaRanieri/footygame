import { afterAll, describe, expect, it } from "vitest";
import { GET as today } from "@/app/api/challenge/today/route";
import { POST as finish } from "@/app/api/challenge/finish/route";
import { MIN_MS_PER_JUMP } from "@/domain/validate-path";
import { closePool } from "@/server/db";
import { hasDb, request, withClient } from "../helpers/db";
import { COPETTI, DI_MARIA, MESSI, PSG_2021, ROSARIO_2025 } from "../fixtures/mini-graph";
import { testDates } from "../fixtures/db-seed";

afterAll(closePool);

const winPath = [
  { type: "player", id: MESSI },
  { type: "club-season", id: PSG_2021 },
  { type: "player", id: DI_MARIA },
  { type: "club-season", id: ROSARIO_2025 },
  { type: "player", id: COPETTI },
];

const post = (body: unknown, init: RequestInit = {}) =>
  finish(
    request("/api/challenge/finish", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
      ...init,
    }),
  );

async function challengeId(date: string): Promise<number> {
  return withClient(
    "TEST_DATABASE_URL_ADMIN",
    async (c) =>
      (await c.query("select id from challenges where date = $1::date", [date])).rows[0].id,
  );
}

describe.skipIf(!hasDb)("GET /api/challenge/today (integración)", () => {
  it("devuelve origen y destino del día, y nada más", async () => {
    const res = await today(request("/api/challenge/today"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(["date", "destination", "id", "origin"]);
    expect(body.date).toBe(testDates().today);
    expect(body.origin).toEqual({ id: MESSI, name: "Lionel Messi" });
    expect(body.destination).toEqual({ id: COPETTI, name: "Enzo Copetti" });
  });

  it("no filtra la solución", async () => {
    const text = await (await today(request("/api/challenge/today"))).text();
    expect(text).not.toMatch(/optimal/i);
  });
});

describe.skipIf(!hasDb)("POST /api/challenge/finish (integración)", () => {
  it("camino ganador válido: resumen con el camino óptimo completo", async () => {
    const id = await challengeId(testDates().today);
    const res = await post({
      challengeId: id,
      path: winPath,
      elapsedMs: 4 * MIN_MS_PER_JUMP + 9000,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      valid: true,
      result: "won",
      jumps: 4,
      extraJumps: 0,
      isOptimal: true,
    });
    expect(body.optimal.length).toBe(4);
    expect(body.optimal.path.map((n: { label: string }) => n.label)).toEqual([
      "Lionel Messi",
      "Paris Saint-Germain 2021/22",
      "Ángel Di María",
      "Rosario Central 2025",
      "Enzo Copetti",
    ]);
  });

  it("camino inválido: 422 y sin ninguna pista de la solución", async () => {
    const id = await challengeId(testDates().today);
    const bad = [winPath[0], { type: "club-season", id: ROSARIO_2025 }]; // Messi no jugó en Rosario Central
    const res = await post({ challengeId: id, path: bad, elapsedMs: 60_000 });
    expect(res.status).toBe(422);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ valid: false, reason: "NOT_CONNECTED" });
    expect(text).not.toMatch(/optimal/i);
  });

  it("tiempo imposible: rechazado", async () => {
    const id = await challengeId(testDates().today);
    const res = await post({ challengeId: id, path: winPath, elapsedMs: 50 });
    expect(res.status).toBe(422);
    expect((await res.json()).reason).toBe("INVALID_TIME");
  });

  it("camino incompleto: rechazado", async () => {
    const id = await challengeId(testDates().today);
    const res = await post({ challengeId: id, path: winPath.slice(0, 3), elapsedMs: 60_000 });
    expect((await res.json()).reason).toBe("INCOMPLETE");
  });

  it("un desafío futuro no existe todavía: 404 (no se puede espiar la solución)", async () => {
    const id = await challengeId(testDates().tomorrow);
    const res = await post({ challengeId: id, path: winPath, elapsedMs: 60_000 });
    expect(res.status).toBe(404);
    expect(await res.text()).not.toMatch(/optimal/i);
  });

  it("desafío inexistente: 404", async () => {
    const res = await post({ challengeId: 987654, path: winPath, elapsedMs: 60_000 });
    expect(res.status).toBe(404);
  });

  it("cuerpo inválido: 400", async () => {
    expect((await post("{no es json")).status).toBe(400);
    expect((await post({ challengeId: "1", path: winPath, elapsedMs: 5000 })).status).toBe(400);
    expect((await post({ challengeId: 1, path: [], elapsedMs: 5000 })).status).toBe(400);
    expect((await post({ challengeId: 1, path: winPath, elapsedMs: -5 })).status).toBe(400);
    expect(
      (await post({ challengeId: 1, path: [{ type: "stadium", id: 1 }], elapsedMs: 5000 })).status,
    ).toBe(400);
  });

  it("más de 21 nodos: 400", async () => {
    const path = Array.from({ length: 22 }, (_, i) => ({
      type: i % 2 ? "club-season" : "player",
      id: 1,
    }));
    expect((await post({ challengeId: 1, path, elapsedMs: 100_000 })).status).toBe(400);
  });

  it("cuerpo gigante: 413", async () => {
    expect((await post("x".repeat(20_000))).status).toBe(413);
  });
});
