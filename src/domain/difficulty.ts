/** Los dos desafíos de cada día: el normal (jugadores muy conocidos) y el difícil (menos conocidos, con un puente). */
export type Difficulty = "normal" | "hard";

/** En el orden en que se muestran. */
export const DIFFICULTIES: readonly Difficulty[] = ["normal", "hard"];

export const isDifficulty = (v: unknown): v is Difficulty => v === "normal" || v === "hard";

/**
 * Los niveles anteriores (fácil, media, difícil) ya no existen. Los resultados viejos guardados en el navegador
 * se leen como "normal" (fácil y media) o "hard" (difícil).
 */
export function difficultyFromLegacy(v: unknown): Difficulty | null {
  if (isDifficulty(v)) return v;
  if (v === "easy" || v === "medium") return "normal";
  return null;
}
