# Requisitos no funcionales

## Rendimiento
- **RNF-01** Cargar el siguiente paso (tras seleccionar un nodo): p95 ≤ 300 ms medido en el servidor, objetivo de percepción < 500 ms en cliente.
- **RNF-02** Carga inicial de landing y juego: LCP ≤ 2,0 s en móvil con red 4G.
- **RNF-03** Soportar al menos 50 solicitudes por segundo sostenidas sin degradación fuera de los límites de latencia [ABIERTO: ajustar tras la primera medición].
- **RNF-04** Los datos del grafo son estáticos, por lo tanto cacheables (CDN/edge).

## Seguridad
- **RNF-10** La base de datos no es accesible directamente desde el navegador: RLS activado sin políticas para anon/authenticated; acceso solo desde el servidor.
- **RNF-11** Ninguna clave de servicio ni secreto llega al cliente.
- **RNF-12** Los endpoints devuelven solo el siguiente paso, nunca volcados completos del grafo.
- **RNF-13** El camino óptimo del desafío no se entrega al cliente hasta que el intento termina.
- **RNF-14** Rate limiting por IP en los endpoints de datos.
- **RNF-15** Validación estricta de entradas (IDs, parámetros) en servidor.
- **RNF-16** Cabeceras de seguridad (CSP, X-Content-Type-Options, etc.).
- **Riesgo aceptado:** quien observe el tráfico de red puede scrapear datos paso a paso; se mitiga con rate limiting y no se elimina.

## Usabilidad
- **RNF-20** Diseño responsive, móvil primero.
- **RNF-21** Accesibilidad básica: contraste, navegación por teclado, textos alternativos en imágenes.
- **RNF-22** Navegadores soportados: últimas 2 versiones de Chrome, Safari, Firefox y Edge.

## Mantenibilidad
- **RNF-30** TypeScript estricto.
- **RNF-31** Linter y formateador en CI.
- **RNF-32** Cobertura mínima de la lógica de dominio (grafo, saltos, tiempo, validación de caminos): ≥ 90 %.

## Costos
- **RNF-40** La v1 debe operar en planes gratuitos o de bajo costo de Vercel y Supabase. Los límites y la pausa por inactividad de Supabase se mitigan con cache y un job periódico [ABIERTO].
