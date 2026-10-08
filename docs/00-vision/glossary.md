# Glosario

| Término | Significado |
|---|---|
| **Jugador** | Futbolista. Nodo del grafo. |
| **Club** | Equipo profesional (no selecciones, salvo decisión posterior). |
| **Temporada** | Período competitivo, p. ej. 2021/22. Se muestra con ese formato de temporada. |
| **Club-temporada** | Un club en una temporada concreta, p. ej. "PSG 2021/22". Nodo del grafo. |
| **Arista** | Relación "jugó en": jugador ↔ club-temporada. |
| **Compañero** | Dos jugadores que integraron el plantel del mismo club en la misma temporada (ver [game-rules](../01-requirements/game-rules.md)). |
| **Desafío** | Par (jugador origen, jugador destino) asignado a una fecha. |
| **Desafío diario** | El desafío del día, igual para todos. |
| **Salto** | Cada selección que hace la persona (jugador o club-temporada). |
| **Camino** | Secuencia de nodos seleccionados desde el origen. |
| **Camino óptimo** | Camino más corto posible entre origen y destino, calculado de antemano. |
| **Start** | Acción que inicia el cronómetro. |
| **Resumen** | Datos del intento: tiempo, saltos, camino recorrido, comparación con el óptimo. |
