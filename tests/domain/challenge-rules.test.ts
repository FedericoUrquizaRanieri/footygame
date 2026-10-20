import { describe, expect, it } from "vitest";
import {
  LEVEL_RULES,
  acceptRoutes,
  intermediatePlayers,
  isBroadPoolPlayer,
  isHardPoolPlayer,
  isNormalPoolPlayer,
  type PlayerFacts,
} from "@/domain/challenge-rules";
import type { OptimalRoutes } from "@/domain/optimal-routes";
import { clubSeasonNode as cs, playerNode as pl } from "@/domain/types";

const M = 1_000_000;
const fact = (
  marketValueEur: number | null,
  nationality: string | null = "Spain",
): PlayerFacts => ({
  marketValueEur,
  nationality,
});

describe("pools de jugadores", () => {
  it("normal: 25 M€ o más", () => {
    expect(isNormalPoolPlayer(fact(25 * M))).toBe(true);
    expect(isNormalPoolPlayer(fact(24.9 * M))).toBe(false);
  });

  it("normal: los argentinos entran desde 8 M€", () => {
    expect(isNormalPoolPlayer(fact(8 * M, "Argentina"))).toBe(true);
    expect(isNormalPoolPlayer(fact(7.9 * M, "Argentina"))).toBe(false);
    expect(isNormalPoolPlayer(fact(8 * M, "Brazil"))).toBe(false);
  });

  it("difícil: entre 10 M€ y el corte del normal, sin repetir a nadie del normal", () => {
    expect(isHardPoolPlayer(fact(10 * M))).toBe(true);
    expect(isHardPoolPlayer(fact(9.9 * M))).toBe(false);
    expect(isHardPoolPlayer(fact(25 * M))).toBe(false);
    expect(isHardPoolPlayer(fact(12 * M, "Argentina"))).toBe(false); // ya está en el normal
  });

  it("sin valor de mercado no entra a ningún pool", () => {
    expect(isNormalPoolPlayer(fact(null))).toBe(false);
    expect(isHardPoolPlayer(fact(null))).toBe(false);
    expect(isBroadPoolPlayer(fact(null))).toBe(false);
  });

  it("el pool amplio une los dos", () => {
    expect(isBroadPoolPlayer(fact(30 * M))).toBe(true);
    expect(isBroadPoolPlayer(fact(12 * M))).toBe(true);
    expect(isBroadPoolPlayer(fact(5 * M))).toBe(false);
  });
});

/** Camino de 4 saltos origen 1, destino 3, con estos intermedios. */
function routes(length: 4 | 6, mids: number[][], count = mids.length): OptimalRoutes {
  return {
    optimalLength: length,
    routesCount: count,
    routes: mids.map((m) => [
      pl(1),
      cs(100),
      ...m.flatMap((id) => [pl(id), cs(101)]).slice(0, -1),
      cs(102),
      pl(3),
    ]),
  };
}

const famous = new Map<number, PlayerFacts>([
  [10, fact(60 * M)], // muy conocido
  [11, fact(12 * M)], // conocido a medias
  [12, fact(2 * M)], // desconocido
]);
const facts = (id: number): PlayerFacts => famous.get(id) ?? fact(null);

describe("intermediatePlayers", () => {
  it("devuelve los jugadores del medio, sin origen ni destino", () => {
    expect([...intermediatePlayers(routes(4, [[10], [11]]).routes)].sort()).toEqual([10, 11]);
    expect([...intermediatePlayers(routes(6, [[10, 12]]).routes)].sort()).toEqual([10, 12]);
  });
});

describe("acceptRoutes", () => {
  it("normal: 4 saltos, de 2 a 5 caminos y un intermedio conocido", () => {
    expect(acceptRoutes("normal", routes(4, [[10], [12]]), facts)).toBe(true);
    expect(acceptRoutes("normal", routes(4, [[11], [12]]), facts)).toBe(true); // amplio alcanza
  });

  it("normal: rechaza un solo camino, demasiados o ninguno con intermedio conocido", () => {
    expect(acceptRoutes("normal", routes(4, [[10]]), facts)).toBe(false);
    expect(acceptRoutes("normal", routes(4, [[10], [10]], 6), facts)).toBe(false);
    expect(acceptRoutes("normal", routes(4, [[12], [12]]), facts)).toBe(false);
  });

  it("normal: rechaza caminos de 6 saltos", () => {
    expect(
      acceptRoutes(
        "normal",
        routes(6, [
          [10, 10],
          [10, 11],
        ]),
        facts,
      ),
    ).toBe(false);
  });

  it("difícil: acepta 4 o 6 saltos, desde un solo camino, con un puente muy conocido", () => {
    expect(acceptRoutes("hard", routes(4, [[10]]), facts)).toBe(true);
    expect(acceptRoutes("hard", routes(6, [[12, 10]]), facts)).toBe(true);
  });

  it("difícil: un intermedio conocido a medias no alcanza como puente", () => {
    expect(acceptRoutes("hard", routes(4, [[11]]), facts)).toBe(false);
    expect(acceptRoutes("hard", routes(4, [[12]]), facts)).toBe(false);
  });

  it("difícil: rechaza más de 8 caminos (no se podrían mostrar todos)", () => {
    expect(acceptRoutes("hard", routes(4, [[10]], 9), facts)).toBe(false);
    expect(LEVEL_RULES.hard.maxRoutes).toBe(8);
  });
});
