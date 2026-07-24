# Landing page de Trazo — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publicar una landing page en español que convierta en frío y sirva la descarga de Trazo, con un hero de scroll-scrubbing 3D, modelada sobre el esqueleto de wisprflow.ai.

**Architecture:** Pipeline en dos fases. **Fase A (Claude Code, sin dependencias externas):** contrato de diseño azul, copy, prompts de assets y prompt one-shot para Claude Design. **Handoff (Benji):** genera imágenes en Higgsfield/Nano Banana Pro, el video del hero (con aprobación previa) y el HTML/CSS visual en Claude Design. **Fase B (Claude Code):** integración del output visual, cableado del scroll-scrubbing (GSAP/Lenis), SEO, optimización, deploy en Vercel y QA con el gate de `.criterio`.

**Tech Stack:** HTML + CSS + JavaScript vanilla · GSAP + ScrollTrigger · Lenis · criterio (contrato de diseño, `.criterio/scripts/*.mjs`, Node ≥18) · Vercel (deploy estático) · GitHub Releases (descargas).

## Global Constraints

- Idioma: **solo español**, `lang="es"`. Copy en español; prompts de imagen/video en inglés.
- Paleta (verbatim): primario `#2563EB`, acento cián `#22D3EE`, fondos `#0B1220` / `#020617`, texto `#F8FAFC`, gris `#94A3B8`. El gate de criterio prohíbe hue 235–285°; `#2563EB` (hue ≈221°) pasa. NO usar el morado legacy `#7B2FBE`.
- Diseño visual **se genera en Claude Design**; Claude Code no diseña a mano — solo estructura, cableado, SEO, deploy y QA.
- Referente maestro: wisprflow.ai. La estructura es la de la spec (11 secciones), no un clon.
- Sin frameworks (no React/Vue). Rutas relativas, nombres de archivo en minúsculas.
- Descargas → GitHub Releases de `JuanIA-sketch/trazo`. Sin login, sin autenticación.
- Imágenes: Nano Banana Pro (ilimitado, sin pedir permiso). **Video: pedir aprobación explícita a Benji ANTES de generar.**
- Todo respeta `prefers-reduced-motion`. Contraste texto/fondo ≥ 4.5:1 (WCAG AA).
- Spec de referencia: `docs/superpowers/specs/2026-07-22-landing-trazo-design.md`.

---

## Estructura de archivos

```
landing/
  index.html            # la página (una sola)
  brand.json            # contrato criterio (generado por design-contract)
  voice.json            # contrato criterio
  motion.json           # contrato criterio
  COMPONENT_RULES.md    # contrato criterio (prosa)
  css/
    brand.css           # generado por tokens.mjs (NO editar a mano)
    styles.css          # estilos de la página (de Claude Design + ajustes)
  js/
    scrub.js            # scroll-scrubbing del hero (GSAP/Lenis)
    scrub.test.mjs      # test unitario de la interpolación
    interactions.js     # tabs, fade-ins, botones de objeciones
  assets/
    hero/               # imagen maestra, poster, video (mp4/webm)
    images/             # imágenes de sección (webp/avif + original)
  vercel.json           # headers de deploy (Accept-Ranges para el video)
docs/
  landing/
    copy-deck.md            # Fase A — copy de las 11 secciones
    prompts-imagenes.md     # Fase A — prompts Nano Banana Pro
    prompt-hero-video.md    # Fase A — prompt del video (gate de aprobación)
    prompt-claude-design.md # Fase A — prompt one-shot para Claude Design
```

---

## FASE A — Preparación (Claude Code, ejecutable ahora)

### Task 1: Contrato de diseño azul + scaffold de `landing/`

**Files:**
- Create: `landing/brand.json`, `landing/voice.json`, `landing/motion.json`, `landing/COMPONENT_RULES.md`, `landing/css/brand.css` (vía skill + script)
- Create: `landing/css/`, `landing/js/`, `landing/assets/hero/`, `landing/assets/images/` (directorios)

**Interfaces:**
- Produces: `landing/brand.json` con la paleta azul y `restricted_hue_range_hsl: [235, 285]` intacto (sin excepción `purple_as_primary`); `landing/css/brand.css` con tokens en 3 niveles que las tareas de Fase B consumen como variables CSS.

