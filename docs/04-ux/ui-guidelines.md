# Guía de interfaz [PROPUESTO]

## Identidad
- Tema fútbol: césped, líneas de cancha, texturas de camiseta, tipografía deportiva fuerte para títulos y una sans legible para el cuerpo.
- Landing "moderna y compleja": degradados, animaciones sutiles, elementos 3D/parallax opcionales sin comprometer el rendimiento.
- Modo oscuro por defecto, modo claro opcional [ABIERTO].

## Principios
1. Móvil primero (360 px mínimo), luego tablet y escritorio.
2. Objetivos táctiles ≥ 44 px.
3. Texto con contraste AA.
4. Jerarquía: el nodo actual es lo más grande de la pantalla.
5. Las animaciones respetan `prefers-reduced-motion`.

## Componentes
- `NodeHeader` (nodo actual)
- `SearchBox`
- `CardGrid` / `PlayerCard` / `ClubSeasonCard`
- `StatusPanel` (tiempo, saltos, destino, camino)
- `ResultModal`
- `LanguageSwitcher`

## Imágenes
Aspect ratio fijo para evitar saltos de layout, con placeholder si falta la foto.

## Accesibilidad
- Navegación por teclado en el buscador y la grilla (Tab/Enter).
- `alt` descriptivo; modal con foco atrapado y cierre con Esc.
- Anuncios para lectores de pantalla en cambios de nodo (`aria-live`).
