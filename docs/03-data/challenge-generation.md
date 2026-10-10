# Generación de desafíos

Un script genera por adelantado la cola de desafíos y los guarda en `challenges` junto con su nivel.
Uso: `npm run data:challenges -- --days 60 --back 30` (ver opciones en `scripts/pipeline/generate-challenges.ts`).

## Dificultad
Cada desafío tiene un **puntaje** y un **nivel** (fácil, media, difícil), calculados en `src/domain/difficulty.ts` (con tests).

| Componente | Valores |
|---|---|
| Largo del camino más corto | 4 saltos: 0 · 6 saltos: +2 · 8 o más: +4 |
| Caminos más cortos que existen | 10 o más: -1 · de 4 a 9: 0 · 2 o 3: +1 · uno solo: +2 |
| Fama del jugador menos conocido | percentil 90 o más: -1 · 50 a 90: 0 · 20 a 50: +1 · menos de 20: +2 |

Nivel: puntaje ≤ 0 fácil, 1 o 2 media, ≥ 3 difícil. La **fama** es la posición del jugador en el ranking por valor de mercado (de 0 a 1).

### Patrón semanal
Lunes y martes fácil, miércoles y jueves media, viernes y sábado difícil, domingo media.

## Algoritmo
1. Se calcula la fama de todos los jugadores del grafo.
2. Para cada fecha sin desafío se toma el nivel que corresponde a su día de la semana.
3. Se sortean pares de jugadores de un conjunto que depende del nivel: fácil solo percentil 95 o más, media 85 o más, difícil 70 o más. **La dificultad tiene que venir del camino, no de jugadores desconocidos.**
4. Se calcula el camino más corto (BFS) y el nivel real del par. Se acepta si coincide con el objetivo y el camino mide entre 4 y 8 saltos.
5. No se repiten jugadores en una ventana de 60 días (hacia atrás y hacia adelante).
6. Se guardan `optimal_length`, `optimal_paths_count`, `optimal_path`, `difficulty` y `difficulty_score`.

## Garantías
- Todo desafío es resoluble y mide como máximo 8 saltos, muy por debajo del límite de 20.
- El script es determinista con la misma semilla (`--seed`).
- `--recompute` recalcula el nivel de desafíos existentes si cambian las reglas; `--regenerate` rehace los futuros (nunca toca los de hoy ni los pasados).

## Estado actual
90 desafíos: 30 pasados (para práctica), el de hoy y 59 futuros. Reparto: 26 fáciles, 39 medias y 25 difíciles; 4, 6 y 8 saltos.
