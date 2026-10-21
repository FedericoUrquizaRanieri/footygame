# Generación de desafíos

Un script genera por adelantado la cola de desafíos y los guarda en `challenges`. **Cada día tiene dos desafíos: uno normal y uno difícil.**
Uso: `npm run data:challenges -- --days 60 --back 30` (ver opciones en `scripts/pipeline/generate-challenges.ts`).

## Por qué este diseño
Las pruebas con amigos (planillas de desafíos y listas de reconocimiento de jugadores en `playtest/`) mostraron que lo que decide si un desafío es divertido es **si se conoce a los jugadores**, no cuánto largo es el camino. Con el sistema anterior (puntaje por largo, caminos y fama, patrón semanal) salían desafíos con jugadores que casi nadie conocía. El diseño nuevo se parece al juego de las películas: el normal siempre tiene jugadores conocidos y un camino corto con varias opciones; el difícil usa jugadores menos conocidos, pero siempre con un puente conocido.

## Fama
Se usa el **valor de mercado máximo** del jugador (`players.market_value_eur`). En las listas de reconocimiento de dos personas fue la mejor señal (AUC 0,86 y 0,89); sumarle partidos europeos, años en el grafo o prestigio del club no mejoró nada. Lo que importa es el corte:

| Valor máximo | Jugadores en el grafo | Lo conocía |
|---|---|---|
| 40 M€ o más | 599 | 97 a 100 % |
| 25 M€ o más | 1.251 | 88 a 94 % |
| 15 M€ o más | 2.295 | 84 a 90 % |
| 10 M€ o más | 3.265 | 73 a 80 % |

Los argentinos entran al pool normal desde 8 M€: el público de la primera versión los conoce mucho más que a otros.

## Pools (`src/domain/challenge-rules.ts`)
| Pool | Quién |
|---|---|
| Normal | 25 M€ o más, o argentinos desde 8 M€ (1.387 jugadores) |
| Difícil | 10 M€ o más que no estén en el pool normal (1.913 jugadores) |
| Amplio | normal + difícil (sirve de intermedio del normal) |

## Reglas de cada nivel
| | Normal | Difícil |
|---|---|---|
| Origen y destino | pool normal | pool difícil |
| Camino más corto | 4 saltos (un solo intermedio) | 4 o 6 saltos |
| Caminos más cortos | de 2 a 5 | de 1 a 8 |
| Puente conocido | al menos un camino con un intermedio del pool amplio | al menos un camino con un intermedio del pool normal |

Los caminos se cuentan **por secuencia de jugadores**: dos temporadas compartidas con el mismo compañero son un solo camino. Se guardan todos (hasta 8) y se muestran al terminar la partida.

## Algoritmo
1. Se cargan el grafo y los datos de los jugadores.
2. Para cada fecha y cada nivel sin desafío se sortean pares del pool del nivel.
3. Se calculan los caminos más cortos con `findOptimalRoutes` (`src/domain/optimal-routes.ts`, con tests) y se acepta el par si cumple las reglas del nivel (`acceptRoutes`).
4. No se repite ningún jugador en una ventana de 60 días (hacia atrás y hacia adelante), contando los dos niveles juntos.
5. Se guardan `optimal_length`, `optimal_paths_count` (cantidad total), `optimal_path` (el primero), `optimal_paths` (hasta 8) y `difficulty` (`normal` o `hard`).

## Garantías
- Todo desafío es resoluble y mide como máximo 6 saltos, muy por debajo del límite de 20.
- El script es determinista con la misma semilla (`--seed`).
- `--regenerate` rehace los futuros (nunca toca los de hoy ni los pasados); `--reset` borra todos antes de generar.

## Estado actual
180 desafíos generados el 2026-10-19 (`--reset --days 60 --back 30`): 90 normales (todos de 4 saltos; 34 con 2 caminos, 25 con 3, 18 con 4, 13 con 5) y 90 difíciles (73 de 4 saltos y 17 de 6; de 1 a 8 caminos).

## Pendientes
- **El difícil sale mayormente de 4 saltos** (73 de 90). Si se quiere más difícil se puede preferir 6 saltos o limitar los caminos a 1 o 2.
- **Algunos normales tienen jugadores jóvenes con valor alto pero poco conocidos** (el valor máximo no distingue bien una joven promesa). Una lista de nombres revisada a mano para el pool normal lo mejoraría.
- Los datos de la liga argentina, la brasileña y la MLS solo cubren 2024 y 2025, así que los clubes locales casi no aparecen en los caminos.
- Probar con amigos los desafíos nuevos (mismo formato de `playtest/planilla.md`) antes de dar por buenos los cortes de fama.
