import { describe, expect, it } from "vitest";
import {
  clubIdOf,
  groupByClub,
  nodeKey,
  normalizeClubSeasonStep,
  normalizePlayerStep,
} from "@/lib/steps";

describe("normalizePlayerStep", () => {
  const step = normalizePlayerStep({
    player: { id: 28003, name: "Lionel Messi" },
    items: [
      { id: 5832021, clubName: "Paris Saint-Germain", seasonLabel: "2021/22" },
      { id: 5832022, clubName: "Paris Saint-Germain", seasonLabel: "2022/23" },
    ],
  });

  it("identifica el nodo y su título", () => {
    expect(step.node).toEqual({ type: "player", id: 28003 });
    expect(step.title).toBe("Lionel Messi");
  });

  it("convierte las club-temporadas en opciones con etiqueta completa", () => {
    expect(step.items[0]).toEqual({
      node: { type: "club-season", id: 5832021 },
      label: "Paris Saint-Germain",
      sublabel: "2021/22",
      fullLabel: "Paris Saint-Germain 2021/22",
      kitId: 583,
    });
  });

  it("un mismo club conserva el color en todas sus temporadas", () => {
    expect(step.items[0].kitId).toBe(step.items[1].kitId);
  });
});

describe("normalizeClubSeasonStep", () => {
  const step = normalizeClubSeasonStep({
    clubSeason: { id: 5832021, clubName: "Paris Saint-Germain", seasonLabel: "2021/22" },
    items: [
      { id: 28003, name: "Lionel Messi" },
      { id: 45320, name: "Ángel Di María" },
    ],
  });

  it("el título es el club y el subtítulo la temporada", () => {
    expect(step.node).toEqual({ type: "club-season", id: 5832021 });
    expect(step.title).toBe("Paris Saint-Germain");
    expect(step.subtitle).toBe("2021/22");
  });

  it("convierte los jugadores en opciones", () => {
    expect(step.items.map((i) => i.label)).toEqual(["Lionel Messi", "Ángel Di María"]);
    expect(step.items[0].node).toEqual({ type: "player", id: 28003 });
    expect(step.items[0].kitId).toBe(28003);
  });
});

describe("utilidades", () => {
  it("clubIdOf deshace club_id * 10000 + año", () => {
    expect(clubIdOf(583 * 10000 + 2021)).toBe(583);
  });

  it("nodeKey distingue jugadores de club-temporadas con el mismo id", () => {
    expect(nodeKey({ type: "player", id: 7 })).not.toBe(nodeKey({ type: "club-season", id: 7 }));
  });
});

describe("groupByClub", () => {
  const step = normalizePlayerStep({
    player: { id: 1, name: "Jugador" },
    items: [
      { id: 5832023, clubName: "PSG", seasonLabel: "2023/24" },
      { id: 1312020, clubName: "Barcelona", seasonLabel: "2020/21" },
      { id: 5832022, clubName: "PSG", seasonLabel: "2022/23" },
    ],
  });

  it("junta las temporadas de un mismo club", () => {
    expect(groupByClub(step)).toEqual([
      { kitId: 583, name: "PSG", seasons: ["2023/24", "2022/23"] },
      { kitId: 131, name: "Barcelona", seasons: ["2020/21"] },
    ]);
  });

  it("conserva el orden de aparición de los clubes", () => {
    expect(groupByClub(step).map((g) => g.name)).toEqual(["PSG", "Barcelona"]);
  });

  it("un jugador sin clubes devuelve una lista vacía", () => {
    expect(groupByClub({ ...step, items: [] })).toEqual([]);
  });
});