- [ ] **Step 1: Crear directorios**

```bash
mkdir -p landing/css landing/js landing/assets/hero landing/assets/images docs/landing
```

- [ ] **Step 2: Generar el contrato con la skill design-contract**

Invocar la skill `design-contract`. Responder su entrevista de 8 preguntas con las decisiones YA tomadas en la spec (no volver a preguntar a Benji lo ya decidido; si la skill exige un turno, usar estos valores):
- Marca/categoría: "Trazo — dictado por voz con IA".
- Preset/arquetipo: **tech_utility** (Sage/Creator: `hype ≤ 2`), referencia Linear/Vercel.
- Paleta: primario `#2563EB` ("Azul eléctrico"), `primary_deep` `#1D4ED8`, accent `#22D3EE` ("Cián señal"), background `#0B1220`, surface `#020617`, text `#F8FAFC`, text_muted `#94A3B8`. Verificar contraste ≥4.5:1.
- Voz: `directness` 4, `warmth` 3, `technicality` 3, `provocation` 2, `hype` 1; español neutro (LATAM), tuteo. `avoid_words`: "revoluciona", "mágico", "sin esfuerzo" (cliché), "potenciado por IA", etc. `safe_words`: "local", "gratis", "tu voz", "código abierto".
- Motion: `restraint` 4, props seguras `transform`/`opacity`.
- `forbidden_patterns`: ≥7 (hero centrado genérico, tres tarjetas iguales, índigo por defecto, Inter en todo, radio 16px uniforme, gradiente morado→rosa, ondas de audio decorativas sin función).

- [ ] **Step 3: Compilar tokens y validar el gate**

```bash
node .criterio/scripts/tokens.mjs landing
node .criterio/scripts/gate.mjs landing
```
Expected: `gate.mjs` imprime `PASS — 8/8 checks` y sale con 0. Si falla el check de hue, confirmar que el primario es `#2563EB` (no el morado). Si falla `min 7 forbidden_patterns`, agregar entradas.

- [ ] **Step 4: Commit**

```bash
git add landing/brand.json landing/voice.json landing/motion.json landing/COMPONENT_RULES.md landing/css/brand.css
git commit -m "feat(landing): contrato de diseño azul de Trazo (gate en verde)"
```

---

### Task 2: Copy deck de las 11 secciones

**Files:**
- Create: `docs/landing/copy-deck.md`

**Interfaces:**
- Consumes: `landing/voice.json` (tono, palabras prohibidas/seguras, estilo de CTA).
- Produces: el copy final ES de las 11 secciones que consumen la Task 5 (prompt Claude Design) y la Task 6 (integración).

- [ ] **Step 1: Escribir el copy de las 11 secciones**

En `docs/landing/copy-deck.md`, una sección por bloque con: headline (H2), subhead, cuerpo y CTA. Contenido exacto:
- **Hero (H1):** "Habla como piensas. Envía como si lo hubieras escrito." Sub: "Dictado por voz con IA — gratis, en español y 100% local. Tu voz nunca sale de tu computador." CTA: "Descargar gratis". Badges: Windows · macOS · Linux.
- **Demo antes/después:** izquierda (hablado): "oye eh… escríbele a la Cami que llego a las dos… no, mejor a las tres, y que lleve, o sea, los contratos". Derecha (final): "Cami, llego a las 15:00. Por favor, lleva los contratos." Etiqueta: "Tú hablas natural. Trazo entrega lo que enviarías."
- **Universalidad (H2):** "Funciona donde ya escribes." Sub: "WhatsApp, Gmail, Slack, Notion, VS Code, Cursor, ChatGPT… en cualquier campo de texto."
- **Métrica (H2):** "4× más rápido que teclear." Sub: "Tecleas ~45 palabras por minuto. Hablas ~200. Haz la cuenta."
- **Features (H2):** "Una herramienta. Tu forma de trabajar." 4 tarjetas: (1) "Perfiles en español" — casual, commit y community, con glosario técnico. (2) "Diccionario personal" — aprende tus nombres, marcas y siglas. (3) "Historial recuperable" — vuelve a pegar cualquier dictado. (4) "+100 idiomas" — detección automática.
- **Privacidad (H2):** "Tu voz nunca sale de tu computador." Sub: "100% local. Sin cuenta, sin suscripción, código abierto (MIT). Otros cobran USD 12 al mes y suben tu voz a la nube. Trazo no."
- **Prueba social (H2):** "Lo que dice la comunidad." (placeholders honestos: "beta testers de Imperio Agéntico"; NO inventar nombres reales).
- **CTA final (H2):** "Empieza a trazar." Botones por plataforma.
- **Objeciones (H2):** "¿Dudas? Pregúntale a tu IA." Sub: "Que ChatGPT, Claude o Perplexity te digan si un dictado local y gratuito te conviene." Botones: Preguntar a ChatGPT / Claude / Perplexity.
- **Navbar:** logo Trazo · Cómo funciona · Features · Privacidad · [Descargar gratis].
- **Footer:** repo en GitHub · Licencia MIT · "Construido sobre Handy (cjpais) y ggml" · "Una dupla de Imperio Agéntico: Benji + Juan".

