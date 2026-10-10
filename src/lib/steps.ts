import type { NodeRef } from "@/domain/types";

/** Opción que se muestra en la grilla del juego (un club-temporada o un jugador). */
export interface StepItem {
  node: NodeRef;
  /** Texto principal de la tarjeta. */
  label: string;
  /** Texto secundario (la temporada, en los club-temporadas). */
  sublabel?: string;
  /** Texto completo para guardar en el camino y para filtrar. */
  fullLabel: string;
  /** Id que define los colores de camiseta (el club, no la temporada, para que un club mantenga su color). */
  kitId: number;
}

/** Siguiente paso desde un nodo: qué nodo es y qué se puede elegir a continuación. */
export interface Step {
  node: NodeRef;
  title: string;
  subtitle?: string;
  items: StepItem[];
}

interface PlayerStepResponse {
  player: { id: number; name: string };
  items: { id: number; clubName: string; seasonLabel: string }[];
}

interface ClubSeasonStepResponse {
  clubSeason: { id: number; clubName: string; seasonLabel: string };
  items: { id: number; name: string }[];
}

/** El id de un club-temporada es club_id * 10000 + año (ver docs/02-architecture/data-model.md). */
export const clubIdOf = (clubSeasonId: number): number => Math.floor(clubSeasonId / 10000);

export function normalizePlayerStep(data: PlayerStepResponse): Step {
  return {
    node: { type: "player", id: data.player.id },
    title: data.player.name,
    items: data.items.map((i) => ({
      node: { type: "club-season", id: i.id },
      label: i.clubName,
      sublabel: i.seasonLabel,
      fullLabel: `${i.clubName} ${i.seasonLabel}`,
      kitId: clubIdOf(i.id),
    })),
  };
}

export function normalizeClubSeasonStep(data: ClubSeasonStepResponse): Step {
  return {
    node: { type: "club-season", id: data.clubSeason.id },
    title: data.clubSeason.clubName,
    subtitle: data.clubSeason.seasonLabel,
    items: data.items.map((p) => ({
      node: { type: "player", id: p.id },
      label: p.name,
      fullLabel: p.name,
      kitId: p.id,
    })),
  };
}

/** Clave estable de un nodo, para mapas de etiquetas y caché. */
export const nodeKey = (n: NodeRef): string => `${n.type === "player" ? "p" : "c"}:${n.id}`;
