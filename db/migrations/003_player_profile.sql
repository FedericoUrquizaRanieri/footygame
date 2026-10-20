-- Datos fijos de la ficha del jugador, para la figurita (bandera y posición). Pueden faltar.
-- nationality: nombre del país en inglés, tal como lo trae Transfermarkt (ver src/lib/nationalities.ts).
-- position: 'Goalkeeper' | 'Defender' | 'Midfield' | 'Attack'.
-- Los permisos de lectura de footygame_app son a nivel de tabla, así que cubren las columnas nuevas.
alter table players
  add column nationality text,
  add column position    text check (position in ('Goalkeeper', 'Defender', 'Midfield', 'Attack'));
