/**
 * Aplica las migraciones de db/migrations/ en orden, una sola vez cada una.
 * Uso: npx tsx scripts/db/migrate.ts [--reset]   (--reset borra el esquema public antes; solo desarrollo/tests)
 * Usa DATABASE_URL_ADMIN (o TEST_DATABASE_URL_ADMIN con --test).
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { loadEnvLocal, requireEnv } from "./env";

export async function migrate(adminUrl: string, reset = false): Promise<string[]> {
  if (reset && !new URL(adminUrl).pathname.endsWith("_test")) {
    throw new Error("--reset solo se permite sobre bases cuyo nombre termina en _test");
  }
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  const applied: string[] = [];
  try {
    if (reset) {
      await client.query("drop schema public cascade; create schema public;");
    }
    await client.query(
      "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
    );
    const dir = resolve(import.meta.dirname, "..", "..", "db", "migrations");
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .sort();
    const done = new Set(
      (await client.query("select name from schema_migrations")).rows.map((r) => r.name),
    );
    for (const file of files) {
      if (done.has(file)) continue;
      const sql = readFileSync(resolve(dir, file), "utf8");
      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into schema_migrations (name) values ($1)", [file]);
        await client.query("commit");
        applied.push(file);
      } catch (error) {
        await client.query("rollback");
        throw new Error(`Falló la migración ${file}: ${(error as Error).message}`);
      }
    }
  } finally {
    await client.end();
  }
  return applied;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  loadEnvLocal();
  const useTest = process.argv.includes("--test");
  const url = requireEnv(useTest ? "TEST_DATABASE_URL_ADMIN" : "DATABASE_URL_ADMIN");
  migrate(url, process.argv.includes("--reset")).then(
    (applied) =>
      console.log(
        applied.length
          ? `Migraciones aplicadas: ${applied.join(", ")}`
          : "Sin migraciones pendientes.",
      ),
    (error) => {
      console.error(error.message);
      process.exit(1);
    },
  );
}
