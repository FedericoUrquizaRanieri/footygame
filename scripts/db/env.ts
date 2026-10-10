import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Carga .env.local (sin dependencias) en process.env si existe. No pisa variables ya definidas. */
export function loadEnvLocal(): void {
  const file = resolve(import.meta.dirname, "..", "..", ".env.local");
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)=(.*)$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}. ¿Ejecutaste npm run db:up?`);
  return value;
}
