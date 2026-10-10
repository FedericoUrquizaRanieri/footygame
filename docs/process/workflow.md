# Flujo de trabajo

| Fase | Entregable | Estado |
|---|---|---|
| 0. Idea y discusión | Alcance acordado | Hecho |
| 1. Requisitos y decisiones | Reglas, requisitos, ADRs | Hecho (con puntos abiertos) |
| 2. Documentación | Este árbol `docs/` | Hecho (preguntas del dueño incorporadas 2026-10-08) |
| 3. Estrategia de tests y setup | Spike de datos, repo Git, CI, linters, tests escritos | **Hecho (2026-10-09)**: spike, repo, CI, Postgres en Docker, pipeline de datos, API interna, y tests de dominio, integración, seguridad y rendimiento (ver [test-results](../05-testing/test-results.md)) |
| 4. Desarrollo por porciones verticales | Código con tests en verde | **En curso**: núcleo, API e interfaz (landing, pantalla previa, juego y resumen) hechos el 2026-10-09; faltan ajustes tras tu prueba |
| 5. Revisión interna | Revisión de código, seguridad, cobertura | Pendiente |
| 6. Prueba como usuario | Recorridos manuales del dueño | Pendiente |
| 7. Entrega | Deploy en Vercel, runbook | Pendiente |

## Ciclo por porción (fase 4)
1. Elegir historia de usuario del [roadmap](roadmap.md).
2. Escribir tests desde sus criterios de aceptación (deben fallar).
3. Implementar lo mínimo para pasarlos.
4. Refactorizar.
5. Actualizar la documentación afectada.
6. Commit pequeño y descriptivo.
7. El dueño prueba la porción en el navegador.

## Definition of Done
- Tests de la porción en verde y cobertura de dominio ≥ 90 %.
- Lint y tipos sin errores.
- Documentación actualizada.
- Sin secretos en el repo.
- Probado por el dueño en móvil y escritorio.

## Convenciones
- Git: rama `main` protegida, ramas `feat/…`, `fix/…`, commits en formato Conventional Commits.
- Cada decisión importante: un ADR.
