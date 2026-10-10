# Modelo de datos

Implementado en [db/migrations/001_schema.sql](../../db/migrations/001_schema.sql). Compatible con Postgres local y Supabase.

## Tablas

### `players`
| Campo | Tipo | Nota |
|---|---|---|
| id | bigint PK | id de la fuente (Transfermarkt) |
| name | text | nombre para mostrar |
| name_search | text | normalizado (minúsculas, sin acentos) con `normalizeText` del dominio; se usa para ordenar y buscar |
| photo_url | text null | v1: vacío (placeholders) |
| market_value_eur | bigint null | valor máximo de mercado; sirve para elegir jugadores conocidos al generar desafíos |

### `clubs`
`id` (bigint PK, de la fuente), `name` (nombre corto, el más frecuente en los partidos), `country`, `league` (código de competición: GB1, ES1, ...), `logo_url` (vacío en v1).

### `club_seasons` (nodo)
| Campo | Nota |
|---|---|
| id | **determinista**: `club_id * 10000 + season_year`. Estable entre cargas, así el estado guardado en el navegador no se rompe al recargar los datos |
| club_id → clubs | |
| season_year | año de inicio de la temporada |
| label | `2021/22` para ligas europeas; `2025` para ligas de año calendario (Argentina, Brasil, MLS) |

UNIQUE(club_id, season_year). No hay tabla `seasons` aparte: el año y la etiqueta viven en `club_seasons`.

### `player_club_seasons` (arista)
`player_id`, `club_season_id`, `source` (origen del dato; hoy `lineups`). PK(player_id, club_season_id) cubre la dirección jugador→club-temporada; el índice `(club_season_id, player_id)` cubre la inversa. La existencia de la fila significa "integró el plantel" (titular, suplente en el banco o con aparición), sin importar los minutos.

### `challenges`
`id`, `date` (UNIQUE, día de Buenos Aires), `origin_player_id`, `destination_player_id`, `optimal_length`, `optimal_paths_count`, `optimal_path` (jsonb). **Nunca se envía `optimal_*` al cliente antes de que el intento termine** (ver [security](security.md)).

## Consultas críticas
1. Club-temporadas de un jugador: `player_club_seasons` JOIN `club_seasons` JOIN `clubs` WHERE player_id = ?
2. Jugadores de un club-temporada: `player_club_seasons` JOIN `players` WHERE club_season_id = ?

Ambas usan índices (0,2 ms de ejecución con los datos reales; ver [test-results](../05-testing/test-results.md)).

## Seguridad
RLS activado en todas las tablas. Solo el rol `footygame_app` (solo lectura) tiene política; `anon`, `authenticated` y `PUBLIC` no tienen ningún permiso. Verificado por tests en [security-tests](../05-testing/security-tests.md).

## Volumen actual (carga del 2026-10-09)
27.723 jugadores · 326 clubes · 3.031 club-temporadas · 93.825 aristas.

## Pendientes
- Cedidos y transferencias a mitad de temporada: aparece una fila por club distinto en la misma temporada.
- Imágenes reales (fotos y escudos) y su licencia.
