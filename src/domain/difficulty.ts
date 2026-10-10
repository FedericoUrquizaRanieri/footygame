export type Difficulty = "easy" | "medium" | "hard";

/** Patrón semanal (0 = domingo ... 6 = sábado): arranca fácil y termina el fin de semana difícil. */
export const DIFFICULTY_BY_WEEKDAY: Record<number, Difficulty> = {
  0: "medium", // domingo
  1: "easy", // lunes
  2: "easy", // martes
  3: "medium", // miércoles
  4: "medium", // jueves
  5: "hard", // viernes
  6: "hard", // sábado
};

/** Nivel objetivo de un desafío según el día de la semana de su fecha (YYYY-MM-DD, Buenos Aires). */
export function targetDifficultyFor(date: string): Difficulty {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error(`Fecha inválida: ${date}`);
  const [, y, m, d] = match.map(Number);
  // Es una fecha de calendario, no un instante: se evalúa en UTC para que no dependa de la zona del servidor.
  return DIFFICULTY_BY_WEEKDAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

/** Fama de 0 (el menos conocido) a 1 (el más conocido) según la posición en el ranking por valor de mercado. */
export function fameFromRank(rank: number, total: number): number {
  return total <= 1 ? 1 : 1 - rank / (total - 1);
}

export interface DifficultyInput {
  /** Saltos del camino más corto. */
  optimalLength: number;
  /** Cuántos caminos distintos de ese largo existen. */
  optimalPathsCount: number;
  /** Fama (0 a 1) de cada jugador. */
  fameA: number;
  fameB: number;
}

/**
 * Puntaje de dificultad: largo del camino + escasez de caminos + lo poco conocido que es el menos conocido.
 * Ver docs/03-data/challenge-generation.md.
 */
export function difficultyScore({
  optimalLength,
  optimalPathsCount,
  fameA,
  fameB,
}: DifficultyInput): number {
  const length = optimalLength <= 4 ? 0 : optimalLength <= 6 ? 2 : 4;
  const paths =
    optimalPathsCount >= 10 ? -1 : optimalPathsCount >= 4 ? 0 : optimalPathsCount >= 2 ? 1 : 2;
  const weakest = Math.min(fameA, fameB);
  const fame = weakest >= 0.9 ? -1 : weakest >= 0.5 ? 0 : weakest >= 0.2 ? 1 : 2;
  return length + paths + fame;
}

export function levelFromScore(score: number): Difficulty {
  return score <= 0 ? "easy" : score <= 2 ? "medium" : "hard";
}

export function difficultyOf(input: DifficultyInput): { score: number; level: Difficulty } {
  const score = difficultyScore(input);
  return { score, level: levelFromScore(score) };
}
