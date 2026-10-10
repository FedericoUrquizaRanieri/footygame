-- Crea los roles y las bases locales de footygame. Idempotente. Ejecutar como superusuario (postgres).
-- Variables esperadas (psql -v): admin_pw, app_pw.
\set ON_ERROR_STOP on

-- Roles que en Supabase ya existen; se emulan localmente para poder probar que NO tienen acceso.
select 'create role anon nologin' where not exists (select from pg_roles where rolname = 'anon') \gexec
select 'create role authenticated nologin' where not exists (select from pg_roles where rolname = 'authenticated') \gexec

-- Dueño del esquema: carga de datos y migraciones (nunca lo usa la web).
select format('create role footygame_admin login password %L', :'admin_pw')
  where not exists (select from pg_roles where rolname = 'footygame_admin') \gexec
select format('alter role footygame_admin login password %L', :'admin_pw') \gexec

-- Rol de la aplicación web: solo lectura (ver db/migrations).
select format('create role footygame_app login password %L', :'app_pw')
  where not exists (select from pg_roles where rolname = 'footygame_app') \gexec
select format('alter role footygame_app login password %L', :'app_pw') \gexec

select 'create database footygame owner footygame_admin encoding ''UTF8'' template template0'
  where not exists (select from pg_database where datname = 'footygame') \gexec
select 'create database footygame_test owner footygame_admin encoding ''UTF8'' template template0'
  where not exists (select from pg_database where datname = 'footygame_test') \gexec

revoke all on database footygame from public;
revoke all on database footygame_test from public;
grant connect on database footygame to footygame_app, footygame_admin;
grant connect on database footygame_test to footygame_app, footygame_admin;

\echo 'Listo: roles footygame_admin y footygame_app, bases footygame y footygame_test.'
