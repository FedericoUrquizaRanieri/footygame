import { describe, expect, it } from "vitest";
import {
  CHALLENGE_TIMEZONE,
  challengeDateFor,
  isArchiveDate,
  secondsUntilNextChallengeDay,
} from "@/domain/daily-date";

describe("challengeDateFor", () => {
  it("usa la zona horaria de Buenos Aires", () => {
    expect(CHALLENGE_TIMEZONE).toBe("America/Argentina/Buenos_Aires");
  });

  it("a las 02:59Z (23:59 en Buenos Aires) sigue siendo el día anterior", () => {
    expect(challengeDateFor(new Date("2026-10-08T02:59:59Z"))).toBe("2026-10-07");
  });

  it("a las 03:00Z (00:00 en Buenos Aires) cambia el día", () => {
    expect(challengeDateFor(new Date("2026-10-08T03:00:00Z"))).toBe("2026-10-08");
  });

  it("acepta timestamps numéricos", () => {
    expect(challengeDateFor(Date.parse("2026-10-08T15:00:00Z"))).toBe("2026-10-08");
  });

  it("maneja el cambio de año", () => {
    expect(challengeDateFor(new Date("2027-01-01T02:00:00Z"))).toBe("2026-12-31");
    expect(challengeDateFor(new Date("2027-01-01T03:00:00Z"))).toBe("2027-01-01");
  });

  it("devuelve siempre formato YYYY-MM-DD", () => {
    expect(challengeDateFor(new Date("2026-03-05T12:00:00Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("secondsUntilNextChallengeDay", () => {
  it("a medianoche de Buenos Aires faltan 24 horas", () => {
    expect(secondsUntilNextChallengeDay(new Date("2026-10-08T03:00:00Z"))).toBe(86_400);
  });

  it("un segundo antes de medianoche falta 1 segundo", () => {
    expect(secondsUntilNextChallengeDay(new Date("2026-10-08T02:59:59Z"))).toBe(1);
  });

  it("al mediodía de Buenos Aires faltan 12 horas", () => {
    expect(secondsUntilNextChallengeDay(new Date("2026-10-08T15:00:00Z"))).toBe(43_200);
  });
});

describe("isArchiveDate", () => {
  const today = "2026-10-09";

  it("acepta fechas anteriores a hoy", () => {
    expect(isArchiveDate("2026-10-08", today)).toBe(true);
    expect(isArchiveDate("2025-01-01", today)).toBe(true);
  });

  it("rechaza hoy y el futuro", () => {
    expect(isArchiveDate("2026-10-09", today)).toBe(false);
    expect(isArchiveDate("2026-10-10", today)).toBe(false);
  });

  it("rechaza formatos inválidos y fechas imposibles", () => {
    for (const bad of [
      "",
      "hoy",
      "09-10-2026",
      "2026-1-5",
      "2026-13-01",
      "2026-02-30",
      "2026-10-08x",
    ]) {
      expect(isArchiveDate(bad, today), bad).toBe(false);
    }
  });
});
