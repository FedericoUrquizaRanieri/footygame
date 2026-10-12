/**
 * Pipeline: fotos de jugadores desde Wikidata + Wikimedia Commons (solo licencias libres).
 * Uso: npx tsx scripts/pipeline/fetch-photos.ts [--min-value=<eur>] [--limit=<n>] [--dry]
 *
 * 1. Lee los jugadores de la base (DATABASE_URL). Su id es el id de Transfermarkt (propiedad P2446).
 * 2. Wikidata (SPARQL): jugador -> archivo de imagen (P18).
 * 3. Commons (API): licencia, autor y miniatura de cada archivo. Solo CC BY, CC BY-SA, CC0 y dominio público.
 * 4. Descarga la miniatura a public/players/<id>.jpg (propia, sin hotlinking).
 * 5. Escribe src/lib/player-photo-credits.generated.json (atribución) y src/lib/player-photos.generated.ts (ids con foto).
 * Es reanudable: guarda lo ya consultado en data/cache y no vuelve a descargar archivos existentes.
 * Con --dry solo consulta y cuenta, sin descargar.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import sharp from "sharp";
import { loadEnvLocal, requireEnv } from "../db/env";

const ROOT = resolve(import.meta.dirname, "..", "..");
const OUT_DIR = resolve(ROOT, "public", "players");
const CACHE_DIR = resolve(ROOT, "data", "cache");
const UA = "footygame/0.1 (proyecto academico; federicourquizaranieri@gmail.com)";
const WIDTH = 256;
const FREE = /^(CC[ -]BY|CC0|Public domain|PD)/i;
const NON_FREE = /(^|[ -])(NC|ND)([ -]|$)/i;

const args = new Map(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"] as const;
  }),
);
const DRY = args.has("dry");
const MIN_VALUE = Number(args.get("min-value") ?? 0);
const LIMIT = Number(args.get("limit") ?? Infinity);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function retry<T>(fn: () => Promise<T>, tries = 5): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries - 1) throw e;
      await sleep(2000 * (i + 1));
    }
  }
}

function readCache<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(resolve(CACHE_DIR, name), "utf8")) as T;
  } catch {
    return fallback;
  }
}
function writeCache(name: string, data: unknown): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(resolve(CACHE_DIR, name), JSON.stringify(data));
}

/** Paso 2: id de Transfermarkt -> nombre de archivo en Commons. */
async function wikidataImages(ids: number[]): Promise<Record<string, string>> {
  const cache = readCache<{ done: number[]; files: Record<string, string> }>(
    "wikidata-images.json",
    {
      done: [],
      files: {},
    },
  );
  const done = new Set(cache.done);
  const todo = ids.filter((id) => !done.has(id));
  const BATCH = 300;
  for (let i = 0; i < todo.length; i += BATCH) {
    const chunk = todo.slice(i, i + BATCH);
    const values = chunk.map((id) => `"${id}"`).join(" ");
    const query = `SELECT ?tm ?img WHERE { VALUES ?tm { ${values} } ?p wdt:P2446 ?tm; wdt:P18 ?img. }`;
    const json = await retry(async () => {
      const res = await fetch("https://query.wikidata.org/sparql", {
        method: "POST",
        headers: {
          "User-Agent": UA,
          Accept: "application/sparql-results+json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ query }),
      });
      if (!res.ok) throw new Error(`Wikidata ${res.status}`);
      return (await res.json()) as {
        results: { bindings: { tm: { value: string }; img: { value: string } }[] };
      };
    });
    for (const b of json.results.bindings) {
      // Si hay varias imágenes, se queda con la primera.
      cache.files[b.tm.value] ??= decodeURIComponent(
        b.img.value.split("/Special:FilePath/")[1] ?? "",
      );
    }
    for (const id of chunk) done.add(id);
    cache.done = [...done];
    writeCache("wikidata-images.json", cache);
    console.log(`Wikidata: ${Math.min(i + BATCH, todo.length)}/${todo.length}`);
    await sleep(1500);
  }
  return cache.files;
}

interface FileInfo {
  thumb: string;
  page: string;
  license: string;
  author: string;
}

const stripHtml = (s: string): string =>
  s
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

/** Paso 3: licencia, autor y miniatura de cada archivo (null = licencia no libre o sin datos). */
async function commonsInfo(files: string[]): Promise<Record<string, FileInfo | null>> {
  const cache = readCache<Record<string, FileInfo | null>>("commons-info.json", {});
  const todo = [...new Set(files)].filter((f) => !(f in cache));
  const BATCH = 40;
  for (let i = 0; i < todo.length; i += BATCH) {
    const chunk = todo.slice(i, i + BATCH);
    const params = new URLSearchParams({
      action: "query",
      format: "json",
      prop: "imageinfo",
      iiprop: "url|extmetadata",
      iiurlwidth: String(WIDTH),
      titles: chunk.map((f) => `File:${f}`).join("|"),
    });
    const json = await retry(async () => {
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
        headers: { "User-Agent": UA },
      });
      if (!res.ok) throw new Error(`Commons ${res.status}`);
      return (await res.json()) as {
        query?: {
          normalized?: { from: string; to: string }[];
          pages?: Record<
            string,
            {
              title: string;
              imageinfo?: {
                thumburl?: string;
                descriptionurl: string;
                extmetadata?: Record<string, { value: string }>;
              }[];
            }
          >;
        };
      };
    });
    const byTitle = new Map<string, FileInfo | null>();
    for (const page of Object.values(json.query?.pages ?? {})) {
      const info = page.imageinfo?.[0];
      const meta = info?.extmetadata ?? {};
      const license = meta.LicenseShortName?.value ?? "";
      const free = info?.thumburl && FREE.test(license) && !NON_FREE.test(license);
      byTitle.set(
        page.title,
        free
          ? {
              thumb: info.thumburl!,
              page: info.descriptionurl,
              license,
              author: stripHtml(meta.Artist?.value ?? "Desconocido"),
            }
          : null,
      );
    }
    const normalized = new Map((json.query?.normalized ?? []).map((n) => [n.from, n.to]));
    for (const f of chunk) {
      const title = `File:${f}`;
      cache[f] = byTitle.get(normalized.get(title) ?? title) ?? null;
    }
    writeCache("commons-info.json", cache);
    console.log(`Commons: ${Math.min(i + BATCH, todo.length)}/${todo.length}`);
    await sleep(500);
  }
  return cache;
}

