# Estrategia de tests

Los tests se escriben **antes** del código de cada porción (TDD/BDD) a partir de los criterios de [user-stories](../01-requirements/user-stories.md).

## Niveles
| Nivel | Qué cubre | Herramienta [PROPUESTO] | Quién |
|---|---|---|---|
| Unitarios | Lógica de dominio: BFS, validación de caminos, conteo de saltos, límite de 20, cronómetro, normalización de búsqueda, i18n | Vitest | Claude |
| Integración | Route Handlers contra una base de prueba (Postgres local o proyecto de test) | Vitest + supertest/fetch | Claude |
| Seguridad | Ver [security-tests](security-tests.md) | Scripts + Vitest | Claude |
| Rendimiento | Ver [performance-tests](performance-tests.md) | k6 / Lighthouse CI | Claude |
| Funcional de usuario | Recorrer el juego en navegador y móvil | Manual | **Dueño del proyecto** |
| E2E automatizado | Camino feliz | Playwright | Posterior (opcional) |

## Prioridad inicial (pedida por el dueño)
1. Rendimiento y seguridad.
2. Tests de código (unitarios e integración) donde corresponde.
3. La funcionalidad de cara al usuario la prueba el dueño durante el desarrollo.

## Reglas
- Cada requisito funcional/historia de usuario tiene al menos un test o está marcado como "verificación manual".
- Lógica de dominio ≥ 90 % de cobertura.
- Los tests no usan datos reales de producción: usan fixtures de un grafo pequeño.
- CI ejecuta lint, tipos, unitarios, integración y auditoría de dependencias en cada push.

## Fixture de grafo
Un grafo mínimo y conocido (≈ 10 jugadores, 6 club-temporadas) que reproduce el ejemplo Messi → … → Copetti con datos ficticios o neutrales, para tests deterministas.

## Matriz de trazabilidad
Se mantiene en [traceability](traceability.md).
