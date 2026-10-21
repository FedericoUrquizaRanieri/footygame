import { afterAll, describe, expect, it } from "vitest";
import { challengeDateFor } from "@/domain/daily-date";
import { closePool } from "@/server/db";
import { getArchiveList, getChallengeForDate, getChallengesForDate } from "@/server/queries";
import { COPETTI, MBAPPE, NEYMAR, RONALDO } from "../fixtures/mini-graph";
import { testDates } from "../fixtures/db-seed";
import { hasDb } from "../helpers/db";

afterAll(closePool);

describe.skipIf(!hasDb)("desafíos pasados (consultas)", () => {
  const { today, yesterday, twoDaysAgo } = testDates();

  it("lista solo los anteriores a hoy, del más reciente al más antiguo, con el normal antes que el difícil", async () => {
    const list = await getArchiveList(today, 50);
    expect(list.map((c) => `${c.date}:${c.difficulty}`)).toEqual([
      `${yesterday}:normal`,
      `${yesterday}:hard`,
      `${twoDaysAgo}:normal`,
    ]);
  });

  it("incluye nombres y nivel, y nada de la solución", async () => {
    const [first] = await getArchiveList(today, 50);
    expect(first.origin).toEqual({ id: NEYMAR, name: "Neymar" });
    expect(first.destination).toEqual({ id: COPETTI, name: "Enzo Copetti" });
    expect(first.difficulty).toBe("normal");
    expect(Object.keys(first).sort()).toEqual([
      "date",
      "destination",
      "difficulty",
      "id",
      "origin",
    ]);
  });

  it("respeta el límite", async () => {
    expect(await getArchiveList(today, 1)).toHaveLength(1);
  });

  it("no incluye el desafío de hoy ni los futuros aunque existan", async () => {
    const dates = (await getArchiveList(today, 50)).map((c) => c.date);
    expect(dates).not.toContain(today);
    expect(dates).not.toContain(challengeDateFor(Date.now() + 86_400_000));
  });

  it("un desafío pasado se puede pedir por fecha (normal por defecto)", async () => {
    const challenge = await getChallengeForDate(twoDaysAgo);
    expect(challenge?.origin.id).toBe(MBAPPE);
    expect(challenge?.difficulty).toBe("normal");
  });

  it("se puede pedir el nivel difícil de una fecha", async () => {
    const hard = await getChallengeForDate(yesterday, "hard");
    expect(hard?.origin.id).toBe(RONALDO);
    expect(hard?.difficulty).toBe("hard");
    expect(await getChallengeForDate(twoDaysAgo, "hard")).toBeNull();
  });

  it("los dos desafíos de un día se piden juntos", async () => {
    const both = await getChallengesForDate(yesterday);
    expect(both.map((c) => c.difficulty)).toEqual(["normal", "hard"]);
  });

  it("una fecha sin desafío devuelve null", async () => {
    expect(await getChallengeForDate("2000-01-01")).toBeNull();
  });
});