- [ ] **Step 2: Verificar contra voice.json**

Revisar que ninguna palabra prohibida de `landing/voice.json` aparezca en el copy. Ajustar inline.

- [ ] **Step 3: Commit**

```bash
git add docs/landing/copy-deck.md
git commit -m "docs(landing): copy deck ES de las 11 secciones"
```

---

### Task 3: Prompts de imágenes (Nano Banana Pro)

**Files:**
- Create: `docs/landing/prompts-imagenes.md`

**Interfaces:**
- Consumes: `landing/brand.json` (paleta), copy deck (qué muestra cada sección).
- Produces: prompts en inglés para que Benji genere en Nano Banana Pro; los archivos resultantes van a `landing/assets/images/` y `landing/assets/hero/` (imagen maestra + poster).

- [ ] **Step 1: Escribir el brief de imágenes**

En `docs/landing/prompts-imagenes.md`, listar cada asset con su prompt en inglés, coherentes con la imagen maestra (misma paleta azul `#2563EB`/`#22D3EE`, fondo oscuro `#020617`, estética tech premium tipo Linear/Apple, cero "AI slop"). Assets mínimos:
1. **Imagen maestra del hero** (frame final): wordmark "Trazo" escrito por una pincelada de tinta azul-cián luminosa sobre fondo `#020617`, partículas de luz residuales, look 3D premium.
2. **Poster del hero** (fallback reduced-motion): frame estático de la imagen maestra.
3. Mockup de la app Trazo en contexto (dictando en un chat).
4. Muro de apps (o se hace con SVGs de logos reales — nota en el archivo).
5. Ilustración de privacidad (candado/escudo con estética de la marca, sin cliché).
6. Imagen de la métrica 4× (teclado vs onda de voz).
7–10. Imágenes de apoyo de features (una por tarjeta si Claude Design las pide).

Cada prompt: sujeto, materiales, iluminación, paleta hex, fondo, dirección artística, aspecto (16:9 hero, 1:1 o 4:3 secciones), "no text except the wordmark", "no watermarks".

- [ ] **Step 2: Commit**

```bash
git add docs/landing/prompts-imagenes.md
git commit -m "docs(landing): prompts de imágenes para Nano Banana Pro"
```

- [ ] **Step 3: HANDOFF a Benji (imágenes)**

Benji genera las imágenes en Nano Banana Pro (ilimitado) y las guarda en `landing/assets/`. Sin gate de aprobación (imágenes no cuestan créditos). Este paso no lo ejecuta Claude Code.

---

### Task 4: Prompt del video del hero (con gate de aprobación)

**Files:**
- Create: `docs/landing/prompt-hero-video.md`

**Interfaces:**
- Consumes: la imagen maestra de la Task 3 (frame final del video).
- Produces: el prompt del video de scroll-scrubbing; el video resultante va a `landing/assets/hero/hero.mp4` + `hero.webm`.

- [ ] **Step 1: Escribir el prompt del video**

