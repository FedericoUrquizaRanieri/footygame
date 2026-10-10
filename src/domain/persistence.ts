import type { GameState, GameStatus } from "./game";
import { MAX_JUMPS, type Challenge, type NodeRef } from "./types";

export const STORAGE_VERSION = 1;

const STATUSES: readonly GameStatus[] = ["ready", "playing", "won", "lost"];

export function serializeGame(game: GameState): string {
  return JSON.stringify({ version: STORAGE_VERSION, game });
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isId = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v);

function parseNode(v: unknown): NodeRef | null {
  if (!isRecord(v) || !isId(v.id)) return null;
  if (v.type === "player") return { type: "player", id: v.id };
  if (v.type === "club-season") return { type: "club-season", id: v.id };
  return null;
}

function parseChallenge(v: unknown): Challenge | null {
  if (!isRecord(v)) return null;
  const { id, date, originId, destinationId } = v;
  if (!isId(id) || typeof date !== "string" || !isId(originId) || !isId(destinationId)) return null;
  return { id, date, originId, destinationId };
}

/** Restaura una partida desde el almacenamiento local. Devuelve null si falta algo o es inconsistente. */
export function deserializeGame(raw: string | null): GameState | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(data) || data.version !== STORAGE_VERSION || !isRecord(data.game)) return null;

  const g = data.game;
  const challenge = parseChallenge(g.challenge);
  const status = g.status as GameStatus;
  if (!challenge || !STATUSES.includes(status) || !Array.isArray(g.path)) return null;

  const path: NodeRef[] = [];
  for (const item of g.path) {
    const node = parseNode(item);
    if (!node) return null;
    path.push(node);
  }
  const first = path[0];
  if (!first || first.type !== "player" || first.id !== challenge.originId) return null;
  if (path.length - 1 > MAX_JUMPS) return null;
  for (let i = 1; i < path.length; i++) {
    if (path[i].type === path[i - 1].type) return null;
  }

  const { startedAt, finishedAt, gaveUp } = g;
  if (gaveUp !== undefined && typeof gaveUp !== "boolean") return null;
  if (gaveUp === true && status !== "lost") return null;
  if (startedAt !== null && typeof startedAt !== "number") return null;
  if (finishedAt !== null && typeof finishedAt !== "number") return null;

  if (status === "ready") {
    if (startedAt !== null || finishedAt !== null || path.length !== 1) return null;
  } else {
    if (startedAt === null) return null;
    if (status === "playing") {
      if (finishedAt !== null) return null;
    } else {
      if (finishedAt === null || finishedAt < startedAt) return null;
    }
  }
  if (status === "won") {
    const last = path[path.length - 1];
    if (last.type !== "player" || last.id !== challenge.destinationId) return null;
  }

  return {
    challenge,
    status,
    path,
    startedAt,
    finishedAt,
    ...(gaveUp === true ? { gaveUp: true } : {}),
  };
}

/**
 * Aplica la regla de cambio de día: una partida en curso de un desafío anterior se cierra como derrota;
 * una partida sin iniciar de un día anterior se descarta (null); las terminadas quedan como están.
 */
export function settleStaleGame(game: GameState, today: string, now: number): GameState | null {
  if (game.challenge.date === today) return game;
  if (game.status === "ready") return null;
  if (game.status === "playing") return { ...game, status: "lost", finishedAt: now };
  return game;
}
