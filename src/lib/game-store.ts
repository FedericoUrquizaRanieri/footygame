import { challengeDateFor } from "@/domain/daily-date";
import type { Difficulty } from "@/domain/difficulty";
import type { GameState } from "@/domain/game";
import { deserializeGame, serializeGame } from "@/domain/persistence";
import type { FinishResult } from "./api-client";

export interface Session {
  game: GameState;
  /** Etiquetas legibles de los nodos del camino, por clave ("p:123", "c:4567"). */
  labels: Record<string, string>;
  result: FinishResult | null;
}

/**
 * Dónde se guarda una partida: un desafío diario (una por nivel, la de hoy) o un desafío pasado (una por fecha y nivel).
 */
export type Scope = { daily: Difficulty } | { archive: string; level: Difficulty };

const PREFIX = "footygame:v1:";

function keys(scope: Scope): { game: string; labels: string; result: string } {
  const base =
    "daily" in scope
      ? `${PREFIX}daily:${scope.daily}:`
      : `${PREFIX}archive:${scope.archive}:${scope.level}:`;
  return { game: `${base}game`, labels: `${base}labels`, result: `${base}result` };
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
    return data &&
      data.valid === true &&
      typeof data.jumps === "number" &&
      Array.isArray(data.optimal?.paths)
      ? (data as FinishResult)
      : null;
  } catch {
    return null;
  }
}

function readSession(scope: Scope): Session | null {
  const k = keys(scope);
  const game = deserializeGame(read(k.game));
  if (!game) return null;
  return { game, labels: parseLabels(read(k.labels)), result: parseResult(read(k.result)) };
}

/** Partida guardada del desafío de hoy en ese nivel, o null si no hay (una partida de otro día se descarta). */
export function readTodaySession(level: Difficulty, now = Date.now()): Session | null {
  const session = readSession({ daily: level });
  if (!session) return null;
  if (session.game.challenge.date !== challengeDateFor(now)) {
    clearSession({ daily: level });
    return null;
  }
  return session;
}

/** Partida guardada de un desafío pasado. Ignora una sesión que corresponda a otra fecha. */
export function readArchiveSession(date: string, level: Difficulty): Session | null {
  const session = readSession({ archive: date, level });
  return session && session.game.challenge.date === date ? session : null;
}

/** Clave de un desafío pasado en `readArchiveStatuses`: "2026-10-12:hard". */
export const archiveKey = (date: string, level: Difficulty): string => `${date}:${level}`;

/** Estado de cada desafío pasado (fecha y nivel) que tiene una partida guardada. */
export function readArchiveStatuses(
  items: readonly { date: string; level: Difficulty }[],
): Record<string, "playing" | "won" | "lost"> {
  const out: Record<string, "playing" | "won" | "lost"> = {};
  for (const { date, level } of items) {
    const status = readArchiveSession(date, level)?.game.status;
    if (status === "playing" || status === "won" || status === "lost") {
      out[archiveKey(date, level)] = status;
    }
  }
  return out;
}

export const writeGame = (game: GameState, scope: Scope): void =>
  write(keys(scope).game, serializeGame(game));
export const writeLabels = (labels: Record<string, string>, scope: Scope): void =>
  write(keys(scope).labels, JSON.stringify(labels));
export const writeResult = (result: FinishResult, scope: Scope): void =>
  write(keys(scope).result, JSON.stringify(result));

export function clearSession(scope: Scope): void {
  const k = keys(scope);
  remove(k.game);
  remove(k.labels);
  remove(k.result);
}
