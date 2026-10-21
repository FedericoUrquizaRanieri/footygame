import type { Graph } from "./graph";
import {
  clubSeasonNode,
  playerNode,
  type ClubSeasonId,
  type NodeRef,
  type PlayerId,
} from "./types";

export interface OptimalRoutes {
  /** Saltos del camino más corto (siempre par: el grafo es bipartito). */
  optimalLength: number;
  /** Caminos más cortos distintos por secuencia de jugadores (dos temporadas en el mismo club no suman otro camino). */
  routesCount: number;
  /** Hasta `maxStored` caminos, deterministas, cada uno alternando jugador y club-temporada. */
  routes: NodeRef[][];
}

/** Temporada de un club-temporada. El id es `club * 10000 + año` (ver docs/02-architecture/data-model.md). */
const seasonOf = (id: ClubSeasonId): number => id % 10_000;

/** Club-temporada que se muestra entre dos compañeros: la más reciente que compartieron. */
function sharedClubSeason(graph: Graph, a: PlayerId, b: PlayerId): ClubSeasonId {
  const mine = new Set(graph.clubSeasonsOf(a));
  let best: ClubSeasonId | null = null;
  for (const id of graph.clubSeasonsOf(b)) {
    if (!mine.has(id)) continue;
    if (
      best === null ||
      seasonOf(id) > seasonOf(best) ||
      (seasonOf(id) === seasonOf(best) && id > best)
    ) {
      best = id;
    }
  }
  return best!;
}

/** El grafo es inmutable, así que los compañeros de cada jugador se calculan una sola vez (el generador los pide miles de veces). */
const teammatesCache = new WeakMap<Graph, Map<PlayerId, PlayerId[]>>();

function teammatesOf(graph: Graph, player: PlayerId): PlayerId[] {
  let byPlayer = teammatesCache.get(graph);
  if (!byPlayer) teammatesCache.set(graph, (byPlayer = new Map()));
  const cached = byPlayer.get(player);
  if (cached) return cached;
  const out = new Set<PlayerId>();
  for (const cs of graph.clubSeasonsOf(player)) for (const p of graph.playersOf(cs)) out.add(p);
  out.delete(player);
  const sorted = [...out].sort((x, y) => x - y);
  byPlayer.set(player, sorted);
  return sorted;
}

/**
 * Todos los caminos más cortos entre dos jugadores, contados por secuencia de jugadores: lo que importa
 * al jugar es por quién se pasa, no por cuál de las temporadas compartidas. Devuelve null si no hay camino
 * o si el más corto supera `maxJumps`.
 */
export function findOptimalRoutes(
  graph: Graph,
  originId: PlayerId,
  destinationId: PlayerId,
  { maxStored = 8, maxJumps = 8 }: { maxStored?: number; maxJumps?: number } = {},
): OptimalRoutes | null {
  if (originId === destinationId) return null;
  if (!graph.hasPlayer(originId) || !graph.hasPlayer(destinationId)) return null;

  const maxHops = Math.floor(maxJumps / 2);
  const dist = new Map<PlayerId, number>([[originId, 0]]);
  const count = new Map<PlayerId, number>([[originId, 1]]);
  const preds = new Map<PlayerId, PlayerId[]>();
  const queue: PlayerId[] = [originId];
  let destHops = Infinity;

  for (let head = 0; head < queue.length; head++) {
    const player = queue[head];
    const d = dist.get(player)!;
    if (d >= destHops || d >= maxHops) break;
    for (const next of teammatesOf(graph, player)) {
      const known = dist.get(next);
      if (known === undefined) {
        dist.set(next, d + 1);
        count.set(next, count.get(player)!);
        preds.set(next, [player]);
        queue.push(next);
        if (next === destinationId) destHops = d + 1;
      } else if (known === d + 1) {
        count.set(next, count.get(next)! + count.get(player)!);
        preds.get(next)!.push(player);
      }
    }
  }
  if (!Number.isFinite(destHops)) return null;

  // Recorre hacia atrás desde el destino; con los predecesores ordenados por id sale siempre en el mismo orden.
  const sequences: PlayerId[][] = [];
  const walk = (player: PlayerId, tail: PlayerId[]): void => {
    if (sequences.length >= maxStored) return;
    if (player === originId) {
      sequences.push([originId, ...tail]);
      return;
    }
    for (const prev of [...preds.get(player)!].sort((x, y) => x - y)) walk(prev, [player, ...tail]);
  };
  walk(destinationId, []);

  const routes = sequences.map((seq) => {
    const nodes: NodeRef[] = [playerNode(seq[0])];
    for (let i = 1; i < seq.length; i++) {
      nodes.push(clubSeasonNode(sharedClubSeason(graph, seq[i - 1], seq[i])), playerNode(seq[i]));
    }
    return nodes;
  });

  return { optimalLength: destHops * 2, routesCount: count.get(destinationId)!, routes };
}
