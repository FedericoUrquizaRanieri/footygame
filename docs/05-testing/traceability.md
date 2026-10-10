# Trazabilidad requisito → test

Estado al 2026-10-09. 186 tests en verde ([test-results](test-results.md)).

| Historia / Requisito | Tipo | Test | Estado |
|---|---|---|---|
| HU-02, RF-12 | Unitario | `game.test.ts`: el cronómetro no corre antes de Start | Hecho |
| HU-03, RF-23 | Unitario | `game.test.ts`: cada selección suma 1 salto, alternancia de tipos | Hecho |
| HU-05, RF-24 | Unitario | `game.test.ts`: volver a un nodo anterior suma 1 salto | Hecho |
| HU-06, RF-26 | Unitario | `game.test.ts`: elegir al destino gana; el club-temporada no | Hecho |
| HU-07, RF-27 | Unitario | `game.test.ts`: 20 saltos sin destino pierde; el salto 20 al destino gana | Hecho |
| HU-04 | Unitario | `search.test.ts`: sin acentos ni mayúsculas, palabras en cualquier orden | Hecho |
| HU-09, RF-28 | Unitario | `persistence.test.ts`: round-trip, tiempo continúa tras recargar, estados inválidos | Hecho |
| Q12 (cambio de día) | Unitario | `persistence.test.ts`: `settleStaleGame` | Hecho |
| Q7 (zona horaria) | Unitario | `daily-date.test.ts`: cambio de día a las 00:00 de Buenos Aires, segundos hasta el próximo día | Hecho |
| RF-31, RNF-13 (lógica) | Unitario | `validate-path.test.ts`, `challenge.test.ts`: validación de camino, óptimo, comparación | Hecho |
| Generación de desafíos | Unitario | `challenge.test.ts`: BFS, conteo de caminos, reglas de aceptación | Hecho |
| RF-41 | Integración | `tests/api/nodes.test.ts`: solo el siguiente paso, campos mínimos, orden | Hecho |
| RF-31, RNF-13 | Integración | `tests/api/challenge.test.ts`: `finish` valida y entrega el óptimo; `today` no incluye la solución; un desafío futuro no se puede espiar | Hecho |
| RNF-10 (S-01, S-02) | Seguridad | `tests/security/db-security.test.ts`: RLS, `anon`/`authenticated`/`PUBLIC` sin permisos, la app solo lee | Hecho |
| S-03, S-04 | Seguridad | `tests/security/static-security.test.ts`: sin secretos ni `NEXT_PUBLIC_` ni cadenas de conexión en el código | Hecho |
| RNF-14 (S-06) | Seguridad | `tests/security/api-security.test.ts`, `tests/server/rate-limit.test.ts`: 429 con `Retry-After` | Hecho |
| S-05, S-12 | Seguridad | `api-security.test.ts`: ids maliciosos → 400, errores sin detalles internos | Hecho |
| S-07, S-08 | Seguridad | `api-security.test.ts`, `challenge.test.ts`: sin datos internos; caminos inválidos rechazados sin pistas | Hecho |
| S-09, S-10 | Seguridad | `static-security.test.ts`: cabeceras y lista cerrada de rutas | Hecho |
| S-11 | Seguridad | `npm audit --omit=dev` en CI | Hecho (en CI) |
| RNF-01 (P-01, P-03, P-04) | Rendimiento | `scripts/perf/api-latency.ts`: p95 ≈ 20 ms | Hecho (local) |
| P-05 | Rendimiento | `scripts/perf/explain.ts`: sin Seq Scan | Hecho |
| RF-50 | Unitario | `tests/i18n/messages.test.ts`: mismas claves y variables en es/en, todas las claves usadas existen | Hecho |
| RF-28, HU-09 | Manual + unitario | Recarga a mitad de partida conserva nodo, saltos y reloj | Hecho (verificado a mano) |
| HU-01, HU-02, HU-03, HU-04, HU-06, HU-07, HU-08 | Manual | Recorrido completo en el navegador: victoria en 4 saltos, derrota a los 20, búsqueda, resumen validado por el servidor | Hecho (verificado por Claude; falta tu prueba) |
| HU-10, RNF-20 | Manual | Celular 390 px y escritorio 1360 px | Hecho (verificado por Claude; falta tu prueba en un teléfono real) |
| RNF-02 (P-06), P-07 | Rendimiento | LCP móvil y peso del bundle con Lighthouse | Pendiente |
| RF-32, HU-01, HU-08 | Manual (dueño) | Recorridos de usuario | Pendiente: te toca probar |
