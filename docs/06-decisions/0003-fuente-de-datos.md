# ADR-0003: Fuente de datos

- **Estado:** Aceptado (opción A)
- **Fecha:** 2026-10-08

## Contexto
El dueño propuso scraping de Transfermarkt o similar y aceptó arrancar con un dataset abierto. Los términos de uso de Transfermarkt prohíben el scraping. El spike ([spike-results](../03-data/spike-results.md)) evaluó `dcaribou/transfermarkt-datasets` (CC0).

## Hallazgos clave
- Grafo denso y conectado (99,9 %), con el ejemplo Messi → Copetti reproducido en 4 saltos.
- Datos de partidos solo desde 2012; Argentina, Brasil y MLS solo 2024–2025.
- Las actualizaciones del dataset están pausadas desde julio de 2026.
- Inferir carreras desde transferencias tiene 83 % de precisión y 42 % de recall.

## Opciones consideradas
- **A.** v1 con ventana 2012–2025 y solo datos confirmados por partidos.
- **B.** A + aristas inferidas por transferencias (marcadas, con ruido).
- **C.** A + otra fuente para ligas sudamericanas/MLS y años previos.

## Decisión
**Opción A**, elegida por el dueño el 2026-10-08. Es la única que cumple "jugaron juntos si o si" con datos verificables. El modelo de datos queda preparado para sumar aristas de otras fuentes más adelante (campo `source`/`confidence`), y B o C se reevalúan después de probar el juego.

## Consecuencias
- (+) Sin riesgo legal adicional (CC0).
- (−) Sin historia previa a 2012 y poca profundidad en Argentina, Brasil y MLS. El juego debe declarar la ventana de datos.
- (−) Dependencia de un dataset sin actualizar; las temporadas nuevas requerirán trabajo propio.
