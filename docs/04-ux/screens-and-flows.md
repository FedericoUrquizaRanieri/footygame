# Pantallas y flujos

## Flujo principal
```
Landing ──[Desafío diario]──► Pantalla previa ──[Start]──► Juego ──(victoria/derrota)──► Modal de resultados
```
Si ya se completó el desafío de hoy: Landing → Desafío diario → directo al resumen.

## 1. Landing (`/`)
- Estética temática de fútbol, moderna y rica visualmente (animaciones, fondo, tipografía fuerte).
- Título, breve explicación del juego (3 pasos), botón principal "Desafío diario", selector de idioma.

## 2. Pantalla previa (`/daily`)
- Fecha y número del desafío.
- Dos tarjetas grandes: origen y destino (foto, nombre).
- Botón **Start**. El tiempo aún no corre.

## 3. Juego (`/daily/play`)
Escritorio:
```
┌──────────────────────────────────────────┬───────────┐
│  NODO ACTUAL (foto, nombre, club-año)     │ ⏱ 01:23   │
│  ───────────────────────────────────────  │ Saltos 3/20│
│  [ Buscar… ]                              │ Destino:   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐             │  foto+nombre│
│  │card│ │card│ │card│ │card│  …           │ Camino:    │
│  └────┘ └────┘ └────┘ └────┘             │  ...       │
└──────────────────────────────────────────┴───────────┘
```
- La barra lateral muestra tiempo, saltos (n/20), destino y camino recorrido.
- En móvil la barra lateral pasa a barra fija superior compacta (tiempo + saltos) y el camino queda en un panel desplegable.
- Tarjetas: foto/escudo + nombre; en club-temporada, escudo + club + temporada.
- Estados: cargando (esqueleto de tarjetas), vacío en búsqueda, error de red con reintento.

## 4. Modal de resultados
- Victoria o derrota con tono visual distinto.
- Tiempo, saltos, camino recorrido (con fotos pequeñas).
- Comentario sobre el camino óptimo.
- Cierra a una vista de resumen persistente (no se puede rejugar el mismo día).

## 5. Páginas de error y 404
Mínimas, temáticas.

## Pendiente
Referenciar visualmente filmlink.io/daily para extraer decisiones de interfaz [ABIERTO: revisión del sitio].
