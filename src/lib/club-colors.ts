/**
 * Colores y diseño de camiseta de cada club, para dibujar escudos ILUSTRATIVOS (no oficiales).
 * Los colores son datos factuales; las formas son plantillas propias y no copian ningún emblema.
 * La clave es el id de Transfermarkt del club (clubs.id). Si falta un club, se usa `kitFor`.
 */

export type ShieldPattern =
  "solid" | "stripes" | "halves" | "hoops" | "band" | "sash" | "chevron" | "cross";

export interface ClubLook {
  pattern: ShieldPattern;
  /** Color principal (fondo). */
  primary: string;
  /** Color secundario (franjas, banda, texto). */
  secondary: string;
}

const PALETTE: Record<string, string> = {
  r: "#d0212b", // rojo
  dr: "#7b1e3a", // granate
  b: "#1f56b4", // azul
  nb: "#14274e", // azul marino
  lb: "#6cb4ee", // celeste
  y: "#f6c900", // amarillo
  o: "#f07d00", // naranja
  w: "#f4f4f0", // blanco
  k: "#14161a", // negro
  g: "#1a8a3c", // verde
  p: "#5e2a8c", // violeta
  pk: "#e86aa0", // rosa
  gr: "#8b9099", // gris
  gd: "#c9a227", // dorado
  br: "#6b3d1f", // marrón
};

const PATTERNS: Record<string, ShieldPattern> = {
  solid: "solid",
  stripes: "stripes",
  halves: "halves",
  hoops: "hoops",
  band: "band",
  sash: "sash",
  chevron: "chevron",
  cross: "cross",
};

