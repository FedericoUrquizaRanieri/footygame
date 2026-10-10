import { MAX_JUMPS, playerNode, type Challenge, type NodeRef } from "./types";

export type GameStatus = "ready" | "playing" | "won" | "lost";

export interface GameState {
  challenge: Challenge;
  status: GameStatus;
  /** Nodos visitados en orden; el primero es el origen. Saltos = path.length - 1. */
  path: NodeRef[];
  /** Instante (ms epoch) del Start; null hasta que se presiona. */
  startedAt: number | null;
  /** Instante (ms epoch) en que terminó la partida. */
  finishedAt: number | null;
  /** true si la partida terminó porque la persona se rindió (siempre con status "lost"). */
  gaveUp?: boolean;
}

export type GameErrorCode = "NOT_STARTED" | "ALREADY_STARTED" | "FINISHED" | "INVALID_NODE";

export class GameError extends Error {
  constructor(public readonly code: GameErrorCode) {
    super(code);
    this.name = "GameError";
  }
}

export function createGame(challenge: Challenge): GameState {
  return {
    challenge,
    status: "ready",
    path: [playerNode(challenge.originId)],
    startedAt: null,
    finishedAt: null,
  };
}

export function startGame(state: GameState, now: number): GameState {
  if (state.status !== "ready") throw new GameError("ALREADY_STARTED");
  return { ...state, status: "playing", startedAt: now };
}

export const jumpsOf = (state: GameState): number => state.path.length - 1;

export const remainingJumps = (state: GameState): number => MAX_JUMPS - jumpsOf(state);

export const currentNode = (state: GameState): NodeRef => state.path[state.path.length - 1];

export function elapsedMs(state: GameState, now: number): number {
  if (state.startedAt === null) return 0;
  return (state.finishedAt ?? now) - state.startedAt;
}

/**
 * Registra una selección (un salto). No valida que el nodo esté conectado con el actual:
 * eso lo garantiza la lista que muestra la UI y lo verifica `validatePath` en el servidor.
 */
export function selectNode(state: GameState, node: NodeRef, now: number): GameState {
  if (state.status === "ready") throw new GameError("NOT_STARTED");
  if (state.status !== "playing") throw new GameError("FINISHED");
  if (node.type === currentNode(state).type) throw new GameError("INVALID_NODE");

  const path = [...state.path, node];
  const reachedDestination = node.type === "player" && node.id === state.challenge.destinationId;
  const outOfJumps = path.length - 1 >= MAX_JUMPS;
  const status: GameStatus = reachedDestination ? "won" : outOfJumps ? "lost" : "playing";

  return { ...state, path, status, finishedAt: status === "playing" ? null : now };
}

/** Rendirse: la partida termina como derrota y conserva el camino recorrido. */
export function giveUp(state: GameState, now: number): GameState {
  if (state.status === "ready") throw new GameError("NOT_STARTED");
  if (state.status !== "playing") throw new GameError("FINISHED");
  return { ...state, status: "lost", finishedAt: now, gaveUp: true };
}