En `docs/landing/prompt-hero-video.md`, prompt en inglés declarando **efecto, frame inicial y frame final** (regla de landing-builder-frame):
- **Efecto:** trazo/morphing (NO zoom, NO "se acerca y gira").
- **Frame inicial:** partículas de luz cián dispersas sobre fondo `#020617` (representan el murmullo de voz).
- **Progresión:** las partículas fluyen y se ordenan en una pincelada de tinta azul 3D que escribe el wordmark "Trazo".
- **Frame final:** el wordmark "Trazo" nítido (= imagen maestra).
- Requisitos: 16:9, ≥1080p nativo, cámara controlada, la secuencia debe funcionar hacia delante Y hacia atrás (es scroll-scrubbing), sin texto extra, sin marcas de agua, sin motion blur agresivo. Modelo sugerido: Seedance/Kling vía la cuenta de Benji.

- [ ] **Step 2: GATE DE APROBACIÓN — presentar a Benji**

Presentar el prompt a Benji y **esperar su aprobación explícita antes de que se genere el video** (los videos consumen créditos limitados; ver constraint global). NO continuar la generación sin el "sí".

- [ ] **Step 3: Commit**

```bash
git add docs/landing/prompt-hero-video.md
git commit -m "docs(landing): prompt del video del hero (pendiente de aprobación)"
```

- [ ] **Step 4: HANDOFF a Benji (video)**

Tras aprobación, Benji genera el video, hace upscale a 4K, y guarda `hero.mp4` (H.264, GOP corto para scrubbing) + `hero.webm` en `landing/assets/hero/`. Este paso no lo ejecuta Claude Code.

---

### Task 5: Prompt one-shot para Claude Design

**Files:**
- Create: `docs/landing/prompt-claude-design.md`

**Interfaces:**
- Consumes: `landing/brand.json`, `landing/COMPONENT_RULES.md`, `docs/landing/copy-deck.md`.
- Produces: el prompt que Benji pega en Claude Design para obtener el HTML/CSS visual de la landing.

- [ ] **Step 1: Escribir el prompt one-shot**

En `docs/landing/prompt-claude-design.md`, empaquetar todo lo que Claude Design necesita para producir la landing visual en una pasada:
- Las 11 secciones en orden con su copy (del copy deck).
- La paleta azul en hex y las reglas de `COMPONENT_RULES.md` (pegar los valores, no referenciar rutas — Claude Design no ve este repo).
- Criterio estético: estilo Apple/Linear premium, mucho espacio negativo, tipografía display con tracking negativo, materiales translúcidos con `backdrop-filter`, fade-ins sobrios (aplicar principios de la skill `apple-design`).
- **Espacios reservados** que Claude Code cableará después: un contenedor `#hero-video` a pantalla completa para el video de scroll-scrubbing (dejar el `<video>` con poster y sin autoplay), slots `<img>` con IDs para las imágenes de sección, y los botones de descarga/objeciones con IDs estables.
- Pedir output: un solo `index.html` + `styles.css` autocontenidos, `lang="es"`, sin frameworks, responsive mobile-first.

- [ ] **Step 2: Commit**

```bash
git add docs/landing/prompt-claude-design.md
git commit -m "docs(landing): prompt one-shot para Claude Design"
```

- [ ] **Step 3: HANDOFF a Benji (Claude Design)**

Benji ejecuta el prompt en Claude Design, itera el visual allá, y trae el `index.html` + `styles.css` resultantes. Este paso no lo ejecuta Claude Code.

---

## FASE B — Integración (Claude Code, tras el handoff)

> **Precondición de la Fase B:** existen `landing/assets/hero/hero.mp4`+`hero.webm`+`poster`, las imágenes en `landing/assets/images/`, y el HTML/CSS de Claude Design.

### Task 6: Integrar el output de Claude Design

**Files:**
- Create: `landing/index.html`, `landing/css/styles.css`
- Modify: `landing/index.html` (enlazar `css/brand.css` antes de `styles.css`)

**Interfaces:**
- Consumes: HTML/CSS de Claude Design, `landing/css/brand.css` (tokens), copy deck.
- Produces: `landing/index.html` con las 11 secciones, IDs estables (`#hero-video`, `.download-btn`, `#ask-chatgpt`/`#ask-claude`/`#ask-perplexity`, `.usecase-tab`), consumidos por las Tasks 7–10.

- [ ] **Step 1: Colocar los archivos y enlazar el contrato**

Guardar el HTML en `landing/index.html` y el CSS en `landing/css/styles.css`. En el `<head>`, enlazar `css/brand.css` ANTES de `css/styles.css` para que los tokens del contrato ganen como variables base. Verificar `lang="es"`.

