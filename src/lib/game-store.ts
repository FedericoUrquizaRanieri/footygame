import { challengeDateFor } from "@/domain/daily-date";
import type { GameState } from "@/domain/game";
import { deserializeGame, serializeGame } from "@/domain/persistence";
import type { FinishResult } from "./api-client";

const GAME_KEY = "footygame:v1:game";
const LABELS_KEY = "footygame:v1:labels";
const RESULT_KEY = "footygame:v1:result";

export interface Session {
  game: GameState;
  /** Etiquetas legibles de los nodos del camino, por clave ("p:123", "c:4567"). */
  labels: Record<string, string>;
  result: FinishResult | null;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null; // modo privado o almacenamiento bloqueado
  }
}

function read(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    storage()?.setItem(key, value);
  } catch {
    // sin almacenamiento disponible: la partida sigue en memoria
  }
}

function remove(key: string): void {
  try {
    storage()?.removeItem(key);
  } catch {
    // nada que borrar
  }
}

function parseLabels(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
    return Object.fromEntries(
      Object.entries(data).filter((e): e is [string, string] => typeof e[1] === "string"),
    );
  } catch {
    return {};
  }
}

function parseResult(raw: string | null): FinishResult | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<FinishResult> | null;
    return data && data.valid === true && typeof data.jumps === "number" && data.optimal
      ? (data as FinishResult)
      : null;
  } catch {
    return null;
  }
}

/** Partida guardada del desafío de hoy, o null si no hay (una partida de otro día se descarta). */
export function readTodaySession(now = Date.now()): Session | null {
  const game = deserializeGame(read(GAME_KEY));
  if (!game) return null;
  if (game.challenge.date !== challengeDateFor(now)) {
    clearSession();
    return null;
  }
  return {
    game,
    labels: parseLabels(read(LABELS_KEY)),
    result: parseResult(read(RESULT_KEY)),
  };
}

export const writeGame = (game: GameState): void => write(GAME_KEY, serializeGame(game));
export const writeLabels = (labels: Record<string, string>): void =>
  write(LABELS_KEY, JSON.stringify(labels));
export const writeResult = (result: FinishResult): void =>
  write(RESULT_KEY, JSON.stringify(result));

export function clearSession(): void {
  remove(GAME_KEY);
  remove(LABELS_KEY);
  remove(RESULT_KEY);
}
