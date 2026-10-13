/**
 * Pipeline paso 5: carga data/processed/*.jsonl en Postgres (idempotente) y valida el resultado.
 * Uso: npx tsx scripts/pipeline/load.ts      (usa DATABASE_URL_ADMIN)
 * Reemplaza por completo club_seasons y player_club_seasons; hace upsert de players y clubs
 * (para no romper desafíos ya generados).
 */
import { createReadStream } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import pg from "pg";
import { normalizeText } from "../../src/domain/search";
import { loadEnvLocal, requireEnv } from "../db/env";

const DIR = resolve(import.meta.dirname, "..", "..", "data", "processed");
const BATCH = 5000;

async function readJsonl<T>(name: string): Promise<T[]> {
  const rows: T[] = [];
  const rl = createInterface({
    input: createReadStream(resolve(DIR, name), "utf8"),
    crlfDelay: Infinity,
  });
  for await (const line of rl) if (line.trim()) rows.push(JSON.parse(line) as T);
  return rows;
}

async function inBatches<T>(rows: T[], fn: (chunk: T[]) => Promise<unknown>): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH) await fn(rows.slice(i, i + BATCH));
}

interface PlayerRow {
  id: number;
  name: string;
  market_value_eur: number | null;
  nationality?: string | null;
  position?: string | null;
}
interface ClubRow {
  id: number;
  name: string;
  country: string | null;
  league: string;
}
interface ClubSeasonRow {
  id: number;
  club_id: number;
  season_year: number;
  label: string;
}
interface EdgeRow {
  player_id: number;
  club_season_id: number;
}

export async function loadAll(adminUrl: string): Promise<Record<string, number>> {
  const [players, clubs, clubSeasons, edges] = await Promise.all([
    readJsonl<PlayerRow>("players.jsonl"),
    readJsonl<ClubRow>("clubs.jsonl"),
    readJsonl<ClubSeasonRow>("club_seasons.jsonl"),
    readJsonl<EdgeRow>("edges.jsonl"),
  ]);
  if (edges.length === 0)
    throw new Error("edges.jsonl está vacío: ejecutá scripts/pipeline/extract.py");

  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    await client.query("begin");

    await inBatches(clubs, (c) =>
      client.query(
        `insert into clubs (id, name, country, league)
         select * from unnest($1::bigint[], $2::text[], $3::text[], $4::text[])
         on conflict (id) do update set name = excluded.name, country = excluded.country, league = excluded.league`,
        [c.map((x) => x.id), c.map((x) => x.name), c.map((x) => x.country), c.map((x) => x.league)],
      ),
    );

    await inBatches(players, (p) =>
      client.query(
        `insert into players (id, name, name_search, market_value_eur, nationality, position)
         select * from unnest($1::bigint[], $2::text[], $3::text[], $4::bigint[], $5::text[], $6::text[])
         on conflict (id) do update set name = excluded.name, name_search = excluded.name_search,
           market_value_eur = excluded.market_value_eur, nationality = excluded.nationality,
           position = excluded.position`,
        [
          p.map((x) => x.id),
          p.map((x) => x.name),
          p.map((x) => normalizeText(x.name)),
          p.map((x) => x.market_value_eur),
          p.map((x) => x.nationality ?? null),
          p.map((x) => x.position ?? null),
        ],
      ),
    );

    await client.query("truncate player_club_seasons, club_seasons");
    await inBatches(clubSeasons, (c) =>
      client.query(
        `insert into club_seasons (id, club_id, season_year, label)
         select * from unnest($1::bigint[], $2::bigint[], $3::int[], $4::text[])`,
        [
          c.map((x) => x.id),
          c.map((x) => x.club_id),
          c.map((x) => x.season_year),
          c.map((x) => x.label),
        ],
      ),
    );
    await inBatches(edges, (e) =>
      client.query(
        `insert into player_club_seasons (player_id, club_season_id)
         select * from unnest($1::bigint[], $2::bigint[])`,
        [e.map((x) => x.player_id), e.map((x) => x.club_season_id)],
      ),
    );

    // Validaciones en la base (si fallan, se revierte todo).
    const check = async (sql: string, label: string) => {
      const n = Number((await client.query(sql)).rows[0].n);
      if (n !== 0) throw new Error(`Validación fallida: ${label} (${n})`);
    };
    await check(
      "select count(*) n from player_club_seasons e left join players p on p.id = e.player_id where p.id is null",
      "aristas sin jugador",
    );
    await check(
      "select count(*) n from club_seasons cs where not exists (select 1 from player_club_seasons e where e.club_season_id = cs.id)",
      "club-temporadas sin jugadores",
    );

    await client.query("analyze players, clubs, club_seasons, player_club_seasons");
    await client.query("commit");

    const counts: Record<string, number> = {};
    for (const t of ["players", "clubs", "club_seasons", "player_club_seasons"]) {
      counts[t] = Number((await client.query(`select count(*) n from ${t}`)).rows[0].n);
    }
    return counts;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  loadEnvLocal();
  const started = Date.now();
  loadAll(requireEnv("DATABASE_URL_ADMIN")).then(
    (counts) =>
      console.log("Carga completa en", ((Date.now() - started) / 1000).toFixed(1), "s", counts),
    (error) => {
      console.error(error.message);
      process.exit(1);
    },
  );
}
