# ADR-0003: Fuente de datos

- **Estado:** Provisional — pendiente de elegir A, B o C (ver abajo)
- **Fecha:** 2026-10-08

## Contexto
El dueño propuso scraping de Transfermarkt o similar y aceptó arrancar con un dataset abierto. Los términos de uso de Transfermarkt prohíben el scraping. El spike ([spike-results](../03-data/spike-results.md)) evaluó `dcaribou/transfermarkt-datasets` (CC0).

## Hallazgos clave
- Grafo denso y conectado (99,9 %), con el ejemplo Messi → Copetti reproducido en 4 saltos.
- Datos de partidos solo desde 2012; Argentina, Brasil y MLS solo 2024–2025.
- Las actualizaciones del dataset están pausadas desde julio de 2026.
- Inferir carreras desde transferencias tiene 83 % de precisión y 42 % de recall.

## Opciones
- **A.** v1 con ventana 2012–2025 y solo datos confirmados por partidos.
- **B.** A + aristas inferidas por transferencias (marcadas, con ruido).
- **C.** A + otra fuente para ligas sudamericanas/MLS y años previos.

## Decisión provisional
Construir la v1 sobre **A**, porque es la única que cumple "jugaron juntos si o si" con datos verificables. Mantener el modelo de datos preparado para sumar aristas de otras fuentes (campo `source`/`confidence`) y reevaluar B o C luego de probar el juego.

## Consecuencias
- (+) Sin riesgo legal adicional (CC0).
- (−) Sin historia previa a 2012 y poca profundidad en Argentina, Brasil y MLS.
- (−) Dependencia de un dataset sin actualizar; las temporadas nuevas requerirán trabajo propio.
