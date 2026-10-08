# Visión

## Qué es
Un juego de navegador con un **desafío diario**: se muestran dos futbolistas (origen y destino) y la persona debe llegar del primero al segundo navegando una cadena de **jugador → club-temporada → jugador → …**, donde cada conexión significa que ambos jugaron juntos en ese club esa temporada.

Ejemplo: Messi → PSG 2021/22 → Di María → Rosario Central 2025/26 → Copetti.

## Referencia
[filmlink.io/daily](https://www.filmlink.io/daily) (el mismo concepto con películas). Se toma como base de mecánica y de estructura de pantallas.

## Problema que resuelve / por qué existe
Entretenimiento casual diario para fans del fútbol, con el gancho de "un desafío por día" y resumen personal de desempeño. Proyecto personal/académico (UNS); el crecimiento depende de que sea divertido.

## Público
Cualquier persona, sin cuenta, sin roles. Uso principal esperado: **celular**, aunque es solo web.

## Principios de producto
1. Cero fricción: se entra y se juega, sin registro.
2. Rápido: cada paso carga al instante.
3. Temático y visual: estética futbolera moderna.
4. Justo: el tiempo corre siempre, no se puede pausar ni hacer trampa fácilmente.
5. Los datos solo se ven a través de la UI.

## Criterio de éxito (v1)
- Un usuario puede completar el desafío diario de punta a punta en móvil y escritorio.
- Los desafíos diarios son siempre resolubles y de dificultad razonable.
- Cada paso responde en menos de 300 ms (p95).
- No hay acceso directo a la base de datos desde el navegador.
