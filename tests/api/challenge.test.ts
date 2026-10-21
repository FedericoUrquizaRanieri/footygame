import { afterAll, describe, expect, it } from "vitest";
import { GET as today } from "@/app/api/challenge/today/route";
import { POST as finish } from "@/app/api/challenge/finish/route";
import { MIN_MS_PER_JUMP } from "@/domain/validate-path";
import { closePool } from "@/server/db";
import { hasDb, request, withClient } from "../helpers/db";
import {
  BARCA_2020,
  COPETTI,
  DI_MARIA,
  MESSI,
  PEDRI,
  PSG_2021,
  ROSARIO_2025,
} from "../fixtures/mini-graph";
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

async function challengeId(date: string, level: "normal" | "hard" = "normal"): Promise<number> {
  return withClient(
    "TEST_DATABASE_URL_ADMIN",
    async (c) =>
      (
        await c.query("select id from challenges where date = $1::date and difficulty = $2", [
          date,
          level,
        ])
      ).rows[0].id,
  );
}

describe.skipIf(!hasDb)("GET /api/challenge/today (integración)", () => {
  it("devuelve los dos desafíos del día (normal y difícil) con origen y destino, y nada más", async () => {
    const res = await today(request("/api/challenge/today"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body).sort()).toEqual(["date", "hard", "normal"]);
    expect(body.date).toBe(testDates().today);
    for (const level of ["normal", "hard"]) {
      expect(Object.keys(body[level]).sort()).toEqual([
        "date",
        "destination",
        "difficulty",
        "id",
        "origin",
      ]);
    }
    expect(body.normal.origin).toEqual({ id: MESSI, name: "Lionel Messi" });
    expect(body.normal.destination).toEqual({ id: COPETTI, name: "Enzo Copetti" });
    expect(body.hard.origin.id).toBe(PEDRI);
  });

  it("informa el nivel de cada desafío", async () => {
    const body = await (await today(request("/api/challenge/today"))).json();
    expect(body.normal.difficulty).toBe("normal");
    expect(body.hard.difficulty).toBe("hard");
  });

  it("no puede haber dos desafíos del mismo nivel en un día", async () => {
    await withClient("TEST_DATABASE_URL_ADMIN", async (c) => {
      await expect(
        c.query(
          `insert into challenges (date, origin_player_id, destination_player_id, optimal_length,
              optimal_paths_count, optimal_path, optimal_paths, difficulty)
             select date, origin_player_id, destination_player_id, optimal_length,
              optimal_paths_count, optimal_path, optimal_paths, difficulty
             from challenges where id = (select min(id) from challenges)`,
        ),
      ).rejects.toMatchObject({ code: "23505" });
    });
  });

  it("los niveles viejos ya no son válidos", async () => {
    await withClient("TEST_DATABASE_URL_ADMIN", async (c) => {
      await expect(
        c.query(
          "update challenges set difficulty = 'easy' where id = (select min(id) from challenges)",
        ),
      ).rejects.toMatchObject({ code: "23514" });
    });
  });

  it("la base solo acepta niveles válidos", async () => {
    await withClient("TEST_DATABASE_URL_ADMIN", async (c) => {
      await expect(
        c.query(
          "update challenges set difficulty = 'imposible' where id = (select min(id) from challenges)",
        ),
      ).rejects.toMatchObject({ code: "23514" });
    });
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
      difficulty: "normal",
    });
    expect(body.optimal.length).toBe(4);
    expect(body.optimal.pathsCount).toBe(1);
    expect(body.optimal.paths).toHaveLength(1);
    expect(body.optimal.paths[0].map((n: { label: string }) => n.label)).toEqual([
      "Lionel Messi",
      "Paris Saint-Germain 2021/22",
      "Ángel Di María",
      "Rosario Central 2025",
      "Enzo Copetti",
    ]);
  });

  it("el difícil devuelve todos los caminos más cortos", async () => {
    const id = await challengeId(testDates().today, "hard");
    const path = [
      { type: "player", id: PEDRI },
      { type: "club-season", id: BARCA_2020 },
      { type: "player", id: MESSI },
      { type: "club-season", id: PSG_2021 },
      { type: "player", id: DI_MARIA },
      { type: "club-season", id: ROSARIO_2025 },
      { type: "player", id: COPETTI },
    ];
    const res = await post({ challengeId: id, path, elapsedMs: 6 * MIN_MS_PER_JUMP + 9000 });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ valid: true, result: "won", difficulty: "hard", isOptimal: true });
    expect(body.optimal.pathsCount).toBe(2);
    expect(body.optimal.paths).toHaveLength(2);
    const middles = body.optimal.paths.map((p: { label: string }[]) => p[2].label);
    expect(middles).toEqual(["Lionel Messi", "Neymar"]);
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

  describe("rendirse (gaveUp)", () => {
    it("un camino incompleto con gaveUp es una derrota válida y muestra el camino más corto", async () => {
      const id = await challengeId(testDates().today);
      const res = await post({
        challengeId: id,
        path: winPath.slice(0, 3),
        elapsedMs: 60_000,
        gaveUp: true,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({ valid: true, result: "lost", jumps: 2, gaveUp: true });
      expect(body.optimal.length).toBe(4);
      expect(body.optimal.paths[0]).toHaveLength(5);
    });

    it("rendirse sin haber hecho saltos también es válido", async () => {
      const id = await challengeId(testDates().today);
      const res = await post({
        challengeId: id,
        path: [winPath[0]],
        elapsedMs: 2_000,
        gaveUp: true,
      });
      expect(res.status).toBe(200);
      expect((await res.json()).jumps).toBe(0);
    });

    it("con gaveUp, un camino que llegó al destino se rechaza", async () => {
      const id = await challengeId(testDates().today);
      const res = await post({ challengeId: id, path: winPath, elapsedMs: 60_000, gaveUp: true });
      expect(res.status).toBe(422);
      const text = await res.text();
      expect(JSON.parse(text).reason).toBe("INVALID_GIVE_UP");
      expect(text).not.toMatch(/optimal/i);
    });

    it("gaveUp debe ser booleano", async () => {
      const res = await post({
        challengeId: 1,
        path: winPath.slice(0, 3),
        elapsedMs: 60_000,
        gaveUp: "si",
      });
      expect(res.status).toBe(400);
    });

    it("sin gaveUp, un camino incompleto sigue rechazándose", async () => {
      const id = await challengeId(testDates().today);
      const res = await post({ challengeId: id, path: winPath.slice(0, 3), elapsedMs: 60_000 });
      expect((await res.json()).reason).toBe("INCOMPLETE");
    });
  });

  it("un desafío pasado se puede cerrar (práctica) y devuelve su resumen", async () => {
    const id = await challengeId(testDates().yesterday);
    // Neymar -> PSG 2021 -> Di María -> Rosario Central 2025 -> Copetti
    const path = [
      { type: "player", id: 4 },
      { type: "club-season", id: PSG_2021 },
      { type: "player", id: DI_MARIA },
      { type: "club-season", id: ROSARIO_2025 },
      { type: "player", id: COPETTI },
    ];
    const res = await post({ challengeId: id, path, elapsedMs: 4 * MIN_MS_PER_JUMP + 5000 });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ valid: true, result: "won", difficulty: "normal" });
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
