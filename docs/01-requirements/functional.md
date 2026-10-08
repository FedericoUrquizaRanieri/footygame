# Requisitos funcionales

Cada requisito tiene un ID para trazarlo con historias de usuario y tests.

## Landing
- **RF-01** La landing presenta el juego con estética temática de fútbol y un botón para ir al desafío diario.
- **RF-02** La landing permite cambiar el idioma (es/en).

## Desafío
- **RF-10** Existe un único desafío por fecha, igual para todos los usuarios.
- **RF-11** La pantalla previa muestra jugador origen, jugador destino (foto y nombre) y un botón Start.
- **RF-12** El cronómetro se inicia solo al presionar Start.

## Juego
- **RF-20** La pantalla de juego muestra arriba el nodo actual (foto, nombre y club-temporada en grande).
- **RF-21** Debajo hay un buscador que filtra la lista y una grilla de tarjetas con foto y nombre.
- **RF-22** Si el nodo actual es un jugador, las tarjetas son sus club-temporadas. Si es un club-temporada, son los jugadores de ese plantel.
- **RF-23** Seleccionar una tarjeta es un salto: se actualiza el nodo actual y el contador.
- **RF-24** Se puede volver a un nodo anterior seleccionándolo en la lista actual; cuenta como salto.
- **RF-25** Una barra lateral muestra tiempo transcurrido y cantidad de saltos (en móvil se adapta, p. ej. barra superior o inferior).
- **RF-26** El juego termina con victoria al seleccionar el jugador destino.
- **RF-27** El juego termina con derrota al llegar a 20 saltos sin victoria.
- **RF-28** Recargar la página no reinicia la partida en curso.

## Resultados
- **RF-30** Al terminar se muestra un modal con resultado, tiempo, saltos y camino recorrido.
- **RF-31** El modal incluye un comentario sobre el camino óptimo.
- **RF-32** Una vez terminado el desafío del día, la persona no puede rehacerlo en el mismo navegador; ve su resumen.

## Datos
- **RF-40** Los datos (jugadores, clubes, club-temporadas, desafíos) se leen de una base de datos en Supabase.
- **RF-41** Seleccionar un nodo carga solo el siguiente paso (no se descargan volúmenes grandes).

## Internacionalización
- **RF-50** Toda la interfaz está disponible en español e inglés.
