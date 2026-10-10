import { describe, expect, it } from "vitest";
import { createGame, giveUp, selectNode, startGame } from "@/domain/game";
import { clubSeasonNode } from "@/domain/types";
import type { FinishResult } from "@/lib/api-client";
import { entryFromResult } from "@/lib/history-store";

const challenge = { id: 7, date: "2026-10-09", originId: 1, destinationId: 3 };

const result: FinishResult = {
  valid: true,
  difficulty: "hard",
  result: "won",
  jumps: 6,
  elapsedMs: 84_000,
  optimal: { length: 4, pathsCount: 2, path: [] },
  extraJumps: 2,
  isOptimal: false,
};

describe("entryFromResult", () => {
  it("arma la entrada del historial con los datos validados por el servidor", () => {
    const game = startGame(createGame(challenge), 1000);
    expect(entryFromResult(game, result, "daily")).toEqual({
      date: "2026-10-09",
      challengeId: 7,
      result: "won",
      gaveUp: false,
      jumps: 6,
      elapsedMs: 84_000,
      optimalLength: 4,
      difficulty: "hard",
      mode: "daily",
    });
  });

  it("marca la rendición y el modo práctica", () => {
    let game = startGame(createGame(challenge), 1000);
    game = selectNode(game, clubSeasonNode(10), 2000);
    const over = giveUp(game, 3000);
    const entry = entryFromResult(
      over,
      { ...result, result: "lost", jumps: 1, gaveUp: true },
      "archive",
    );
    expect(entry).toMatchObject({ result: "lost", gaveUp: true, mode: "archive", jumps: 1 });
  });
});
