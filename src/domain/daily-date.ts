export const CHALLENGE_TIMEZONE = "America/Argentina/Buenos_Aires";

const formatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CHALLENGE_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Fecha (YYYY-MM-DD) del desafío vigente en el instante dado, según Buenos Aires. */
export function challengeDateFor(now: Date | number): string {
  const parts = formatter.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: CHALLENGE_TIMEZONE,
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Segundos que faltan para que cambie el desafío diario (medianoche de Buenos Aires). */
export function secondsUntilNextChallengeDay(now: Date | number): number {
  const parts = clock.formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const elapsed = get("hour") * 3600 + get("minute") * 60 + get("second");
  return 86_400 - elapsed;
}

/** Suma (o resta) días de calendario a una fecha YYYY-MM-DD. No depende de la zona horaria. */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** ¿Es `date` una fecha real (YYYY-MM-DD) anterior a `today`? Define qué desafíos se pueden jugar de práctica. */
export function isArchiveDate(date: string, today: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  // Una fecha imposible (2026-02-30) no sobrevive al viaje de ida y vuelta por el calendario.
  if (shiftDate(date, 0) !== date) return false;
  return date < today;
}
