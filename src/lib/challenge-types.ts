import type { Difficulty } from "@/domain/difficulty";

/** Tipos del desafío del día que comparten el servidor y la interfaz (sin código de servidor). */
export interface PlayerSummary {
  id: number;
  name: string;
}

export interface TodaysChallenge {
  id: number;
  date: string;
  origin: PlayerSummary;
  destination: PlayerSummary;
  difficulty: Difficulty;
}
