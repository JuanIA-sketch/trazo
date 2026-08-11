# Landing de Trazo — Capa premium (addendum a la spec base)

**Fecha:** 2026-07-22 · Complementa `2026-07-22-landing-trazo-design.md`. Motivado por el feedback de Benji: el primer output de Claude Design quedó "muy plano, muy básico". La estructura (11 secciones) sirve; falta ejecución premium 2026. **Construye Claude Code** (frontend-design + apple-design + animation) sobre el copy deck, el contrato azul y los assets ya generados.

## Requisitos premium (wishlist de Benji)

1. **Header "liquid glass" tipo píldora** — navbar redondeada flotante estilo Apple / Instagram-WhatsApp-Telegram 2026: `backdrop-filter` blur + saturación, borde sutil, sombra suave, se condensa al hacer scroll. No una barra rectangular plana.
2. **Announcement bar** superior — franja de anuncio con degradado oscuro que se **oscurece en ambos extremos** (máscara/gradiente izquierda→centro→derecha), con sombra. Texto corto (ej. "Nuevo: dictado 100% local, gratis — v0.9").
3. **Grid de fondo** sutil — patrón de cuadrícula tenue (líneas a muy baja opacidad) detrás del contenido, con viñeta/fade en los bordes.
4. **Botones con shimmer y microinteracciones** — brillo que recorre el botón (shimmer), estados hover/press con `transform`/`opacity`, focus visible.
5. **Scroll-scrubbing 3D del hero** — el video ya generado (`hero.mp4`/`webm`) controlado por scroll con GSAP (interpolación de `currentTime`), sección sticky.
6. **Animaciones a 60 FPS** — reveals por sección al entrar en viewport, parallax sutil, todo con `transform`/`opacity` (nunca props de layout, respeta el gate de `.criterio`). `prefers-reduced-motion` desactiva scrubbing/animaciones intensas.
7. **Pulido fino** — tipografía (Geist), grosores, legibilidad, iconografía coherente (SVG, no emojis), jerarquía y espaciado premium.
8. **Sección de video pitch** — bloque "cómo usar Trazo" con un video demo embebido (revisar `TRAZO.mp4`/`TRAZO 2.mp4` en Descargas antes de generar uno nuevo). Se relaciona con el video demo de 2 min del hackathon.

## Referencias

- Estructura: Wispr Flow (referente maestro).
- Estética/interacción: Apple (liquid glass, springs), Linear/Vercel (grid, oscuro premium), componentes tipo **21st.dev**.
- Material adicional: el "blog de notas" de Benji (pendiente de compartir).

## Reglas que se mantienen

- Paleta azul del contrato (`#2563EB`/`#22D3EE`, fondo `#0B1220`/`#020617`), gate de `.criterio` en verde, sin `transition: all` ni animación de props de layout, español, SEO + JSON-LD, deploy Vercel. Ver spec base.

## Estado de assets (listos)

- Hero: `hero.mp4`/`hero.webm` (1080p GOP corto), `hero-4k.mp4`, `poster.jpg`, `master.png`, `hero-start.png`.
- Secciones: `app-context.png`, `privacy.png`, `speed.png`.

## Pendiente de Benji

- El "blog de notas" con referencias/material.
- Opcional: el HTML de Claude Design (link dio 403; si lo exporta, se puede incorporar como base o referencia). Por defecto, Claude Code construye fresco a premium.
