import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createGame, selectNode, startGame } from "@/domain/game";
import { clubSeasonNode, playerNode } from "@/domain/types";
import {
  archiveKey,
  clearSession,
  readArchiveSession,
  readArchiveStatuses,
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
  difficulty: "normal",
  result: "won",
  jumps: 4,
  elapsedMs: 60_000,
  optimal: {
    length: 4,
    pathsCount: 2,
    paths: [[{ type: "player", id: 1, label: "A" }]],
  },
  extraJumps: 0,
  isOptimal: true,
};

const daily = { daily: "normal" } as const;
const dailyHard = { daily: "hard" } as const;

const store = () =>
  (globalThis as unknown as { window: { localStorage: FakeStorage } }).window.localStorage;

beforeEach(() => {
  (globalThis as { window?: unknown }).window = { localStorage: new FakeStorage() };
});
afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("game-store", () => {
  it("sin nada guardado devuelve null", () => {
    expect(readTodaySession("normal", NOW)).toBeNull();
  });

  it("restaura la partida, las etiquetas y el resultado de hoy", () => {
    let game = startGame(createGame(challenge), NOW);
    game = selectNode(game, clubSeasonNode(10), NOW + 1000);
    writeGame(game, daily);
    writeLabels({ "p:1": "Lionel Messi" }, daily);
    writeResult(result, daily);

    const session = readTodaySession("normal", NOW + 2000);
    expect(session?.game).toEqual(game);
    expect(session?.labels).toEqual({ "p:1": "Lionel Messi" });
    expect(session?.result).toEqual(result);
    expect(session?.game.path).toEqual([playerNode(1), clubSeasonNode(10)]);
  });

  it("el normal y el difícil de hoy son partidas distintas", () => {
    const hard = { ...challenge, id: 8, destinationId: 5 };
    writeGame(startGame(createGame(challenge), NOW), daily);
    writeGame(startGame(createGame(hard), NOW), dailyHard);
    expect(readTodaySession("normal", NOW)?.game.challenge.id).toBe(7);
    expect(readTodaySession("hard", NOW)?.game.challenge.id).toBe(8);
    clearSession(daily);
    expect(readTodaySession("normal", NOW)).toBeNull();
    expect(readTodaySession("hard", NOW)).not.toBeNull();
  });

  it("descarta (y borra) una partida de otro día", () => {
    writeGame(startGame(createGame(challenge), NOW), daily);
    const tomorrow = NOW + 24 * 3600 * 1000;
    expect(readTodaySession("normal", tomorrow)).toBeNull();
    expect(readTodaySession("normal", NOW)).toBeNull(); // ya se borró
  });

  it("ignora datos corruptos", () => {
    store().setItem("footygame:v1:daily:normal:game", "{rota");
    expect(readTodaySession("normal", NOW)).toBeNull();
  });

  it("ignora etiquetas o resultado inválidos sin perder la partida", () => {
    writeGame(startGame(createGame(challenge), NOW), daily);
    store().setItem("footygame:v1:daily:normal:labels", "[1,2]");
    store().setItem("footygame:v1:daily:normal:result", '{"valid":false}');
    const session = readTodaySession("normal", NOW);
    expect(session?.labels).toEqual({});
    expect(session?.result).toBeNull();
    expect(session?.game.status).toBe("playing");
  });

  it("ignora un resultado guardado con el formato anterior (un solo camino óptimo)", () => {
    writeGame(startGame(createGame(challenge), NOW), daily);
    const old = { ...result, optimal: { length: 4, pathsCount: 2, path: [] } };
    store().setItem("footygame:v1:daily:normal:result", JSON.stringify(old));
    expect(readTodaySession("normal", NOW)?.result).toBeNull();
  });

  it("clearSession borra todo", () => {
    writeGame(startGame(createGame(challenge), NOW), daily);
    writeResult(result, daily);
    clearSession(daily);
    expect(readTodaySession("normal", NOW)).toBeNull();
  });

  it("sin almacenamiento disponible no falla", () => {
    delete (globalThis as { window?: unknown }).window;
    expect(() => writeGame(startGame(createGame(challenge), NOW), daily)).not.toThrow();
    expect(readTodaySession("normal", NOW)).toBeNull();
  });
});

