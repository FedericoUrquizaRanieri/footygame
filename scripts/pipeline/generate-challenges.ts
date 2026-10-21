/**
 * Genera la cola de desafíos diarios en la tabla `challenges`: cada día tiene uno normal y uno difícil.
 *
 * Uso: npx tsx scripts/pipeline/generate-challenges.ts [opciones]
 *   --days N        días hacia adelante desde hoy que deben tener desafíos (por defecto 60)
 *   --back N        días hacia atrás desde hoy que también deben tener desafíos, para jugar de práctica (por defecto 0)
 *   --seed N        semilla (la misma semilla reproduce la misma cola)
 *   --regenerate    borra primero los desafíos futuros (los de hoy y anteriores no se tocan)
 *   --reset         borra TODOS los desafíos antes de generar (hoy, pasados y futuros)
 *
 * Reglas (docs/03-data/challenge-generation.md, código en src/domain/challenge-rules.ts): el normal usa jugadores
 * muy conocidos a 4 saltos con 2 a 5 caminos; el difícil usa jugadores menos conocidos con un puente conocido.
 * No se repite ningún jugador en una ventana de 60 días, entre los dos niveles.
 */
import pg from "pg";
import { challengeDateFor } from "../../src/domain/daily-date";
import {
  LEVEL_RULES,
  MAX_STORED_ROUTES,
  acceptRoutes,
  isHardPoolPlayer,
  isNormalPoolPlayer,
  type PlayerFacts,
} from "../../src/domain/challenge-rules";
import { DIFFICULTIES, type Difficulty } from "../../src/domain/difficulty";
import { Graph } from "../../src/domain/graph";
import { findOptimalRoutes } from "../../src/domain/optimal-routes";
import { loadEnvLocal, requireEnv } from "../db/env";

const REPEAT_WINDOW_DAYS = 60;
const MAX_ATTEMPTS_PER_CHALLENGE = 8000;
const MAX_JUMPS = 6;

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

    const facts = new Map<number, PlayerFacts>(
      (await client.query("select id, market_value_eur, nationality from players")).rows.map(
        (r) => [
          Number(r.id),
          {
            marketValueEur: r.market_value_eur === null ? null : Number(r.market_value_eur),
            nationality: r.nationality,
          },
        ],
      ),
    );
    const factsOf = (id: number): PlayerFacts =>
      facts.get(id) ?? { marketValueEur: null, nationality: null };

    const today = challengeDateFor(Date.now());
    if (flag("reset")) {
      const del = await client.query("delete from challenges");
      console.log(`Desafíos borrados: ${del.rowCount}`);
    } else if (flag("regenerate")) {
      const del = await client.query("delete from challenges where date > $1::date", [today]);
      console.log(`Desafíos futuros borrados: ${del.rowCount}`);
    }

    const existing = (
      await client.query(
        `select to_char(date, 'YYYY-MM-DD') as d, difficulty, origin_player_id as o, destination_player_id as de
           from challenges`,
      )
    ).rows.map((r) => ({
      date: r.d as string,
      difficulty: r.difficulty as Difficulty,
      players: [Number(r.o), Number(r.de)],
    }));
    const taken = new Set(existing.map((e) => `${e.date}:${e.difficulty}`));

    const inGraph = (id: number) => graph.hasPlayer(id);
    const allIds = [...facts.keys()].filter(inGraph).sort((a, b) => a - b);
    const pools: Record<Difficulty, number[]> = {
      normal: allIds.filter((id) => isNormalPoolPlayer(factsOf(id))),
      hard: allIds.filter((id) => isHardPoolPlayer(factsOf(id))),
    };
    console.log(
      `Pool normal: ${pools.normal.length} jugadores · pool difícil: ${pools.hard.length}`,
    );

    const wanted: string[] = [];
    for (let i = -back; i < days; i++) wanted.push(addDays(today, i));

    const created: { level: Difficulty; length: number; routes: number }[] = [];
    for (const date of wanted) {
      for (const level of DIFFICULTIES) {
        if (taken.has(`${date}:${level}`)) continue;
        const pool = pools[level];
        const blocked = new Set(
          existing
            .filter((e) => daysBetween(e.date, date) <= REPEAT_WINDOW_DAYS)
            .flatMap((e) => e.players),
        );

        let chosen: {
          a: number;
          b: number;
          analysis: NonNullable<ReturnType<typeof findOptimalRoutes>>;
        } | null = null;
        for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_CHALLENGE && !chosen; attempt++) {
          const a = pool[Math.floor(random() * pool.length)];
          const b = pool[Math.floor(random() * pool.length)];
          if (a === b || blocked.has(a) || blocked.has(b)) continue;
          const analysis = findOptimalRoutes(graph, a, b, {
            maxStored: MAX_STORED_ROUTES,
            maxJumps: MAX_JUMPS,
          });
          if (!analysis || !acceptRoutes(level, analysis, factsOf)) continue;
          chosen = { a, b, analysis };
        }
        if (!chosen) throw new Error(`No se encontró un desafío ${level} para ${date}`);

        const { analysis } = chosen;
        await client.query(
          `insert into challenges
             (date, origin_player_id, destination_player_id, optimal_length, optimal_paths_count,
              optimal_path, optimal_paths, difficulty, difficulty_score)
           values ($1::date, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, 0)`,
          [
            date,
            chosen.a,
            chosen.b,
            analysis.optimalLength,
            analysis.routesCount,
            JSON.stringify(analysis.routes[0]),
            JSON.stringify(analysis.routes),
            level,
          ],
        );
        existing.push({ date, difficulty: level, players: [chosen.a, chosen.b] });
        created.push({ level, length: analysis.optimalLength, routes: analysis.routesCount });
      }
    }

    const tally = (key: (c: (typeof created)[number]) => string | number) => {
      const out: Record<string, number> = {};
      for (const c of created) out[key(c)] = (out[key(c)] ?? 0) + 1;
      return out;
    };
    console.log(`Desafíos creados: ${created.length}`);
    for (const level of DIFFICULTIES) {
      const rules = LEVEL_RULES[level];
      const mine = created.filter((c) => c.level === level);
      console.log(
        `  ${level} (${rules.lengths.join("/")} saltos, ${rules.minRoutes}-${rules.maxRoutes} caminos): ${mine.length}`,
        "largos:",
        JSON.stringify(
          Object.fromEntries(
            Object.entries(tally((c) => `${c.level}:${c.length}`)).filter(([k]) =>
              k.startsWith(level),
            ),
          ),
        ),
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
