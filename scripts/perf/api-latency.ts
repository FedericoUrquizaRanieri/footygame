/**
 * Pruebas de rendimiento de la API interna (P-01, P-03, P-04 de docs/05-testing/performance-tests.md).
 * Requiere el servidor en marcha (npm run build && npx next start -p 3100) y datos cargados.
 * Uso: npx tsx scripts/perf/api-latency.ts [--base http://localhost:3100]
 *
 * Cada pedido lleva un X-Forwarded-For distinto para que el rate limit por IP no interfiera
 * (en producción lo fija el proxy de Vercel; ver docs/02-architecture/security.md).
 */
import { performance } from "node:perf_hooks";
import pg from "pg";
import { loadEnvLocal, requireEnv } from "../db/env";

const P95_LIMIT_MS = 300;
const base = (() => {
  const i = process.argv.indexOf("--base");
  return i >= 0 ? process.argv[i + 1] : "http://localhost:3100";
})();

let ipCounter = 0;
const nextIp = () => `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${++ipCounter & 255}`;

interface Sample {
  ms: number;
  status: number;
}

async function hit(path: string): Promise<Sample> {
  const started = performance.now();
  const res = await fetch(`${base}${path}`, { headers: { "x-forwarded-for": nextIp() } });
  await res.arrayBuffer();
  return { ms: performance.now() - started, status: res.status };
}

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

function summarize(name: string, samples: Sample[], seconds: number) {
  const ms = samples.map((s) => s.ms).sort((a, b) => a - b);
  const errors = samples.filter((s) => s.status >= 500 || s.status === 429).length;
  const row = {
    prueba: name,
    pedidos: samples.length,
    "req/s": +(samples.length / seconds).toFixed(1),
    p50: +percentile(ms, 50).toFixed(1),
    p95: +percentile(ms, 95).toFixed(1),
    p99: +percentile(ms, 99).toFixed(1),
    max: +ms[ms.length - 1].toFixed(1),
    "5xx/429": errors,
  };
  return row;
}

/** Cierra N pedidos con concurrencia fija. */
async function closedLoop(paths: string[], total: number, concurrency: number) {
  const samples: Sample[] = [];
  let next = 0;
  const started = performance.now();
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < total) {
        const path = paths[next++ % paths.length];
        samples.push(await hit(path));
      }
    }),
  );
  return { samples, seconds: (performance.now() - started) / 1000 };
}

/** Tasa fija de pedidos por segundo durante unos segundos (carga sostenida). */
async function openLoop(paths: string[], rps: number, seconds: number) {
  const samples: Promise<Sample>[] = [];
  const started = performance.now();
  for (let i = 0; i < rps * seconds; i++) {
    const due = started + (i * 1000) / rps;
    const wait = due - performance.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    samples.push(hit(paths[i % paths.length]));
  }
  const done = await Promise.all(samples);
  return { samples: done, seconds: (performance.now() - started) / 1000 };
}

async function main(): Promise<void> {
  loadEnvLocal();
  const db = new pg.Client({ connectionString: requireEnv("DATABASE_URL") });
  await db.connect();
  const players = (await db.query("select id from players order by random() limit 400")).rows.map(
    (r) => r.id,
  );
  const clubSeasons = (
    await db.query("select id from club_seasons order by random() limit 400")
  ).rows.map((r) => r.id);
  await db.end();

  const playerPaths = players.map((id: number) => `/api/nodes/player/${id}`);
  const csPaths = clubSeasons.map((id: number) => `/api/nodes/club-season/${id}`);

  // Calentamiento (conexiones, JIT, pool).
  await closedLoop([...playerPaths, ...csPaths], 100, 5);

  const rows = [];
  let r = await closedLoop(playerPaths, 800, 10);
  rows.push(summarize("P-01 jugador -> club-temporadas (10 conc.)", r.samples, r.seconds));
  r = await closedLoop(csPaths, 800, 10);
  rows.push(summarize("P-01 club-temporada -> jugadores (10 conc.)", r.samples, r.seconds));
  r = await closedLoop([...playerPaths, ...csPaths], 800, 1);
  rows.push(summarize("P-01 mixto secuencial (1 conc.)", r.samples, r.seconds));
  r = await openLoop([...playerPaths, ...csPaths], 50, 30);
  rows.push(summarize("P-03 sostenida 50 req/s x 30 s", r.samples, r.seconds));
  r = await openLoop([...playerPaths, ...csPaths], 200, 15);
  rows.push(summarize("P-04 pico 200 req/s x 15 s", r.samples, r.seconds));

  console.table(rows);
  const failed = rows.filter((x) => x["5xx/429"] > 0 || x.p95 > P95_LIMIT_MS);
  if (failed.length) {
    console.error(
      `FALLA: ${failed.map((x) => x.prueba).join("; ")} (límite p95 ${P95_LIMIT_MS} ms, 0 errores)`,
    );
    process.exit(1);
  }
  console.log(`OK: p95 ≤ ${P95_LIMIT_MS} ms y sin errores 5xx/429 en todas las pruebas.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
