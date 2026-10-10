/**
 * P-05: planes de ejecución de las consultas críticas con datos reales.
 * Falla si alguna usa Seq Scan sobre las tablas grandes. Uso: npx tsx scripts/perf/explain.ts
 */
import pg from "pg";
import { loadEnvLocal, requireEnv } from "../db/env";

const queries: Record<string, { sql: string; param: () => Promise<number> }> = {};

async function main(): Promise<void> {
  loadEnvLocal();
  const client = new pg.Client({ connectionString: requireEnv("DATABASE_URL_ADMIN") });
  await client.connect();
  try {
    const pickPlayer = async () =>
      Number((await client.query("select id from players order by random() limit 1")).rows[0].id);
    const pickCs = async () =>
      Number(
        (await client.query("select id from club_seasons order by random() limit 1")).rows[0].id,
      );

    queries["jugador -> club-temporadas"] = {
      param: pickPlayer,
      sql: `select cs.id, c.name, cs.label from player_club_seasons e
              join club_seasons cs on cs.id = e.club_season_id join clubs c on c.id = cs.club_id
             where e.player_id = $1 order by cs.season_year, c.name`,
    };
    queries["club-temporada -> jugadores"] = {
      param: pickCs,
      sql: `select p.id, p.name from player_club_seasons e join players p on p.id = e.player_id
             where e.club_season_id = $1 order by p.name_search`,
    };

    let bad = 0;
    for (const [name, q] of Object.entries(queries)) {
      const id = await q.param();
      const plan = (await client.query(`explain (analyze, format json) ${q.sql}`, [id])).rows[0][
        "QUERY PLAN"
      ][0];
      const text = JSON.stringify(plan.Plan);
      const seq =
        /"Node Type":"Seq Scan","Parallel Aware":(true|false),"Async Capable":(true|false),"Relation Name":"(player_club_seasons|players|club_seasons)"/.test(
          text,
        );
      console.log(
        `${name}: ${plan["Execution Time"].toFixed(3)} ms, planificación ${plan["Planning Time"].toFixed(3)} ms, Seq Scan en tablas grandes: ${seq ? "SÍ" : "no"}`,
      );
      if (seq) bad++;
    }
    if (bad) {
      console.error("FALLA: hay Seq Scan sobre tablas grandes");
      process.exit(1);
    }
    console.log("OK: las consultas críticas usan índices.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
