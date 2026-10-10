import { describe, expect, it } from "vitest";
import { Graph } from "@/domain/graph";
import { clubSeasonNode, playerNode } from "@/domain/types";
import {
  BARCA_2020,
  COPETTI,
  DI_MARIA,
  ISOLATED_PLAYER,
  MESSI,
  PSG_2021,
  PSG_2022,
  ROSARIO_2025,
  miniGraph,
} from "../fixtures/mini-graph";

describe("Graph", () => {
  it("devuelve los club-temporadas de un jugador, ordenados", () => {
    expect(miniGraph.clubSeasonsOf(MESSI)).toEqual(
      [PSG_2021, BARCA_2020, PSG_2022].sort((a, b) => a - b),
    );
  });

  it("devuelve los jugadores de un club-temporada, ordenados", () => {
    expect(miniGraph.playersOf(ROSARIO_2025)).toEqual([DI_MARIA, COPETTI].sort((a, b) => a - b));
  });

  it("devuelve listas vacías para ids desconocidos", () => {
    expect(miniGraph.clubSeasonsOf(99999)).toEqual([]);
    expect(miniGraph.playersOf(99999)).toEqual([]);
  });

  it("indica si un nodo existe", () => {
    expect(miniGraph.hasPlayer(MESSI)).toBe(true);
    expect(miniGraph.hasPlayer(99999)).toBe(false);
    expect(miniGraph.hasClubSeason(PSG_2021)).toBe(true);
    expect(miniGraph.hasClubSeason(99999)).toBe(false);
  });

  it("ignora aristas duplicadas", () => {
    const g = new Graph([
      { playerId: 1, clubSeasonId: 10 },
      { playerId: 1, clubSeasonId: 10 },
    ]);
    expect(g.clubSeasonsOf(1)).toEqual([10]);
    expect(g.playersOf(10)).toEqual([1]);
  });

  describe("areConnected", () => {
    it("conecta jugador con su club-temporada en ambos sentidos", () => {
      expect(miniGraph.areConnected(playerNode(MESSI), clubSeasonNode(PSG_2021))).toBe(true);
      expect(miniGraph.areConnected(clubSeasonNode(PSG_2021), playerNode(MESSI))).toBe(true);
    });

    it("no conecta si el jugador no integró ese plantel", () => {
      expect(miniGraph.areConnected(playerNode(MESSI), clubSeasonNode(ROSARIO_2025))).toBe(false);
    });

    it("no conecta nodos del mismo tipo", () => {
      expect(miniGraph.areConnected(playerNode(MESSI), playerNode(DI_MARIA))).toBe(false);
      expect(miniGraph.areConnected(clubSeasonNode(PSG_2021), clubSeasonNode(PSG_2022))).toBe(
        false,
      );
    });

    it("no conecta nodos desconocidos", () => {
      expect(miniGraph.areConnected(playerNode(99999), clubSeasonNode(PSG_2021))).toBe(false);
    });
  });

  describe("neighbors", () => {
    it("de un jugador son sus club-temporadas", () => {
      expect(miniGraph.neighbors(playerNode(COPETTI))).toEqual([clubSeasonNode(ROSARIO_2025)]);
    });

    it("de un club-temporada son sus jugadores", () => {
      expect(miniGraph.neighbors(clubSeasonNode(ROSARIO_2025))).toEqual([
        playerNode(DI_MARIA),
        playerNode(COPETTI),
      ]);
    });

    it("de un nodo aislado/desconocido es vacío", () => {
      expect(miniGraph.neighbors(playerNode(99999))).toEqual([]);
      expect(miniGraph.hasPlayer(ISOLATED_PLAYER)).toBe(true);
    });
  });

  describe("nodos sin aristas conocidas", () => {
    it("se pueden declarar para distinguir 'no existe' de 'no está conectado'", () => {
      const g = new Graph([], { playerIds: [MESSI], clubSeasonIds: [ROSARIO_2025] });
      expect(g.hasPlayer(MESSI)).toBe(true);
      expect(g.hasClubSeason(ROSARIO_2025)).toBe(true);
      expect(g.hasPlayer(DI_MARIA)).toBe(false);
      expect(g.areConnected(playerNode(MESSI), clubSeasonNode(ROSARIO_2025))).toBe(false);
      expect(g.neighbors(playerNode(MESSI))).toEqual([]);
    });
  });
});
