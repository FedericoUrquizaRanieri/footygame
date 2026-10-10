import { describe, expect, it } from "vitest";
import { filterByName, normalizeText } from "@/domain/search";
import { miniPlayers } from "../fixtures/mini-graph";

describe("normalizeText", () => {
  it("pasa a minúsculas y quita acentos", () => {
    expect(normalizeText("Ángel Di María")).toBe("angel di maria");
    expect(normalizeText("Kylian Mbappé")).toBe("kylian mbappe");
  });

  it("recorta y colapsa espacios", () => {
    expect(normalizeText("  Lionel    Messi  ")).toBe("lionel messi");
  });

  it("normaliza la ñ y la ü", () => {
    expect(normalizeText("Muñoz Müller")).toBe("munoz muller");
  });
});

describe("filterByName", () => {
  const names = (q: string) => filterByName(miniPlayers, q).map((p) => p.name);

  it("con consulta vacía devuelve todo en el mismo orden", () => {
    expect(filterByName(miniPlayers, "")).toEqual(miniPlayers);
    expect(filterByName(miniPlayers, "   ")).toEqual(miniPlayers);
  });

  it("ignora mayúsculas y acentos", () => {
    expect(names("di maria")).toEqual(["Ángel Di María"]);
    expect(names("DI MARÍA")).toEqual(["Ángel Di María"]);
    expect(names("mbappe")).toEqual(["Kylian Mbappé"]);
  });

  it("busca por fragmentos en cualquier posición", () => {
    expect(names("ess")).toEqual(["Lionel Messi"]);
  });

  it("todas las palabras deben aparecer, en cualquier orden", () => {
    expect(names("maria angel")).toEqual(["Ángel Di María"]);
    expect(names("lionel zzz")).toEqual([]);
  });

  it("devuelve vacío si no hay coincidencias y no muta la entrada", () => {
    const copy = [...miniPlayers];
    expect(names("xyz")).toEqual([]);
    expect(miniPlayers).toEqual(copy);
  });
});
