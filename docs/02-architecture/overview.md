# Arquitectura general

## Stack
| Capa | Tecnología | Motivo |
|---|---|---|
| Frontend + backend ligero | **Next.js (App Router) + TypeScript** | React, rutas de API seguras en el mismo proyecto, SSR para la landing ([ADR-0001](../06-decisions/0001-nextjs-typescript.md)) |
| Hosting | **Vercel** | Deploy simple, CDN/edge |
| Base de datos | **Supabase (PostgreSQL)** | Gestionada, SQL, RLS |
| Estado del jugador | `localStorage` del navegador | Sin cuentas |

## Diagrama lógico
```
Navegador (React)
   │  fetch (solo a nuestro dominio)
   ▼
Next.js Route Handlers (Vercel)  ── validación, rate limit, cache
   │  conexión server-side con rol restringido
   ▼
Supabase Postgres (RLS activado, sin acceso anon)
```

El navegador **nunca** habla con Supabase directamente ([ADR-0002](../06-decisions/0002-acceso-solo-servidor.md)).

## Módulos
- `domain/`: lógica pura, sin dependencias de framework (grafo, reglas de saltos, validación de caminos, cronómetro). Aquí vive la mayor parte de los tests unitarios.
- `data/`: acceso a base de datos (repositorios).
- `app/api/`: Route Handlers, validación y transporte.
- `app/[locale]/`: páginas y componentes UI.
- `scripts/`: carga de datos y generación de desafíos (no se despliegan).

## Flujo de una partida
1. `GET /api/challenge/today` → origen y destino (datos mínimos).
2. El cliente muestra la pantalla previa. Start → guarda `startedAt` en localStorage.
3. Cada selección: `GET /api/nodes/player/:id` o `GET /api/nodes/club-season/:id` → siguiente lista.
4. El cliente lleva el estado (camino, saltos). Al terminar → `POST /api/challenge/finish` con el camino.
5. El servidor valida el camino contra el grafo y responde con el comentario del camino óptimo.

## Caché
Las listas de nodos son datos estáticos entre cargas de datos: se sirven con `Cache-Control` público de CDN (`s-maxage`, `stale-while-revalidate`). El desafío del día se cachea hasta el cambio de día.
