import type { Difficulty } from "./difficulty";
import type { OptimalRoutes } from "./optimal-routes";
import type { PlayerId } from "./types";

/**
 * Reglas de los dos desafíos diarios. Salen de las pruebas con amigos (playtest/etiquetado_fama_*):
 * el valor de mercado máximo es la mejor señal de a quién se conoce, y el corte útil está en 25 M€
 * (88-94 % de reconocimiento) contra 10 M€ (73-80 %). Ver docs/03-data/challenge-generation.md.
 */
export const NORMAL_MIN_VALUE_EUR = 25_000_000;
/** Piso propio para argentinos: el público de la primera versión los conoce mucho más que a otros. */
export const ARGENTINA_MIN_VALUE_EUR = 8_000_000;
export const HARD_MIN_VALUE_EUR = 10_000_000;

export interface PlayerFacts {
  marketValueEur: number | null;
  /** País en inglés, como lo trae Transfermarkt. */
  nationality: string | null;
}

const value = (p: PlayerFacts): number => p.marketValueEur ?? 0;

/** Jugadores muy conocidos: pueden ser origen o destino del desafío normal. */
export function isNormalPoolPlayer(p: PlayerFacts): boolean {
  return (
    value(p) >= NORMAL_MIN_VALUE_EUR ||
    (p.nationality === "Argentina" && value(p) >= ARGENTINA_MIN_VALUE_EUR)
  );
}

/** Jugadores menos conocidos pero que se pueden resolver: origen y destino del desafío difícil. */
export function isHardPoolPlayer(p: PlayerFacts): boolean {
  return !isNormalPoolPlayer(p) && value(p) >= HARD_MIN_VALUE_EUR;
}

/** Conocido a medias: sirve de intermedio en el desafío normal. */
export function isBroadPoolPlayer(p: PlayerFacts): boolean {
  return isNormalPoolPlayer(p) || isHardPoolPlayer(p);
}

export interface LevelRules {
  /** Saltos permitidos del camino más corto. */
  lengths: readonly number[];
  /** Cantidad de caminos más cortos (distintos por secuencia de jugadores). */
  minRoutes: number;
  maxRoutes: number;
}

export const LEVEL_RULES: Record<Difficulty, LevelRules> = {
  // Un solo intermedio (4 saltos) y de 2 a 5 caminos, como el juego de las películas.
  normal: { lengths: [4], minRoutes: 2, maxRoutes: 5 },
  // Más largo y con pocos caminos, pero con un puente muy conocido para que se pueda resolver.
  hard: { lengths: [4, 6], minRoutes: 1, maxRoutes: 8 },
};

/** Cuántos caminos óptimos se guardan para mostrar al terminar (el máximo de las reglas). */
export const MAX_STORED_ROUTES = 8;

/** Jugadores que están en el medio de algún camino (sin origen ni destino). */
export function intermediatePlayers(routes: OptimalRoutes["routes"]): Set<PlayerId> {
  const out = new Set<PlayerId>();
  for (const route of routes) {
    for (let i = 2; i < route.length - 1; i += 2) out.add(route[i].id);
  }
  return out;
}

/**
 * ¿Sirve este par para el nivel? `facts` da los datos de cualquier jugador. El puente es un intermedio
 * conocido: del pool amplio en el normal, del pool normal (muy conocido) en el difícil.
 */
export function acceptRoutes(
  level: Difficulty,
  analysis: OptimalRoutes,
  facts: (id: PlayerId) => PlayerFacts,
): boolean {
  const rules = LEVEL_RULES[level];
  if (!rules.lengths.includes(analysis.optimalLength)) return false;
  if (analysis.routesCount < rules.minRoutes || analysis.routesCount > rules.maxRoutes)
    return false;
  const known = level === "normal" ? isBroadPoolPlayer : isNormalPoolPlayer;
  for (const id of intermediatePlayers(analysis.routes)) if (known(facts(id))) return true;
  return false;
}
