/**
 * Genera una cola de desafíos diarios en la tabla `challenges`.
 * Uso: npx tsx scripts/pipeline/generate-challenges.ts [--days 60] [--pool 600] [--seed 42]
 *
 * Reglas (docs/03-data/challenge-generation.md): jugadores conocidos (mayor valor de mercado),
 * camino mínimo de 4 a 8 saltos, al menos 2 caminos mínimos, sin repetir jugadores en 60 días.
 */
import pg from "pg";
import { acceptChallenge, analyzeChallenge } from "../../src/domain/challenge";
import { challengeDateFor } from "../../src/domain/daily-date";
import { Graph } from "../../src/domain/graph";
import { loadEnvLocal, requireEnv } from "../db/env";

const REPEAT_WINDOW_DAYS = 60;
const MAX_ATTEMPTS_PER_DAY = 5000;

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? Number(process.argv[i + 1]) : fallback;
}

/** PRNG determinista (mulberry32) para que la misma semilla reproduzca la misma cola. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

async function main(): Promise<void> {
  loadEnvLocal();
  const days = arg("days", 60);
  const poolSize = arg("pool", 600);
  const random = rng(arg("seed", 42));

  const client = new pg.Client({ connectionString: requireEnv("DATABASE_URL_ADMIN") });
  await client.connect();
  try {
    const edges = (
      await client.query("select player_id, club_season_id from player_club_seasons")
    ).rows.map((r) => ({ playerId: Number(r.player_id), clubSeasonId: Number(r.club_season_id) }));
    if (edges.length === 0) throw new Error("No hay datos: ejecutá npm run data:load");
    const graph = new Graph(edges);

    const pool = (
      await client.query(
        `select id from players where market_value_eur is not null
          order by market_value_eur desc, id limit $1`,
        [poolSize * 2],
      )
    ).rows
      .map((r) => Number(r.id))
      .filter((id) => graph.hasPlayer(id))
      .slice(0, poolSize);

    const last = (
      await client.query("select to_char(max(date), 'YYYY-MM-DD') as d from challenges")
    ).rows[0].d as string | null;
    const today = challengeDateFor(Date.now());
    const firstDate = last && last >= today ? addDays(last, 1) : today;

    const recent = (
      await client.query(
        `select origin_player_id, destination_player_id from challenges
          order by date desc limit $1`,
        [REPEAT_WINDOW_DAYS],
      )
    ).rows;
    const lastUsed: number[][] = recent
      .reverse()
      .map((r) => [Number(r.origin_player_id), Number(r.destination_player_id)]);

    const lengths = new Map<number, number>();
    let created = 0;
    for (let i = 0; i < days; i++) {
      const date = addDays(firstDate, i);
      const blocked = new Set(lastUsed.slice(-REPEAT_WINDOW_DAYS).flat());
      let chosen: {
        a: number;
        b: number;
        analysis: NonNullable<ReturnType<typeof analyzeChallenge>>;
      } | null = null;
      for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_DAY && !chosen; attempt++) {
        const a = pool[Math.floor(random() * pool.length)];
        const b = pool[Math.floor(random() * pool.length)];
        if (a === b || blocked.has(a) || blocked.has(b)) continue;
        const analysis = analyzeChallenge(graph, a, b);
        if (analysis && acceptChallenge(analysis)) chosen = { a, b, analysis };
      }
      if (!chosen) throw new Error(`No se encontró un desafío válido para ${date}`);

      const res = await client.query(
        `insert into challenges
           (date, origin_player_id, destination_player_id, optimal_length, optimal_paths_count, optimal_path)
         values ($1::date, $2, $3, $4, $5, $6::jsonb)
         on conflict (date) do nothing`,
        [
          date,
          chosen.a,
          chosen.b,
          chosen.analysis.optimalLength,
          chosen.analysis.optimalPathsCount,
          JSON.stringify(chosen.analysis.optimalPath),
        ],
      );
      if (res.rowCount) {
        created++;
        lastUsed.push([chosen.a, chosen.b]);
        lengths.set(
          chosen.analysis.optimalLength,
          (lengths.get(chosen.analysis.optimalLength) ?? 0) + 1,
        );
      }
    }
    console.log(`Desafíos creados: ${created} (desde ${firstDate}).`);
    console.log("Saltos óptimos:", Object.fromEntries([...lengths].sort((x, y) => x[0] - y[0])));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
