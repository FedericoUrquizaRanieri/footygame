# Diseño de API interna [PROPUESTO]

Estas rutas **son internas**: las consume solo la UI del propio sitio. No se documentan ni se promueven como API pública. Protegidas por rate limiting, validación de origen y respuestas mínimas ([security](security.md)).

| Método | Ruta | Respuesta |
|---|---|---|
| GET | `/api/challenge/today` | `{ id, date, origin: Player, destination: Player }` |
| GET | `/api/nodes/player/:id` | Lista de club-temporadas del jugador: `[{ id, clubName, clubLogo, seasonLabel }]` |
| GET | `/api/nodes/club-season/:id` | Lista de jugadores del club-temporada: `[{ id, name, photo }]` |
| POST | `/api/challenge/finish` | Entrada: `{ challengeId, path[], elapsedMs }`. Salida: `{ valid, result, optimalLength, optimalPath[], comment }` |

## Reglas
- Todos los IDs se validan (entero positivo o formato esperado) antes de consultar.
- Respuestas con campos mínimos. No se devuelven IDs de la fuente ni campos internos.
- `/finish` valida que cada par de nodos consecutivos del `path` esté conectado y que el primero sea el origen.
- Las listas se devuelven completas para permitir filtrado instantáneo en cliente (≤ ~40 elementos).
- Errores: JSON `{ error: code }` sin detalles internos.
- Códigos: 200, 400 (entrada inválida), 404, 429 (rate limit), 500.

## Cache
- `nodes/*`: `public, s-maxage=86400, stale-while-revalidate`.
- `challenge/today`: cache hasta medianoche (Buenos Aires).
- `finish`: sin cache.
