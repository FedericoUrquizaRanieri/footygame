import type { Graph } from "./graph";
import { MAX_JUMPS, type Challenge, type NodeRef } from "./types";

/** Tiempo mínimo plausible por salto; evita resultados imposibles enviados al servidor. */
export const MIN_MS_PER_JUMP = 300;

export type PathRejection =
  | "EMPTY_PATH"
  | "WRONG_ORIGIN"
  | "TOO_MANY_JUMPS"
  | "NOT_ALTERNATING"
  | "UNKNOWN_NODE"
  | "NOT_CONNECTED"
  | "DESTINATION_NOT_LAST"
  | "INCOMPLETE"
  | "INVALID_GIVE_UP"
  | "INVALID_TIME";

export type PathVerdict =
  | { valid: true; result: "won" | "lost"; jumps: number; gaveUp?: true }
  | { valid: false; reason: PathRejection };

const reject = (reason: PathRejection): PathVerdict => ({ valid: false, reason });

const exists = (graph: Graph, n: NodeRef): boolean =>
  n.type === "player" ? graph.hasPlayer(n.id) : graph.hasClubSeason(n.id);

/**
 * Valida el camino que reporta el cliente contra el grafo y el desafío.
 * Con `gaveUp`, un camino incompleto (que no llegó al destino) se acepta como derrota por rendición.
 */
export function validatePath(
  graph: Graph,
  challenge: Challenge,
  path: NodeRef[],
  elapsedMs: number,
  options: { gaveUp?: boolean } = {},
): PathVerdict {
  if (path.length === 0) return reject("EMPTY_PATH");

  const first = path[0];
  if (first.type !== "player" || first.id !== challenge.originId) return reject("WRONG_ORIGIN");

  const jumps = path.length - 1;
  if (jumps > MAX_JUMPS) return reject("TOO_MANY_JUMPS");

  for (let i = 1; i < path.length; i++) {
    if (path[i].type === path[i - 1].type) return reject("NOT_ALTERNATING");
  }
  if (!path.every((n) => exists(graph, n))) return reject("UNKNOWN_NODE");
  for (let i = 1; i < path.length; i++) {
    if (!graph.areConnected(path[i - 1], path[i])) return reject("NOT_CONNECTED");
  }

  const isDestination = (n: NodeRef) => n.type === "player" && n.id === challenge.destinationId;
  if (path.slice(0, -1).some(isDestination)) return reject("DESTINATION_NOT_LAST");

  const reachedDestination = isDestination(path[path.length - 1]);
  const gaveUp = options.gaveUp === true;
  // Rendirse solo tiene sentido si no se llegó al destino: si se llegó, fue una victoria.
  if (gaveUp && reachedDestination) return reject("INVALID_GIVE_UP");

  let result: "won" | "lost";
  if (reachedDestination) result = "won";
  else if (jumps === MAX_JUMPS || gaveUp) result = "lost";
  else return reject("INCOMPLETE");

  if (!Number.isFinite(elapsedMs) || elapsedMs < jumps * MIN_MS_PER_JUMP) {
    return reject("INVALID_TIME");
  }

  return gaveUp ? { valid: true, result, jumps, gaveUp: true } : { valid: true, result, jumps };
}
