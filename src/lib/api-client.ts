import type { Difficulty } from "@/domain/difficulty";
import type { NodeRef } from "@/domain/types";
import { nodeKey, normalizeClubSeasonStep, normalizePlayerStep, type Step } from "./steps";

const cache = new Map<string, Promise<Step>>();

async function request(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(path, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

/**
 * Carga el siguiente paso de un nodo. Los pasos son datos estáticos, así que se guardan en memoria
 * para que volver a un nodo o precargarlo (al apoyar el dedo o el mouse) sea instantáneo.
 */
export function fetchStep(node: NodeRef): Promise<Step> {
  const key = nodeKey(node);
  const cached = cache.get(key);
  if (cached) return cached;

  const path =
    node.type === "player" ? `/api/nodes/player/${node.id}` : `/api/nodes/club-season/${node.id}`;
  const promise = request(path)
    .then((res) => res.json())
    .then((data) =>
      node.type === "player" ? normalizePlayerStep(data) : normalizeClubSeasonStep(data),
    );
  cache.set(key, promise);
  promise.catch(() => cache.delete(key));
  return promise;
}

/** Precarga sin esperar el resultado ni propagar errores. */
export function prefetchStep(node: NodeRef): void {
  fetchStep(node).catch(() => undefined);
}

export interface FinishResult {
  valid: true;
  difficulty: Difficulty;
  result: "won" | "lost";
  jumps: number;
  elapsedMs: number;
  optimal: {
    length: number;
    /** Cuántos caminos más cortos hay en total; `paths` trae hasta 8. */
    pathsCount: number;
    paths: { type: "player" | "club-season"; id: number; label: string }[][];
  };
  extraJumps: number;
  isOptimal: boolean;
  gaveUp?: true;
}

/** Cierra el intento en el servidor, que valida el camino y devuelve el camino más corto. */
export async function finishChallenge(body: {
  challengeId: number;
  path: NodeRef[];
  elapsedMs: number;
  gaveUp?: boolean;
}): Promise<FinishResult> {
  const res = await fetch("/api/challenge/finish", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as FinishResult;
}
