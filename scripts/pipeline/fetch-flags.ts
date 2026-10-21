/**
 * Pipeline: banderas de las nacionalidades (PNG de 48 x 36 px) en public/flags, desde el paquete npm
 * flag-icons (licencia MIT). Uso: npx tsx scripts/pipeline/fetch-flags.ts
 *
 * 1. Baja el paquete a una carpeta temporal con `npm pack` (no se agrega como dependencia).
 * 2. Convierte a PNG las banderas que usa src/lib/nationalities.ts.
 * 3. Copia la licencia a public/flags/LICENSE.
 * public/flags se versiona (pesa unos pocos KB); se regenera con `npm run data:flags`.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import sharp from "sharp";
import { FLAG_CODES } from "../../src/lib/nationalities";

const ROOT = resolve(import.meta.dirname, "..", "..");
const OUT = resolve(ROOT, "public", "flags");
const PACKAGE = "flag-icons@7.2.3";

async function main(): Promise<void> {
  const work = mkdtempSync(resolve(tmpdir(), "flags-"));
  try {
    // En Windows npm es un .cmd: hace falta pasar por el shell.
    execFileSync("npm", ["pack", PACKAGE, "--silent"], {
      cwd: work,
      shell: true,
      stdio: "inherit",
    });
    execFileSync("tar", ["-xzf", "flag-icons-7.2.3.tgz"], { cwd: work, stdio: "inherit" });

    mkdirSync(OUT, { recursive: true });
    const codes = [...new Set(Object.values(FLAG_CODES))].sort();
    for (const code of codes) {
      const svg = readFileSync(resolve(work, "package", "flags", "4x3", `${code}.svg`));
      await sharp(svg, { density: 200 })
        .resize(48, 36, { fit: "fill" })
        .png({ compressionLevel: 9, palette: true })
        .toFile(resolve(OUT, `${code}.png`));
    }
    copyFileSync(resolve(work, "package", "LICENSE"), resolve(OUT, "LICENSE"));
    console.log(`Listo: ${codes.length} banderas en public/flags`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
