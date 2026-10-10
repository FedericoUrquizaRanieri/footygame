import { describe, expect, it } from "vitest";
import {
  DEFAULT_CHALLENGE_RULES,
  acceptChallenge,
  analyzeChallenge,
  compareToOptimal,
} from "@/domain/challenge";
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
  ROSARIO_2025,
  miniGraph,
} from "../fixtures/mini-graph";

describe("analyzeChallenge", () => {
  it("Messi -> Copetti: 4 saltos, un camino, y devuelve el camino", () => {
    const a = analyzeChallenge(miniGraph, MESSI, COPETTI);
    expect(a).toEqual({
      optimalLength: 4,
      optimalPathsCount: 1,
      optimalPath: [pl(MESSI), cs(PSG_2021), pl(DI_MARIA), cs(ROSARIO_2025), pl(COPETTI)],
    });
  });

  it("compañeros directos: 2 saltos y cuenta todos los caminos mínimos", () => {
    expect(analyzeChallenge(miniGraph, MESSI, MBAPPE)?.optimalLength).toBe(2);
    expect(analyzeChallenge(miniGraph, MESSI, MBAPPE)?.optimalPathsCount).toBe(2);
    expect(analyzeChallenge(miniGraph, MESSI, NEYMAR)?.optimalPathsCount).toBe(3);
  });

  it("Pedri -> Copetti: 6 saltos, 2 caminos; el camino devuelto es determinista (ids menores)", () => {
    const a = analyzeChallenge(miniGraph, PEDRI, COPETTI);
    expect(a?.optimalLength).toBe(6);
    expect(a?.optimalPathsCount).toBe(2);
    expect(a?.optimalPath).toEqual([
      pl(PEDRI),
      cs(BARCA_2020),
      pl(MESSI),
      cs(PSG_2021),
      pl(DI_MARIA),
      cs(ROSARIO_2025),
      pl(COPETTI),
    ]);
  });

  it("devuelve null si origen y destino son el mismo jugador", () => {
    expect(analyzeChallenge(miniGraph, MESSI, MESSI)).toBeNull();
  });

  it("devuelve null si algún jugador no existe", () => {
    expect(analyzeChallenge(miniGraph, 99999, MESSI)).toBeNull();
    expect(analyzeChallenge(miniGraph, MESSI, 99999)).toBeNull();
  });

  it("devuelve null si no hay camino (componentes distintas)", () => {
    expect(analyzeChallenge(miniGraph, MESSI, ISOLATED_PLAYER)).toBeNull();
  });
});

describe("acceptChallenge", () => {
  const base = { optimalLength: 4, optimalPathsCount: 2, optimalPath: [] };

  it("expone las reglas por defecto documentadas", () => {
    expect(DEFAULT_CHALLENGE_RULES).toEqual({ minLength: 4, maxLength: 8, minPaths: 2 });
  });

  it("acepta un desafío dentro de las reglas", () => {
    expect(acceptChallenge(base)).toBe(true);
  });

  it("rechaza compañeros directos (demasiado fácil)", () => {
    expect(acceptChallenge({ ...base, optimalLength: 2 })).toBe(false);
  });

  it("rechaza caminos más largos que el máximo", () => {
    expect(acceptChallenge({ ...base, optimalLength: 10 })).toBe(false);
  });

  it("rechaza si hay menos caminos que el mínimo exigido", () => {
    expect(acceptChallenge({ ...base, optimalPathsCount: 1 })).toBe(false);
  });

  it("acepta los límites exactos", () => {
    expect(acceptChallenge({ ...base, optimalLength: 8 })).toBe(true);
    expect(acceptChallenge({ ...base, optimalLength: 4, optimalPathsCount: 2 })).toBe(true);
  });

  it("permite reglas personalizadas", () => {
    const rules = { minLength: 2, maxLength: 6, minPaths: 1 };
    expect(acceptChallenge({ ...base, optimalLength: 2, optimalPathsCount: 1 }, rules)).toBe(true);
    expect(acceptChallenge({ ...base, optimalLength: 8 }, rules)).toBe(false);
  });
});

describe("compareToOptimal", () => {
  it("camino óptimo: 0 saltos de más", () => {
    expect(compareToOptimal(4, 4)).toEqual({ optimalLength: 4, extraJumps: 0, isOptimal: true });
  });

  it("calcula los saltos de más", () => {
    expect(compareToOptimal(7, 4)).toEqual({ optimalLength: 4, extraJumps: 3, isOptimal: false });
  });

  it("en una derrota (20 saltos) también compara", () => {
    expect(compareToOptimal(20, 4)).toEqual({ optimalLength: 4, extraJumps: 16, isOptimal: false });
  });
});
