# ADR-0004: Estado de usuario en el navegador, sin cuentas

- **Estado:** Aceptado
- **Fecha:** 2026-10-07

## Contexto
No hay usuarios ni roles; no hay ranking en la v1.

## Decisión
La partida en curso y el resumen del día se guardan en `localStorage`. El servidor es sin estado respecto al usuario.

## Consecuencias
- (+) Cero fricción, sin datos personales, sin autenticación.
- (−) Se puede rejugar borrando el almacenamiento y el estado no se comparte entre dispositivos.
- (−) Un futuro ranking o rachas exigirán revisar esta decisión (cuentas o identificador anónimo y validación en servidor).
