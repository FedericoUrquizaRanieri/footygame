# ADR-0002: Acceso a la base de datos solo desde el servidor

- **Estado:** Propuesto
- **Fecha:** 2026-10-07

## Contexto
Requisito: "los datos solo se acceden a través de la UI, sin APIs abiertas". Supabase expone por defecto una API REST con la clave anónima pública.

## Decisión
- RLS activado en todas las tablas sin políticas para `anon`/`authenticated`.
- El navegador no usa el cliente de Supabase para datos.
- El acceso se hace desde Route Handlers de Next.js con una conexión de servidor (rol de mínimo privilegio vía cadena de conexión del pooler, o `service_role` solo en entorno de servidor).
- Rate limiting y respuestas mínimas.

## Consecuencias
- (+) No hay lectura directa desde el navegador a la base.
- (−) No elimina el scraping lento vía nuestras rutas (riesgo aceptado, ver [security](../02-architecture/security.md)).
- (−) Más código de servidor que usar Supabase desde el cliente.
