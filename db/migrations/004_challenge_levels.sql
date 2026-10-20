-- Dos desafíos por día (normal y difícil) y todos los caminos más cortos (docs/03-data/challenge-generation.md).
-- Los niveles viejos (easy, medium, hard) se convierten: fácil y media pasan a normal. Los desafíos anteriores
-- se regeneran con `npm run data:challenges -- --reset`.
alter table challenges drop constraint challenges_difficulty_check;
alter table challenges drop constraint challenges_date_key;

update challenges set difficulty = 'normal' where difficulty in ('easy', 'medium');

alter table challenges
  alter column difficulty set default 'normal',
  add constraint challenges_difficulty_check check (difficulty in ('normal', 'hard')),
  add constraint challenges_date_difficulty_key unique (date, difficulty),
  -- Todos los caminos más cortos (hasta 8), cada uno como lista de nodos. NUNCA se envía antes de terminar el intento.
  -- optimal_path conserva el primero, por compatibilidad; optimal_paths_count es la cantidad total.
  add column optimal_paths jsonb;

update challenges set optimal_paths = jsonb_build_array(optimal_path) where optimal_paths is null;
alter table challenges alter column optimal_paths set not null;