async function download(url: string, dest: string): Promise<boolean> {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (res.status === 429 || res.status >= 500) {
      await sleep(3000 * (i + 1));
      continue;
    }
    if (!res.ok) return false;
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    return true;
  }
  return false;
}

/** Achica la foto (máx. 192×256, JPEG calidad 75) para no servir ni guardar archivos pesados. Idempotente. */
async function shrink(file: string): Promise<void> {
  if (statSync(file).size < 20_000) return;
  const out = await sharp(readFileSync(file))
    .rotate()
    .resize({ width: 192, height: 256, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 75, mozjpeg: true })
    .toBuffer();
  writeFileSync(file, out);
}

async function main(): Promise<void> {
  loadEnvLocal();
  const pool = new pg.Pool({ connectionString: requireEnv("DATABASE_URL") });
  const { rows } = await pool.query<{ id: number }>(
    "select id from players where coalesce(market_value_eur, 0) >= $1 order by market_value_eur desc nulls last",
    [MIN_VALUE],
  );
  await pool.end();
  const ids = rows.map((r) => Number(r.id)).slice(0, LIMIT);
  console.log(`Jugadores a consultar: ${ids.length}`);

  const files = await wikidataImages(ids);
  const withImage = ids.filter((id) => files[String(id)]);
  console.log(`Con imagen en Wikidata: ${withImage.length}`);

  const info = await commonsInfo(withImage.map((id) => files[String(id)]));
  const usable = withImage.filter((id) => info[files[String(id)]]);
  console.log(`Con licencia libre: ${usable.length} de ${ids.length}`);
  if (DRY) return;

  mkdirSync(OUT_DIR, { recursive: true });
  const credits: Record<string, { author: string; license: string; source: string }> = {};
  let next = 0;
  async function worker(): Promise<void> {
    while (next < usable.length) {
      const id = usable[next++];
      const f = info[files[String(id)]]!;
      const dest = resolve(OUT_DIR, `${id}.jpg`);
      const ok = existsSync(dest) || (await download(f.thumb, dest));
      if (ok) await shrink(dest).catch(() => undefined);
      if (ok) credits[id] = { author: f.author, license: f.license, source: f.page };
      if (next % 100 === 0) console.log(`Descargadas: ${next}/${usable.length}`);
    }
  }
  await Promise.all(Array.from({ length: 3 }, worker));

  const okIds = Object.keys(credits)
    .map(Number)
    .sort((a, b) => a - b);
  writeFileSync(
    resolve(ROOT, "src", "lib", "player-photo-credits.generated.json"),
    JSON.stringify(credits, null, 1),
  );
  writeFileSync(
    resolve(ROOT, "src", "lib", "player-photos.generated.ts"),
    `// Generado por scripts/pipeline/fetch-photos.ts. No editar a mano.\n/** Ids de jugador que tienen foto en public/players/<id>.jpg. */\nexport const PLAYER_PHOTO_IDS: readonly number[] = ${JSON.stringify(okIds)};\n`,
  );
  console.log(`Listo: ${okIds.length} fotos.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
