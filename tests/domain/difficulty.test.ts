import { describe, expect, it } from "vitest";
import { DIFFICULTIES, difficultyFromLegacy, isDifficulty } from "@/domain/difficulty";

describe("niveles de dificultad", () => {
  it("hay dos: normal y difícil, en ese orden", () => {
    expect(DIFFICULTIES).toEqual(["normal", "hard"]);
  });

  it("isDifficulty solo acepta los niveles vigentes", () => {
    expect(isDifficulty("normal")).toBe(true);
    expect(isDifficulty("hard")).toBe(true);
    expect(isDifficulty("easy")).toBe(false);
    expect(isDifficulty("medium")).toBe(false);
    expect(isDifficulty(undefined)).toBe(false);
  });

  it("los niveles viejos se convierten: fácil y media pasan a normal", () => {
    expect(difficultyFromLegacy("easy")).toBe("normal");
    expect(difficultyFromLegacy("medium")).toBe("normal");
    expect(difficultyFromLegacy("hard")).toBe("hard");
    expect(difficultyFromLegacy("normal")).toBe("normal");
  });

  it("algo desconocido no se convierte", () => {
    expect(difficultyFromLegacy("imposible")).toBeNull();
    expect(difficultyFromLegacy(3)).toBeNull();
  });
});
