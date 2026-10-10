/**
 * Grafo mínimo y determinista para los tests. Datos simplificados (no son datos reales completos).
 *
 * Jugadores: 1 Messi, 2 Di María, 3 Copetti, 4 Neymar, 5 Mbappé, 6 Vlahović, 7 Ronaldo, 13 Pedri,
 *            9 y 10 = aislados (componente separada).
 * Club-temporadas: 10 PSG 2021, 11 Barcelona 2020, 12 Rosario Central 2025, 13 PSG 2022,
 *                  14 Juventus 2022, 15 Real Madrid 2013, 17 club aislado.
 *
 * Caminos relevantes:
 *  - Messi -> Copetti: 4 saltos, 1 camino  (Messi, PSG21, Di María, RC25, Copetti)
 *  - Messi -> Mbappé: 2 saltos, 2 caminos  (PSG21, PSG22)
 *  - Pedri -> Copetti: 6 saltos, 2 caminos (vía Messi o vía Neymar)
 */
import { Graph, type Edge } from "@/domain/graph";
import type { Challenge } from "@/domain/types";

export const MESSI = 1;
export const DI_MARIA = 2;
export const COPETTI = 3;
export const NEYMAR = 4;
export const MBAPPE = 5;
export const VLAHOVIC = 6;
export const RONALDO = 7;
export const PEDRI = 13;
export const ISOLATED_PLAYER = 9;

export const PSG_2021 = 10;
export const BARCA_2020 = 11;
export const ROSARIO_2025 = 12;
export const PSG_2022 = 13;
export const JUVE_2022 = 14;
export const REAL_2013 = 15;
export const ISOLATED_CLUB = 17;

const roster: Record<number, number[]> = {
  [PSG_2021]: [MESSI, DI_MARIA, NEYMAR, MBAPPE],
  [BARCA_2020]: [MESSI, NEYMAR, PEDRI],
  [ROSARIO_2025]: [DI_MARIA, COPETTI],
  [PSG_2022]: [MESSI, NEYMAR, MBAPPE],
  [JUVE_2022]: [DI_MARIA, VLAHOVIC],
  [REAL_2013]: [DI_MARIA, RONALDO],
  [ISOLATED_CLUB]: [ISOLATED_PLAYER, 10],
};

export const miniEdges: Edge[] = Object.entries(roster).flatMap(([cs, players]) =>
  players.map((playerId) => ({ playerId, clubSeasonId: Number(cs) })),
);

export const miniGraph = new Graph(miniEdges);

export const messiToCopetti: Challenge = {
  id: 1,
  date: "2026-10-08",
  originId: MESSI,
  destinationId: COPETTI,
};

export const miniPlayers = [
  { id: MESSI, name: "Lionel Messi" },
  { id: DI_MARIA, name: "Ángel Di María" },
  { id: COPETTI, name: "Enzo Copetti" },
  { id: NEYMAR, name: "Neymar" },
  { id: MBAPPE, name: "Kylian Mbappé" },
];
