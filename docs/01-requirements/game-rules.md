# Reglas del juego

## Grafo
- Nodos: **jugadores** y **club-temporadas**.
- Un jugador conecta con todos los club-temporadas en los que jugó; un club-temporada conecta con todos los jugadores que jugaron en él.
- Se camina siempre alternando: jugador → club-temporada → jugador → …
- "Jugaron juntos si o si": la arista existe cuando el jugador **integró el plantel** de ese club en esa temporada. Los minutos jugados no importan. Si la fuente no tiene planteles explícitos, se infiere de apariciones y transferencias (detalle en [data-pipeline](../03-data/data-pipeline.md)).
- Las selecciones nacionales **no** son nodos; solo clubes.

## Desarrollo de una partida
1. La persona entra al desafío diario y ve **de dónde sale y a dónde llega** (origen y destino) con un botón **Start**. El cronómetro todavía no corre.
2. Al apretar Start, **empieza el cronómetro** y se pasa a la pantalla de juego.
3. La pantalla muestra el nodo actual (foto, nombre y club-año en grande) y debajo un buscador y las tarjetas de los nodos conectados.
4. Cada selección es **un salto**. Ejemplo: Messi → PSG 2021/22 → Di María → Rosario Central 2025/26 → Copetti = 4 saltos.
5. **Volver atrás** no existe como botón. Se vuelve seleccionando de nuevo el nodo anterior desde la lista actual (por ejemplo, desde PSG 2021/22 se vuelve a Messi seleccionando a Messi), y **cuenta como un salto**.
6. **Victoria**: seleccionar al jugador destino.
7. **Derrota**: llegar al límite de **20 saltos** sin alcanzar el destino.
8. Al terminar (victoria o derrota) aparece un **modal con el resumen**.

## Cronómetro
- Corre siempre desde Start, sin pausa (aunque cambie de pestaña o minimice).
- El instante de Start se persiste en el navegador para que recargar la página **no** reinicie el tiempo ni la partida.
- El tiempo es medido en cliente en la v1 (sin ranking no hay incentivo fuerte a manipularlo).

## Puntuación y resumen
- Se muestran **tiempo y saltos** por separado, sin fórmula combinada, y se comparan con el camino óptimo.
- El resumen incluye: resultado, tiempo, saltos, camino recorrido, y el **camino óptimo completo** con un comentario sobre cuántos saltos requería.
- No hay ranking en la v1; el resumen es solo personal.

## Desafío diario
- Un desafío por día, el mismo para todos.
- Cambio de día según zona horaria **America/Argentina/Buenos_Aires**.
- Si una partida queda abierta y cambia el día, se cierra como **derrota** del desafío anterior.
- Un intento por día por navegador. Es posible reintentar borrando el almacenamiento local y se acepta como riesgo en la v1.

## Reglas de generación de desafíos
Ver [challenge-generation](../03-data/challenge-generation.md).
