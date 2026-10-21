import { describe, expect, it } from "vitest";
import { findOptimalRoutes } from "@/domain/optimal-routes";
import { Graph } from "@/domain/graph";
import { clubSeasonNode as cs, playerNode as pl } from "@/domain/types";
import {
  BARCA_2020,
  COPETTI,
  DI_MARIA,
  ISOLATED_PLAYER,
  MBAPPE,
  MESSI,
  NEYMAR,
  PEDRI,
  PSG_2021,
  PSG_2022,
  ROSARIO_2025,
  miniGraph,
} from "../fixtures/mini-graph";

describe("findOptimalRoutes", () => {
  it("Messi -> Copetti: 4 saltos y un único camino", () => {
    expect(findOptimalRoutes(miniGraph, MESSI, COPETTI)).toEqual({
      optimalLength: 4,
      routesCount: 1,
      routes: [[pl(MESSI), cs(PSG_2021), pl(DI_MARIA), cs(ROSARIO_2025), pl(COPETTI)]],
    });
  });

  it("Pedri -> Copetti: 6 saltos y dos caminos (por Messi o por Neymar), en orden estable", () => {
    const found = findOptimalRoutes(miniGraph, PEDRI, COPETTI)!;
    expect(found.optimalLength).toBe(6);
    expect(found.routesCount).toBe(2);
    expect(found.routes).toEqual([
      [
        pl(PEDRI),
        cs(BARCA_2020),
        pl(MESSI),
        cs(PSG_2021),
        pl(DI_MARIA),
        cs(ROSARIO_2025),
        pl(COPETTI),
      ],
      [
        pl(PEDRI),
        cs(BARCA_2020),
        pl(NEYMAR),
        cs(PSG_2021),
        pl(DI_MARIA),
        cs(ROSARIO_2025),
        pl(COPETTI),
      ],
    ]);
  });

  it("compañeros: 2 saltos, y dos temporadas compartidas cuentan como un solo camino", () => {
    const found = findOptimalRoutes(miniGraph, MESSI, MBAPPE)!;
    expect(found.optimalLength).toBe(2);
    expect(found.routesCount).toBe(1);
    // Comparten PSG 2021 y PSG 2022: se muestra la más reciente (en los datos reales: club * 10000 + año).
    expect(found.routes).toEqual([[pl(MESSI), cs(PSG_2022), pl(MBAPPE)]]);
  });

  it("con la temporada en el id real, elige la más reciente", () => {
    const graph = new Graph([
      { playerId: 1, clubSeasonId: 5 * 10_000 + 2019 },
      { playerId: 2, clubSeasonId: 5 * 10_000 + 2019 },
      { playerId: 1, clubSeasonId: 5 * 10_000 + 2023 },
      { playerId: 2, clubSeasonId: 5 * 10_000 + 2023 },
      { playerId: 1, clubSeasonId: 9 * 10_000 + 2012 },
      { playerId: 2, clubSeasonId: 9 * 10_000 + 2012 },
    ]);
    expect(findOptimalRoutes(graph, 1, 2)!.routes).toEqual([[pl(1), cs(5 * 10_000 + 2023), pl(2)]]);
  });

  it("maxStored limita los caminos guardados pero no la cantidad total", () => {
    const found = findOptimalRoutes(miniGraph, PEDRI, COPETTI, { maxStored: 1 })!;
    expect(found.routesCount).toBe(2);
    expect(found.routes).toHaveLength(1);
  });

  it("maxJumps corta la búsqueda: un camino más largo devuelve null", () => {
    expect(findOptimalRoutes(miniGraph, PEDRI, COPETTI, { maxJumps: 4 })).toBeNull();
    expect(findOptimalRoutes(miniGraph, PEDRI, COPETTI, { maxJumps: 6 })).not.toBeNull();
  });

  it("devuelve null sin camino, con el mismo jugador o con jugadores desconocidos", () => {
    expect(findOptimalRoutes(miniGraph, MESSI, ISOLATED_PLAYER)).toBeNull();
    expect(findOptimalRoutes(miniGraph, MESSI, MESSI)).toBeNull();
    expect(findOptimalRoutes(miniGraph, MESSI, 99999)).toBeNull();
  });

  it("todos los caminos son válidos: alternan jugador y club-temporada y están conectados", () => {
    const found = findOptimalRoutes(miniGraph, PEDRI, COPETTI)!;
    for (const route of found.routes) {
      expect(route).toHaveLength(found.optimalLength + 1);
      for (let i = 1; i < route.length; i++) {
        expect(route[i].type).not.toBe(route[i - 1].type);
        expect(miniGraph.areConnected(route[i - 1], route[i])).toBe(true);
      }
    }
  });
});
