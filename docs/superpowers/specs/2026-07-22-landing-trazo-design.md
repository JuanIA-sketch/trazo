# Spec: Landing page de Trazo

**Fecha:** 2026-07-22 · **Estado:** aprobada por Benji · **Deadline duro:** entrega hackathon 2026-07-31 20:00 (Chile); primer avance en Skool 2026-07-25.

## 1. Objetivo

Landing page en español que convierta en frío y sirva la descarga de Trazo (Win/Mac/Linux), evaluada por el jurado del Hackathon Imperial junto con branding, UX y video demo. Modelada sobre el esqueleto de conversión de wisprflow.ai (auditado 2026-07-22), atacando sus dos huecos: privacidad enterrada y suscripción de pago.

## 2. Decisiones cerradas

| Decisión | Valor |
|---|---|
| Idioma | Solo español (`lang=es`) |
| Hosting | Vercel (primera opción: previews por rama y headers correctos para video); GitHub Pages como fallback. Descargas → GitHub Releases de `JuanIA-sketch/trazo` |
| Modo (skill landing-builder-frame) | `hero-solido` + `scroll-scrubbing` |
| Concepto hero | "La pincelada que escribe" (azul) |
| Paleta (rebrand azul) | Primario `#2563EB`, acento cián `#22D3EE`, fondos `#0B1220` / `#020617`, texto `#F8FAFC`, gris `#94A3B8` |
| Diseño visual | **Todo en Claude Design** (regla de Benji); Claude Code solo estructura, cableado, SEO y deploy |
| Referente maestro | Wispr Flow; complementos: IG code.xr, uiuxmanuel, suraj.dsgn (pendientes de revisión con sesión de Benji) |

## 3. Rebrand azul (alcance app + landing)

- La paleta reemplaza al morado `#7B2FBE`/naranja en: `src/styles/theme.css` (variables light/dark), iconos de app (regenerar master "T" sobre `#2563EB` + `tauri icon`), `TrazoTextLogo.tsx`/`TrazoMark.tsx` (heredan vía CSS vars — verificar contraste dark), y todo asset de la landing.
- Validación objetiva: el gate de `.criterio` prohíbe hue 235–285°; `#2563EB` (hue ~221°) pasa. Correr `design-audit` sobre la landing antes de cada entrega.

## 4. Estructura de la landing (11 secciones)

1. **Navbar** — logo Trazo, anclas (Cómo funciona · Features · Privacidad · Descargar), CTA persistente "Descargar gratis".
2. **Hero (scroll-scrubbing)** — video controlado por scroll ocupando toda la pantalla. H1: "Habla como piensas. Envía como si lo hubieras escrito." Sub: "Dictado por voz con IA — gratis, en español y 100% local. Tu voz nunca sale de tu computador." CTA "Descargar gratis" + badges Win/Mac/Linux.
3. **Demo antes/después** — panel izquierdo: habla imperfecta con muletillas y "no, mejor…"; panel derecho: texto final limpio. Recurso gráfico principal (informe p.6).
4. **Universalidad** — "Funciona donde escribes": muro de logos (WhatsApp, Gmail, Slack, Discord, VS Code, Cursor, ChatGPT, Notion…).
5. **Métrica gancho** — "4× más rápido que teclear" con comparación visual teclear ~45 ppm vs hablar ~200 ppm.
6. **Features con nombre propio** (4 tarjetas) — Perfiles en español (casual/commit/community) · Diccionario personal · Historial recuperable · +100 idiomas con detección automática.
7. **⭐ Privacidad** (diferenciador vs Wispr) — "Tu voz nunca sale de tu computador": 100% local, sin cuenta, sin suscripción, código abierto MIT. Contraste explícito: "Otros cobran $12/mes y suben tu voz a la nube."
8. **Prueba social** — testimonios de la comunidad (placeholders honestos hasta tener feedback real de Skool; no inventar personas).
9. **CTA final** — "Empieza a trazar": botones de descarga por plataforma → GitHub Releases.
10. **Manejo de objeciones** — "¿Dudas? Pregúntale a tu IA": botones que abren ChatGPT/Claude/Perplexity con un prompt sobre dictado local vs. nube (patrón tomado de Wispr; favorece a un producto local y gratuito).
11. **Footer** — repo GitHub, licencia MIT, créditos a Handy (cjpais) y ggml, la dupla Benji + Juan.

Cuerpo sólido: imágenes estáticas, fade-in sobrio al entrar en viewport, jerarquía de lectura fuerte. Sin video fuera del hero.

## 5. Hero scroll-scrubbing

