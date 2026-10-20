# Fuentes de datos

**Es el mayor riesgo del proyecto** ([risks](../process/risks.md)). Estado: **en discusión**.

## Qué necesitamos
Por cada jugador: nombre, foto. Por cada club: nombre, escudo. Por cada par jugador–club–temporada: participación real (partidos/minutos). Cobertura de las principales ligas del mundo.

## Idea inicial del dueño
Armar la base con scraping de Transfermarkt o similar.

## Opciones
| Opción | Pros | Contras |
|---|---|---|
| **Scraping directo de Transfermarkt** | Cobertura enorme | Sus términos de uso lo prohíben, bloquean bots (rate limits, IPs), parsers frágiles, riesgo legal si se publica |
| **Dataset abierto derivado de Transfermarkt** (p. ej. "transfermarkt-datasets" de dcaribou en GitHub/Kaggle, publicado con licencia abierta; **verificar licencia y vigencia**) | Ya limpio, con jugadores, clubes, partidos jugados y transferencias; sin scraping propio | Tiene retraso respecto al mercado actual, imágenes no incluidas como archivos |
| **API-Football / football-data.org** | Legal, estable | Planes gratis limitados en ligas, temporadas históricas y peticiones |
| **Wikidata** | Libre, trae fotos de Commons | Cobertura de carreras irregular, sin datos de participación real |
| **Híbrido** | Dataset base + completar con API/Wikidata | Más trabajo de integración |

## Decisión del dueño
Arrancar con el dataset abierto. No hay fuente definitiva todavía.

## Recomendación [PROPUESTO]
1. Evaluar primero el **dataset abierto** como base: da `appearances` reales (dos jugadores con partidos en el mismo club-temporada = jugaron juntos), sin necesidad de scraping propio.
2. Si falta cobertura reciente, completar puntualmente con una API o carga manual.
3. Dejar el scraping propio como último recurso, a baja tasa y solo para uso personal/académico, asumiendo el riesgo de términos de uso.

## Spike de datos (antes de escribir la app) [PROPUESTO]
- Descargar el dataset candidato, cargar una muestra en Postgres.
- Medir: cuántos jugadores/club-temporadas, grado promedio, conectividad del grafo, longitud típica de caminos.
- Probar que se pueden generar desafíos buenos.
- Decidir fuente definitiva y documentar en un ADR ([ADR-0003](../06-decisions/0003-fuente-de-datos.md)).

## Alcance de ligas (decidido)
Premier League, LaLiga, Serie A, Bundesliga, Ligue 1, Liga Profesional Argentina, Brasileirão, Primeira Liga, Eredivisie y MLS. Ventana temporal propuesta: desde 2000/01, a confirmar en el spike. Selecciones nacionales fuera de alcance.

El dataset abierto suele cubrir solo algunas ligas de primer nivel. Si faltara Argentina u otras, es un hallazgo clave del spike.

## Plantel vs. apariciones
Las aristas se definen por **integrar el plantel**, sin importar minutos. Un dataset basado en apariciones omitiría suplentes sin minutos. El spike debe verificar si hay datos de plantel o si se infieren de transferencias y apariciones.

## Imágenes y derechos
- Fotos de jugadores y escudos tienen derechos de imagen y marcas registradas.
- No hacer hotlinking a sitios de terceros.
- **Fotos de jugadores**: `npm run data:photos` ([fetch-photos.ts](../../scripts/pipeline/fetch-photos.ts)) cruza el id de Transfermarkt (P2446) con Wikidata, toma la imagen (P18), verifica en Commons que la licencia sea libre (CC BY, CC BY-SA, CC0, dominio público; se descartan NC/ND), descarga una miniatura de 256 px a `public/players/` y escribe la atribución en `src/lib/player-photo-credits.generated.json` y los ids con foto en `src/lib/player-photos.generated.ts`. Es reanudable. Las imágenes no se versionan (se regeneran); para publicar hay que correr el script antes de construir o subirlas a un bucket.
- **Escudos**: no se usan escudos reales (son marcas registradas). Se dibujan escudos ilustrativos con los colores de camiseta de cada club ([club-colors.ts](../../src/lib/club-colors.ts)); un club nuevo en la base necesita una línea en esa tabla.
- Jugadores sin foto libre: monograma con iniciales.
