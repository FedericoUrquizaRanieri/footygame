import pg from "pg";
import { analyzeChallenge } from "../../src/domain/challenge";
import { challengeDateFor } from "../../src/domain/daily-date";
import { normalizeText } from "../../src/domain/search";
import {
  BARCA_2020,
  COPETTI,
  DI_MARIA,
  ISOLATED_CLUB,
  ISOLATED_PLAYER,
  JUVE_2022,
  MBAPPE,
  MESSI,
  NEYMAR,
  PEDRI,
  PSG_2021,
  PSG_2022,
  REAL_2013,
  RONALDO,
  ROSARIO_2025,
  VLAHOVIC,
  miniEdges,
  miniGraph,
} from "./mini-graph";

/** Valor de mercado de prueba (€): define el orden "más conocidos primero". */
export const marketValues: Record<number, number | null> = {
  [MESSI]: 180_000_000,
  [MBAPPE]: 200_000_000,
  [NEYMAR]: 90_000_000,
  [DI_MARIA]: 65_000_000,
  [COPETTI]: 6_000_000,
  [VLAHOVIC]: 60_000_000,
  [RONALDO]: 100_000_000,
  [PEDRI]: 100_000_000,
};

export const playerNames: Record<number, string> = {
  [MESSI]: "Lionel Messi",
  [DI_MARIA]: "Ángel Di María",
  [COPETTI]: "Enzo Copetti",
  [NEYMAR]: "Neymar",
  [MBAPPE]: "Kylian Mbappé",
  [VLAHOVIC]: "Dušan Vlahović",
  [RONALDO]: "Cristiano Ronaldo",
  [PEDRI]: "Pedri",
  [ISOLATED_PLAYER]: "Jugador Aislado",
  10: "Otro Aislado",
};

const clubs = [
  { id: 583, name: "Paris Saint-Germain", country: "France", league: "FR1" },
  { id: 131, name: "FC Barcelona", country: "Spain", league: "ES1" },
  { id: 3949, name: "Rosario Central", country: "Argentina", league: "ARG1" },
  { id: 506, name: "Juventus", country: "Italy", league: "IT1" },
  { id: 418, name: "Real Madrid", country: "Spain", league: "ES1" },
  { id: 999, name: "Club Aislado", country: "Nowhere", league: "XX1" },
];

const clubSeasons = [
  { id: PSG_2021, club: 583, year: 2021, label: "2021/22" },
  { id: BARCA_2020, club: 131, year: 2020, label: "2020/21" },
  { id: ROSARIO_2025, club: 3949, year: 2025, label: "2025" },
  { id: PSG_2022, club: 583, year: 2022, label: "2022/23" },
  { id: JUVE_2022, club: 506, year: 2022, label: "2022/23" },
  { id: REAL_2013, club: 418, year: 2013, label: "2013/14" },
  { id: ISOLATED_CLUB, club: 999, year: 2020, label: "2020/21" },
];

/** Días (YYYY-MM-DD, Buenos Aires) usados por los tests. */
export function testDates(now = Date.now()) {
  return {
    today: challengeDateFor(now),
    tomorrow: challengeDateFor(now + 86_400_000),
    yesterday: challengeDateFor(now - 86_400_000),
    twoDaysAgo: challengeDateFor(now - 2 * 86_400_000),
  };
}

export async function seedTestDb(adminUrl: string): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query("begin");
    for (const [id, name] of Object.entries(playerNames)) {
      await client.query(
        "insert into players (id, name, name_search, market_value_eur) values ($1, $2, $3, $4)",
        [id, name, normalizeText(name), marketValues[Number(id)] ?? null],
      );
    }
    for (const c of clubs) {
      await client.query("insert into clubs (id, name, country, league) values ($1, $2, $3, $4)", [
        c.id,
        c.name,
        c.country,
        c.league,
      ]);
    }
    for (const cs of clubSeasons) {
      await client.query(
        "insert into club_seasons (id, club_id, season_year, label) values ($1, $2, $3, $4)",
        [cs.id, cs.club, cs.year, cs.label],
      );
    }
    for (const e of miniEdges) {
      await client.query(
        "insert into player_club_seasons (player_id, club_season_id) values ($1, $2)",
        [e.playerId, e.clubSeasonId],
      );
    }

    const { today, tomorrow } = testDates();
    const todays = analyzeChallenge(miniGraph, MESSI, COPETTI)!;
    const futures = analyzeChallenge(miniGraph, PEDRI, COPETTI)!;
    const insert = `insert into challenges
      (date, origin_player_id, destination_player_id, optimal_length, optimal_paths_count, optimal_path,
       difficulty, difficulty_score)
      values ($1::date, $2, $3, $4, $5, $6::jsonb, $7, $8)`;
    await client.query(insert, [
      today,
      MESSI,
      COPETTI,
      todays.optimalLength,
      todays.optimalPathsCount,
      JSON.stringify(todays.optimalPath),
      "easy",
      -2,
    ]);
    await client.query(insert, [
      tomorrow,
      PEDRI,
      COPETTI,
      futures.optimalLength,
      futures.optimalPathsCount,
      JSON.stringify(futures.optimalPath),
      "hard",
      4,
    ]);
    const { yesterday, twoDaysAgo } = testDates();
    for (const [date, from, level, score] of [
      [yesterday, NEYMAR, "medium", 1],
      [twoDaysAgo, MBAPPE, "hard", 3],
    ] as const) {
      const analysis = analyzeChallenge(miniGraph, from, COPETTI)!;
      await client.query(insert, [
        date,
        from,
        COPETTI,
        analysis.optimalLength,
        analysis.optimalPathsCount,
        JSON.stringify(analysis.optimalPath),
        level,
        score,
      ]);
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}
