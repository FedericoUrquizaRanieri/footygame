# Sistema de diseño

Implementado en `src/app/globals.css` (tokens), `src/components/ui/` (piezas) y `src/components/{landing,game}/`.

## Concepto: la cancha de noche, vista desde la tribuna
La cancha es el lugar donde vive todo el sitio, no un fondo de la landing. `PitchBackdrop` dibuja el césped (franjas de corte, grano, luz de reflectores, viñeta) con las marcas de tiza, y **cada pantalla muestra otra zona** de la misma cancha cambiando el encuadre:

| Pantalla | Zona | Objeto en primer plano |
|---|---|---|
| Landing | centro (círculo central) | la ruta del día, con la pelota, y la cartelería LED; "Cómo se juega" muestra el juego real con tres figuritas que se pegan al hacer scroll |
| Desafío de hoy y de un día anterior | área grande | planilla de partida y marcador de estadio |
| Desafíos anteriores | córner | entradas con muescas y sello de resultado |
| Juego, créditos y legal | centro / córner, **tenue** (`calm`) | el contenido; la cancha baja de volumen |

La estructura del juego (jugador, club-temporada, jugador…) se dibuja siempre igual: **círculo = jugador, escudo = club y temporada**. Los jugadores son **figuritas**.

Objetos en lugar de tarjetas: la entrada con muescas, el sello torcido, el marcador de lámparas ámbar y la cartelería del borde de la cancha reemplazan al rectángulo redondeado con borde. La acción principal es una **tarjeta amarilla** (esquinas casi rectas, sombra dura, leve giro).

**Momento memorable:** la landing. El titular entra por líneas y después la pelota recorre la ruta del día entre las dos figuritas.

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
| `--night` | `#061a13` | fondo de cartelería y marcador |
| `--led` | `#ffb347` | **solo** superficies de lámparas (cartelería y marcador de estadísticas) |
| `--floodlight` | `rgba(255,238,186,.2)` | luz cálida de reflectores sobre el césped |
| `--r` / `--r-sm` | 14 px / 10 px | radios de botones secundarios y paneles; las entradas y la tarjeta amarilla usan 6 px |

Un tema único (no hay modo claro/oscuro): la cancha es la identidad. Decisión confirmada con el dueño ("oscuro por defecto").

## Tipografía
- **Archivo** (variable, eje de ancho `wdth`), una sola familia con `next/font`. Los títulos usan `font-stretch: var(--display-stretch)` (68 %, condensado, como los nombres en una camiseta); el cuerpo usa el ancho normal.
- El titular de la landing juega con el ancho: la primera frase abierta (125 %) y la segunda larga y condensada (62 %).
- Cuerpo ≥ 17 px; las líneas de lectura no pasan de ~65 caracteres.
- El reloj usa dígitos de ancho fijo para que no tiemble.
- Archivo tiene métricas en `next/font`, así que ya no aparece el aviso "Failed to find font override values" que daba Big Shoulders.

## Figuritas
Jugadores y clubes son figuritas de álbum: borde de papel, marco del color de la camiseta o del club y la foto (o el escudo) en una ventana con filo blanco.
- **Figurita de jugador** (`Sticker`): foto, nombre, arriba la **bandera** de su nacionalidad y su **posición** (ARQ, DEF, MED, DEL) y al pie el valor de mercado máximo. Son datos fijos de su ficha: no dependen del club ni del año. Desde `FOIL_VALUE_EUR` (50 M) sale **brillante**: borde dorado, estrella y reflejo de colores que se corre al mirarla de cerca.
- **Figurita de club** (`ClubSticker`): el escudo ilustrativo con su forma de siempre sobre un fondo del color del club, el nombre, la temporada como dato principal y la liga arriba (`src/lib/leagues.ts`).
- Los datos salen de la API de nodos: `league` en cada club-temporada y, en cada jugador del plantel, `marketValueEur`, `nationality` y `position` (los tres pueden ser `null`; sin valor se muestra "Sin valor" y sin nacionalidad o posición la franja de arriba queda vacía). Los clientes que reciben una respuesta vieja, sin esos campos, dibujan la figurita sin el dato. `nationality` y `position` se cargan con la migración `003_player_profile.sql` y `npm run data:profiles`.
- Las banderas son PNG de 48 x 36 px en `public/flags` (de flag-icons, MIT). Se usan imágenes y no emojis porque Windows no dibuja los emojis de bandera. La carpeta está en `.gitignore`: se regenera con `npm run data:flags`, igual que las fotos con `npm run data:photos`. Si una bandera falta, `Flag` se oculta.
- La foto es decorativa y tiene alternativa: si el archivo no existe o falla, `PlayerPhoto` se oculta y queda el monograma.

