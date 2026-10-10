import type { Difficulty } from "@/domain/difficulty";
import { Graph } from "@/domain/graph";
import type { Challenge, NodeRef } from "@/domain/types";
import type { PlayerSummary, TodaysChallenge } from "@/lib/challenge-types";
import { getPool } from "./db";

/** Desafío completo, incluida la solución. SOLO para uso interno (endpoint finish). */
export interface ChallengeWithSolution {
  challenge: Challenge;
  difficulty: Difficulty;
  optimalLength: number;
  optimalPathsCount: number;
}

const DATE_SQL = "to_char(c.date, 'YYYY-MM-DD')";

export async function getChallengeForDate(date: string): Promise<TodaysChallenge | null> {
  const { rows } = await getPool().query(
    `select c.id, ${DATE_SQL} as date, c.difficulty, o.id as o_id, o.name as o_name, d.id as d_id, d.name as d_name
       from challenges c
       join players o on o.id = c.origin_player_id
       join players d on d.id = c.destination_player_id
      where c.date = $1::date`,
    [date],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    id: r.id,
    date: r.date,
    origin: { id: r.o_id, name: r.o_name },
    destination: { id: r.d_id, name: r.d_name },
    difficulty: r.difficulty,
  };
}

export async function getChallengeWithSolution(id: number): Promise<ChallengeWithSolution | null> {
  const { rows } = await getPool().query(
    `select c.id, ${DATE_SQL} as date, c.origin_player_id, c.destination_player_id,
            c.optimal_length, c.optimal_paths_count, c.difficulty
       from challenges c where c.id = $1`,
    [id],
  );
  const r = rows[0];
  if (!r) return null;
  return {
    challenge: {
      id: r.id,
      date: r.date,
      originId: r.origin_player_id,
      destinationId: r.destination_player_id,
    },
    difficulty: r.difficulty,
    optimalLength: r.optimal_length,
    optimalPathsCount: r.optimal_paths_count,
  };
}

export interface ClubSeasonItem {
  id: number;
  clubName: string;
  seasonLabel: string;
}

export interface PlayerStep {
  player: PlayerSummary;
  items: ClubSeasonItem[];
}

/** Siguiente paso desde un jugador: sus club-temporadas, las más recientes primero. */
export async function getPlayerStep(playerId: number): Promise<PlayerStep | null> {
  const pool = getPool();
  const [player, items] = await Promise.all([
    pool.query("select id, name from players where id = $1", [playerId]),
    pool.query(
      `select cs.id, c.name as club_name, cs.label
         from player_club_seasons e
         join club_seasons cs on cs.id = e.club_season_id
         join clubs c on c.id = cs.club_id
        where e.player_id = $1
        order by cs.season_year desc, c.name`,
      [playerId],
    ),
  ]);
  if (player.rows.length === 0) return null;
  return {
    player: player.rows[0],
    items: items.rows.map((r) => ({ id: r.id, clubName: r.club_name, seasonLabel: r.label })),
  };
}

export interface ClubSeasonStep {
  clubSeason: ClubSeasonItem;
  items: PlayerSummary[];
}

/** Siguiente paso desde un club-temporada: el plantel, con los más conocidos primero. */
export async function getClubSeasonStep(clubSeasonId: number): Promise<ClubSeasonStep | null> {
  const pool = getPool();
  const [cs, items] = await Promise.all([
    pool.query(
      `select cs.id, c.name as club_name, cs.label
         from club_seasons cs join clubs c on c.id = cs.club_id where cs.id = $1`,
      [clubSeasonId],
    ),
    pool.query(
      `select p.id, p.name
         from player_club_seasons e join players p on p.id = e.player_id
        where e.club_season_id = $1
        order by p.market_value_eur desc nulls last, p.name_search`,
      [clubSeasonId],
    ),
  ]);
  const r = cs.rows[0];
  if (!r) return null;
  return {
    clubSeason: { id: r.id, clubName: r.club_name, seasonLabel: r.label },
    items: items.rows,
  };
}

/**
 * Grafo parcial para validar un camino sin cargar el grafo completo: contiene solo las aristas entre
 * pares consecutivos del camino y declara qué nodos del camino existen en la base.
 */
export async function getPathGraph(path: NodeRef[]): Promise<Graph> {
  const pool = getPool();
  const pairPlayers: number[] = [];
  const pairClubSeasons: number[] = [];
  for (let i = 1; i < path.length; i++) {
    const [a, b] = [path[i - 1], path[i]];
    if (a.type === b.type) continue; // el dominio lo rechaza como NOT_ALTERNATING
    pairPlayers.push(a.type === "player" ? a.id : b.id);
    pairClubSeasons.push(a.type === "player" ? b.id : a.id);
  }
  const playerIds = [...new Set(path.filter((n) => n.type === "player").map((n) => n.id))];
  const clubSeasonIds = [...new Set(path.filter((n) => n.type === "club-season").map((n) => n.id))];

  const [edges, players, clubSeasons] = await Promise.all([
    pairPlayers.length === 0
      ? Promise.resolve({ rows: [] as { player_id: number; club_season_id: number }[] })
      : pool.query(
          `select e.player_id, e.club_season_id
             from player_club_seasons e
             join unnest($1::bigint[], $2::bigint[]) as q(p, c)
               on q.p = e.player_id and q.c = e.club_season_id`,
          [pairPlayers, pairClubSeasons],
        ),
    pool.query("select id from players where id = any($1::bigint[])", [playerIds]),
    pool.query("select id from club_seasons where id = any($1::bigint[])", [clubSeasonIds]),
  ]);
  return new Graph(
    edges.rows.map((r) => ({ playerId: r.player_id, clubSeasonId: r.club_season_id })),
    { playerIds: players.rows.map((r) => r.id), clubSeasonIds: clubSeasons.rows.map((r) => r.id) },
  );
}

export interface LabeledNode {
  type: "player" | "club-season";
  id: number;
  label: string;
}

/** Camino óptimo del desafío con etiquetas legibles. Solo se llama después de validar el intento. */
export async function getOptimalPathLabeled(challengeId: number): Promise<LabeledNode[]> {
  const pool = getPool();
  const { rows } = await pool.query("select optimal_path from challenges where id = $1", [
    challengeId,
  ]);
  const path = (rows[0]?.optimal_path ?? []) as NodeRef[];
  const playerIds = path.filter((n) => n.type === "player").map((n) => n.id);
  const csIds = path.filter((n) => n.type === "club-season").map((n) => n.id);
  const [pl, cs] = await Promise.all([
    pool.query("select id, name from players where id = any($1::bigint[])", [playerIds]),
    pool.query(
      `select cs.id, c.name || ' ' || cs.label as label
         from club_seasons cs join clubs c on c.id = cs.club_id where cs.id = any($1::bigint[])`,
      [csIds],
    ),
  ]);
  const pName = new Map<number, string>(pl.rows.map((r) => [r.id, r.name]));
  const cName = new Map<number, string>(cs.rows.map((r) => [r.id, r.label]));
  return path.map((n) => ({
    type: n.type,
    id: n.id,
    label: (n.type === "player" ? pName.get(n.id) : cName.get(n.id)) ?? String(n.id),
  }));
}
