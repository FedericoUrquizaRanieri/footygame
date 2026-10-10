import { afterAll, describe, expect, it } from "vitest";
import { GET as clubSeasonStep } from "@/app/api/nodes/club-season/[id]/route";
import { GET as playerStep } from "@/app/api/nodes/player/[id]/route";
import { closePool } from "@/server/db";
import { hasDb, request } from "../helpers/db";
import { BARCA_2020, MESSI, PSG_2021 } from "../fixtures/mini-graph";

const player = (id: string) =>
  playerStep(request(`/api/nodes/player/${id}`), { params: Promise.resolve({ id }) });
const clubSeason = (id: string) =>
  clubSeasonStep(request(`/api/nodes/club-season/${id}`), { params: Promise.resolve({ id }) });

afterAll(closePool);

describe.skipIf(!hasDb)("GET /api/nodes (integración)", () => {
  it("jugador: devuelve sus club-temporadas, las más recientes primero", async () => {
    const res = await player(String(MESSI));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.player).toEqual({ id: MESSI, name: "Lionel Messi" });
    expect(
      body.items.map(
        (i: { clubName: string; seasonLabel: string }) => `${i.clubName} ${i.seasonLabel}`,
      ),
    ).toEqual([
      "Paris Saint-Germain 2022/23",
      "Paris Saint-Germain 2021/22",
      "FC Barcelona 2020/21",
    ]);
  });

  it("club-temporada: devuelve el plantel con los más conocidos primero", async () => {
    const res = await clubSeason(String(PSG_2021));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.clubSeason).toEqual({
      id: PSG_2021,
      clubName: "Paris Saint-Germain",
      seasonLabel: "2021/22",
    });
    // Mbappé (200 M), Messi (180 M), Neymar (90 M), Di María (65 M)
    expect(body.items.map((p: { name: string }) => p.name)).toEqual([
      "Kylian Mbappé",
      "Lionel Messi",
      "Neymar",
      "Ángel Di María",
    ]);
  });

  it("a igual valor de mercado, ordena por nombre; sin valor, al final", async () => {
    const res = await clubSeason(String(BARCA_2020));
    const names = (await res.json()).items.map((p: { name: string }) => p.name);
    // Messi 180 M, Pedri 100 M, Neymar 90 M
    expect(names).toEqual(["Lionel Messi", "Pedri", "Neymar"]);
  });

  it("solo devuelve el siguiente paso: campos mínimos, sin datos internos", async () => {
    const body = await (await player(String(MESSI))).json();
    expect(Object.keys(body).sort()).toEqual(["items", "player"]);
    expect(Object.keys(body.items[0]).sort()).toEqual(["clubName", "id", "seasonLabel"]);
    const club = await (await clubSeason(String(PSG_2021))).json();
    expect(Object.keys(club.items[0]).sort()).toEqual(["id", "name"]);
  });

  it("es cacheable por CDN", async () => {
    const res = await player(String(MESSI));
    expect(res.headers.get("cache-control")).toMatch(/public, s-maxage=\d+/);
  });

  it("id inexistente: 404", async () => {
    expect((await player("987654321")).status).toBe(404);
    expect((await clubSeason("987654321")).status).toBe(404);
  });
});
