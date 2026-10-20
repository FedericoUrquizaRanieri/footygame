import { difficultyFromLegacy } from "@/domain/difficulty";
import type { GameState } from "@/domain/game";
import type { HistoryEntry } from "@/domain/stats";
import type { FinishResult } from "./api-client";

const HISTORY_KEY = "footygame:v1:history";

/** Tope de partidas guardadas (más de un año de desafíos diarios). */
export const MAX_HISTORY = 400;

function isEntry(v: unknown): v is HistoryEntry {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    typeof e.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(e.date) &&
    Number.isInteger(e.challengeId) &&
    (e.result === "won" || e.result === "lost") &&
    typeof e.gaveUp === "boolean" &&
    Number.isInteger(e.jumps) &&
    typeof e.elapsedMs === "number" &&
    Number.isFinite(e.elapsedMs) &&
    Number.isInteger(e.optimalLength) &&
    difficultyFromLegacy(e.difficulty) !== null &&
    (e.mode === "daily" || e.mode === "archive")
  );
}

/** Lee el historial guardado; descarta las entradas inválidas y nunca falla. */
export function parseHistory(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    // Los niveles viejos (fácil, media) se leen como "normal".
    return Array.isArray(data)
      ? data.filter(isEntry).map((e) => ({ ...e, difficulty: difficultyFromLegacy(e.difficulty)! }))
      : [];
  } catch {
    return [];
  }
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readHistory(): HistoryEntry[] {
  try {
    return parseHistory(storage()?.getItem(HISTORY_KEY) ?? null);
  } catch {
    return [];
  }
}

/** Guarda una partida terminada. Es idempotente: la misma fecha, modo y nivel se reemplaza. */
export function recordResult(entry: HistoryEntry): void {
  const rest = readHistory().filter(
    (e) => !(e.date === entry.date && e.mode === entry.mode && e.difficulty === entry.difficulty),
  );
  const next = [...rest, entry].sort((a, b) => a.date.localeCompare(b.date)).slice(-MAX_HISTORY);
  try {
    storage()?.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // sin almacenamiento: las estadísticas simplemente no se guardan
  }
}

/** Entrada del historial a partir de una partida terminada y su resultado validado por el servidor. */
export function entryFromResult(
  game: GameState,
  result: FinishResult,
  mode: HistoryEntry["mode"],
): HistoryEntry {
  return {
    date: game.challenge.date,
    challengeId: game.challenge.id,
    result: result.result,
    gaveUp: game.gaveUp === true,
    jumps: result.jumps,
    elapsedMs: result.elapsedMs,
    optimalLength: result.optimal.length,
    difficulty: result.difficulty,
    mode,
  };
}
