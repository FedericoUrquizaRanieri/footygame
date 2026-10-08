# Trazabilidad requisito → test

| Historia / Requisito | Tipo de verificación | Test (a crear en Fase 3) |
|---|---|---|
| HU-02, RF-12 | Unitario | El cronómetro no corre antes de Start |
| HU-03, RF-23 | Unitario | Cada selección suma exactamente 1 salto |
| HU-05, RF-24 | Unitario | Volver a un nodo anterior suma 1 salto |
| HU-06, RF-26 | Unitario | Seleccionar el destino termina en victoria |
| HU-07, RF-27 | Unitario | Llegar a 20 saltos sin destino termina en derrota |
| HU-04 | Unitario | Búsqueda sin acentos ni mayúsculas |
| HU-09, RF-28 | Unitario | Estado persistido y restaurado desde localStorage |
| RF-41 | Integración | `nodes/*` devuelve solo el siguiente paso |
| RF-31, RNF-13 | Integración | `finish` valida el camino y devuelve el comentario; `challenge/today` no incluye `optimal_path` |
| RNF-10 | Seguridad | Clave anónima no lee ninguna tabla |
| RNF-14 | Seguridad | Rate limit responde 429 |
| RNF-01 | Rendimiento | p95 de `nodes/*` ≤ 300 ms |
| RNF-02 | Rendimiento | LCP móvil ≤ 2 s |
| HU-10, RF-32, HU-01, HU-08 | Manual (dueño) | Recorridos de usuario |
