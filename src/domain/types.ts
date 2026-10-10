export type PlayerId = number;
export type ClubSeasonId = number;

export type NodeRef = { type: "player"; id: PlayerId } | { type: "club-season"; id: ClubSeasonId };

export interface Challenge {
  id: number;
  /** Fecha del desafío, formato YYYY-MM-DD (zona horaria de Buenos Aires). */
  date: string;
  originId: PlayerId;
  destinationId: PlayerId;
}

/** Límite de saltos (selecciones) por partida. */
export const MAX_JUMPS = 20;

export const playerNode = (id: PlayerId): NodeRef => ({ type: "player", id });
export const clubSeasonNode = (id: ClubSeasonId): NodeRef => ({ type: "club-season", id });

export const sameNode = (a: NodeRef, b: NodeRef): boolean => a.type === b.type && a.id === b.id;
