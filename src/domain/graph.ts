import {
  clubSeasonNode,
  playerNode,
  type ClubSeasonId,
  type NodeRef,
  type PlayerId,
} from "./types";

/** Arista: el jugador integró el plantel de ese club-temporada. */
export interface Edge {
  playerId: PlayerId;
  clubSeasonId: ClubSeasonId;
}

function addTo(map: Map<number, Set<number>>, key: number, value: number): void {
  const set = map.get(key);
  if (set) set.add(value);
  else map.set(key, new Set([value]));
}

const sortedList = (map: Map<number, Set<number>>, key: number): number[] =>
  [...(map.get(key) ?? [])].sort((a, b) => a - b);

/** Grafo bipartito jugador <-> club-temporada. Inmutable una vez construido. */
export class Graph {
  private readonly byPlayer = new Map<PlayerId, Set<ClubSeasonId>>();
  private readonly byClubSeason = new Map<ClubSeasonId, Set<PlayerId>>();

  /**
   * `known` declara nodos que existen aunque no se hayan cargado sus aristas (grafos parciales),
   * para distinguir "no existe" de "no está conectado".
   */
  constructor(
    edges: Iterable<Edge>,
    known: { playerIds?: Iterable<PlayerId>; clubSeasonIds?: Iterable<ClubSeasonId> } = {},
  ) {
    for (const { playerId, clubSeasonId } of edges) {
      addTo(this.byPlayer, playerId, clubSeasonId);
      addTo(this.byClubSeason, clubSeasonId, playerId);
    }
    for (const id of known.playerIds ?? [])
      if (!this.byPlayer.has(id)) this.byPlayer.set(id, new Set());
    for (const id of known.clubSeasonIds ?? [])
      if (!this.byClubSeason.has(id)) this.byClubSeason.set(id, new Set());
  }

  hasPlayer(id: PlayerId): boolean {
    return this.byPlayer.has(id);
  }

  hasClubSeason(id: ClubSeasonId): boolean {
    return this.byClubSeason.has(id);
  }

  clubSeasonsOf(playerId: PlayerId): ClubSeasonId[] {
    return sortedList(this.byPlayer, playerId);
  }

  playersOf(clubSeasonId: ClubSeasonId): PlayerId[] {
    return sortedList(this.byClubSeason, clubSeasonId);
  }

  areConnected(a: NodeRef, b: NodeRef): boolean {
    if (a.type === "player" && b.type === "club-season") {
      return this.byPlayer.get(a.id)?.has(b.id) ?? false;
    }
    if (a.type === "club-season" && b.type === "player") {
      return this.byClubSeason.get(a.id)?.has(b.id) ?? false;
    }
    return false;
  }

  /** Nodos del siguiente paso, ordenados por id. */
  neighbors(node: NodeRef): NodeRef[] {
    return node.type === "player"
      ? this.clubSeasonsOf(node.id).map(clubSeasonNode)
      : this.playersOf(node.id).map(playerNode);
  }
}