## Imágenes
- **Jugadores**: foto real de Wikimedia Commons (solo CC BY, CC BY-SA, CC0 o dominio público), descargada y alojada en `public/players/<id>.jpg` (sin hotlinking). Se muestra sobre el monograma (`PlayerPhoto`); si el jugador no tiene foto libre, queda el monograma con colores deterministas (`src/lib/kits.ts`). La atribución de cada foto está en la página `/credits`.
- **Clubes**: escudos **ilustrativos, no oficiales**. Usan los colores y el diseño de camiseta reales del club (`src/lib/club-colors.ts`) sobre una silueta propia, sin letras. No copian ningún emblema, animal ni símbolo del club. Un club mantiene su aspecto en todas sus temporadas. Si un club no está en la tabla, se usa el color determinista de `kits.ts`.
- La página de créditos y el pie de la landing aclaran que los escudos no son oficiales.

## Movimiento
Tres capas, todas en CSS salvo el haz de luz:
1. **Entrada de la landing (una vez):** el titular entra por líneas con máscara; después la pelota recorre cada tramo de la ruta y el nodo siguiente la recibe (≈ 3,4 s en total).
2. **Ambiente:** en "Cómo se juega", cada figurita llega torcida y queda pegada al entrar en pantalla, y la línea de pases entre ellas se dibuja con el scroll (`animation-timeline: view()`, solo donde está soportado); la cartelería LED con los desafíos anteriores (se pausa con hover o foco) y el haz de luz que sigue al mouse sobre el césped (solo con mouse).
3. **Respuesta a una acción:** figuritas que se enderezan y suben con un brillo holográfico, la tarjeta amarilla que se hunde al presionar, las entradas del archivo que se reparten al abrir la página y se levantan al pasar.
- `prefers-reduced-motion`: todo pasa a su estado final al instante; la cartelería queda quieta y con scroll horizontal; el haz de luz y el scroll animado no se activan.

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
| `/[locale]/daily` | Pantalla previa (zona de área grande): origen, destino, reglas y **Empezar** (el reloj aún no corre). Si ya se jugó: resumen y cuenta regresiva |
| `/[locale]/daily/play` | Juego (cancha tenue): nodo actual, buscador, opciones, marcador (barra lateral en escritorio, barra fija en celular) y resumen final |

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
| Movimiento justificado (una entrada principal, una cartelería ambiente), `reduced-motion` | Cumple |
| `100dvh`, nunca `100vh` | Cumple |
| Estados vacío, de carga y de error | Cumple |
| Íconos de una librería, sin SVG a mano | **Desvío deliberado**: monogramas, escudos, pelota y cancha se dibujan a mano porque son la identidad. No hay otros íconos |
| Dependencias nuevas (Tailwind, Motion, Phosphor) | **Desvío deliberado**: cero dependencias de interfaz; CSS propio |

## Textura
`public/textures/grain.png` (128 px, ruido casi transparente) da el grano del césped. Un `feTurbulence` en SVG inline trababa el renderizado, por eso es una imagen estática cacheable.
