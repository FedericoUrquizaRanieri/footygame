# footygame

Juego de navegador con un **desafío diario de fútbol**: te muestran dos futbolistas y tenés que llegar de uno al otro saltando entre clubes-temporada y compañeros de plantel.

> Ejemplo: Messi → PSG 2021 → Di María → Rosario Central 2025 → Copetti (4 saltos).

Inspirado en [filmlink.io/daily](https://www.filmlink.io/daily). Estado: **en desarrollo** (Fase 3: setup y tests, ver [docs/process/workflow.md](docs/process/workflow.md)).

## Stack

Next.js (App Router) · TypeScript · Supabase (PostgreSQL) · Vercel · Vitest

## Documentación

Todo el diseño del proyecto está en [docs/](docs/README.md): visión, reglas del juego, requisitos, arquitectura, datos, UX, estrategia de tests y decisiones (ADRs).

## Requisitos

- Node.js ≥ 22 y npm
- Python ≥ 3.10 (solo para los scripts de datos)

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar cuando exista el proyecto de Supabase
npm run dev                  # http://localhost:3000
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

Los datos provienen del dataset abierto [dcaribou/transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets) (CC0). Para reproducir el análisis del spike:

```bash
pip install -r scripts/requirements.txt
python scripts/spike/download.py        # ~210 MB a data/raw/ (ignorado por git)
PYTHONUTF8=1 python scripts/spike/graph.py leagues
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
