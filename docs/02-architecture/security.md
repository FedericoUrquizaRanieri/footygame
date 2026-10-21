# Seguridad

## Objetivo declarado
"Los datos solo se acceden a través de la UI; no hay APIs abiertas."

## Realidad
En una web que muestra datos, quien observa el tráfico de red puede ver las respuestas que la UI consume. Lo que **sí** se puede garantizar y lo que **no**:

| Garantizado | No garantizado |
|---|---|
| Acceso directo a Supabase cerrado | Imposibilidad de scrapear lentamente vía las rutas internas |
| Sin volcados completos | Ocultar datos que la UI ya muestra |
| Sin claves privadas en el cliente | |
| Rate limiting y validación | |
| El camino óptimo no se filtra antes de tiempo | |

Riesgo aceptado: scraping lento y paso a paso. Se vigila con logs.

## Controles
1. **RLS** activado en todas las tablas, sin políticas públicas. Verificado por test: con la clave anónima no se devuelve ninguna fila.
2. **Acceso solo server-side**: Route Handlers usan una conexión con rol de mínimo privilegio (solo `SELECT` en tablas de grafo; escritura solo en scripts). La `service_role` key nunca se usa en rutas expuestas si se evita ([ADR-0002](../06-decisions/0002-acceso-solo-servidor.md)).
3. **Secretos** únicamente en variables de entorno del servidor (sin prefijo `NEXT_PUBLIC_`).
4. **Rate limiting** por IP (p. ej. 60 req/min en `nodes/*`, más estricto en `finish`).
5. **Validación de entrada** con esquema (p. ej. zod) en todas las rutas.
6. **Anti-filtrado de solución**: `optimal_path` y `optimal_paths` jamás en respuestas hasta `finish`.
7. **Cabeceras**: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors 'none'`.
8. **Dependencias**: `npm audit` en CI.
9. **Sin PII**: no hay cuentas ni datos personales. No se guardan IPs en la base (solo en el contador del rate limit con expiración).

## Anti-trampa (v1)
- Tiempo y saltos se calculan en cliente; `finish` recalcula saltos desde el `path` y valida el tiempo de forma plausible (no negativo, no menor a un mínimo por salto).
- Sin ranking, la manipulación solo afecta a quien la hace.

## Tests asociados
Ver [security-tests](../05-testing/security-tests.md).
