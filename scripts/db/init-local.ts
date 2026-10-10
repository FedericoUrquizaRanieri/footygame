/**
 * Levanta el Postgres local de footygame en Docker (puerto 5433, aislado de cualquier otro Postgres).
 *  1. genera contraseñas aleatorias y las guarda en .env.local si el archivo no existe (no se muestran),
 *  2. ejecuta `docker compose up -d --wait`.
 * Uso: npm run db:up
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "..");
const envFile = resolve(root, ".env.local");
const PORT = 5433;

if (existsSync(envFile)) {
  console.log(".env.local ya existe: se reutilizan las credenciales.");
} else {
  const secret = () => randomBytes(18).toString("base64url");
  const [superPw, adminPw, appPw] = [secret(), secret(), secret()];
  const base = `localhost:${PORT}`;
  writeFileSync(
    envFile,
    [
      "# Generado por scripts/db/init-local.ts. NO versionar.",
      `POSTGRES_SUPERUSER_PASSWORD=${superPw}`,
      `FOOTYGAME_ADMIN_PASSWORD=${adminPw}`,
      `FOOTYGAME_APP_PASSWORD=${appPw}`,
      `DATABASE_URL=postgresql://footygame_app:${appPw}@${base}/footygame`,
      `DATABASE_URL_ADMIN=postgresql://footygame_admin:${adminPw}@${base}/footygame`,
      `TEST_DATABASE_URL=postgresql://footygame_app:${appPw}@${base}/footygame_test`,
      `TEST_DATABASE_URL_ADMIN=postgresql://footygame_admin:${adminPw}@${base}/footygame_test`,
      "",
    ].join("\n"),
    "utf8",
  );
  console.log("Credenciales generadas en .env.local (no se muestran).");
}

const result = spawnSync("docker", ["compose", "--env-file", ".env.local", "up", "-d", "--wait"], {
  cwd: root,
  stdio: "inherit",
});
if (result.status !== 0) process.exit(result.status ?? 1);
console.log(
  `Postgres de footygame listo en localhost:${PORT} (bases: footygame y footygame_test).`,
);
