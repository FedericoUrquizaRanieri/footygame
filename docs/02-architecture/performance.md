# Rendimiento

## Presupuestos
| Métrica | Objetivo |
|---|---|
| Latencia servidor `nodes/*` (p95) | ≤ 300 ms (sin cache), ≤ 50 ms (con cache) |
| Percepción de cambio de nodo | < 500 ms |
| LCP móvil 4G | ≤ 2,0 s |
| JS inicial de la página de juego | ≤ 200 kB gzip [PROPUESTO] |

## Estrategias
1. **Índices en ambas direcciones** del grafo (ver [data-model](data-model.md)).
2. **CDN cache**: datos de nodos inmutables entre cargas.
3. **Prefetch**: al mostrar una lista, precargar en segundo plano los nodos más probables no es viable (demasiadas opciones); en su lugar, cache + conexión persistente. Se podría precargar el nodo al pasar el mouse/tocar.
4. **Imágenes**: `next/image`, tamaños responsivos, lazy loading, formatos modernos.
5. **Región**: función de Vercel en la misma región que Supabase.
6. **Conexiones**: pooler de Supabase (transaction mode) para funciones serverless.
7. **Listas completas, filtrado en cliente**: evita ida y vuelta por cada tecla.

## Medición
Plan en [performance-tests](../05-testing/performance-tests.md).
