const pad = (n: number) => String(n).padStart(2, "0");

/** 83_000 -> "01:23"; desde una hora: "1:02:03". */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** 18_753 segundos -> "05:12:33". */
export function formatCountdown(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** "2026-10-09" -> "9 de octubre" / "October 9". */
export function formatChallengeDate(date: string, locale: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** Desde este valor de mercado la figurita sale "brillante" (las estrellas del plantel). */
export const FOIL_VALUE_EUR = 50_000_000;

/** 30_000_000 -> "€30 M"; 4_500_000 -> "€4,5 M"; 800_000 -> "€800 K". */
export function formatMarketValue(eur: number, locale: string): string {
  if (eur >= 1_000_000) {
    const millions = eur / 1_000_000;
    const n = new Intl.NumberFormat(locale, { maximumFractionDigits: millions >= 10 ? 0 : 1 });
    return `€${n.format(millions)} M`;
  }
  return `€${Math.max(1, Math.round(eur / 1000))} K`;
}
