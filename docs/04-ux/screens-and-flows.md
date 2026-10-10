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

## Mejoras de juego (v1.1)
- **Nivel de dificultad** visible en la pantalla previa y en el resumen (tres barras y el nombre del nivel).
- **Rendirme**: botón en la barra lateral (escritorio) y en el panel del camino (celular), con confirmación. Termina como derrota y muestra el camino más corto.
- **Tus números** en la pantalla previa del diario: racha actual, mejor racha, mejor tiempo y saltos promedio. En el resumen, la racha al ganar.
- **Desafíos anteriores** (`/[locale]/archive`): lista de hasta 60 días con tu resultado. Cada uno tiene su pantalla previa (`/archive/[date]`) y su juego (`/archive/[date]/play`), con las mismas reglas pero como práctica: no cuenta para la racha ni para los números. El resumen vuelve a la lista y no muestra cuenta regresiva.
- Las rutas de práctica solo sirven fechas anteriores a hoy; para hoy, el futuro o fechas inválidas muestran la página "no encontrada" (con `noindex`). Limitación menor: por el streaming de Next.js el código HTTP es 200 en esos casos.

- **Clubes del destino**: tocar al jugador destino abre un diálogo con los clubes donde jugó (agrupados por club, con sus temporadas). En celular se llega desde el panel del camino ("Ver sus clubes"). Reutiliza la misma carga con caché que el resto del juego, sin ruta nueva.
