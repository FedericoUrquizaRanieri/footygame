# footygame

Juego de navegador con un **desafío diario de fútbol**: te muestran dos futbolistas y tenés que llegar de uno al otro saltando entre clubes-temporada y compañeros de plantel.

> Ejemplo: Messi → PSG 2021 → Di María → Rosario Central 2025 → Copetti (4 saltos).

Inspirado en [filmlink.io/daily](https://www.filmlink.io/daily). Estado: **en desarrollo** (Fase 4: núcleo, API e interfaz hechos; falta tu prueba, ver [docs/process/workflow.md](docs/process/workflow.md)).

## Stack

Next.js (App Router) · TypeScript · Supabase (PostgreSQL) · Vercel · Vitest

## Documentación

Todo el diseño del proyecto está en [docs/](docs/README.md): visión, reglas del juego, requisitos, arquitectura, datos, UX, estrategia de tests y decisiones (ADRs).

## Requisitos

- Node.js ≥ 22 y npm
- Python ≥ 3.10 (solo para los scripts de datos)

## Puesta en marcha

Requiere Docker (el juego usa su propio Postgres en un contenedor, puerto 5433, aislado de cualquier otro Postgres). Detalle en [docs/process/local-environment.md](docs/process/local-environment.md).

```bash
npm install
npm run db:up         # genera .env.local y levanta Postgres en Docker
npm run db:migrate    # crea el esquema
# cargar los datos (una vez): ver "Datos" más abajo
npm run data:challenges   # cola de desafíos (si todavía no hay uno para hoy)
npm run dev           # http://localhost:3000  (se abre en /es o /en)
```

## Scripts

| Comando                           | Qué hace                                          |
| --------------------------------- | ------------------------------------------------- |
| `npm run dev`                     | Servidor de desarrollo                            |
| `npm run build` / `npm start`     | Build y servidor de producción                    |
| `npm run lint`                    | ESLint                                            |
| `npm run typecheck`               | Chequeo de tipos                                  |
| `npm test`                        | Tests (Vitest)                                    |
| `npm run test:coverage`           | Tests con cobertura (mínimo 90 % en `src/domain`) |
| `npm run format` / `format:check` | Prettier                                          |

## Datos (spike)

Los datos provienen del dataset abierto [dcaribou/transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets) (CC0).

```bash
pip install -r scripts/requirements.txt
python scripts/spike/download.py     # ~210 MB a data/raw/ (ignorado por git)
npm run data:extract                 # extrae y valida -> data/processed/
npm run data:load                    # carga a Postgres (~5 s)
npm run data:challenges              # genera la cola de desafíos diarios
```

Resultados y conclusiones: [docs/03-data/spike-results.md](docs/03-data/spike-results.md).

## Estructura

```
src/            Aplicación Next.js (app/, y luego domain/, data/)
docs/           Documentación del proyecto
scripts/        Scripts de datos (spike, carga, generación de desafíos)
data/raw/       Datos crudos descargados (no se versionan)
.github/        CI
```

## Seguridad

La base de datos no es accesible desde el navegador: todo pasa por rutas del servidor. Nunca versionar `.env*` ni usar el prefijo `NEXT_PUBLIC_` para secretos. Detalle en [docs/02-architecture/security.md](docs/02-architecture/security.md).

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md).
