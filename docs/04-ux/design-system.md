# Sistema de diseño

Implementado en `src/app/globals.css` (tokens), `src/components/ui/` (piezas) y `src/components/{landing,game}/`.

## Concepto: pizarra de tiza sobre césped
La interfaz es una cancha vista desde arriba. El césped con franjas de corte es la superficie, las líneas de tiza son la estructura, los jugadores son **figuritas** y los clubes son **escudos**. La estructura del juego (jugador, club-temporada, jugador…) se dibuja siempre igual: **círculo = jugador, escudo = club y temporada**.

**Único momento audaz:** en la landing, la ruta del desafío de hoy se arma sola entre dos figuritas. Todo lo demás es deliberadamente quieto.

## Tokens
| Token | Valor | Uso |
|---|---|---|
| `--grass` | `#0f3b28` | superficie base |
| `--grass-stripe` | `#15492f` | franjas de corte (bajo contraste, es superficie) |
| `--grass-deep` | `#0a2a1c` | secciones secundarias, barra superior, marcador |
| `--chalk` | `#f1f3ec` | texto, líneas, papel de las figuritas y del resultado |
| `--ink` | `#0e2219` | texto sobre papel |
| `--card-yellow` | `#ffd12e` | **solo** la acción principal (tarjeta amarilla) |
| `--card-red` | `#e5412d` | derrota (cabecera del resultado) |
| `--red-text` | `#ff8a78` | aviso de último salto sobre césped (contraste AA) |
| `--sky` | `#8ad4f5` | **solo** el jugador destino |
| `--r` / `--r-sm` | 14 px / 10 px | un único sistema de radios |

Un tema único (no hay modo claro/oscuro): la cancha es la identidad. Decisión confirmada con el dueño ("oscuro por defecto").

## Tipografía
- **Big Shoulders** (display, 800–900): títulos, nombres de jugador en mayúsculas "de camiseta", botones y cifras del marcador.
- **Hanken Grotesk** (cuerpo e interfaz).
- Ambas con `next/font` (autoalojadas, sin pedidos externos). Cuerpo ≥ 17 px; las líneas de lectura no pasan de ~65 caracteres.
- El reloj usa dígitos de ancho fijo para que no tiemble.

## Imágenes
- **Jugadores**: foto real de Wikimedia Commons (solo CC BY, CC BY-SA, CC0 o dominio público), descargada y alojada en `public/players/<id>.jpg` (sin hotlinking). Se muestra sobre el monograma (`PlayerPhoto`); si el jugador no tiene foto libre, queda el monograma con colores deterministas (`src/lib/kits.ts`). La atribución de cada foto está en la página `/credits`.
- **Clubes**: escudos **ilustrativos, no oficiales**. Usan los colores y el diseño de camiseta reales del club (`src/lib/club-colors.ts`) sobre una silueta propia, sin letras. No copian ningún emblema, animal ni símbolo del club. Un club mantiene su aspecto en todas sus temporadas. Si un club no está en la tabla, se usa el color determinista de `kits.ts`.
- La página de créditos y el pie de la landing aclaran que los escudos no son oficiales.

## Movimiento
- Una sola animación autónoma: la ruta de la landing (≈ 2,5 s).
- El resto responde a una acción (presionar una tarjeta, abrir el resumen).
- `prefers-reduced-motion`: todo pasa a su estado final al instante.

## Accesibilidad
- Contraste AA en todos los textos (`--chalk` sobre `--grass`: ~11:1; `--ink` sobre `--card-yellow`: ~12:1).
- Foco visible en todo (`--focus`; azul oscuro sobre papel).
- Objetivos táctiles ≥ 44 px.
- Un solo `<main>`; el encabezado y el pie quedan fuera. Enlace "Saltar al contenido".
- Cada cambio de nodo se anuncia (`role="status"`) y el foco pasa al título del nodo.
- El resumen es un `<dialog>` nativo: foco atrapado, Esc cierra, abre desde arriba.
- Los íconos de monograma y escudo son decorativos (`aria-hidden`); el nombre siempre está en texto.

## Pantallas
| Ruta | Pantalla |
|---|---|
| `/[locale]` | Landing: héroe con la ruta del día, cómo se juega (línea de pases), reglamento y datos |
| `/[locale]/daily` | Pantalla previa: origen, destino, reglas y **Empezar** (el reloj aún no corre). Si ya se jugó: resumen y cuenta regresiva |
| `/[locale]/daily/play` | Juego: nodo actual, buscador, opciones, marcador (barra lateral en escritorio, barra fija en celular) y resumen final |

## Decisión sobre la skill de diseño
Se compararon `frontend-design` y `design-taste-frontend`. Se usó **`frontend-design` como guía** y el **checklist final de `design-taste-frontend` como control de calidad**, porque esta última está pensada para landing pages (excluye la UI de producto) e impone Tailwind, Motion e iconos externos, que no encajan con el presupuesto de rendimiento ni con el dibujo propio de escudos y canchas.

### Checklist final (resultado)
| Control | Estado |
|---|---|
| Sin rayas largas en el texto | Cumple (lo verifica un test) |
| Un solo tema, un solo acento por función, un solo sistema de radios | Cumple |
| Contraste AA en botones y formularios | Cumple |
| CTA sin saltos de línea | Cumple |
| Héroe entra en la pantalla (≤ 4 textos, CTA visible) | Cumple (escritorio 1360×860 y celular 390×844) |
| Sin 3 tarjetas iguales, sin etiquetas en mayúsculas, sin numeración decorativa | Cumple; los números 1-2-3 son una secuencia real |
| Movimiento justificado, 1 sola animación autónoma, `reduced-motion` | Cumple |
| `100dvh`, nunca `100vh` | Cumple |
| Estados vacío, de carga y de error | Cumple |
| Íconos de una librería, sin SVG a mano | **Desvío deliberado**: monogramas, escudos y cancha se dibujan a mano porque son la identidad y no hay fotos. No hay otros íconos |
| Dependencias nuevas (Tailwind, Motion, Phosphor) | **Desvío deliberado**: cero dependencias de interfaz; CSS propio |
