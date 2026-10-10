import { shiftDate } from "./daily-date";
import type { Difficulty } from "./difficulty";

/** Una partida terminada, tal como se guarda en el historial del navegador. */
export interface HistoryEntry {
  /** Fecha del desafío (YYYY-MM-DD, Buenos Aires). */
  date: string;
  challengeId: number;
  result: "won" | "lost";
  gaveUp: boolean;
  jumps: number;
  elapsedMs: number;
  optimalLength: number;
  difficulty: Difficulty;
  /** "daily" es el desafío del día; "archive" es práctica y no cuenta para la racha ni las estadísticas. */
  mode: "daily" | "archive";
}

export interface Stats {
  played: number;
  won: number;
  lost: number;
  /** Victorias sobre partidas jugadas (0 a 1). */
  winRate: number;
  /** Días seguidos ganados que llegan hasta hoy, o hasta ayer si hoy todavía no se jugó. */
  currentStreak: number;
  bestStreak: number;
  bestTimeMs: number | null;
  /** Saltos promedio de las victorias. */
  averageJumps: number | null;
  /** Victorias resueltas por el camino más corto. */
  optimalSolves: number;
}

/** Largo de cada tramo de fechas consecutivas (ordenadas y sin repetir). */
function runs(sortedDates: string[]): { end: string; length: number }[] {
  const out: { end: string; length: number }[] = [];
  for (const date of sortedDates) {
    const last = out[out.length - 1];
    if (last && shiftDate(last.end, 1) === date) {
      last.end = date;
      last.length += 1;
    } else {
      out.push({ end: date, length: 1 });
    }
  }
  return out;
}

/** Estadísticas del desafío diario. `today` es la fecha de hoy en Buenos Aires. */
export function computeStats(history: readonly HistoryEntry[], today: string): Stats {
  // Solo el diario cuenta; si una fecha aparece dos veces, vale la última.
  const byDate = new Map<string, HistoryEntry>();
  for (const e of history) if (e.mode === "daily") byDate.set(e.date, e);
  const daily = [...byDate.values()];

  const wins = daily.filter((e) => e.result === "won");
  const winDates = wins.map((e) => e.date).sort();
  const winRuns = runs(winDates);

  // La racha sigue viva si el último tramo termina hoy o ayer, salvo que hoy ya se haya perdido.
  const lastRun = winRuns[winRuns.length - 1];
  const lostToday = byDate.get(today)?.result === "lost";
  const alive =
    lastRun && !lostToday && (lastRun.end === today || lastRun.end === shiftDate(today, -1));

  return {
    played: daily.length,
    won: wins.length,
    lost: daily.length - wins.length,
    winRate: daily.length === 0 ? 0 : wins.length / daily.length,
    currentStreak: alive ? lastRun.length : 0,
    bestStreak: winRuns.reduce((max, r) => Math.max(max, r.length), 0),
    bestTimeMs: wins.length === 0 ? null : Math.min(...wins.map((e) => e.elapsedMs)),
    averageJumps:
      wins.length === 0 ? null : wins.reduce((sum, e) => sum + e.jumps, 0) / wins.length,
    optimalSolves: wins.filter((e) => e.jumps === e.optimalLength).length,
  };
}
