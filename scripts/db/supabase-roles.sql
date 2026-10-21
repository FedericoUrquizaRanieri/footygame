-- Roles de footygame en Supabase. Ejecutar UNA vez en el SQL Editor del proyecto, ANTES de `npm run db:migrate`
-- (las migraciones crean las políticas RLS solo si footygame_app ya existe).
--
-- Antes de ejecutar, reemplazá las dos contraseñas. Usá letras y números (sin @ : / ? # %) para no
-- tener que codificarlas en las URLs de conexión. Guardalas en un gestor de contraseñas, NO en el repo.

-- Dueño del esquema: migraciones y carga de datos (nunca lo usa la web).
create role footygame_admin login password 'REEMPLAZAR_PASSWORD_ADMIN';
grant usage, create on schema public to footygame_admin;

-- Rol de la web: solo lectura (+ INSERT en feedback_messages, que otorga la migración 005).
create role footygame_app login password 'REEMPLAZAR_PASSWORD_APP';
grant usage on schema public to footygame_app;

-- Permite que `postgres` (el usuario del panel) administre lo que cree footygame_admin.
grant footygame_admin to postgres;
