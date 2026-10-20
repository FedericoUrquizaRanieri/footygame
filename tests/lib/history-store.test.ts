import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { HistoryEntry } from "@/domain/stats";
import { MAX_HISTORY, parseHistory, readHistory, recordResult } from "@/lib/history-store";

class FakeStorage {
  private data = new Map<string, string>();
  getItem = (k: string) => this.data.get(k) ?? null;
  setItem = (k: string, v: string) => void this.data.set(k, v);
  removeItem = (k: string) => void this.data.delete(k);
}

const base: HistoryEntry = {
  date: "2026-10-09",
  challengeId: 1,
  result: "won",
  gaveUp: false,
  jumps: 4,
  elapsedMs: 61_000,
  optimalLength: 4,
  difficulty: "normal",
  mode: "daily",
};

beforeEach(() => {
  (globalThis as { window?: unknown }).window = { localStorage: new FakeStorage() };
});
afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("parseHistory", () => {
  it("acepta una lista válida", () => {
    expect(parseHistory(JSON.stringify([base]))).toEqual([base]);
  });

  it("devuelve vacío con datos ausentes, corruptos o de otro tipo", () => {
    expect(parseHistory(null)).toEqual([]);
    expect(parseHistory("{rota")).toEqual([]);
    expect(parseHistory('{"a":1}')).toEqual([]);
    expect(parseHistory("42")).toEqual([]);
  });

  it("descarta solo las entradas inválidas", () => {
    const raw = JSON.stringify([
      base,
      { ...base, date: "09/10/2026" },
      { ...base, result: "empate" },
      { ...base, jumps: "cuatro" },
      { ...base, difficulty: "imposible" },
      { ...base, mode: "otro" },
      null,
      "x",
    ]);
    expect(parseHistory(raw)).toEqual([base]);
  });
});

describe("recordResult / readHistory", () => {
  it("guarda y lee una entrada", () => {
    recordResult(base);
    expect(readHistory()).toEqual([base]);
  });

  it("es idempotente: la misma fecha y modo se reemplaza, no se duplica", () => {
    recordResult(base);
    recordResult({ ...base, jumps: 6 });
    const history = readHistory();
    expect(history).toHaveLength(1);
    expect(history[0].jumps).toBe(6);
  });

  it("cada nivel de la misma fecha se guarda aparte", () => {
    recordResult(base);
    recordResult({ ...base, difficulty: "hard", challengeId: 2 });
    expect(readHistory()).toHaveLength(2);
  });

  it("los niveles viejos se leen como normal (fácil y media) o difícil", () => {
    const raw = JSON.stringify([
      { ...base, difficulty: "easy", date: "2026-10-01" },
      { ...base, difficulty: "medium", date: "2026-10-02" },
      { ...base, difficulty: "hard", date: "2026-10-03" },
    ]);
    expect(parseHistory(raw).map((e) => e.difficulty)).toEqual(["normal", "normal", "hard"]);
  });

  it("el diario y la práctica de la misma fecha conviven", () => {
    recordResult(base);
    recordResult({ ...base, mode: "archive", challengeId: 2 });
    expect(readHistory()).toHaveLength(2);
  });

  it("guarda como máximo MAX_HISTORY entradas, conservando las más recientes", () => {
    for (let i = 0; i < MAX_HISTORY + 5; i++) {
      const day = String((i % 28) + 1).padStart(2, "0");
      const month = String(Math.floor(i / 28) + 1).padStart(2, "0");
      recordResult({ ...base, date: `2025-${month}-${day}`, challengeId: i });
    }
    const history = readHistory();
    expect(history).toHaveLength(MAX_HISTORY);
    expect(history.some((e) => e.challengeId === MAX_HISTORY + 4)).toBe(true);
    expect(history.some((e) => e.challengeId === 0)).toBe(false);
  });

  it("sin almacenamiento disponible no falla", () => {
    delete (globalThis as { window?: unknown }).window;
    expect(() => recordResult(base)).not.toThrow();
    expect(readHistory()).toEqual([]);
  });
});
