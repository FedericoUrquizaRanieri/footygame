# Preguntas abiertas y decisiones cerradas

Última actualización: 2026-10-08.

## Cerradas
| # | Tema | Decisión |
|---|---|---|
| Q1 | Fuente de datos | Arrancar con un **dataset abierto**. No hay fuente definitiva todavía; se confirma en ADR-0003 tras el spike |
| Q2 | Ligas | Top 5 europeas (Premier League, LaLiga, Serie A, Bundesliga, Ligue 1) + Argentina + Brasil + 3 más: **Primeira Liga, Eredivisie y MLS** [fácil de cambiar] |
| Q3 | "Jugaron juntos" | **Compartieron plantel** en un club-temporada. Los minutos no importan |
| Q4 | Granularidad | **Temporada** (`2021/22`) |
| Q5 | Puntuación | Se muestran tiempo y saltos, comparados con el óptimo. Sin fórmula combinada |
| Q6 | Camino óptimo | Se muestra el **camino completo** al terminar |
| Q7 | Zona horaria | America/Argentina/Buenos_Aires |
| Q8 | Selecciones | No se cuentan |
| Q9 | Imágenes | **Placeholders** por ahora |
| Q10 | Tema | Oscuro por defecto |
| Q11 | Largo de desafíos | 4 a 8 saltos óptimos |
| Q12 | Partida abierta al cambiar el día | Se cierra como derrota |
| Q13 | — | Era un error de tipeo |

## Abiertas
| # | Pregunta | Se resuelve en |
|---|---|---|
| A1 | ¿Qué hacemos con la cobertura? Opciones A (ventana 2012–2025), B (sumar aristas inferidas por transferencias) o C (otra fuente). Ver [spike-results](../03-data/spike-results.md) | Decisión del dueño → ADR-0003 |
| A2 | Rango de longitud de desafíos: entre estrellas casi todo da 4 o 6 saltos. ¿Aceptás 4–6 con pool famoso y hasta 8 con un pool más amplio? | Generación de desafíos |
| A3 | Fotos y escudos reales: fuente y licencia | Después de la v1 |
| A4 | Actualización de datos después de julio de 2026 (el dataset está pausado) | Después de la v1 |

*Spike del 2026-10-08 resuelto: el dataset sí trae suplentes del banco (vía alineaciones), tiene licencia CC0 y cubre las 10 ligas, pero con ventana corta para ARG/BRA/MLS.*
