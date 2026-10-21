-- Mensajes de la gente: feedback del juego y pedidos de retiro de contenido (formularios de /feedback y /legal).
-- Es la ÚNICA tabla donde el rol de la web puede escribir: solo INSERT, sin SELECT/UPDATE/DELETE. Los mensajes
-- se leen desde el panel de Supabase o con el rol admin.
create table feedback_messages (
  id         bigint generated always as identity primary key,
  kind       text not null check (kind in ('feedback', 'removal')),
  message    text not null check (char_length(message) between 1 and 3000),
  -- Mail para responder: opcional en el feedback, obligatorio en los pedidos de retiro.
  contact    text check (contact is null or char_length(contact) <= 254),
  locale     text not null check (locale in ('es', 'en')),
  created_at timestamptz not null default now(),
  constraint removal_needs_contact check (kind <> 'removal' or contact is not null)
);

alter table feedback_messages enable row level security;
revoke all on feedback_messages from public;
do $$
begin
  if exists (select from pg_roles where rolname = 'anon') then
    revoke all on feedback_messages from anon;
  end if;
  if exists (select from pg_roles where rolname = 'authenticated') then
    revoke all on feedback_messages from authenticated;
  end if;
  if exists (select from pg_roles where rolname = 'footygame_app') then
    grant insert on feedback_messages to footygame_app;
    create policy app_insert on feedback_messages for insert to footygame_app with check (true);
  end if;
end
$$;
