# Modelo de datos [PROPUESTO]

## Tablas

### `players`
| Campo | Tipo | Nota |
|---|---|---|
| id | bigint PK | |
| name | text | nombre para mostrar |
| name_search | text | normalizado (sin acentos, minúsculas) para búsqueda |
| photo_url | text null | ver licencias en [data-sources](../03-data/data-sources.md) |
| source_id | text | id en la fuente |

### `clubs`
| id | name | country | logo_url | source_id |

### `seasons`
| id | label (`2021/22`) | start_year |

### `club_seasons` (nodo)
| id | club_id → clubs | season_id → seasons | UNIQUE(club_id, season_id) |

### `player_club_seasons` (arista)
| player_id | club_season_id | appearances (nullable, informativo) |
PK(player_id, club_season_id). La existencia de la fila significa "integró el plantel". Índices en **ambas direcciones**: `(player_id)` y `(club_season_id)`.

### `challenges`
| id | date (UNIQUE) | origin_player_id | destination_player_id | optimal_length | optimal_paths_count | difficulty |

El camino óptimo completo (opcional) puede almacenarse en `challenges.optimal_path jsonb`. Nunca se envía al cliente antes del fin del intento.

## Consultas críticas
1. Club-temporadas de un jugador: `player_club_seasons` JOIN `club_seasons` JOIN `clubs`/`seasons` WHERE player_id = ?
2. Jugadores de un club-temporada: `player_club_seasons` JOIN `players` WHERE club_season_id = ?

Ambas son lookups por índice. Volumen esperado: un plantel ≈ 25–40 jugadores y una carrera ≈ 5–20 club-temporadas.

## Seguridad
RLS activado en todas las tablas, sin políticas para `anon` ni `authenticated`. Ver [security](security.md).

## Abiertos
- Granularidad decidida: temporada (`2021/22`). En ligas de año calendario (Argentina reciente, Brasil, MLS) la etiqueta será `2025`.
- Qué hacer con cedidos y transferencias a mitad de temporada: aparece una fila por club distinto en la misma temporada.
- Imágenes: placeholders en la v1; `photo_url` y `logo_url` quedan vacíos por ahora.
