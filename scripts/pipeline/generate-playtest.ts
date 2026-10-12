/**
 * Genera desafíos de prueba para comparar dos sistemas de generación con amigos, sin que sepan cuál es cuál.
 * Rellena los días inmediatamente anteriores al primer desafío existente (quedan en el archivo, jugables como práctica)
 * con la mitad de cada sistema, mismos niveles en ambos, en orden aleatorio. Escribe playtest/mapping.csv con la respuesta.
 *
 * Uso: npx tsx scripts/pipeline/generate-playtest.ts [--count 20] [--seed 7]
 * Sistema "old": pools de fama 0.95 / 0.85 / 0.70 (fácil / media / difícil). Sistema "new": 0.95 / 0.90 / 0.85.
 */
import { writeFileSync } from "node:fs";
import pg from "pg";
import { analyzeChallenge } from "../../src/domain/challenge";
import { difficultyOf, fameFromRank, type Difficulty } from "../../src/domain/difficulty";
import { Graph } from "../../src/domain/graph";
import { loadEnvLocal, requireEnv } from "../db/env";

const POOLS: Record<"old" | "new", Record<Difficulty, number>> = {
  old: { easy: 0.95, medium: 0.85, hard: 0.7 },
  new: { easy: 0.95, medium: 0.9, hard: 0.85 },
};
const TIER_SLOTS: Difficulty[] = ["easy", "easy", "easy", "medium", "medium", "medium", "medium", "hard", "hard", "hard"];
const REPEAT_WINDOW_DAYS = 60;
const MAX_ATTEMPTS = 20000;

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? Number(process.argv[i + 1]) : fallback;
}
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
const addDays = (date: string, days: number): string => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};
const daysBetween = (a: string, b: string): number =>
  Math.abs(Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;

async function main(): Promise<void> {
  loadEnvLocal();
  const count = arg("count", 20);
  if (count !== TIER_SLOTS.length * 2) throw new Error(`--count debe ser ${TIER_SLOTS.length * 2}`);
  const random = rng(arg("seed", 7));
  const shuffle = <T,>(xs: T[]): T[] => {
    const a = [...xs];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const client = new pg.Client({ connectionString: requireEnv("DATABASE_URL_ADMIN") });
  await client.connect();
  try {
    const graph = new Graph(
      (await client.query("select player_id, club_season_id from player_club_seasons")).rows.map((r) => ({
        playerId: Number(r.player_id),
        clubSeasonId: Number(r.club_season_id),
      })),
    );
    const ranked = (await client.query("select id from players order by market_value_eur desc nulls last, id")).rows
      .map((r) => Number(r.id))
      .filter((id) => graph.hasPlayer(id));
    const fame = new Map(ranked.map((id, i) => [id, fameFromRank(i, ranked.length)]));
    const fameOf = (id: number) => fame.get(id) ?? 0;

    const existing = (
      await client.query(
        "select to_char(date, 'YYYY-MM-DD') as d, origin_player_id as o, destination_player_id as de from challenges",
      )
    ).rows.map((r) => ({ date: r.d as string, players: [Number(r.o), Number(r.de)] }));
    const first = existing.map((e) => e.date).sort()[0];
    const dates = Array.from({ length: count }, (_, i) => addDays(first, -count + i));
    if (dates.some((d) => existing.some((e) => e.date === d))) throw new Error("Hay desafíos en el rango; ya se generó?");

    const slots = shuffle([
      ...TIER_SLOTS.map((tier) => ({ system: "old" as const, tier })),
      ...TIER_SLOTS.map((tier) => ({ system: "new" as const, tier })),
    ]);

    const rows: string[] = ["date,system,tier,optimal_length,optimal_paths,origin,destination"];
    for (let i = 0; i < count; i++) {
      const date = dates[i];
      const { system, tier } = slots[i];
      const pool = ranked.filter((id) => fameOf(id) >= POOLS[system][tier]);
      const blocked = new Set(
        existing.filter((e) => daysBetween(e.date, date) <= REPEAT_WINDOW_DAYS).flatMap((e) => e.players),
      );
      let done = false;
      for (let attempt = 0; attempt < MAX_ATTEMPTS && !done; attempt++) {
        const a = pool[Math.floor(random() * pool.length)];
        const b = pool[Math.floor(random() * pool.length)];
        if (a === b || blocked.has(a) || blocked.has(b)) continue;
        const analysis = analyzeChallenge(graph, a, b);
        if (!analysis || analysis.optimalLength < 4 || analysis.optimalLength > 8) continue;
        const { level, score } = difficultyOf({
          optimalLength: analysis.optimalLength,
          optimalPathsCount: analysis.optimalPathsCount,
          fameA: fameOf(a),
          fameB: fameOf(b),
        });
        if (level !== tier) continue;
        await client.query(
          `insert into challenges (date, origin_player_id, destination_player_id, optimal_length, optimal_paths_count,
             optimal_path, difficulty, difficulty_score) values ($1::date, $2, $3, $4, $5, $6::jsonb, $7, $8)`,
          [date, a, b, analysis.optimalLength, analysis.optimalPathsCount, JSON.stringify(analysis.optimalPath), level, score],
        );
        existing.push({ date, players: [a, b] });
        const names = (await client.query("select id, name from players where id in ($1, $2)", [a, b])).rows;
        const nameOf = (id: number) => String(names.find((n) => Number(n.id) === id)?.name).replaceAll(",", " ");
        rows.push([date, system, tier, analysis.optimalLength, analysis.optimalPathsCount, nameOf(a), nameOf(b)].join(","));
        done = true;
      }
      if (!done) throw new Error(`No se encontró desafío ${system}/${tier} para ${date}`);
    }
    writeFileSync("playtest/mapping.csv", rows.join("\n") + "\n", "utf-8");
    console.log(`Creados ${count} desafíos de prueba (${dates[0]} a ${dates[count - 1]}). Respuesta en playtest/mapping.csv`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
