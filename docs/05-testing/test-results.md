# Resultados de tests y mediciones

Corrida del 2026-10-09 (interfaz verificada además a mano en el navegador: escritorio, celular, español e inglés, victoria, derrota y recarga) sobre el Postgres de Docker con los datos reales cargados. Entorno: Windows 11, Node 24, todo en la misma máquina (sin latencia de red), Next.js en modo producción (`next start`).

## Tests automáticos
**186 tests, 17 archivos, todos en verde** (`npm test`).

| Área | Archivos | Qué cubre |
|---|---|---|
| Dominio | `tests/domain/*` | grafo, saltos, límite de 20, cronómetro, validación de camino, camino óptimo, búsqueda sin acentos, día en Buenos Aires, persistencia, regla de cambio de día |
| Integración | `tests/api/*` | las 4 rutas contra la base de test (datos mínimos conocidos) |
| Cliente | `tests/lib/*`, `tests/i18n/*` | normalización de pasos, almacenamiento local de la partida, formatos, colores de camiseta, paridad de textos es/en y claves usadas |
| Seguridad | `tests/security/*`, `tests/server/*` | RLS y permisos en la base, entradas maliciosas, rate limiting, cross-site, no filtrar la solución, secretos, rutas existentes, cabeceras |

Cobertura de `src/domain`: 100 % de líneas, 96,6 % de ramas (mínimo exigido: 90 %).

Los tests de base de datos se omiten solos si no hay `TEST_DATABASE_URL*` (por ejemplo, sin Docker levantado). En CI corren contra un Postgres efímero.

## Rendimiento (scripts/perf)
Datos reales: 27.723 jugadores, 3.031 club-temporadas, 93.825 aristas.

| Prueba | Pedidos | req/s | p50 | p95 | p99 | max | Errores |
|---|---|---|---|---|---|---|---|
| P-01 jugador → club-temporadas, 10 concurrentes | 800 | 677 | 14,1 ms | 22,1 ms | 25,7 ms | 28 ms | 0 |
| P-01 club-temporada → jugadores, 10 concurrentes | 800 | 824 | 11,9 ms | 15,8 ms | 18,7 ms | 25 ms | 0 |
| P-01 mixto, secuencial | 800 | 69 | 15,5 ms | 16,4 ms | 16,8 ms | 27 ms | 0 |
| P-03 carga sostenida 50 req/s × 30 s | 1500 | 50 | 17,7 ms | 19,4 ms | 19,9 ms | 21 ms | 0 |
| P-04 pico 200 req/s × 15 s | 3000 | 200 | 6,0 ms | 18,9 ms | 19,8 ms | 22,5 ms | 0 |

Objetivo RNF-01: p95 ≤ 300 ms. **Cumplido con amplio margen** (≈ 20 ms). Advertencia: es una medición local sin red; en Vercel + Supabase sumará la latencia entre ambos y conviene volver a medirla (ver pendientes).

**P-05 planes de ejecución:** ambas consultas críticas usan índices (0,16 ms y 0,18 ms de ejecución), sin Seq Scan en las tablas grandes.

## Humo de punta a punta (`scripts/perf/smoke.ts`)
Juega el desafío del día solo por la API: cada paso ofrece el siguiente nodo del camino óptimo, `finish` valida la victoria en 4 saltos y marca el camino como óptimo, y un camino manipulado se rechaza sin ninguna pista.

## Pendientes
- P-06 (LCP/CLS móvil) y P-07 (peso del bundle): requieren la interfaz del juego.
- Repetir P-01/P-03 contra el despliegue real (Vercel + Supabase).
- El rate limit en memoria no es global en serverless (cada instancia cuenta por separado). Migrar a un almacén compartido antes de publicar.
