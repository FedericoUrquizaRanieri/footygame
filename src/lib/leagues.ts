/** Nombre de cada liga a partir del código de competición de la base. Son nombres propios: no se traducen. */
const LEAGUES: Record<string, string> = {
  GB1: "Premier League",
  ES1: "LaLiga",
  IT1: "Serie A",
  L1: "Bundesliga",
  FR1: "Ligue 1",
  ARG1: "Liga Profesional",
  BRA1: "Brasileirão",
  PO1: "Liga Portugal",
  NL1: "Eredivisie",
  MLS1: "MLS",
};

export const leagueName = (code: string | undefined): string | null =>
  code ? (LEAGUES[code] ?? null) : null;
