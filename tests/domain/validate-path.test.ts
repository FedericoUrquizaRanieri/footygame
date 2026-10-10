import { describe, expect, it } from "vitest";
import { MIN_MS_PER_JUMP, validatePath } from "@/domain/validate-path";
import { MAX_JUMPS, clubSeasonNode as cs, playerNode as pl, type NodeRef } from "@/domain/types";
import {
  COPETTI,
  DI_MARIA,
  MESSI,
  NEYMAR,
  PSG_2021,
  ROSARIO_2025,
  messiToCopetti,
  miniGraph,
} from "../fixtures/mini-graph";

const winPath: NodeRef[] = [pl(MESSI), cs(PSG_2021), pl(DI_MARIA), cs(ROSARIO_2025), pl(COPETTI)];
const okTime = (jumps: number) => jumps * MIN_MS_PER_JUMP + 5000;

const validate = (path: NodeRef[], elapsed = okTime(Math.max(path.length - 1, 0))) =>
  validatePath(miniGraph, messiToCopetti, path, elapsed);

function bouncePath(jumps: number): NodeRef[] {
  const path: NodeRef[] = [pl(MESSI)];
  for (let i = 1; i <= jumps; i++) path.push(i % 2 === 1 ? cs(PSG_2021) : pl(MESSI));
  return path;
}

describe("validatePath", () => {
  it("acepta un camino ganador y cuenta los saltos", () => {
    expect(validate(winPath)).toEqual({ valid: true, result: "won", jumps: 4 });
  });

  it("acepta un camino perdedor de exactamente 20 saltos", () => {
    expect(validate(bouncePath(MAX_JUMPS))).toEqual({ valid: true, result: "lost", jumps: 20 });
  });

  it("rechaza más de 20 saltos", () => {
    expect(validate(bouncePath(MAX_JUMPS + 2))).toEqual({ valid: false, reason: "TOO_MANY_JUMPS" });
  });

  it("rechaza un camino vacío", () => {
    expect(validate([], 1000)).toEqual({ valid: false, reason: "EMPTY_PATH" });
  });

  it("rechaza si no empieza en el origen del desafío", () => {
    expect(
      validate([pl(NEYMAR), cs(PSG_2021), pl(DI_MARIA), cs(ROSARIO_2025), pl(COPETTI)]),
    ).toEqual({
      valid: false,
      reason: "WRONG_ORIGIN",
    });
  });

  it("rechaza si no alterna jugador / club-temporada", () => {
    expect(validate([pl(MESSI), pl(DI_MARIA)])).toEqual({
      valid: false,
      reason: "NOT_ALTERNATING",
    });
  });

  it("rechaza nodos que no existen", () => {
    expect(validate([pl(MESSI), cs(999_999)])).toEqual({ valid: false, reason: "UNKNOWN_NODE" });
  });

  it("rechaza saltos entre nodos no conectados", () => {
    expect(validate([pl(MESSI), cs(ROSARIO_2025)])).toEqual({
      valid: false,
      reason: "NOT_CONNECTED",
    });
  });

  it("rechaza seguir después de llegar al destino", () => {
    expect(validate([...winPath, cs(ROSARIO_2025)])).toEqual({
      valid: false,
      reason: "DESTINATION_NOT_LAST",
    });
  });

  it("rechaza un camino que no llegó al destino ni al límite", () => {
    expect(validate(winPath.slice(0, 3))).toEqual({ valid: false, reason: "INCOMPLETE" });
  });

  describe("tiempo", () => {
    it("rechaza tiempos negativos o no finitos", () => {
      expect(validate(winPath, -1)).toEqual({ valid: false, reason: "INVALID_TIME" });
      expect(validate(winPath, Number.NaN)).toEqual({ valid: false, reason: "INVALID_TIME" });
      expect(validate(winPath, Number.POSITIVE_INFINITY)).toEqual({
        valid: false,
        reason: "INVALID_TIME",
      });
    });

    it("rechaza tiempos imposiblemente rápidos", () => {
      expect(validate(winPath, 100)).toEqual({ valid: false, reason: "INVALID_TIME" });
    });

    it("acepta el mínimo plausible exacto", () => {
      expect(validate(winPath, 4 * MIN_MS_PER_JUMP)).toEqual({
        valid: true,
        result: "won",
        jumps: 4,
      });
    });
  });
});
