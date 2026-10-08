# Roadmap [PROPUESTO]

## Hito 0 — Datos (spike)
**Hecho (2026-10-08):** fuente evaluada, conectividad validada, ejemplo reproducido. Resultados en [spike-results](../03-data/spike-results.md). Falta cerrar ADR-0003 (opción A, B o C) y generar los desafíos de prueba.

## Hito 1 — Cimientos
Repo Git, Next.js + TS, lint/format, CI, proyecto Supabase con esquema y RLS, fixtures y tests de seguridad base (S-01…S-04).

## Hito 2 — Núcleo de dominio
Lógica pura con tests: grafo, BFS, conteo de saltos, límite de 20, validación de caminos, cronómetro. (HU-03, 05, 06, 07)

## Hito 3 — API segura
`nodes/*`, `challenge/today`, `finish`, validación, rate limit, cache. Tests de integración, seguridad y rendimiento.

## Hito 4 — Juego (UI)
Pantalla previa, juego, buscador, tarjetas, barra lateral, persistencia de partida. (HU-02, 03, 04, 09)

## Hito 5 — Resultados y desafío diario
Modal, resumen, comentario del camino óptimo, bloqueo de rejugar. (HU-08)

## Hito 6 — Landing e i18n
Landing temática, es/en, responsive final. (HU-01, 10)

## Hito 7 — Endurecimiento y entrega
Pruebas de rendimiento completas, revisión de seguridad, accesibilidad, deploy.

## Backlog posterior
Desafíos pasados, rachas, compartir, ranking, pistas.