- [ ] **Step 2: Verificar estructura y correr el gate de diseño**

Confirmar que están las 11 secciones y los IDs reservados. Correr:
```bash
node .criterio/scripts/gate.mjs landing
```
Expected: PASS 8/8. Si el CSS de Claude Design introdujo un color fuera de la paleta o índigo, ajustarlo en `styles.css` (usar variables de `brand.css`), no relajar el gate.

- [ ] **Step 3: Servir y revisar en el navegador**

```bash
python -m http.server 8080 --directory landing
```
Abrir `http://localhost:8080`, confirmar que renderiza sin errores de consola y que las secciones están completas. (Verificación visual con el navegador integrado.)

- [ ] **Step 4: Commit**

```bash
git add landing/index.html landing/css/styles.css
git commit -m "feat(landing): integrar estructura visual de Claude Design"
```

---

### Task 7: Cablear el scroll-scrubbing del hero

**Files:**
- Create: `landing/js/scrub.js`, `landing/js/scrub.test.mjs`
- Modify: `landing/index.html` (cargar GSAP, ScrollTrigger, Lenis y `scrub.js`)

**Interfaces:**
- Consumes: `#hero-video` y su sección sticky de la Task 6.
- Produces: comportamiento de scrubbing; función pura `lerp(current, target, factor)` testeada.

- [ ] **Step 1: Escribir el test de la interpolación (falla primero)**

`landing/js/scrub.test.mjs`:
```js
import assert from 'node:assert';
import { lerp } from './scrub.js';

// Interpola hacia el objetivo sin sobrepasar
assert.equal(lerp(0, 10, 0.1), 1);
assert.equal(lerp(10, 10, 0.1), 10);           // ya en el objetivo → sin cambio
assert.ok(Math.abs(lerp(0, 1, 0.25) - 0.25) < 1e-9);
console.log('scrub lerp: OK');
```

- [ ] **Step 2: Correr el test y verlo fallar**

```bash
node landing/js/scrub.test.mjs
```
Expected: FAIL — `Cannot find module` o `lerp is not a function` (aún no existe).

- [ ] **Step 3: Escribir `scrub.js`**

```js
// Interpolación pura (testeable sin DOM).
export function lerp(current, target, factor) {
  return current + (target - current) * factor;
}

// El cableado del DOM solo corre en el navegador.
if (typeof window !== 'undefined') {
  const video = document.querySelector('#hero-video');
  const section = document.querySelector('#hero-scroll');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (video && section && !reduce) {
    video.pause();
    video.removeAttribute('autoplay');
    let targetTime = 0;

    const lenis = new Lenis({ smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);

    const setup = () => {
      const dur = video.duration || 0;
      ScrollTrigger.create({
        trigger: section, start: 'top top', end: 'bottom bottom', scrub: true,
        onUpdate: (self) => { targetTime = self.progress * dur; },
      });
    };
    if (video.readyState >= 1) setup(); else video.addEventListener('loadedmetadata', setup);

    // Nunca asignar currentTime de golpe: interpolar hacia el objetivo.
    function tick() {
      if (video.duration) video.currentTime = lerp(video.currentTime, targetTime, 0.2);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
}
```

- [ ] **Step 4: Correr el test y verlo pasar**

```bash
node landing/js/scrub.test.mjs
```
Expected: `scrub lerp: OK`.

- [ ] **Step 5: Cargar librerías y el script en el HTML**

En `landing/index.html`, antes de `</body>`, añadir GSAP + ScrollTrigger + Lenis (vía `<script type="module">` con import desde CDN, y respaldo local si el CDN falla, según Fase 3 de la skill), luego `<script type="module" src="js/scrub.js"></script>`. Marcar la sección del hero con `id="hero-scroll"` (sticky, alta) y el `<video id="hero-video" muted playsinline preload="auto" poster="assets/hero/poster.webp">` con fuentes `hero.webm` y `hero.mp4`.

- [ ] **Step 6: Verificar el scrubbing en el navegador**

Servir con `python -m http.server 8080 --directory landing`. Comprobar: al bajar el video avanza, al subir retrocede, al parar se detiene, sin saltos. Sin errores de consola.

- [ ] **Step 7: Commit**

