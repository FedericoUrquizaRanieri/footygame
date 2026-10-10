# Historias de usuario y criterios de aceptación

Los criterios de aceptación son la base de los tests (ver [test-strategy](../05-testing/test-strategy.md)).

## HU-01 Entrar al juego
Como jugador quiero llegar a una landing atractiva con acceso directo al desafío del día.
- Dado que entro a la URL raíz, veo la landing temática y un botón "Desafío diario".
- Al apretar el botón voy a la pantalla previa del desafío de hoy.
- Puedo cambiar el idioma entre es y en.

## HU-02 Conocer el desafío antes de empezar
Como jugador quiero ver de dónde salgo y a dónde llego antes de que corra el tiempo.
- Veo foto y nombre del origen y del destino.
- El cronómetro no corre hasta presionar Start.
- Al presionar Start paso a la pantalla de juego y el tiempo empieza en 0.

## HU-03 Navegar por jugadores y clubes
Como jugador quiero saltar entre jugadores y club-temporadas.
- Arriba veo el nodo actual con foto, nombre y club-año en grande.
- Si estoy en un jugador, veo tarjetas de sus club-temporadas; si estoy en un club-temporada, tarjetas de sus jugadores.
- Cada selección suma 1 al contador de saltos y cambia el nodo actual.
- El siguiente paso se muestra en menos de 500 ms en condiciones normales.

## HU-04 Buscar rápido
Como jugador quiero filtrar la lista escribiendo.
- El filtro es sin distinción de mayúsculas y acentos.
- Filtra mientras escribo, sin recargar.

## HU-05 Volver a un nodo anterior
Como jugador quiero poder volver a un nodo anterior.
- Puedo seleccionar el nodo anterior en la lista actual.
- Esa selección cuenta como un salto.

## HU-06 Ganar
Como jugador quiero que el juego detecte cuando llego al destino.
- Al seleccionar al jugador destino el tiempo se detiene y aparece el modal de resultados.

## HU-07 Perder
Como jugador, si llego a 20 saltos sin ganar, el juego termina.
- El tiempo se detiene y aparece el modal con resultado "derrota".

## HU-08 Ver mi resumen
Como jugador quiero ver cómo me fue.
- El modal muestra resultado, tiempo, saltos y camino recorrido.
- Muestra un comentario sobre el camino óptimo.
- Si vuelvo a la página el mismo día, veo mi resumen en lugar de poder rejugar.

## HU-09 No perder la partida
Como jugador quiero que recargar no me haga perder el progreso.
- Tras recargar sigo en el mismo nodo con el mismo contador y el tiempo sigue contando desde el Start original.

## HU-10 Usar el juego en el celular
- Todas las pantallas son usables en 360 px de ancho.
- La barra de tiempo y saltos sigue visible sin tapar las tarjetas.

## HU-11 Saber qué tan difícil es
- Antes de empezar veo el nivel del desafío (fácil, media o difícil).
- El nivel coincide con el patrón semanal y con el puntaje calculado al generar el desafío.

## HU-12 Rendirme
- Después de Empezar puedo rendirme; la app me pide confirmación.
- Al confirmar, la partida termina como derrota, veo el camino más corto y mi racha se corta.

## HU-13 Ver mi racha y mis números
- Veo mi racha actual, mi mejor racha, mi mejor tiempo y mis saltos promedio.
- Si no jugué hoy pero ayer gané, mi racha sigue visible y no se corta todavía.
- Los desafíos pasados no modifican estos números.

## HU-14 Encontrar rápido a los jugadores conocidos
- En un plantel, los jugadores más conocidos aparecen primero.
- En un jugador, sus clubes más recientes aparecen primero.

## HU-15 Jugar desafíos pasados
- Puedo ver la lista de desafíos anteriores con su nivel y mi resultado si ya lo jugué.
- Puedo jugar uno que no jugué, con las mismas reglas, y ver su resumen.
