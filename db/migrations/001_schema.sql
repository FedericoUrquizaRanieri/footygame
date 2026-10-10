-- Esquema inicial de footygame. Compatible con Postgres local y con Supabase.
-- Seguridad: RLS activado en TODAS las tablas; solo el rol de la app (footygame_app) tiene política de lectura.
-- anon / authenticated (los roles de la API pública de Supabase) no reciben ningún permiso.

create table players (
  id                bigint primary key,            -- id de la fuente (Transfermarkt)
  name              text   not null,
  name_search       text   not null,               -- normalizado: minúsculas, sin acentos
  photo_url         text,                          -- v1: null (placeholders)
  market_value_eur  bigint                         -- valor máximo de mercado; sirve para elegir jugadores conocidos
);

create table clubs (
  id        bigint primary key,                    -- id de la fuente
  name      text   not null,
  country   text,
  league    text   not null,                       -- código de competición (GB1, ES1, ...)
  logo_url  text
);

-- Nodo "club en una temporada". id determinista = club_id * 10000 + season_year (estable entre cargas).
create table club_seasons (
  id           bigint primary key,
  club_id      bigint  not null references clubs (id),
  season_year  integer not null,                   -- año de inicio de la temporada
  label        text    not null,                   -- '2021/22' o '2025' (ligas de año calendario)
  unique (club_id, season_year)
);

-- Arista: el jugador integró el plantel de ese club-temporada.
create table player_club_seasons (
  player_id       bigint not null references players (id),
  club_season_id  bigint not null references club_seasons (id),
  source          text   not null default 'lineups',  -- origen del dato (confianza)
  primary key (player_id, club_season_id)
);
-- La PK cubre player_id -> club_season_id; este índice cubre la dirección inversa.
create index player_club_seasons_by_club_season on player_club_seasons (club_season_id, player_id);

create table challenges (
  id                    bigserial primary key,
  date                  date    not null unique,   -- día (Buenos Aires)
  origin_player_id      bigint  not null references players (id),
  destination_player_id bigint  not null references players (id),
  optimal_length        integer not null,
  optimal_paths_count   integer not null,
  optimal_path          jsonb   not null,          -- NUNCA se envía al cliente antes de terminar el intento
  created_at            timestamptz not null default now(),
  check (origin_player_id <> destination_player_id)
);

-- Búsqueda por nombre (uso interno de scripts).
create index players_name_search on players (name_search);

-- ---------------------------------------------------------------------------
-- Seguridad
-- ---------------------------------------------------------------------------
alter table players             enable row level security;
alter table clubs               enable row level security;
alter table club_seasons        enable row level security;
alter table player_club_seasons enable row level security;
alter table challenges          enable row level security;

-- Nadie en el esquema público por defecto, y ningún permiso para los roles de la API pública.
revoke all on all tables in schema public from public;
do $$
begin
  if exists (select from pg_roles where rolname = 'anon') then
    revoke all on all tables in schema public from anon;
    revoke all on schema public from anon;
  end if;
  if exists (select from pg_roles where rolname = 'authenticated') then
    revoke all on all tables in schema public from authenticated;
    revoke all on schema public from authenticated;
  end if;

  -- Rol de la app web: solo lectura, y únicamente mediante políticas explícitas.
  if exists (select from pg_roles where rolname = 'footygame_app') then
    grant usage on schema public to footygame_app;
    grant select on players, clubs, club_seasons, player_club_seasons, challenges to footygame_app;
    create policy app_read on players             for select to footygame_app using (true);
    create policy app_read on clubs               for select to footygame_app using (true);
    create policy app_read on club_seasons        for select to footygame_app using (true);
    create policy app_read on player_club_seasons for select to footygame_app using (true);
    create policy app_read on challenges          for select to footygame_app using (true);
  end if;
end
$$;