```bash
git add landing/js/scrub.js landing/js/scrub.test.mjs landing/index.html
git commit -m "feat(landing): scroll-scrubbing del hero con GSAP/Lenis"
```

---

### Task 8: SEO — meta, Open Graph y JSON-LD

**Files:**
- Modify: `landing/index.html` (`<head>`)

**Interfaces:**
- Consumes: la estructura de la Task 6.
- Produces: `<head>` con SEO completo y JSON-LD válido.

- [ ] **Step 1: Añadir el bloque SEO al `<head>`**

```html
<title>Trazo | Dictado por voz con IA, gratis y 100% local</title>
<meta name="description" content="Trazo convierte tu voz en texto claro y listo para enviar, en cualquier aplicación. Dictado por voz con IA, en español, gratis, de código abierto y sin nube: tu voz nunca sale de tu computador.">
<link rel="canonical" href="https://REEMPLAZAR-DOMINIO/">
<meta property="og:title" content="Trazo | Dictado por voz con IA, gratis y 100% local">
<meta property="og:description" content="Dictado por voz con IA, en español, gratis y 100% local. Tu voz nunca sale de tu computador.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://REEMPLAZAR-DOMINIO/">
<meta property="og:site_name" content="Trazo">
<meta property="og:image" content="https://REEMPLAZAR-DOMINIO/assets/hero/poster.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Trazo | Dictado por voz con IA, gratis y 100% local">
<meta name="twitter:description" content="Dictado por voz con IA, en español, gratis y 100% local.">
<meta name="twitter:image" content="https://REEMPLAZAR-DOMINIO/assets/hero/poster.jpg">
```
Nota: `REEMPLAZAR-DOMINIO` se fija en la Task 10 cuando se conoce el dominio de Vercel.

- [ ] **Step 2: Añadir el JSON-LD**

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Trazo",
  "applicationCategory": "UtilitiesApplication",
  "operatingSystem": "Windows, macOS, Linux",
  "description": "Dictado por voz con IA, en español, gratis, de código abierto y 100% local.",
  "license": "https://opensource.org/licenses/MIT",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "author": {
    "@type": "Organization",
    "name": "Trazo",
    "url": "https://github.com/JuanIA-sketch/trazo"
  }
}
</script>
```

- [ ] **Step 3: Validar el JSON-LD**

Verificar que el bloque es JSON válido:
```bash
node -e "const fs=require('fs');const h=fs.readFileSync('landing/index.html','utf8');const m=h.match(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/);JSON.parse(m[1]);console.log('JSON-LD OK')"
```
Expected: `JSON-LD OK`.

- [ ] **Step 4: Commit**

```bash
git add landing/index.html
git commit -m "feat(landing): SEO (meta, OG, JSON-LD SoftwareApplication)"
```

---

### Task 9: Optimización, reduced-motion y móvil

**Files:**
- Modify: `landing/index.html`, `landing/css/styles.css`, `landing/js/interactions.js` (crear si Claude Design no lo entregó)

**Interfaces:**
- Consumes: assets en `landing/assets/`, estructura de la Task 6.
- Produces: página optimizada; interacciones de tabs/objeciones cableadas.

- [ ] **Step 1: Imágenes optimizadas y lazy**

Convertir imágenes de sección a WebP/AVIF (conservar originales), añadir `loading="lazy"` y `width`/`height` para evitar layout shift. Verificar que ninguna imagen supere el ancho del viewport (`max-width:100%`).

- [ ] **Step 2: Fallback de reduced-motion**

Confirmar que con `prefers-reduced-motion: reduce` el `<video>` no hace scrubbing y se muestra el `poster` (ya cubierto por el guard de `scrub.js`); añadir en `styles.css` la regla que desactiva fade-ins/parallax bajo esa media query.

- [ ] **Step 3: Cablear objeciones y tabs**

`landing/js/interactions.js`: los botones `#ask-chatgpt`/`#ask-claude`/`#ask-perplexity` abren cada IA con un prompt pre-cargado por querystring (ej. `https://chatgpt.com/?q=...` con "¿Me conviene un dictado por voz local y gratuito frente a uno de pago en la nube?"). Cablear los tabs de casos de uso si Claude Design los dejó como estructura estática.

- [ ] **Step 4: Verificar en móvil**

