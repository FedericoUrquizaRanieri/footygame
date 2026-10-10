import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import en from "@/i18n/messages/en.json";
import es from "@/i18n/messages/es.json";
import { createT } from "@/i18n/translate";

function flatten(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === "object" && v !== null
      ? flatten(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );
}

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const lookup = (obj: Record<string, unknown>, key: string) =>
  key.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown> | undefined)?.[p], obj);

describe("mensajes es/en", () => {
  it("tienen exactamente las mismas claves", () => {
    expect(flatten(en).sort()).toEqual(flatten(es).sort());
  });

  it("usan las mismas variables en cada clave", () => {
    for (const key of flatten(es)) {
      expect(placeholders(lookup(en, key) as string), key).toEqual(
        placeholders(lookup(es, key) as string),
      );
    }
  });

  it("no hay textos vacíos ni rayas largas", () => {
    for (const dict of [es, en]) {
      for (const key of flatten(dict)) {
        const value = lookup(dict, key) as string;
        expect(value.trim().length, key).toBeGreaterThan(0);
        expect(value, key).not.toContain("—");
      }
    }
  });

  it("todas las claves usadas con t(...) en el código existen", () => {
    const root = resolve(import.meta.dirname, "..", "..", "src");
    const files: string[] = [];
    const walk = (dir: string) =>
      readdirSync(dir).forEach((name) => {
        const full = resolve(dir, name);
        if (statSync(full).isDirectory()) walk(full);
        else if (/\.tsx?$/.test(name)) files.push(full);
      });
    walk(root);

    const used = new Set<string>();
    for (const file of files) {
      for (const m of readFileSync(file, "utf8").matchAll(/\bt\(\s*"([a-zA-Z0-9_.]+)"/g))
        used.add(m[1]);
    }
    expect(used.size).toBeGreaterThan(10);
    for (const key of used) expect(lookup(es, key), `falta la clave ${key}`).toBeTypeOf("string");
  });
});

describe("createT", () => {
  const t = createT(es);

  it("traduce y reemplaza variables", () => {
    expect(t("landing.challengeOf", { date: "9 de octubre" })).toBe("Desafío del 9 de octubre");
  });

  it("devuelve la clave si no existe", () => {
    expect(t("no.existe")).toBe("no.existe");
  });

  it("deja el marcador si falta la variable", () => {
    expect(t("landing.challengeOf")).toBe("Desafío del {date}");
  });
});
