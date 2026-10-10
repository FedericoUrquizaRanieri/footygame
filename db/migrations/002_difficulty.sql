-- Nivel de dificultad de cada desafío (ver docs/03-data/challenge-generation.md).
-- Los permisos de lectura de footygame_app son a nivel de tabla, así que cubren las columnas nuevas.
alter table challenges
  add column difficulty text not null default 'medium'
    check (difficulty in ('easy', 'medium', 'hard')),
  add column difficulty_score smallint not null default 1;