- **Concepto:** efecto trazo/morphing. Frame inicial: partículas de luz cián dispersas sobre fondo `#020617` (murmullo de voz). Progresión: las partículas fluyen en una pincelada de tinta azul 3D que escribe el wordmark "Trazo". Frame final: wordmark nítido (= imagen maestra). Debe funcionar hacia delante y hacia atrás.
- **Técnica:** video 16:9 ≥1080p generado desde imagen maestra (Higgsfield/plataforma del día), upscale a 4K, MP4 H.264 + WebM, GOP corto para scrubbing. `video.currentTime` interpolado vía GSAP ScrollTrigger + `requestAnimationFrame` (nunca asignación directa), sección sticky, poster inicial, precarga, versión móvil ligera.
- **Accesibilidad:** con `prefers-reduced-motion`, sustituir por imagen estática premium y desactivar scrubbing.

## 6. SEO

- `<title>`: "Trazo | Dictado por voz con IA, gratis y 100% local" (patrón Marca | Categoría-beneficio de Wispr).
- Meta description: "Trazo convierte tu voz en texto claro y listo para enviar, en cualquier aplicación. Dictado por voz con IA, en español, gratis, de código abierto y sin nube: tu voz nunca sale de tu computador."
- H1 único (el del hero); un H2 por sección; categoría "dictado por voz" repetida con naturalidad.
- OG/Twitter: `og:title`, `og:description`, `og:image` (frame final del hero), `og:url`, `og:site_name`, `twitter:card=summary_large_image` (superset de lo que hace Wispr).
- JSON-LD: `SoftwareApplication` (name Trazo, operatingSystem "Windows, macOS, Linux", offers price 0 CLP/USD, license MIT, applicationCategory "UtilitiesApplication") + `Organization` (la dupla). Wispr solo usa Organization — ventaja técnica.
- Canonical y sitemap.xml según dominio final (se define al deploy; placeholder relativo mientras).

## 7. Pipeline de construcción (división de herramientas)

1. **Claude Code (aquí):** `design-contract` genera el contrato de diseño azul (brand.json/voice.json/motion.json/brand.css) en `landing/`; se escribe el copy completo; se generan los prompts de assets.
2. **Higgsfield (Benji, día gratis / cuenta 2):** imagen maestra + video hero + ~8-10 imágenes de sección según prompts entregados. Assets a `landing/assets/`.
3. **Claude Design (Benji):** prompt one-shot (estructura de 11 secciones + copy + paleta + contrato + criterio apple-design + espacios reservados para video/imágenes) → HTML/CSS visual.
4. **Claude Code (aquí):** integración del output — scrubbing GSAP/Lenis, video, SEO/meta/JSON-LD, optimización (WebP/AVIF, lazy, móvil), deploy.
5. **QA:** gate de `.criterio` (`design-audit`) + checklist Fase 4 de landing-builder-frame + prueba real de scrubbing en desktop y móvil.

## 8. Stack y entrega

- HTML + CSS + JS vanilla; GSAP + ScrollTrigger; Lenis si mejora la suavidad. Sin frameworks. Carpeta `landing/` del repo Trazo.
- Deploy: Vercel (estático; sin `.htaccess`; verificar `Accept-Ranges` para el scrubbing). Botones de descarga apuntan a GitHub Releases (URLs estables `/releases/latest/download/...`).
- Rutas relativas y nombres en minúsculas; corre en localhost con `python -m http.server` o similar.

## 9. Criterios de aceptación

- Scrubbing fluido adelante/atrás sin saltos, desktop y móvil; sin errores de consola ni de red.
- `design-audit` (gate) en verde; contraste WCAG 4.5:1; `prefers-reduced-motion` funcional.
- SEO verificable: title/meta/OG/JSON-LD presentes y válidos (validador de schema.org); un solo H1.
- Página completa < 3 s de carga percibida en conexión media (video con poster + precarga progresiva).
- Todos los CTA de descarga funcionan (apuntan a releases reales o al repo si aún no hay release).
- Sin desbordamientos horizontales; navegación por teclado y focus visible.

## 10. Fuera de alcance

- Video demo de 2 min del hackathon (deliverable aparte).
- Página de pricing (no aplica), blog, use-cases hub, multi-idioma.
- Wake word, features nuevas del app (specs aparte si se abordan).

## 11. Riesgos

- **Créditos de generación:** mitigado planificando prompts antes de generar (día gratis de Higgsfield; frame inicial/final declarados evitan regeneraciones).
- **Calidad del scrubbing en móvil:** mitigado con versión de video ligera + fallback a imagen.
- **Dependencia del output de Claude Design:** el contrato de diseño + prompt one-shot minimizan iteraciones; la integración se hace aquí con control total.
- **Testimonios:** no inventar; usar feedback real de Skool tras el avance del 25-07 o marcar como "beta testers de la comunidad".