Con el navegador integrado en viewport móvil (375px): sin scroll horizontal, el video del hero carga (versión ligera/poster), los CTA son tocables. Sin errores de consola.

- [ ] **Step 5: Commit**

```bash
git add landing/index.html landing/css/styles.css landing/js/interactions.js landing/assets
git commit -m "feat(landing): optimización de imágenes, reduced-motion e interacciones"
```

---

### Task 10: Deploy en Vercel + botones de descarga

**Files:**
- Create: `landing/vercel.json`
- Modify: `landing/index.html` (URLs de descarga y dominio en el SEO)

**Interfaces:**
- Consumes: la página completa de las Tasks 6–9.
- Produces: config de deploy y CTAs de descarga funcionales.

- [ ] **Step 1: Escribir `vercel.json`**

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Accept-Ranges", "value": "bytes" }]
    }
  ]
}
```
(`Accept-Ranges: bytes` es imprescindible para el scrubbing del video.)

- [ ] **Step 2: Apuntar los botones de descarga a GitHub Releases**

Los `.download-btn` apuntan a `https://github.com/JuanIA-sketch/trazo/releases/latest`. Cuando existan releases, cada plataforma puede apuntar al asset directo (patrón de bundles Tauri: `Trazo_0.9.0_x64-setup.exe`, `Trazo_0.9.0_x64.dmg`, `Trazo_0.9.0_amd64.AppImage`). Mientras no haya release, todos apuntan a `/releases/latest`.

- [ ] **Step 3: Deploy en Vercel**

```bash
cd landing && npx vercel deploy --prod --yes
```
(Requiere que Benji tenga cuenta Vercel conectada; si no, Claude Code entrega la carpeta lista y Benji hace el deploy desde el dashboard.) Al obtener el dominio, reemplazar `REEMPLAZAR-DOMINIO` en el `<head>` (Task 8) y en `og:url`/`canonical`.

- [ ] **Step 4: Commit**

```bash
git add landing/vercel.json landing/index.html
git commit -m "feat(landing): config de deploy en Vercel y descargas a GitHub Releases"
```

---

### Task 11: QA final

**Files:**
- (sin cambios de código; correcciones inline si algo falla)

- [ ] **Step 1: Gate de diseño**

```bash
node .criterio/scripts/gate.mjs landing
```
Expected: PASS 8/8.

- [ ] **Step 2: Checklist de la skill landing-builder-frame (Fase 4)**

Verificar en el navegador (desktop y móvil): scrubbing fluido adelante/atrás sin saltos ni deformaciones; el hero contiene el único video; el resto son imágenes coherentes; cero assets externos no generados; interacciones OK (objeciones abren la IA correcta); `prefers-reduced-motion` funciona; sin errores de consola ni de red; sin desbordamientos horizontales.

- [ ] **Step 3: Verificar SEO**

Confirmar un solo `<h1>`, jerarquía de `<h2>` por sección, y que el JSON-LD valida en el validador de schema.org (pegar el bloque). Confirmar que `og:image`/`canonical`/`og:url` ya no dicen `REEMPLAZAR-DOMINIO`.

- [ ] **Step 4: Commit final**

```bash
git add -A landing docs/landing
git commit -m "chore(landing): QA final — gate en verde, checklist completa"
```

---

## Self-review (cobertura de la spec)

- Rebrand azul → Task 1 (contrato) + constraint global; la app se rebrandeará en un plan aparte (fuera de este, que es solo landing).
- 11 secciones → Task 2 (copy) + Task 5 (prompt) + Task 6 (integración).
- Hero scroll-scrubbing → Task 4 (video) + Task 7 (cableado).
- SEO + JSON-LD SoftwareApplication → Task 8.
- Pipeline Claude Code / Higgsfield / Claude Design → Tasks 1–5 (A), handoffs, Tasks 6–11 (B).
- Deploy Vercel + descargas → Task 10.
- QA con design-audit → Task 11.
- Regla de aprobación de video → Task 4 Step 2 (gate explícito).
- prefers-reduced-motion, contraste, sin frameworks, español → constraints globales + Tasks 7/9.

**Nota de alcance:** el rebrand azul de la *app* (theme.css, iconos, logos a azul) NO está en este plan — este plan es solo la landing. Si se quiere, se hace en un plan corto aparte reusando el contrato de la Task 1.
