import { describe, expect, it } from "vitest";
import {
  DIFFICULTY_BY_WEEKDAY,
  difficultyOf,
  difficultyScore,
  fameFromRank,
  levelFromScore,
  targetDifficultyFor,
} from "@/domain/difficulty";

describe("targetDifficultyFor (patrón semanal)", () => {
  it("lunes y martes son fáciles", () => {
    expect(targetDifficultyFor("2026-10-12")).toBe("easy"); // lunes
    expect(targetDifficultyFor("2026-10-13")).toBe("easy"); // martes
  });

  it("miércoles y jueves son medios", () => {
    expect(targetDifficultyFor("2026-10-14")).toBe("medium"); // miércoles
    expect(targetDifficultyFor("2026-10-15")).toBe("medium"); // jueves
  });

  it("viernes y sábado son difíciles", () => {
    expect(targetDifficultyFor("2026-10-09")).toBe("hard"); // viernes
    expect(targetDifficultyFor("2026-10-10")).toBe("hard"); // sábado
  });

  it("el domingo es medio", () => {
    expect(targetDifficultyFor("2026-10-11")).toBe("medium");
  });

  it("cubre los 7 días de la semana", () => {
    expect(Object.keys(DIFFICULTY_BY_WEEKDAY)).toHaveLength(7);
  });

  it("rechaza fechas con formato inválido", () => {
    expect(() => targetDifficultyFor("09/10/2026")).toThrow();
  });
});

describe("fameFromRank", () => {
  it("el primero del ranking vale 1 y el último 0", () => {
    expect(fameFromRank(0, 100)).toBe(1);
    expect(fameFromRank(99, 100)).toBe(0);
  });

  it("es proporcional en el medio", () => {
    expect(fameFromRank(50, 101)).toBeCloseTo(0.5, 5);
  });

  it("con un solo jugador vale 1", () => {
    expect(fameFromRank(0, 1)).toBe(1);
  });
});

describe("difficultyScore", () => {
  const base = { optimalLength: 4, optimalPathsCount: 5, fameA: 0.7, fameB: 0.7 };

  it("largo del camino: 4 suma 0, 6 suma 2, 8 o más suma 4", () => {
    expect(difficultyScore({ ...base, optimalLength: 4 })).toBe(0);
    expect(difficultyScore({ ...base, optimalLength: 6 })).toBe(2);
    expect(difficultyScore({ ...base, optimalLength: 8 })).toBe(4);
    expect(difficultyScore({ ...base, optimalLength: 10 })).toBe(4);
  });

  it("caminos óptimos: pocos suman, muchos restan", () => {
    expect(difficultyScore({ ...base, optimalPathsCount: 12 })).toBe(-1);
    expect(difficultyScore({ ...base, optimalPathsCount: 10 })).toBe(-1);
    expect(difficultyScore({ ...base, optimalPathsCount: 9 })).toBe(0);
    expect(difficultyScore({ ...base, optimalPathsCount: 4 })).toBe(0);
    expect(difficultyScore({ ...base, optimalPathsCount: 3 })).toBe(1);
    expect(difficultyScore({ ...base, optimalPathsCount: 2 })).toBe(1);
    expect(difficultyScore({ ...base, optimalPathsCount: 1 })).toBe(2);
  });

  it("fama: cuenta el menos conocido de los dos", () => {
    expect(difficultyScore({ ...base, fameA: 0.95, fameB: 0.95 })).toBe(-1);
    expect(difficultyScore({ ...base, fameA: 0.95, fameB: 0.6 })).toBe(0);
    expect(difficultyScore({ ...base, fameA: 0.95, fameB: 0.3 })).toBe(1);
    expect(difficultyScore({ ...base, fameA: 0.95, fameB: 0.05 })).toBe(2);
  });
});

describe("levelFromScore", () => {
  it("define los cortes", () => {
    expect(levelFromScore(-3)).toBe("easy");
    expect(levelFromScore(0)).toBe("easy");
    expect(levelFromScore(1)).toBe("medium");
    expect(levelFromScore(2)).toBe("medium");
    expect(levelFromScore(3)).toBe("hard");
    expect(levelFromScore(7)).toBe("hard");
  });
});

describe("difficultyOf", () => {
  it("jugadores muy conocidos y muchos caminos de 4 saltos: fácil", () => {
    expect(
      difficultyOf({ optimalLength: 4, optimalPathsCount: 17, fameA: 0.97, fameB: 0.95 }),
    ).toEqual({ score: -2, level: "easy" });
  });

  it("4 saltos con pocos caminos y un jugador menos conocido: media", () => {
    expect(
      difficultyOf({ optimalLength: 4, optimalPathsCount: 3, fameA: 0.9, fameB: 0.6 }),
    ).toEqual({ score: 1, level: "medium" });
  });

  it("6 saltos con pocos caminos y un jugador poco conocido: difícil", () => {
    expect(
      difficultyOf({ optimalLength: 6, optimalPathsCount: 2, fameA: 0.8, fameB: 0.3 }),
    ).toEqual({ score: 4, level: "hard" });
  });
});
