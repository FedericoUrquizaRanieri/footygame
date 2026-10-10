import { describe, expect, it } from "vitest";
import { shiftDate } from "@/domain/daily-date";
import { computeStats, type HistoryEntry } from "@/domain/stats";

let seq = 0;
function entry(date: string, over: Partial<HistoryEntry> = {}): HistoryEntry {
  return {
    date,
    challengeId: ++seq,
    result: "won",
    gaveUp: false,
    jumps: 4,
    elapsedMs: 60_000,
    optimalLength: 4,
    difficulty: "medium",
    mode: "daily",
    ...over,
  };
}
const lost = (date: string, over: Partial<HistoryEntry> = {}) =>
  entry(date, { result: "lost", jumps: 20, ...over });

describe("shiftDate", () => {
  it("suma y resta días de calendario", () => {
    expect(shiftDate("2026-10-09", 1)).toBe("2026-10-10");
    expect(shiftDate("2026-10-09", -1)).toBe("2026-10-08");
  });

  it("cruza meses y años", () => {
    expect(shiftDate("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftDate("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("maneja el 29 de febrero", () => {
    expect(shiftDate("2028-02-28", 1)).toBe("2028-02-29");
    expect(shiftDate("2028-03-01", -1)).toBe("2028-02-29");
  });
});

describe("computeStats: totales", () => {
  const today = "2026-10-10";

  it("sin historial, todo en cero", () => {
    expect(computeStats([], today)).toEqual({
      played: 0,
      won: 0,
      lost: 0,
      winRate: 0,
      currentStreak: 0,
      bestStreak: 0,
      bestTimeMs: null,
      averageJumps: null,
      optimalSolves: 0,
    });
  });

  it("cuenta partidas, victorias y derrotas", () => {
    const stats = computeStats(
      [entry("2026-10-08"), lost("2026-10-09"), entry("2026-10-10")],
      today,
    );
    expect(stats).toMatchObject({ played: 3, won: 2, lost: 1 });
    expect(stats.winRate).toBeCloseTo(2 / 3, 5);
  });

  it("mejor tiempo y saltos promedio solo de las victorias", () => {
    const stats = computeStats(
      [
        entry("2026-10-07", { elapsedMs: 90_000, jumps: 6 }),
        entry("2026-10-08", { elapsedMs: 45_000, jumps: 4 }),
        lost("2026-10-09", { elapsedMs: 5_000 }),
      ],
      today,
    );
    expect(stats.bestTimeMs).toBe(45_000);
    expect(stats.averageJumps).toBe(5);
  });

  it("cuenta las veces que se resolvió por el camino más corto", () => {
    const stats = computeStats(
      [
        entry("2026-10-07", { jumps: 4, optimalLength: 4 }),
        entry("2026-10-08", { jumps: 6, optimalLength: 4 }),
        entry("2026-10-09", { jumps: 6, optimalLength: 6 }),
        lost("2026-10-06"),
      ],
      today,
    );
    expect(stats.optimalSolves).toBe(2);
  });

  it("rendirse cuenta como derrota", () => {
    const stats = computeStats(
      [entry("2026-10-09", { result: "lost", gaveUp: true, jumps: 2 })],
      today,
    );
    expect(stats).toMatchObject({ played: 1, won: 0, lost: 1 });
  });

  it("los desafíos de práctica no cuentan", () => {
    const stats = computeStats(
      [entry("2026-10-09", { mode: "archive" }), entry("2026-10-08", { mode: "archive" })],
      today,
    );
    expect(stats.played).toBe(0);
    expect(stats.currentStreak).toBe(0);
  });

  it("si una fecha aparece dos veces, vale la última", () => {
    const stats = computeStats([lost("2026-10-09"), entry("2026-10-09")], today);
    expect(stats).toMatchObject({ played: 1, won: 1 });
  });
});

describe("computeStats: racha", () => {
  const today = "2026-10-10";

  it("días seguidos ganados terminando hoy", () => {
    const history = [entry("2026-10-08"), entry("2026-10-09"), entry("2026-10-10")];
    expect(computeStats(history, today)).toMatchObject({ currentStreak: 3, bestStreak: 3 });
  });

  it("si hoy todavía no se jugó, la racha sigue viva hasta ayer", () => {
    const history = [entry("2026-10-08"), entry("2026-10-09")];
    expect(computeStats(history, today).currentStreak).toBe(2);
  });

  it("si hoy se perdió, la racha se corta", () => {
    const history = [entry("2026-10-08"), entry("2026-10-09"), lost("2026-10-10")];
    expect(computeStats(history, today)).toMatchObject({ currentStreak: 0, bestStreak: 2 });
  });

  it("si ayer no se jugó y hoy tampoco, la racha es 0", () => {
    expect(computeStats([entry("2026-10-07"), entry("2026-10-08")], today).currentStreak).toBe(0);
  });

  it("un día sin jugar en el medio corta la racha", () => {
    const history = [
      entry("2026-10-05"),
      entry("2026-10-06"),
      entry("2026-10-08"),
      entry("2026-10-09"),
    ];
    expect(computeStats(history, today)).toMatchObject({ currentStreak: 2, bestStreak: 2 });
  });

  it("una derrota en el medio corta la racha", () => {
    const history = [
      entry("2026-10-05"),
      entry("2026-10-06"),
      lost("2026-10-07"),
      entry("2026-10-08"),
      entry("2026-10-09"),
      entry("2026-10-10"),
    ];
    expect(computeStats(history, today)).toMatchObject({ currentStreak: 3, bestStreak: 3 });
  });

  it("la mejor racha puede ser anterior a la actual", () => {
    const history = [
      entry("2026-09-01"),
      entry("2026-09-02"),
      entry("2026-09-03"),
      entry("2026-09-04"),
      entry("2026-10-09"),
    ];
    expect(computeStats(history, today)).toMatchObject({ currentStreak: 1, bestStreak: 4 });
  });

  it("no importa el orden en que vienen los datos", () => {
    const history = [entry("2026-10-10"), entry("2026-10-08"), entry("2026-10-09")];
    expect(computeStats(history, today).currentStreak).toBe(3);
  });

  it("cruza el cambio de mes y de año", () => {
    const history = [entry("2026-12-30"), entry("2026-12-31"), entry("2027-01-01")];
    expect(computeStats(history, "2027-01-01").currentStreak).toBe(3);
  });

  it("una victoria de práctica no sostiene la racha del diario", () => {
    const history = [entry("2026-10-08"), entry("2026-10-09", { mode: "archive" })];
    expect(computeStats(history, today).currentStreak).toBe(0);
  });
});
