# ADR-0005: Postgres local en Docker, separado de otras instalaciones

- **Estado:** Aceptado
- **Fecha:** 2026-10-09

## Contexto
Mientras los datos no son definitivos se prefiere desarrollar contra Postgres local antes de pasar a Supabase. En la máquina del dueño ya corre un Postgres (puerto 5432) que pertenece a otro proyecto.

## Decisión
footygame usa **su propio Postgres 17 en un contenedor de Docker**, publicado solo en `127.0.0.1:5433`, con un volumen propio y credenciales generadas en `.env.local`. Nunca se crean roles ni bases en el Postgres compartido.

## Alternativas
- Compartir el Postgres de la máquina con roles y bases propias: se descartó porque los roles son globales a la instancia y se mezclarían con el otro proyecto.
- Segunda instancia nativa de Windows: más difícil de mantener y de borrar.
- Ir directo a Supabase: se pospone hasta tener los datos definitivos.

## Consecuencias
- (+) Aislamiento total; se puede destruir y recrear con `npm run db:destroy` / `npm run db:up`.
- (+) Mismo motor y las mismas migraciones que en Supabase.
- (−) Requiere Docker Desktop.
- (−) Los roles `anon` y `authenticated` de Supabase se emulan localmente (vacíos) solo para poder probar que no tienen acceso.

Ver [local-environment](../process/local-environment.md).