/** `id patrón principal secundario  # club`. */
const TABLE = `
1030 stripes r w # Argentinos Juniors
14602 stripes r w # Estudiantes (Río Cuarto)
19775 stripes k w # Riestra
10511 stripes k g # San Martín (San Juan)
12574 stripes b w # Godoy Cruz
12301 stripes g y # Aldosivi
830 stripes g w # Banfield
25184 stripes r w # Barracas Central
2417 solid lb w # Belgrano
189 band b y # Boca Juniors
31284 stripes k w # Central Córdoba
14687 stripes b w # Gimnasia (Mendoza)
2063 solid w r # Huracán
1234 solid r w # Independiente
333 solid dr w # Lanús
1286 halves r k # Newell's
928 stripes br w # Platense
209 sash w r # River Plate
1418 stripes b y # Rosario Central
1775 stripes b r # San Lorenzo
12454 stripes g w # Sarmiento
3938 stripes nb w # Talleres
11831 stripes nb r # Tigre
14554 stripes lb w # Atlético Tucumán
7097 stripes r w # Unión
1029 chevron w b # Vélez
288 stripes r w # Estudiantes (La Plata)
2402 halves g y # Defensa y Justicia
12179 stripes b w # Independiente Rivadavia
1106 stripes nb w # Gimnasia (La Plata)
1829 stripes r w # Instituto
1444 stripes lb w # Racing
17776 solid g w # Chapecoense
2029 stripes k w # Ceará
978 sash k w # Vasco da Gama
330 stripes k w # Atlético Mineiro
679 stripes r k # Athletico Paranaense
614 hoops r k # Flamengo
10997 solid nb w # Remo
776 stripes g w # Coritiba
609 solid b w # Cruzeiro
10010 stripes b r # Bahia
10492 stripes g w # Juventude
2125 halves r k # Vitória
2462 stripes dr g # Fluminense
10870 stripes b r # Fortaleza
210 stripes lb k # Grêmio
3876 halves y g # Mirasol
8793 solid w r # Bragantino
537 stripes k w # Botafogo
221 solid w gr # Santos
1023 solid g w # Palmeiras
199 solid w k # Corinthians
6600 solid r w # Internacional
8718 halves r k # Sport Recife
585 band w r # São Paulo
621 stripes r w # Athletic Bilbao
13 stripes r w # Atlético de Madrid
331 solid r nb # Osasuna
1244 stripes b w # Leganés
940 solid lb w # Celta
2687 solid y b # Cádiz
993 stripes g w # Córdoba
1108 stripes b w # Alavés
897 stripes b w # Deportivo
1531 sash w g # Elche
131 stripes b dr # Barcelona
3709 solid b w # Getafe
12321 stripes r w # Girona
16795 stripes r w # Granada
3368 stripes b dr # Levante
1084 stripes lb w # Málaga
714 stripes b w # Espanyol
237 solid r k # Mallorca
367 sash w r # Rayo Vallecano
150 stripes g w # Betis
418 solid w nb # Real Madrid
2497 solid b w # Oviedo
681 stripes b w # Real Sociedad
366 solid p w # Valladolid
142 solid w b # Zaragoza
1533 stripes b dr # Eibar
5358 stripes b dr # Huesca
368 solid w r # Sevilla
2448 stripes r w # Sporting Gijón
3302 stripes r w # Almería
472 solid y b # Las Palmas
1049 solid w k # Valencia
1050 solid y b # Villarreal
1147 stripes r w # AC Ajaccio
290 stripes b w # Auxerre
162 halves r w # Monaco
1159 solid w r # Nancy
618 solid g w # Saint-Étienne
1416 solid w k # Amiens
1420 stripes k w # Angers
3524 stripes r b # Clermont
2969 solid r w # Dijon
855 stripes r k # Guingamp
1095 solid b w # Troyes
40 solid nb w # Bordeaux
1158 solid o k # Lorient
347 solid dr w # Metz
995 solid y g # Nantes
750 solid y b # Sochaux
415 solid p w # Toulouse
3558 stripes r w # GFC Ajaccio
1082 solid r nb # Lille
738 solid lb nb # Le Havre
969 solid nb o # Montpellier
1160 solid r w # Nîmes
417 stripes r k # Niza
1041 band w b # Lyon
244 solid w lb # Marsella
10004 solid b w # Paris FC
583 band nb r # PSG
826 stripes r y # Lens
667 solid b w # Estrasburgo
595 solid b w # Bastia
1162 solid b r # Caen
3911 solid r w # Brest
1421 solid r w # Reims
273 halves r k # Rennes
14171 stripes r w # Évian
1423 solid r w # Valenciennes
989 stripes r k # Bournemouth
11 solid r w # Arsenal
405 solid dr lb # Aston Villa
1148 stripes r w # Brentford
1237 stripes b w # Brighton
1132 solid dr lb # Burnley
603 solid b w # Cardiff
631 solid b w # Chelsea
873 stripes r b # Crystal Palace
29 solid b w # Everton
931 solid w k # Fulham
1110 stripes b w # Huddersfield
3008 stripes o k # Hull City
677 solid b w # Ipswich
399 solid w y # Leeds
1003 solid b w # Leicester
31 solid r w # Liverpool
1031 solid o nb # Luton
281 solid lb w # Manchester City
985 solid r w # Manchester United
641 chevron r w # Middlesbrough
762 stripes k w # Newcastle
1123 solid y g # Norwich
703 solid r w # Nottingham Forest
1039 hoops b w # QPR
1032 hoops b w # Reading
350 stripes r w # Sheffield United
180 stripes r w # Southampton
512 stripes r w # Stoke
289 stripes r w # Sunderland
2288 solid w k # Swansea
148 solid w nb # Tottenham
1010 solid y k # Watford
984 stripes nb w # West Brom
379 solid dr lb # West Ham
1071 stripes b w # Wigan
543 solid gd k # Wolverhampton
4102 stripes r w # Carpi
5 stripes r k # Milan
2919 solid r w # Monza
430 solid p w # Fiorentina
12 solid dr o # Roma
800 stripes nb k # Atalanta
4171 stripes r y # Benevento
1025 stripes r nb # Bologna
19 solid b w # Brescia
1390 stripes r nb # Cagliari
1627 stripes r lb # Catania
1429 stripes k w # Cesena
862 solid y b # Chievo
1047 solid b w # Como
2921 stripes lb w # Pescara
4083 stripes r b # Crotone
749 solid b w # Empoli
8970 solid y b # Frosinone
252 halves r nb # Genoa
276 solid y b # Hellas Verona
46 stripes b k # Inter
506 stripes k w # Juventus
458 solid pk k # Palermo
130 cross w y # Parma
4172 stripes k b # Pisa
2722 stripes lb w # SPAL
6195 solid lb w # Napoli
1387 stripes k w # Siena
398 solid lb w # Lazio
3522 solid w k # Spezia
416 solid dr w # Torino
1038 band b w # Sampdoria
2239 stripes r gr # Cremonese
1005 stripes y r # Lecce
1210 solid dr w # Livorno
380 solid dr w # Salernitana
6574 stripes g k # Sassuolo
410 stripes k w # Udinese
607 halves g o # Venezia
2036 stripes r b # Heidenheim
3 solid w r # Köln
4 solid r k # Núremberg
89 solid r w # Union Berlin
39 solid r w # Mainz
10 stripes b k # Arminia Bielefeld
15 solid r k # Leverkusen
27 solid r nb # Bayern Múnich
16 solid y k # Dortmund
18 solid w g # Mönchengladbach
23 solid y b # Braunschweig
24 solid k r # Eintracht Frankfurt
167 stripes r g # Augsburgo
4795 stripes r k # Ingolstadt
33 solid b w # Schalke
35 solid br w # St. Pauli
38 solid r w # Düsseldorf
41 solid w b # Hamburgo
42 solid r k # Hannover
44 stripes b w # Hertha
269 solid b w # Kiel
23826 solid w r # RB Leipzig
60 solid r k # Friburgo
127 stripes b k # Paderborn
105 solid b w # Darmstadt
86 solid g w # Werder Bremen
65 solid g w # Greuther Fürth
533 solid b w # Hoffenheim
79 solid w r # Stuttgart
80 solid b w # Bochum
82 solid g w # Wolfsburgo
51663 stripes r k # Atlanta United
72309 solid g k # Austin
78435 solid lb w # Charlotte
432 solid r nb # Chicago Fire
69261 solid pk k # Inter Miami
4078 solid b k # Montréal
1247 solid dr lb # Colorado Rapids
813 solid y k # Columbus Crew
2440 solid k r # D.C. United
8816 hoops r b # FC Dallas
51772 solid o b # Cincinnati
9168 solid o w # Houston Dynamo
51828 stripes k gd # Los Angeles FC
1061 solid w nb # LA Galaxy
56089 solid gr lb # Minnesota United
63966 solid y nb # Nashville
626 solid nb r # New England
40058 solid lb nb # New York City
45604 solid p w # Orlando City
25467 band nb gd # Philadelphia Union
4291 solid g gd # Portland Timbers
6643 solid dr b # Real Salt Lake
623 solid w r # Red Bull New York
114977 solid lb nb # San Diego
218 solid b k # San Jose
9636 solid g nb # Seattle Sounders
4284 solid lb nb # Sporting Kansas City
82686 solid r nb # St. Louis City
11141 solid r gr # Toronto
6321 solid w b # Vancouver
1268 solid g y # ADO Den Haag
1090 solid r w # AZ
610 band w r # Ajax
723 stripes r k # Almere City
642 stripes b w # De Graafschap
798 hoops r k # Excelsior
1455 stripes r w # Dordrecht
1283 solid r w # Emmen
202 solid g w # Groningen
317 solid r w # Twente
200 solid r w # Utrecht
724 solid o k # Volendam
234 halves r w # Feyenoord
385 solid y g # Fortuna Sittard
1435 stripes r y # Go Ahead Eagles
1304 stripes k w # Heracles
132 solid y k # NAC Breda
467 stripes r g # NEC
1269 solid b w # Zwolle
383 stripes r w # PSV
235 solid y b # RKC
192 stripes y k # Roda JC
133 solid y b # Cambuur
306 stripes b w # Heerenveen
1434 solid w k # Telstar
468 hoops r w # Sparta
1426 stripes y k # VVV-Venlo
499 stripes y k # Vitesse
403 stripes r b # Willem II
2990 solid k w # Académica
110302 solid g w # AVS
2457 solid b w # B SAD
2503 stripes k w # Boavista
3349 solid y b # Feirense
982 stripes k w # Nacional
2423 solid r w # Santa Clara
7179 solid g y # Tondela
2431 halves r g # Estrela Amadora
68608 solid b w # Os Belenenses
976 solid o k # União Madeira
1301 stripes g r # Marítimo
3268 solid w k # Casa Pia
3336 stripes g w # Desportivo Aves
2521 solid y r # Alverca
8024 solid y b # Arouca
3329 stripes r w # Famalicão
2995 solid y g # Paços de Ferreira
3327 stripes k w # Penafiel
720 stripes b w # Porto
6912 stripes r w # Vizela
3325 stripes b w # Chaves
1465 solid y b # Estoril
2424 stripes r b # Gil Vicente
979 solid g w # Moreirense
7378 stripes k w # Portimonense
2425 solid g w # Rio Ave
1436 stripes k y # Beira-Mar
1075 solid r w # Braga
4294 stripes k w # Farense
4750 stripes r k # Olhanense
294 solid r w # Benfica
336 hoops g w # Sporting CP
2420 solid w k # Vitória Guimarães
1085 stripes g w # Vitória Setúbal
`;

const LOOKS = new Map<number, ClubLook>();
for (const line of TABLE.split("\n")) {
  const [id, pattern, primary, secondary] = line.split("#")[0].trim().split(/\s+/);
  if (id && PATTERNS[pattern] && PALETTE[primary] && PALETTE[secondary]) {
    LOOKS.set(Number(id), {
      pattern: PATTERNS[pattern],
      primary: PALETTE[primary],
      secondary: PALETTE[secondary],
    });
  }
}

/** Diseño ilustrativo del club, o null si no está en la tabla. */
export function clubLookFor(clubId: number): ClubLook | null {
  return LOOKS.get(clubId) ?? null;
}

/** Negro o blanco, el que más contraste da sobre `hex`. */
export function readableOn(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? "#14161a" : "#f4f4f0";
}
