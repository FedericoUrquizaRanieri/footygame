/* eslint-disable @typescript-eslint/no-explicit-any -- el test manipula JSON arbitrario a propósito */
import { describe, expect, it } from "vitest";
import { createGame, elapsedMs, selectNode, startGame } from "@/domain/game";
import {
  STORAGE_VERSION,
  deserializeGame,
  serializeGame,
  settleStaleGame,
} from "@/domain/persistence";
import { clubSeasonNode as cs, playerNode as pl } from "@/domain/types";
import { COPETTI, DI_MARIA, PSG_2021, ROSARIO_2025, messiToCopetti } from "../fixtures/mini-graph";

const T0 = 5_000_000;

function playing() {
  let s = startGame(createGame(messiToCopetti), T0);
  s = selectNode(s, cs(PSG_2021), T0 + 1000);
  return selectNode(s, pl(DI_MARIA), T0 + 2000);
}

function won() {
  let s = playing();
  s = selectNode(s, cs(ROSARIO_2025), T0 + 3000);
  return selectNode(s, pl(COPETTI), T0 + 4000);
}

describe("serializeGame / deserializeGame", () => {
  it("round-trip: una partida en curso se restaura idéntica", () => {
    const s = playing();
    expect(deserializeGame(serializeGame(s))).toEqual(s);
  });

  it("round-trip de partidas listas y terminadas", () => {
    const ready = createGame(messiToCopetti);
    expect(deserializeGame(serializeGame(ready))).toEqual(ready);
    expect(deserializeGame(serializeGame(won()))).toEqual(won());
  });

  it("tras recargar, el tiempo sigue contando desde el Start original", () => {
    const restored = deserializeGame(serializeGame(playing()));
    expect(restored).not.toBeNull();
    expect(elapsedMs(restored!, T0 + 10_000)).toBe(10_000);
  });

  it("devuelve null con entradas vacías o no JSON", () => {
    expect(deserializeGame(null)).toBeNull();
    expect(deserializeGame("")).toBeNull();
    expect(deserializeGame("{no es json")).toBeNull();
    expect(deserializeGame("42")).toBeNull();
    expect(deserializeGame("null")).toBeNull();
  });

  it("devuelve null si cambia la versión del formato", () => {
    const parsed = JSON.parse(serializeGame(playing()));
    parsed.version = STORAGE_VERSION + 1;
    expect(deserializeGame(JSON.stringify(parsed))).toBeNull();
  });

  const tamper = (mutate: (g: Record<string, any>) => void) => {
    const parsed = JSON.parse(serializeGame(playing()));
    mutate(parsed.game);
    return deserializeGame(JSON.stringify(parsed));
  };

  it("rechaza estados inconsistentes", () => {
    expect(tamper((g) => (g.status = "volando"))).toBeNull();
    expect(tamper((g) => delete g.challenge)).toBeNull();
    expect(tamper((g) => (g.challenge.originId = "x"))).toBeNull();
    expect(tamper((g) => (g.startedAt = null))).toBeNull(); // jugando sin startedAt
    expect(tamper((g) => (g.finishedAt = T0))).toBeNull(); // jugando con finishedAt
    expect(tamper((g) => (g.path = []))).toBeNull();
    expect(tamper((g) => (g.path[0] = { type: "player", id: 999 }))).toBeNull(); // no empieza en el origen
    expect(tamper((g) => (g.path[1] = { type: "player", id: 5 }))).toBeNull(); // no alterna
    expect(tamper((g) => (g.path[1] = { type: "club", id: 5 }))).toBeNull(); // tipo inválido
    expect(
      tamper(
        (g) =>
          (g.path = Array(30)
            .fill(0)
            .map((_, i) => (i % 2 ? { type: "club-season", id: 1 } : { type: "player", id: 1 }))),
      ),
    ).toBeNull();
  });

  it("rechaza 'ready' con tiempo o saltos, y 'won' sin destino al final", () => {
    const ready = JSON.parse(serializeGame(createGame(messiToCopetti)));
    ready.game.startedAt = T0;
    expect(deserializeGame(JSON.stringify(ready))).toBeNull();

    const w = JSON.parse(serializeGame(won()));
    w.game.path.pop();
    w.game.path.push({ type: "player", id: 1 });
    expect(deserializeGame(JSON.stringify(w))).toBeNull();

    const finishedBeforeStart = JSON.parse(serializeGame(won()));
    finishedBeforeStart.game.finishedAt = T0 - 1;
    expect(deserializeGame(JSON.stringify(finishedBeforeStart))).toBeNull();
  });
});

describe("settleStaleGame", () => {
  it("la partida del día actual no cambia", () => {
    const s = playing();
    expect(settleStaleGame(s, "2026-10-08", T0 + 5000)).toEqual(s);
  });

  it("una partida en curso de un día anterior se cierra como derrota", () => {
    const stale = settleStaleGame(playing(), "2026-10-09", T0 + 9000);
    expect(stale?.status).toBe("lost");
    expect(stale?.finishedAt).toBe(T0 + 9000);
  });

  it("una partida lista (sin Start) de un día anterior se descarta", () => {
    expect(settleStaleGame(createGame(messiToCopetti), "2026-10-09", T0)).toBeNull();
  });

  it("una partida ya terminada de un día anterior queda como está", () => {
    const s = won();
    expect(settleStaleGame(s, "2026-10-09", T0 + 99999)).toEqual(s);
  });
});
