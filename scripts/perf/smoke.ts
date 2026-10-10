/**
 * Humo de punta a punta: juega el desafío de hoy por la API, paso a paso, como lo haría la interfaz,
 * siguiendo el camino óptimo, y cierra el intento con /finish. También prueba un intento inválido.
 * Requiere servidor en marcha. Uso: npx tsx scripts/perf/smoke.ts [--base http://localhost:3100]
 */
import pg from "pg";
import { loadEnvLocal, requireEnv } from "../db/env";

const base = (() => {
  const i = process.argv.indexOf("--base");
  return i >= 0 ? process.argv[i + 1] : "http://localhost:3100";
})();

type Node = { type: "player" | "club-season"; id: number };
let n = 0;
const get = async (path: string) => {
  const res = await fetch(`${base}${path}`, { headers: { "x-forwarded-for": `10.9.0.${++n}` } });
  return { status: res.status, body: await res.json() };
};
const post = async (path: string, body: unknown) => {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "x-forwarded-for": `10.9.1.${++n}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};
const assert = (cond: boolean, msg: string) => {
  if (!cond) {
    console.error(`FALLA: ${msg}`);
    process.exit(1);
  }
};

async function main(): Promise<void> {
  loadEnvLocal();
  const today = await get("/api/challenge/today");
  assert(today.status === 200, "challenge/today debe responder 200");
  const c = today.body;
  console.log(`Desafío ${c.date}: ${c.origin.name} -> ${c.destination.name}`);
  assert(!JSON.stringify(c).includes("optimal"), "el desafío no debe traer la solución");

  // La solución se lee directo de la base (solo este script de pruebas; la API no la entrega).
  const db = new pg.Client({ connectionString: requireEnv("DATABASE_URL_ADMIN") });
  await db.connect();
  const optimal: Node[] = (
    await db.query("select optimal_path from challenges where id = $1", [c.id])
  ).rows[0].optimal_path;
  await db.end();

  // Recorre el camino: en cada paso, la lista que muestra la UI debe contener el siguiente nodo.
  const started = Date.now();
  for (let i = 0; i < optimal.length - 1; i++) {
    const cur = optimal[i];
    const nxt = optimal[i + 1];
    const step = await get(`/api/nodes/${cur.type}/${cur.id}`);
    assert(step.status === 200, `nodes/${cur.type}/${cur.id} debe responder 200`);
    assert(
      step.body.items.some((it: { id: number }) => it.id === nxt.id),
      `el paso ${i + 1} no ofrece el siguiente nodo`,
    );
  }
  const elapsedMs = Math.max(Date.now() - started, optimal.length * 400);

  const done = await post("/api/challenge/finish", { challengeId: c.id, path: optimal, elapsedMs });
  assert(
    done.status === 200 && done.body.valid && done.body.result === "won",
    "finish debe validar la victoria",
  );
  assert(done.body.isOptimal, "el camino óptimo debe marcarse como óptimo");
  console.log(`Victoria en ${done.body.jumps} saltos (óptimo ${done.body.optimal.length}).`);
  console.log(
    "Camino óptimo:",
    done.body.optimal.path.map((p: { label: string }) => p.label).join(" -> "),
  );

  const tampered = optimal.slice(0, 1).concat([{ type: "club-season", id: 1 }, optimal[2]]);
  const bad = await post("/api/challenge/finish", { challengeId: c.id, path: tampered, elapsedMs });
  assert(
    bad.status === 422 && !bad.body.valid && !JSON.stringify(bad.body).includes("optimal"),
    "un camino falso debe rechazarse sin pistas",
  );
  console.log("Camino manipulado rechazado:", bad.body.reason);
  console.log("OK: flujo completo validado.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
