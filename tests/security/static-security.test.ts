import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { securityHeaders } from "@/server/security-headers";

const ROOT = resolve(import.meta.dirname, "..", "..");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = resolve(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const rel = (f: string) => relative(ROOT, f).replace(/\\/g, "/");
const srcFiles = walk(resolve(ROOT, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
const read = (f: string) => readFileSync(f, "utf8");
const isComment = (line: string) => /^\s*(#|\/\/|\*|\/\*)/.test(line);
const withoutComments = (f: string) =>
  read(f)
    .split(/\r?\n/)
    .filter((line) => !isComment(line))
    .join("\n");

describe("S-03/S-04 sin secretos en el cliente", () => {
  it("las variables de conexión solo se leen desde src/server", () => {
    const offenders = srcFiles
      .filter((f) => /DATABASE_URL/.test(read(f)))
      .map(rel)
      .filter((f) => !f.startsWith("src/server/"));
    expect(offenders).toEqual([]);
  });

  it("no hay cadenas de conexión ni claves service_role en el código", () => {
    const offenders = srcFiles
      .filter((f) => /postgres(ql)?:\/\/|service_role/i.test(read(f)))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it("no se usa el prefijo NEXT_PUBLIC_ (nada de la base debe ir al navegador)", () => {
    const files = [...srcFiles, resolve(ROOT, "next.config.ts"), resolve(ROOT, ".env.example")];
    expect(files.filter((f) => /NEXT_PUBLIC_/.test(withoutComments(f))).map(rel)).toEqual([]);
  });

  it("los componentes cliente no importan código de servidor ni la librería pg", () => {
    const offenders = srcFiles
      .filter((f) => /^\s*["']use client["']/.test(read(f)))
      .filter((f) => /from\s+["'](@\/server\/|pg["'])/.test(read(f)))
      .map(rel);
    expect(offenders).toEqual([]);
  });

  it(".env.example no trae valores y .env.local está ignorado por git", () => {
    const example = read(resolve(ROOT, ".env.example"))
      .split(/\r?\n/)
      .filter((line) => /^[A-Z_]+=/.test(line));
    for (const line of example) expect(line, line).toMatch(/^[A-Z_]+=$/);
    expect(read(resolve(ROOT, ".gitignore"))).toMatch(/^\.env\.\*$/m);
  });
});

describe("S-10 no existen rutas que listen o vuelquen tablas completas", () => {
  it("solo existen las rutas de API esperadas", () => {
    const routes = walk(resolve(ROOT, "src", "app", "api"))
      .filter((f) => /route\.ts$/.test(f))
      .map(rel)
      .sort();
    expect(routes).toEqual([
      "src/app/api/challenge/finish/route.ts",
      "src/app/api/challenge/today/route.ts",
      "src/app/api/feedback/route.ts",
      "src/app/api/nodes/club-season/[id]/route.ts",
      "src/app/api/nodes/player/[id]/route.ts",
    ]);
  });
});

describe("S-09 cabeceras de seguridad", () => {
  const header = (key: string) => securityHeaders.find((h) => h.key === key)?.value ?? "";

  it("define CSP restrictiva", () => {
    const csp = header("Content-Security-Policy");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("connect-src 'self'");
  });

  it("define el resto de cabeceras", () => {
    expect(header("X-Content-Type-Options")).toBe("nosniff");
    expect(header("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(header("X-Frame-Options")).toBe("DENY");
    expect(header("Permissions-Policy")).toContain("camera=()");
  });

  it("next.config las aplica a todas las rutas", async () => {
    const rules = await nextConfig.headers!();
    expect(rules).toEqual([{ source: "/:path*", headers: securityHeaders }]);
  });
});
