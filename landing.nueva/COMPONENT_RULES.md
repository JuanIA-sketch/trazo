# Contrato de diseño — Trazo (landing)

> Lee este archivo y `brand.json` antes de escribir cualquier componente. El CSS de tokens (`css/brand.css`) es **generado** por `node .criterio/scripts/tokens.mjs landing`: no se edita a mano.

## Postura visual (los 6 ejes)

| Eje | Valor | Por qué |
|---|---|---|
| density | 2 | Landing que convierte en frío: el aire deja respirar la promesa y el video del hero manda. |
| expression | 3 | Premium tipo Apple/Linear: decisiones notorias, sin ruido. |
| geometry | 3 | Esquinas suaves pero de software serio, no infantiles. |
| warmth | 2 | Marca azul-cián: el frío comunica precisión y privacidad. |
| editoriality | 3 | El hero vive de una frase grande y un wordmark que se escribe. |
| materiality | 2 | Profundidad sutil (translucidez, luz del trazo) al estilo Apple, sin glassmorphism gratuito. |

## Paleta (hex exactos)

- **Azul eléctrico `#2563EB`** — acción principal, foco, estado activo, CTA. No pintar más del 18% del área visible.
- **Azul prensado `#1D4ED8`** — hover/pressed del primary.
- **Cián señal `#22D3EE`** — luz de acento: el trazo del hero, enlaces, destellos. Es la luz, no el fondo.
- **Azul noche `#0B1220`** — fondo de página (tema oscuro).
- **Panel nocturno `#0F1A30`** — tarjetas y secciones elevadas.
- **Panel elevado `#16233F`** — modales y popovers.
- **Contorno tenue `#24314B`** — líneas de 1px.
- **Blanco niebla `#F8FAFC`** — texto principal (contraste ≈18:1 sobre el fondo).
- **Gris pizarra `#94A3B8`** — subtítulos y metadatos.
- **Gris tenue `#64748B`** — placeholders y notas al pie.

## Tipografía

- **Geist** para display (600/700) y cuerpo (400/500). Una sola superfamilia: display y body comparten familia con pesos distintos.
- **Geist Mono** para el texto "antes" del demo, comandos y etiquetas de código. Nunca para prosa ni títulos.
- Prohibido Inter en títulos (es el default estadístico).

## Forma y espacio

- Radios: `radius_sm` 8px, `radius_md` 12px, `radius_lg` 20px. Nada de "16px en todo". Borde de 1px.
- Base de espaciado 8px. Secciones con respiración generosa (`section_y` 64/112/160). El aire es parte del look premium.

## Botón

- Un solo `primary` visible por sección; el CTA de descarga es el primary. Altura mínima 48px, `radius_md`, label que empieza con verbo ("Descargar gratis"). El secundario es `ghost`: mismo tamaño, sin fondo, no compite.

## Tarjeta

- Prohibida la tarjeta dentro de tarjeta: un solo nivel de elevación por región. Fondo `surface` sobre `background`; `surface_elevated` solo en modal/popover. `radius_lg` en la tarjeta, `radius_md` en sus elementos. **Las 4 tarjetas de features no son idénticas**: cada una lidera con su propio dato (perfiles, diccionario, historial, idiomas), no con el mismo molde icono-título-dos-líneas.

## Navegación

- Máximo 5 destinos: Cómo funciona · Features · Privacidad · GitHub · [Descargar gratis]. El CTA de descarga es el único primary del navbar. La navbar no colapsa de forma brusca al hacer scroll. Cada item con label de texto; iconos solos, prohibidos.

## Movimiento

- Ver `motion.json`. Entrada ease-out, salida ease-in; feedback directo ≤200ms; solo se animan `transform`/`opacity`/color, nunca `transition: all` ni propiedades de layout. El hero es scroll-scrubbing (el video se controla por scroll interpolando `currentTime`, nunca asignándolo de golpe). Todo respeta `prefers-reduced-motion`: con `reduce`, el hero muestra el poster estático y no hay scrubbing.

## Anti-slop (lo prohibido, ver `brand.json`)

Nada de: hero centrado genérico con dos botones iguales, tres tarjetas idénticas, degradado de texto como recurso principal, degradado morado→rosa, glassmorphism como muleta, Inter en títulos, emojis como iconos, sombras difusas gigantes, buzzwords SaaS ("revoluciona", "sin esfuerzo", "todo en uno"), ondas de audio decorativas sin función, ni muros de logos inventados.

---

> **Línea de arranque:** Lee `brand.json` y `COMPONENT_RULES.md` antes de escribir cualquier componente.
