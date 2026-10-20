/**
 * Carga solo los datos fijos de la ficha (nacionalidad y posición) en los jugadores que ya están en la base.
 * Uso: npx tsx scripts/pipeline/load-profiles.ts      (usa DATABASE_URL_ADMIN)
 * Es aditivo: no toca clubes, temporadas ni aristas (a diferencia de load.ts). Requiere la migración 003.
 */
import { createReadStream } from "node:fs";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import pg from "pg";
import { loadEnvLocal, requireEnv } from "../db/env";

const FILE = resolve(import.meta.dirname, "..", "..", "data", "processed", "players.jsonl");
const BATCH = 5000;

interface Row {
  id: number;
  nationality?: string | null;
  position?: string | null;
}

async function main(): Promise<void> {
  loadEnvLocal();
  const rows: Row[] = [];
  const rl = createInterface({ input: createReadStream(FILE, "utf8"), crlfDelay: Infinity });
  for await (const line of rl) if (line.trim()) rows.push(JSON.parse(line) as Row);

  const client = new pg.Client({ connectionString: requireEnv("DATABASE_URL_ADMIN") });
  await client.connect();
  try {
    await client.query("begin");
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      await client.query(
        `update players p set nationality = v.nationality, position = v.position
           from unnest($1::bigint[], $2::text[], $3::text[]) as v(id, nationality, position)
          where p.id = v.id`,
        [
          chunk.map((r) => r.id),
          chunk.map((r) => r.nationality ?? null),
          chunk.map((r) => r.position ?? null),
        ],
      );
    }
    const { rows: stat } = await client.query(
      "select count(*) total, count(nationality) with_nationality, count(position) with_position from players",
    );
    await client.query("commit");
    console.log("Fichas cargadas:", stat[0]);
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
