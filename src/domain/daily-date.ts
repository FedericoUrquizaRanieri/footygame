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
