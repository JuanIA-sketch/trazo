# FUTURO (landing) — Componente FloatingIconsHero (shadcn/React + framer-motion)

> Anotado a pedido de Benji (2026-07-22). **Para la LANDING, a futuro** — no ahora. Un hero con iconos flotantes que se repelen del cursor (física de resorte). Requiere stack shadcn + Tailwind + TypeScript + `framer-motion`, `@radix-ui/react-slot`, `class-variance-authority`. Nuestra landing actual es HTML/CSS vanilla (de Claude Design); integrar esto implicaría migrar esa sección a React o portar la lógica a JS vanilla.

## Idea
Hero a pantalla completa con 16 iconos de apps flotando (animación continua) que se **repelen del cursor** cuando se acerca (<150px), con spring physics. Encaja con nuestra sección de universalidad/apps. Se puede portar a vanilla JS (mousemove + transform) sin framer-motion si no queremos React.

## Código de referencia (tal cual lo pasó Benji)

`components/ui/floating-icons-hero-section.tsx` — componente principal: `FloatingIconsHero` + subcomponente `Icon` con `useMotionValue`/`useSpring`; repulsión por distancia/ángulo; animación flotante continua (y/x/rotate en loop). Props: `title, subtitle, ctaText, ctaHref, icons[]` (cada icono: `{id, icon: React.FC<SVG>, className}` para posicionar con Tailwind `top-[..] left-[..]`).

`demo.tsx` — 16 SVG de marcas (Google, Apple, Microsoft, Figma, GitHub, Slack, Notion, Vercel, Stripe, Discord, X, Spotify, Dropbox, Twitch, Linear, YouTube) posicionados; `FloatingIconsHeroDemo`.

Dependencias: `framer-motion`, `@radix-ui/react-slot`, `class-variance-authority`. Botón `originui/button` (cva variants). Iconos con `lucide-react` si faltan.

**Nota de porteo a nuestra landing vanilla:** la repulsión al cursor se replica con un `mousemove` listener que calcula distancia a cada icono y aplica `transform: translate()` con una transición spring-like (CSS `cubic-bezier`) — sin necesidad de framer-motion. Se puede sumar al carrusel/universalidad como variante "wow". El código React completo original está en el historial del chat (2026-07-22) por si se migra a React.
