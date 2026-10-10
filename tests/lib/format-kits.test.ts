import { describe, expect, it } from "vitest";
import { formatChallengeDate, formatClock, formatCountdown } from "@/lib/format";
import { initials, kitFor } from "@/lib/kits";

describe("formatClock", () => {
  it("formatea mm:ss", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(83_000)).toBe("01:23");
    expect(formatClock(59_999)).toBe("00:59");
  });

  it("agrega horas desde una hora", () => {
    expect(formatClock(3_723_000)).toBe("1:02:03");
  });

  it("no muestra tiempos negativos", () => {
    expect(formatClock(-5000)).toBe("00:00");
  });
});

describe("formatCountdown", () => {
  it("formatea hh:mm:ss", () => {
    expect(formatCountdown(18_753)).toBe("05:12:33");
    expect(formatCountdown(0)).toBe("00:00:00");
    expect(formatCountdown(86_400)).toBe("24:00:00");
  });
});

describe("formatChallengeDate", () => {
  it("usa el idioma pedido", () => {
    expect(formatChallengeDate("2026-10-09", "es")).toBe("9 de octubre");
    expect(formatChallengeDate("2026-10-09", "en")).toBe("October 9");
  });
});

describe("initials", () => {
  it("toma primera y última palabra", () => {
    expect(initials("Lionel Messi")).toBe("LM");
    expect(initials("Donny van de Beek")).toBe("DB");
  });

  it("con una sola palabra toma dos letras", () => {
    expect(initials("Neymar")).toBe("NE");
  });

  it("ignora acentos y símbolos", () => {
    expect(initials("Ángel Di María")).toBe("AM");
    expect(initials("  -  ")).toBe("?");
  });
});

describe("kitFor", () => {
  it("es determinista", () => {
    expect(kitFor(28003)).toEqual(kitFor(28003));
  });

  it("devuelve colores con texto legible (claro u oscuro definidos)", () => {
    for (const id of [1, 2, 3, 583, 28003, 5_832_021]) {
      const kit = kitFor(id);
      expect(kit.bg).toMatch(/^#[0-9a-f]{6}$/);
      expect(kit.fg).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
