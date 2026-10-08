# Pipeline de datos [PROPUESTO]

Proceso reproducible, ejecutado con scripts en `scripts/` (no forma parte del despliegue web).

```
Fuente → [1] Descarga/extracción → [2] Normalización → [3] Validación → [4] Carga a Supabase → [5] Generación de desafíos
```

1. **Extracción**: bajar dataset/API. Guardar copia cruda local (no versionada si es grande).
2. **Normalización**: unificar nombres de club, etiquetas de temporada (`2021/22`), generar `name_search` (sin acentos, minúsculas), deduplicar jugadores.
3. **Filtrado**: ligas y rango de años del [alcance](data-sources.md); descartar selecciones nacionales. La arista jugador–club-temporada se crea si el jugador integró el plantel (sin umbral de minutos), derivado de apariciones y transferencias si la fuente no tiene planteles.
4. **Validación** (falla el pipeline si no se cumple):
   - Sin jugadores sin ninguna arista.
   - Sin club-temporadas con menos de X jugadores (detecta datos incompletos).
   - Sin duplicados en claves.
   - Tamaños de componentes conexas del grafo reportados.
5. **Carga**: upsert idempotente a Supabase con conexión de escritura (solo en local/CI, nunca en la web).
6. **Generación de desafíos**: ver [challenge-generation](challenge-generation.md).

## Actualización
Tras cada mercado de pases importante o inicio de temporada: re-ejecutar pasos 1–5. Cambios de datos invalidan el cache de CDN (nuevo deploy o revalidación).

## Reproducibilidad
Cada ejecución registra: versión/fecha de la fuente, cantidad de filas por tabla, resultado de validaciones.
