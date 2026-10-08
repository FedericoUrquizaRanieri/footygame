# Tests de rendimiento

## Objetivos
Ver [performance](../02-architecture/performance.md).

## Pruebas
| ID | Prueba | Herramienta | Criterio de aprobación |
|---|---|---|---|
| P-01 | Latencia de `nodes/player/:id` y `nodes/club-season/:id` con datos del tamaño real, sin cache | k6 | p95 ≤ 300 ms |
| P-02 | Mismas rutas con cache de CDN | k6 | p95 ≤ 50 ms |
| P-03 | Carga sostenida: 50 req/s durante 5 min | k6 | 0 % errores 5xx, p95 dentro de P-01 |
| P-04 | Pico: subida a 200 req/s en 30 s | k6 | Degradación controlada (429 antes que 5xx) |
| P-05 | Planes de consulta (`EXPLAIN ANALYZE`) | SQL | Uso de índices, sin seq scan en tablas grandes |
| P-06 | LCP/CLS/TBT móvil de landing y juego | Lighthouse CI | LCP ≤ 2,0 s, CLS ≤ 0,1 |
| P-07 | Peso del bundle de la página de juego | análisis de build | ≤ 200 kB gzip |
| P-08 | Renderizado de lista de 40 tarjetas con filtrado | Medición en dispositivo medio | Sin bloqueo > 100 ms |

## Entorno
Base con volumen realista (cargada por el pipeline) y despliegue de preview en Vercel. Las mediciones locales sirven de referencia, no de aceptación.

## Cuándo se ejecuta
- P-05 y P-07: en CI.
- P-01 a P-04, P-06: antes de cada release y tras cambios de esquema.