describe("sesiones de desafíos pasados", () => {
  const past = { id: 3, date: "2026-10-04", originId: 1, destinationId: 3 };
  const other = { id: 4, date: "2026-10-05", originId: 1, destinationId: 3 };
  const scope = (date: string, level: "normal" | "hard" = "normal") => ({ archive: date, level });

  it("se guardan aparte del desafío diario", () => {
    const game = startGame(createGame(past), NOW);
    writeGame(game, scope(past.date));
    expect(readTodaySession("normal", NOW)).toBeNull();
    expect(readArchiveSession(past.date, "normal")?.game).toEqual(game);
  });

  it("una partida de práctica no se descarta por ser de otro día", () => {
    writeGame(startGame(createGame(past), NOW), scope(past.date));
    expect(readArchiveSession(past.date, "normal")).not.toBeNull();
  });

  it("cada fecha tiene su propia sesión, con sus etiquetas y su resultado", () => {
    writeGame(startGame(createGame(past), NOW), scope(past.date));
    writeLabels({ "p:1": "A" }, scope(past.date));
    writeGame(startGame(createGame(other), NOW), scope(other.date));
    writeResult(result, scope(other.date));
    expect(readArchiveSession(past.date, "normal")?.labels).toEqual({ "p:1": "A" });
    expect(readArchiveSession(past.date, "normal")?.result).toBeNull();
    expect(readArchiveSession(other.date, "normal")?.result).toEqual(result);
  });

  it("el normal y el difícil de la misma fecha son sesiones distintas", () => {
    writeGame(startGame(createGame(past), NOW), scope(past.date, "normal"));
    expect(readArchiveSession(past.date, "hard")).toBeNull();
    writeGame(startGame(createGame({ ...past, id: 9 }), NOW), scope(past.date, "hard"));
    expect(readArchiveSession(past.date, "hard")?.game.challenge.id).toBe(9);
    expect(readArchiveSession(past.date, "normal")?.game.challenge.id).toBe(3);
  });

  it("clearSession con una fecha solo borra esa", () => {
    writeGame(startGame(createGame(past), NOW), scope(past.date));
    writeGame(startGame(createGame(other), NOW), scope(other.date));
    clearSession(scope(past.date));
    expect(readArchiveSession(past.date, "normal")).toBeNull();
    expect(readArchiveSession(other.date, "normal")).not.toBeNull();
  });

  it("ignora una sesión guardada bajo otra fecha de desafío", () => {
    writeGame(startGame(createGame(other), NOW), scope(past.date));
    expect(readArchiveSession(past.date, "normal")).toBeNull();
  });

  it("no pisa la partida del día", () => {
    const today = { ...challenge };
    writeGame(startGame(createGame(today), NOW), daily);
    writeGame(startGame(createGame(past), NOW), scope(past.date));
    expect(readTodaySession("normal", NOW)?.game.challenge.date).toBe("2026-10-09");
  });

  it("readArchiveStatuses informa el estado de cada desafío jugado", () => {
    let won = startGame(createGame(past), NOW);
    won = selectNode(won, clubSeasonNode(10), NOW + 1);
    won = selectNode(won, playerNode(3), NOW + 2);
    writeGame(won, scope(past.date));
    writeGame(startGame(createGame(other), NOW), scope(other.date, "hard"));
    expect(
      readArchiveStatuses([
        { date: past.date, level: "normal" },
        { date: past.date, level: "hard" },
        { date: other.date, level: "hard" },
        { date: "2026-10-01", level: "normal" },
      ]),
    ).toEqual({
      [archiveKey(past.date, "normal")]: "won",
      [archiveKey(other.date, "hard")]: "playing",
    });
  });
});
