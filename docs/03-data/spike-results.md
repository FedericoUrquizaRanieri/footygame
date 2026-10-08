# Resultados del spike de datos

Fecha: 2026-10-08. Scripts reproducibles en `scripts/spike/` (`coverage.py`, `graph.py`, `probe.py`, `transfers_check.py`). Datos crudos en `data/raw/` (no versionar).

## Fuente evaluada
Dataset abierto `dcaribou/transfermarkt-datasets` (derivado de Transfermarkt).
- Licencia: **CC0-1.0** (según el README del repo).
- Distribución: archivo DuckDB de ~210 MB (12 tablas) en Cloudflare R2.
- Vigencia: datos hasta el 6 de julio de 2026. **Las actualizaciones están pausadas** (el pipeline falla desde mediados de julio de 2026 y no hay fecha de reanudación). La temporada 2026/27 no está.
- No trae tabla de planteles. Se derivaron aristas de `game_lineups` (titulares **y suplentes en el banco**, incluso los que no jugaron) y `appearances`, uniendo con `games.season`.

## Cobertura de las 10 ligas
| Liga | Temporadas con datos de partidos |
|---|---|
| Premier, LaLiga, Serie A, Bundesliga, Ligue 1, Primeira Liga, Eredivisie | 2012 a 2025 (14 temporadas) |
| Argentina, Brasil, MLS | **solo 2024 y 2025** |

Los datos de partidos no existen antes de 2012. Hay algunos huecos puntuales dentro de una temporada (p. ej. MLS 2024 con 357 de 509 partidos con alineaciones).

## El grafo resultante
| | Todos los clubes del dataset | Solo clubes de las 10 ligas |
|---|---|---|
| Aristas | 182.382 | 93.825 |
| Jugadores | 53.463 | 27.723 |
| Club-temporadas | 5.903 | 3.031 |
| Jugadores por club-temporada | media 30,9 (mín 1, máx 57) | media 31,0 |
| Club-temporadas por jugador | media 3,4, mediana 2, máx 21 | media 3,4 |
| Componente conexa principal | 99,9 % | 100,0 % |

## Prueba con tu ejemplo
Con datos reales el camino mínimo Messi → Copetti es exactamente el que describiste:
**Messi → PSG 2021 → Di María → Rosario Central 2025 → Copetti (4 saltos).**

## Dificultad natural
Camino mínimo entre 400 pares al azar del top 1.500 de valor de mercado:
- 2 saltos (compañeros directos): 4 %
- **4 saltos: 73 %**
- **6 saltos: 23 %**
- 8 saltos o más: 0 %

El grafo es bipartito, así que el mínimo siempre es par. Entre estrellas, casi todo se resuelve en 4 o 6 saltos. Para llegar a 8 hay que usar jugadores menos conocidos. El rango "4–8" de [challenge-generation](challenge-generation.md) queda como **4–6 para jugadores famosos y hasta 8 con un pool más amplio**.

## Problemas encontrados
1. **Carreras truncadas.** Solo se ven temporadas desde 2012. Messi aparece con Barcelona 2012–2020, PSG 2021–22 e Inter Miami 2024–25, pero **falta todo Barcelona antes de 2012 y Inter Miami 2023**. Un jugador retirado antes de 2012 no existe.
2. **Argentina, Brasil y MLS tienen solo 2 temporadas.** Un jugador solo de liga argentina aparece con 2024 y 2025. Quien salió de Argentina antes de 2024 y nunca jugó en las ligas cubiertas no está.
3. **Inferir lo que falta con la tabla de transferencias no es confiable.** Se probó inferir club-temporadas desde `transfers` y se comparó contra lo que dicen los partidos (2012–2024, ligas con cobertura completa):
   - Precisión 83 %: 17 % de las aristas inferidas son falsas.
   - Recall 42 %: encuentra menos de la mitad de las reales (los jugadores de cantera no tienen transferencia).
   - Como la regla es "jugaron juntos si o si", no se debería usar para crear aristas sin marcarlas como baja confianza.
4. **Sin actualización.** Para temporadas nuevas hará falta otra fuente o retomar la extracción nosotros.
5. **Codificación.** Los nombres vienen en UTF-8; en la consola de Windows hay que usar `PYTHONUTF8=1`.

## Conclusión
**Los datos sirven para una v1 acotada**:
- Muy buenos para las 7 ligas europeas entre 2012 y 2025: grafo denso, conectado y con el ejemplo funcionando.
- Aceptables pero cortos para Argentina, Brasil y MLS: solo 2024–2025, suficiente para que existan los nodos pero no sus historiales.
- No sirven por sí solos para historia previa a 2012 ni para la temporada 2026/27.

Opciones para decidir (ver [ADR-0003](../06-decisions/0003-fuente-de-datos.md)):
- **A. v1 con una ventana 2012–2025**, declarada en el juego. Más simple y 100 % apoyada en datos reales.
- **B. Completar historiales con `transfers`** marcando esas aristas como inferidas. Más cobertura, con 17 % de ruido y sin ser compañeros garantizados.
- **C. Completar con otra fuente** (API de terceros o scraping propio) para Argentina/Brasil/MLS y los años previos. Más cobertura y más riesgo legal o de costo.
