# Generación de desafíos [PROPUESTO]

Un script genera por adelantado una cola de desafíos (p. ej. 90 días) y los guarda en `challenges`.

## Algoritmo
1. Elegir un **pool de jugadores "conocidos"** (por valor de mercado o cantidad de partidos/selecciones) para evitar desconocidos.
2. Sortear pares (A, B) del pool en la misma componente conexa.
3. Calcular el camino mínimo con **BFS** sobre el grafo bipartito. Longitud en saltos = número de selecciones del camino (como se cuenta en el juego).
4. Aceptar el par si:
   - longitud óptima dentro de un rango objetivo (p. ej. 4 a 8 saltos) [ABIERTO],
   - no son compañeros directos (óptimo > 2),
   - existen varios caminos distintos (`optimal_paths_count ≥ 2`),
   - no se repitió el jugador origen/destino recientemente (ventana de 60 días).
5. Asignar dificultad según longitud óptima y popularidad.
6. Guardar `optimal_length`, `optimal_paths_count` y un `optimal_path` de ejemplo.

## Garantías
- El desafío siempre es resoluble (existe camino) y ≤ 20 saltos por margen amplio.
- Validación en CI/script: todo desafío futuro cumple lo anterior.

## Tests
Los tests unitarios del BFS y del filtrado usan un grafo pequeño fijo (fixtures).
