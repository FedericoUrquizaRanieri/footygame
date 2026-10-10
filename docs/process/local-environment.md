# Entorno local

## Base de datos: Postgres en Docker (puerto 5433)
footygame usa **su propio Postgres en un contenedor de Docker**, aislado de cualquier otra instalación de Postgres de la máquina (el Postgres del sistema escucha en 5432 y es de otros proyectos; footygame **no lo usa**).

| | |
|---|---|
| Contenedor | `footygame-db` (imagen `postgres:17-alpine`) |
| Puerto | `127.0.0.1:5433` (solo localhost) |
| Datos | volumen Docker `footygame_footygame_pgdata` |
| Bases | `footygame` (desarrollo) y `footygame_test` (tests; se recrea en cada corrida) |
| Roles | `footygame_admin` (migraciones y carga), `footygame_app` (solo lectura, lo usa la web), `postgres` (superusuario del contenedor), `anon` y `authenticated` (solo para probar que NO tienen acceso) |
| Credenciales | `.env.local` (generado, ignorado por git) |

### Comandos
| Comando | Qué hace |
|---|---|
| `npm run db:up` | Genera `.env.local` si no existe y levanta el contenedor (crea roles y bases la primera vez) |
| `npm run db:down` | Detiene y quita el contenedor, **conserva los datos** |
| `npm run db:destroy` | Lo anterior y además **borra el volumen** (hay que recargar los datos) |
| `npm run db:migrate` | Aplica las migraciones pendientes a `footygame` |
| `npm run data:extract` | Extrae y valida los datos del dataset a `data/processed/` (Python + DuckDB) |
| `npm run data:load` | Carga `data/processed/` en `footygame` (unos 5 s) |
| `npm run data:challenges` | Genera la cola de desafíos (`-- --days 60`) |

### Primera vez
```bash
npm install
npm run db:up
npm run db:migrate
pip install -r scripts/requirements.txt
python scripts/spike/download.py     # ~210 MB, una sola vez
npm run data:extract
npm run data:load
npm run data:challenges
npm run build && npx next start -p 3100
```

### Conectarse con pgAdmin
Agregar un server nuevo con host `localhost`, puerto **5433**, base `footygame` y usuario `footygame_admin`. La contraseña está en `.env.local` (variable `FOOTYGAME_ADMIN_PASSWORD`).

## Pasaje a Supabase (más adelante)
1. Crear el proyecto y aplicar `db/migrations/*.sql` (con `DATABASE_URL_ADMIN` apuntando a Supabase).
2. Crear un rol de solo lectura equivalente a `footygame_app` y usar su cadena de conexión (pooler) como `DATABASE_URL` en Vercel.
3. Correr `npm run data:load` y `npm run data:challenges` contra Supabase.
4. Los tests de seguridad (`tests/security`) se pueden apuntar a un proyecto de prueba para confirmar que la API pública (`anon`) no ve nada.
