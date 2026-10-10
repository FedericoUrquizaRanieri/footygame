import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createGame, selectNode, startGame } from "@/domain/game";
import { clubSeasonNode, playerNode } from "@/domain/types";
import {
  clearSession,
  readTodaySession,
  writeGame,
  writeLabels,
  writeResult,
} from "@/lib/game-store";
import type { FinishResult } from "@/lib/api-client";

class FakeStorage {
  private data = new Map<string, string>();
  getItem = (k: string) => this.data.get(k) ?? null;
  setItem = (k: string, v: string) => void this.data.set(k, v);
  removeItem = (k: string) => void this.data.delete(k);
}

const NOW = Date.parse("2026-10-09T15:00:00Z"); // 12:00 en Buenos Aires
const challenge = { id: 7, date: "2026-10-09", originId: 1, destinationId: 3 };
const result: FinishResult = {
  valid: true,
  result: "won",
  jumps: 4,
  elapsedMs: 60_000,
  optimal: { length: 4, pathsCount: 2, path: [{ type: "player", id: 1, label: "A" }] },
  extraJumps: 0,
  isOptimal: true,
};

beforeEach(() => {
  (globalThis as { window?: unknown }).window = { localStorage: new FakeStorage() };
});
afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("game-store", () => {
  it("sin nada guardado devuelve null", () => {
    expect(readTodaySession(NOW)).toBeNull();
  });

  it("restaura la partida, las etiquetas y el resultado de hoy", () => {
    let game = startGame(createGame(challenge), NOW);
    game = selectNode(game, clubSeasonNode(10), NOW + 1000);
    writeGame(game);
    writeLabels({ "p:1": "Lionel Messi" });
    writeResult(result);

    const session = readTodaySession(NOW + 2000);
    expect(session?.game).toEqual(game);
    expect(session?.labels).toEqual({ "p:1": "Lionel Messi" });
    expect(session?.result).toEqual(result);
    expect(session?.game.path).toEqual([playerNode(1), clubSeasonNode(10)]);
  });

  it("descarta (y borra) una partida de otro día", () => {
    writeGame(startGame(createGame(challenge), NOW));
    const tomorrow = NOW + 24 * 3600 * 1000;
    expect(readTodaySession(tomorrow)).toBeNull();
    expect(readTodaySession(NOW)).toBeNull(); // ya se borró
  });

  it("ignora datos corruptos", () => {
    const store = (globalThis as unknown as { window: { localStorage: FakeStorage } }).window
      .localStorage;
    store.setItem("footygame:v1:game", "{rota");
    expect(readTodaySession(NOW)).toBeNull();
  });

  it("ignora etiquetas o resultado inválidos sin perder la partida", () => {
    const store = (globalThis as unknown as { window: { localStorage: FakeStorage } }).window
      .localStorage;
    writeGame(startGame(createGame(challenge), NOW));
    store.setItem("footygame:v1:labels", "[1,2]");
    store.setItem("footygame:v1:result", '{"valid":false}');
    const session = readTodaySession(NOW);
    expect(session?.labels).toEqual({});
    expect(session?.result).toBeNull();
    expect(session?.game.status).toBe("playing");
  });

  it("clearSession borra todo", () => {
    writeGame(startGame(createGame(challenge), NOW));
    writeResult(result);
    clearSession();
    expect(readTodaySession(NOW)).toBeNull();
  });

  it("sin almacenamiento disponible no falla", () => {
    delete (globalThis as { window?: unknown }).window;
    expect(() => writeGame(startGame(createGame(challenge), NOW))).not.toThrow();
    expect(readTodaySession(NOW)).toBeNull();
  });
});
