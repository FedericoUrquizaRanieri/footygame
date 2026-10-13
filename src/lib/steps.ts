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
  /** Código de liga del club (solo en los club-temporadas): dato de la figurita del club. */
  league?: string;
  /** Valor de mercado máximo en euros (solo en los jugadores; puede no haber): dato de la figurita. */
  marketValueEur?: number | null;
  /** País y posición (solo en los jugadores; pueden faltar): los datos fijos de la figurita. */
  nationality?: string | null;
  position?: string | null;
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
  items: { id: number; clubName: string; seasonLabel: string; league?: string }[];
}

interface ClubSeasonStepResponse {
  clubSeason: { id: number; clubName: string; seasonLabel: string };
  items: {
    id: number;
    name: string;
    marketValueEur?: number | null;
    nationality?: string | null;
    position?: string | null;
  }[];
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
      league: i.league,
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
      marketValueEur: p.marketValueEur,
      nationality: p.nationality,
      position: p.position,
    })),
  };
}

/** Clave estable de un nodo, para mapas de etiquetas y caché. */
export const nodeKey = (n: NodeRef): string => `${n.type === "player" ? "p" : "c"}:${n.id}`;

export interface ClubGroup {
  kitId: number;
  name: string;
  seasons: string[];
}

/** Junta las club-temporadas de un jugador por club, conservando el orden (las más recientes primero). */
export function groupByClub(step: Step): ClubGroup[] {
  const groups = new Map<number, ClubGroup>();
  for (const item of step.items) {
    const group = groups.get(item.kitId) ?? { kitId: item.kitId, name: item.label, seasons: [] };
    if (item.sublabel) group.seasons.push(item.sublabel);
    groups.set(item.kitId, group);
  }
  return [...groups.values()];
}
