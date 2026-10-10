import type { Graph } from "./graph";
import { playerNode, type NodeRef, type PlayerId } from "./types";

export interface PathAnalysis {
  /** Saltos del camino mínimo (siempre par: el grafo es bipartito). */
  optimalLength: number;
  /** Cantidad de caminos mínimos distintos. */
  optimalPathsCount: number;
  /** Un camino mínimo determinista (se prefiere el descubierto primero, por ids ascendentes). */
  optimalPath: NodeRef[];
}

const keyOf = (n: NodeRef): string => `${n.type === "player" ? "p" : "c"}:${n.id}`;

/** Camino mínimo y cantidad de caminos mínimos entre dos jugadores, o null si no hay desafío posible. */
export function analyzeChallenge(
  graph: Graph,
  originId: PlayerId,
  destinationId: PlayerId,
): PathAnalysis | null {
  if (originId === destinationId) return null;
  if (!graph.hasPlayer(originId) || !graph.hasPlayer(destinationId)) return null;

  const origin = playerNode(originId);
  const destinationKey = keyOf(playerNode(destinationId));
  const dist = new Map<string, number>([[keyOf(origin), 0]]);
  const count = new Map<string, number>([[keyOf(origin), 1]]);
  const parent = new Map<string, NodeRef>();
  const nodes = new Map<string, NodeRef>([[keyOf(origin), origin]]);
  const queue: NodeRef[] = [origin];
  let destDist = Infinity;

  for (let head = 0; head < queue.length; head++) {
    const node = queue[head];
    const nodeKey = keyOf(node);
    const d = dist.get(nodeKey)!;
    if (d >= destDist) break;
    for (const next of graph.neighbors(node)) {
      const nextKey = keyOf(next);
      const known = dist.get(nextKey);
      if (known === undefined) {
        dist.set(nextKey, d + 1);
        count.set(nextKey, count.get(nodeKey)!);
        parent.set(nextKey, node);
        nodes.set(nextKey, next);
        queue.push(next);
        if (nextKey === destinationKey) destDist = d + 1;
      } else if (known === d + 1) {
        count.set(nextKey, count.get(nextKey)! + count.get(nodeKey)!);
      }
    }
  }

  if (!Number.isFinite(destDist)) return null;

  const optimalPath: NodeRef[] = [];
  for (let k: string | undefined = destinationKey; k !== undefined;) {
    optimalPath.push(nodes.get(k)!);
    const p = parent.get(k);
    k = p ? keyOf(p) : undefined;
  }
  optimalPath.reverse();

  return {
    optimalLength: destDist,
    optimalPathsCount: count.get(destinationKey)!,
    optimalPath,
  };
}

export interface ChallengeRules {
  minLength: number;
  maxLength: number;
  minPaths: number;
}

/** Reglas de docs/03-data/challenge-generation.md. */
export const DEFAULT_CHALLENGE_RULES: ChallengeRules = { minLength: 4, maxLength: 8, minPaths: 2 };

export function acceptChallenge(
  analysis: PathAnalysis,
  rules: ChallengeRules = DEFAULT_CHALLENGE_RULES,
): boolean {
  return (
    analysis.optimalLength >= rules.minLength &&
    analysis.optimalLength <= rules.maxLength &&
    analysis.optimalPathsCount >= rules.minPaths
  );
}

export interface OptimalComparison {
  optimalLength: number;
  extraJumps: number;
  isOptimal: boolean;
}

export function compareToOptimal(jumps: number, optimalLength: number): OptimalComparison {
  const extraJumps = jumps - optimalLength;
  return { optimalLength, extraJumps, isOptimal: extraJumps === 0 };
}
