/**
 * Genera la cola de desafíos diarios en la tabla `challenges`, con su nivel de dificultad.
 *
 * Uso: npx tsx scripts/pipeline/generate-challenges.ts [opciones]
 *   --days N        días hacia adelante desde hoy que deben tener desafío (por defecto 60)
 *   --back N        días hacia atrás desde hoy que también deben tener desafío, para jugar de práctica (por defecto 0)
 *   --seed N        semilla (la misma semilla reproduce la misma cola)
 *   --regenerate    borra primero los desafíos futuros (los de hoy y anteriores no se tocan)
 *   --recompute     recalcula el nivel de los desafíos existentes sin cambiarlos
 *
 * Reglas (docs/03-data/challenge-generation.md): camino mínimo de 4 a 8 saltos, el nivel del día
 * sigue el patrón semanal, y no se repiten jugadores en una ventana de 60 días.
 */
import pg from "pg";
import { analyzeChallenge } from "../../src/domain/challenge";
import { challengeDateFor } from "../../src/domain/daily-date";
import {
  difficultyOf,
  fameFromRank,
  targetDifficultyFor,
  type Difficulty,
} from "../../src/domain/difficulty";
import { Graph } from "../../src/domain/graph";
import { loadEnvLocal, requireEnv } from "../db/env";

const REPEAT_WINDOW_DAYS = 60;
const MAX_ATTEMPTS_PER_DAY = 6000;
const MIN_LENGTH = 4;
const MAX_LENGTH = 8;

/**
 * Mínima fama de los jugadores que se sortean para cada nivel. Incluso en "difícil" son jugadores que un
 * aficionado conoce: la dificultad tiene que venir del camino (largo y pocos caminos), no de la oscuridad.
 */
const MIN_FAME_FOR: Record<Difficulty, number> = { easy: 0.95, medium: 0.85, hard: 0.7 };

const flag = (name: string) => process.argv.includes(`--${name}`);
function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? Number(process.argv[i + 1]) : fallback;
}

/** PRNG determinista (mulberry32). */
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

const daysBetween = (a: string, b: string): number =>
  Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;

async function main(): Promise<void> {
  loadEnvLocal();
  const days = arg("days", 60);
  const back = arg("back", 0);
  const random = rng(arg("seed", 42));

  const client = new pg.Client({ connectionString: requireEnv("DATABASE_URL_ADMIN") });
  await client.connect();
  try {
    const edges = (
      await client.query("select player_id, club_season_id from player_club_seasons")
    ).rows.map((r) => ({ playerId: Number(r.player_id), clubSeasonId: Number(r.club_season_id) }));
    if (edges.length === 0) throw new Error("No hay datos: ejecutá npm run data:load");
    const graph = new Graph(edges);

    // Fama de cada jugador: posición en el ranking por valor de mercado entre todos los del grafo.
    const ranked = (
      await client.query("select id from players order by market_value_eur desc nulls last, id")
    ).rows
      .map((r) => Number(r.id))
      .filter((id) => graph.hasPlayer(id));
    const fame = new Map(ranked.map((id, i) => [id, fameFromRank(i, ranked.length)]));
    const fameOf = (id: number) => fame.get(id) ?? 0;

    const levelOf = (a: number, b: number) => {
      const analysis = analyzeChallenge(graph, a, b);
      if (!analysis) return null;
      return {
        analysis,
        ...difficultyOf({
          optimalLength: analysis.optimalLength,
          optimalPathsCount: analysis.optimalPathsCount,
          fameA: fameOf(a),
          fameB: fameOf(b),
        }),
      };
    };

    if (flag("recompute")) {
      const rows = (
        await client.query(
          "select id, origin_player_id as o, destination_player_id as d from challenges order by date",
        )
      ).rows;
      for (const r of rows) {
        const result = levelOf(Number(r.o), Number(r.d));
        if (!result) continue;
        await client.query(
          "update challenges set difficulty = $2, difficulty_score = $3 where id = $1",
          [r.id, result.level, result.score],
        );
      }
      console.log(`Nivel recalculado en ${rows.length} desafíos.`);
      return;
    }

    const today = challengeDateFor(Date.now());
    if (flag("regenerate")) {
      const del = await client.query("delete from challenges where date > $1::date", [today]);
      console.log(`Desafíos futuros borrados: ${del.rowCount}`);
    }

    const existing = (
      await client.query(
        `select to_char(date, 'YYYY-MM-DD') as d, origin_player_id as o, destination_player_id as de
           from challenges`,
      )
    ).rows.map((r) => ({ date: r.d as string, players: [Number(r.o), Number(r.de)] }));
    const existingDates = new Set(existing.map((e) => e.date));

    const pools = Object.fromEntries(
      (Object.keys(MIN_FAME_FOR) as Difficulty[]).map((level) => [
        level,
        ranked.filter((id) => fameOf(id) >= MIN_FAME_FOR[level]),
      ]),
    ) as Record<Difficulty, number[]>;

    const wanted: string[] = [];
    for (let i = -back; i < days; i++) {
      const date = addDays(today, i);
      if (!existingDates.has(date)) wanted.push(date);
    }

    const created: { date: string; level: Difficulty; length: number; paths: number }[] = [];
    for (const date of wanted) {
      const target = targetDifficultyFor(date);
      const pool = pools[target];
      const blocked = new Set(
        existing
          .filter((e) => daysBetween(e.date, date) <= REPEAT_WINDOW_DAYS)
          .flatMap((e) => e.players),
      );

      let chosen: { a: number; b: number; result: NonNullable<ReturnType<typeof levelOf>> } | null =
        null;
      for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_DAY && !chosen; attempt++) {
        const a = pool[Math.floor(random() * pool.length)];
        const b = pool[Math.floor(random() * pool.length)];
        if (a === b || blocked.has(a) || blocked.has(b)) continue;
        const result = levelOf(a, b);
        if (!result || result.level !== target) continue;
        const { optimalLength } = result.analysis;
        if (optimalLength < MIN_LENGTH || optimalLength > MAX_LENGTH) continue;
        chosen = { a, b, result };
      }
      if (!chosen) throw new Error(`No se encontró un desafío ${target} para ${date}`);

      const { analysis, level, score } = chosen.result;
      await client.query(
        `insert into challenges
           (date, origin_player_id, destination_player_id, optimal_length, optimal_paths_count,
            optimal_path, difficulty, difficulty_score)
         values ($1::date, $2, $3, $4, $5, $6::jsonb, $7, $8)
         on conflict (date) do nothing`,
        [
          date,
          chosen.a,
          chosen.b,
          analysis.optimalLength,
          analysis.optimalPathsCount,
          JSON.stringify(analysis.optimalPath),
          level,
          score,
        ],
      );
      existing.push({ date, players: [chosen.a, chosen.b] });
      created.push({
        date,
        level,
        length: analysis.optimalLength,
        paths: analysis.optimalPathsCount,
      });
    }

    const count = (key: (c: (typeof created)[number]) => string | number) => {
      const out: Record<string, number> = {};
      for (const c of created) out[String(key(c))] = (out[String(key(c))] ?? 0) + 1;
      return out;
    };
    console.log(`Desafíos creados: ${created.length}.`);
    console.log(
      "Por nivel:",
      count((c) => c.level),
    );
    console.log(
      "Saltos óptimos:",
      count((c) => c.length),
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
