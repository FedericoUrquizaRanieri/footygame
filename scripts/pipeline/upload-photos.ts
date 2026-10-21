/**
 * Pipeline: sube las fotos de public/players al bucket público `players` de Supabase Storage.
 * Uso: npx tsx scripts/pipeline/upload-photos.ts [--only-missing]
 *
 * Variables (en el entorno, NUNCA en el repo ni en Vercel):
 *   SUPABASE_URL                 https://<ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY    clave secreta service_role (Project Settings → API Keys)
 *
 * Crea el bucket si no existe y sube cada archivo con upsert, así que se puede repetir. Con --only-missing
 * saltea los que ya están. Después, en Vercel: NEXT_PUBLIC_PHOTOS_BASE_URL=<SUPABASE_URL>/storage/v1/object/public/players
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvLocal, requireEnv } from "../db/env";

const BUCKET = "players";
const CONCURRENCY = 8;
const DIR = resolve(import.meta.dirname, "..", "..", "public", "players");

async function ensureBucket(base: string, headers: Record<string, string>): Promise<void> {
  const res = await fetch(`${base}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
  });
  // 400/409: el bucket ya existe.
  if (!res.ok && res.status !== 400 && res.status !== 409) {
    throw new Error(`No se pudo crear el bucket: HTTP ${res.status} ${await res.text()}`);
  }
}

async function main(): Promise<void> {
  loadEnvLocal();
  const base = requireEnv("SUPABASE_URL").replace(/\/$/, "");
  const headers = { Authorization: `Bearer ${requireEnv("SUPABASE_SERVICE_ROLE_KEY")}` };
  const onlyMissing = process.argv.includes("--only-missing");

  await ensureBucket(base, headers);
  const files = readdirSync(DIR).filter((f) => /\.(jpg|png)$/.test(f));
  console.log(`Subiendo ${files.length} fotos al bucket "${BUCKET}"…`);

  let done = 0;
  let skipped = 0;
  const failed: string[] = [];
  const queue = [...files];

  async function worker(): Promise<void> {
    for (let file = queue.pop(); file; file = queue.pop()) {
      const url = `${base}/storage/v1/object/${BUCKET}/${file}`;
      try {
        if (onlyMissing) {
          const head = await fetch(`${base}/storage/v1/object/public/${BUCKET}/${file}`, {
            method: "HEAD",
          });
          if (head.ok) {
            skipped++;
            continue;
          }
        }
        const res = await fetch(url, {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": file.endsWith(".png") ? "image/png" : "image/jpeg",
            "Cache-Control": "max-age=31536000",
            "x-upsert": "true",
          },
          body: readFileSync(resolve(DIR, file)),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        done++;
      } catch (error) {
        failed.push(`${file}: ${(error as Error).message}`);
      }
      if ((done + skipped + failed.length) % 500 === 0) {
        console.log(`  ${done + skipped + failed.length}/${files.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`Listo: ${done} subidas, ${skipped} salteadas, ${failed.length} con error.`);
  if (failed.length) {
    console.error(failed.slice(0, 10).join("\n"));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
