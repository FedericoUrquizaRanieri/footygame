# Riesgos

| ID | Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|---|
| R-01 | Fuente de datos inviable o ilegal (scraping prohibido/bloqueado) | Alta | Crítico | Spike de datos, dataset abierto, ADR-0003 |
| R-02 | Datos incompletos o erróneos (ligas menores, cedidos, mitad de temporada) | Alta | Alto | Validaciones del pipeline, alcance acotado a ligas principales |
| R-03 | Desafíos irresolubles o aburridos | Media | Alto | BFS y reglas de generación, validación previa |
| R-04 | Derechos de imagen y marcas (fotos, escudos) | Media | Medio | Sin hotlinking, fuentes con licencia, placeholders |
| R-05 | Scraping de nuestros datos vía rutas internas | Media | Medio | Rate limit, respuestas mínimas, monitoreo; riesgo aceptado |
| R-06 | Límites/pausa del plan gratuito de Supabase y Vercel | Media | Medio | Cache CDN, job keep-alive, revisar planes |
| R-07 | Trampa con tiempo/saltos del cliente | Alta | Bajo (sin ranking) | Validación en `finish`; revisar si hay ranking |
| R-08 | Rendimiento de móvil con landing pesada | Media | Medio | Presupuestos, Lighthouse CI |
| R-09 | Datos desactualizados tras mercados de pases | Alta | Bajo | Proceso de actualización periódica |
| R-10 | Rejugar borrando almacenamiento | Alta | Bajo | Aceptado en v1 |
