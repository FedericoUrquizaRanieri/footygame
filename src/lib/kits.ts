export interface Kit {
  bg: string;
  fg: string;
}

/** Colores de camiseta para monogramas y escudos de reemplazo (la v1 no usa fotos ni escudos reales). */
const KITS: readonly Kit[] = [
  { bg: "#c8372d", fg: "#f1f3ec" },
  { bg: "#1f5fa8", fg: "#f1f3ec" },
  { bg: "#f2a900", fg: "#0e2219" },
  { bg: "#6b3fa0", fg: "#f1f3ec" },
  { bg: "#0e8a7d", fg: "#f1f3ec" },
  { bg: "#d9531e", fg: "#f1f3ec" },
  { bg: "#b0305a", fg: "#f1f3ec" },
  { bg: "#2a6f97", fg: "#f1f3ec" },
];

/** Misma camiseta siempre para el mismo id. */
export function kitFor(id: number): Kit {
  const mixed = Math.imul(Math.abs(id) + 1, 2654435761) >>> 0;
  return KITS[mixed % KITS.length];
}

/** "Lionel Messi" -> "LM"; "Neymar" -> "NE"; "Club Atlético Rosario Central" -> "CC". */
export function initials(name: string): string {
  const words = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/\s+/)
    .filter((w) => /\p{L}/u.test(w));
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
