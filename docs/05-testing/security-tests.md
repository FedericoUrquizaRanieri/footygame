# Tests de seguridad

| ID | Prueba | Criterio de aprobación |
|---|---|---|
| S-01 | Consultar cada tabla vía REST de Supabase con la clave anónima | 0 filas / acceso denegado |
| S-02 | Intentar INSERT/UPDATE/DELETE con clave anónima | Denegado |
| S-03 | Buscar secretos en el bundle del cliente y en el repositorio (`service_role`, URLs de conexión) | No se encuentra ninguno |
| S-04 | Variables `NEXT_PUBLIC_*` no contienen secretos | Revisión automática |
| S-05 | Rutas de API con IDs inválidos (negativos, texto, inyección SQL) | 400, sin error SQL expuesto |
| S-06 | Rate limiting: superar el límite por IP | 429 |
| S-07 | Respuesta de `challenge/today` y `nodes/*` no contiene `optimal_path` ni campos internos | Verificado por esquema |
| S-08 | `finish` con caminos inválidos (nodos no conectados, otro origen, saltos > 20, tiempo negativo) | Rechazado |
| S-09 | Cabeceras de seguridad presentes | CSP, XCTO, Referrer-Policy, frame-ancestors |
| S-10 | No existen rutas que listen tablas completas | Revisión de rutas |
| S-11 | `npm audit` | Sin vulnerabilidades altas/críticas |
| S-12 | Errores 500 no filtran stack traces | Verificado |

## Revisión manual
Antes del release, revisión con las skills de revisión de seguridad.
