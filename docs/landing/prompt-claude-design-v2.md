# Prompt v2 (premium) para Claude Design — Landing de Trazo

> Pega TODO lo que está bajo "PROMPT" en Claude Design. **Adjunta la imagen de referencia** (el recuadro hundido con dot-grid de skalersinc que te gustó). Autocontenido: Claude Design no ve el repo. El video del hero y las imágenes de sección los inserta Claude Code después — deja slots reservados.

---

## PROMPT

Diseña una landing page **premium, oscura y con mucha profundidad** para **Trazo**, una app de dictado por voz con IA, gratis, en español y 100% local. Un solo `index.html` + `styles.css`, `lang="es"`, responsive mobile-first, sin frameworks.

**IMPORTANTE — nivel de ejecución:** el objetivo es que se sienta como Apple, Linear, Vercel y Wispr Flow — NO plana. Un intento anterior salió demasiado plana y básica; esta debe tener **profundidad, materiales, luz y movimiento**: glass con blur, sombras largas y suaves, glows de color, grano sutil, bordes de 1px con luz interior, y microanimaciones fluidas a 60fps. Cada superficie importante tiene relieve; nada es un rectángulo plano sobre fondo sólido.

### Identidad visual (hex exactos)

- Tema **oscuro** siempre. Fondos: `#020617` (más profundo) y `#0B1220` (página). Paneles: `#0F1A30` / elevado `#16233F`. Bordes: `#24314B`.
- **Primario** (acción, foco): azul eléctrico `#2563EB` (hover `#1D4ED8`). **Acento/luz**: cián señal `#22D3EE`.
- Texto: `#F8FAFC`; secundario `#94A3B8`; tenue `#64748B`.
- **Tipografía**: para los titulares grandes usa un **serif editorial de alto contraste** (tipo Fraunces / Instrument Serif / Playfair) — le da clase, como la imagen de referencia. Para cuerpo, UI y navegación, un **grotesque limpio** (Geist, General Sans o similar). Para el texto "antes" del demo, **monoespaciada**. Máximo dos familias visibles + la mono.
- **PROHIBIDO**: morados/índigo (`#6366F1`, `#8B5CF6`, degradados morado→rosa), Inter en titulares, emojis como iconos, y cualquier look genérico de "IA". El acento es azul-cián, nunca morado.

### Componentes firma (de aquí sale lo premium — imprescindibles)

1. **Header "liquid glass" tipo píldora flotante**: una barra redondeada (999px) centrada, separada de los bordes, con `backdrop-filter: blur(18px) saturate(1.6)`, borde de 1px con luz interior (`box-shadow inset`), y sombra suave. Contiene el logo "Trazo", los enlaces y un botón primario. Al hacer scroll se **condensa** suavemente (menos padding, fondo un poco más opaco). Estilo interfaces Apple / Instagram / WhatsApp 2026.
2. **Announcement bar** arriba de todo: franja delgada con texto centrado ("Nuevo — Trazo 0.9: dictado por voz 100% local, gratis"), con un **degradado oscuro que se desvanece en ambos extremos** (máscara `linear-gradient` izquierda→centro→derecha), un puntito de acento con glow y una flecha. Sombra inferior sutil.
3. **Recuadro hundido con dot-grid + video loop** (COMO LA IMAGEN ADJUNTA): un card grande con relieve *embossed/inset* (sombras interiores que lo hunden), **patrón de puntos** de fondo dentro del card, y un **slot central reservado para un video en loop** (déjalo como `<video class="loop">` con poster; Claude Code inserta el archivo). Úsalo como bloque destacado (p. ej. la sección "cómo se usa" o un showcase del producto). Botón dentro tipo **píldora plateada glossy/liquid**.
4. **Grid de fondo global**: patrón de cuadrícula tenue a muy baja opacidad detrás de todo, con **viñeta/fade radial** en los bordes para que no sea un tablero plano. Encima, dos **glows** radiales grandes y difusos (uno azul arriba, uno cián abajo) y un **grano** sutil en overlay.
5. **Botones con shimmer y relieve**: primario con degradado vertical, sombra de color y un **destello (shimmer)** que lo recorre; hover con `translateY(-2px)`. Secundarios ghost/outline con glass. Todos píldora.

### Movimiento (60fps, solo transform/opacity)

- **Page-load**: reveal escalonado del hero (eyebrow → título → subtítulo → botones), con `translateY` + fade y `animation-delay`.
- **Al hacer scroll**: cada sección entra con fade + subida corta; parallax sutil en imágenes/glows; el header se condensa. Un único elemento en movimiento por región.
- **Hero**: reserva una sección alta/sticky con un `<video id="hero-video">` a pantalla completa detrás del texto (Claude Code lo controlará por scroll — solo deja el contenedor sticky y el video con poster).
- Respeta `prefers-reduced-motion`: sin animaciones intensas, muestra posters estáticos.

### Estructura (11 secciones + video pitch) con copy exacto

1. **Navbar** (píldora glass): logo "Trazo" · Cómo funciona · Features · Privacidad · GitHub · botón primario "Descargar gratis".
2. **Hero** (sticky, video de fondo reservado): eyebrow "Dictado por voz con IA · 100% local". H1 (serif editorial grande): "Habla como piensas. Envía como si lo hubieras escrito." Subtítulo: "Dictado por voz con IA, gratis y en español. Tu voz nunca sale de tu computador." Botón primario "Descargar gratis" + ghost "Ver cómo funciona". Badges: Windows · macOS · Linux. Microcopy: "Sin cuenta. Sin suscripción. Código abierto."
3. **Demo antes/después**: dos paneles glass. Izquierda "Lo que dijiste" (mono, desordenado, con un tachado en "no, mejor a las tres"): "oye eh… escríbele a la Cami que llego a las dos… no, mejor a las tres, y que lleve, o sea, los contratos". Derecha "Lo que Trazo escribió": "Cami, llego a las 15:00. Por favor, lleva los contratos." Pie: "Quita las muletillas, entiende el 'no, mejor…' y deja solo la versión final."
4. **Universalidad**: H2 "Funciona donde ya escribes." Sub: "WhatsApp, Gmail, Slack, Notion, VS Code, Cursor, ChatGPT. En cualquier campo de texto de tu computador." Fila de chips/logos de apps monocromos atenuados.
5. **Métrica**: H2 "4× más rápido que teclear." Sub: "Tecleas unas 45 palabras por minuto. Hablas cerca de 200. La cuenta la haces tú." Visual: dos barras (45 tenue vs 200 con degradado azul→cián y glow).
6. **Features** (4 tarjetas glass **no idénticas**, tamaños/acentos distintos): "Perfiles en español" (Casual, commit o community, con glosario técnico) · "Diccionario personal" (aprende tus nombres, marcas y siglas) · "Historial recuperable" (vuelve a pegar lo de hace cinco minutos o lo de ayer) · "Más de 100 idiomas" (detecta el idioma solo). Iconos SVG de línea, nunca emojis.
7. **Privacidad** (sección estelar, más peso): eyebrow "Privacidad de verdad". H2 "Tu voz nunca sale de tu computador." Cuerpo: "Trazo transcribe 100% local, en tu máquina. Sin cuenta, sin suscripción y con código abierto bajo licencia MIT. Otros cobran USD 12 al mes y suben tu voz a la nube. Trazo no." Tres pruebas con check: "Procesamiento local: el audio se queda en tu equipo" · "Sin registro: lo abres y funciona" · "Código abierto: puedes leer qué hace." Slot de imagen reservado (`<img id="privacy-visual">`).
8. **Cómo se usa (video pitch)** — usa aquí el **recuadro hundido con dot-grid** del componente firma: H2 "Mira cómo se usa." Sub: "En un minuto: pulsas el atajo, hablas, y tu texto aparece donde estés escribiendo." Dentro del recuadro, el slot de video loop con botón play glossy.
9. **Prueba social**: H2 "Lo que dice la comunidad." Tres citas glass atribuidas a "beta tester · Imperio Agéntico": "Dejé de escribir a mano los mensajes largos. Hablo y ya está." · "Que sea local me cambió la decisión. Dicto cosas de trabajo sin dudarlo." · "Los perfiles en español entienden cómo hablo de verdad."
10. **CTA final**: card grande con glow. H2 (serif) "Empieza a trazar." Sub: "Descárgalo, habla y mira cómo aparece tu texto. Sin cuenta." Tres botones de descarga (Windows / macOS / Linux). Microcopy: "Gratis y de código abierto. Para siempre."
11. **Manejo de objeciones**: H2 "Pregúntale a tu IA antes de decidir." Sub: "Que ChatGPT, Claude o Perplexity te digan si un dictado local y gratuito te conviene más que uno de pago en la nube." Tres botones glass: "Preguntar a ChatGPT" · "Preguntar a Claude" · "Preguntar a Perplexity".
12. **Footer**: columnas Producto / Proyecto (Repositorio en GitHub, Licencia MIT, Reportar un problema) / Créditos ("Construido sobre Handy y ggml"). Firma: "Una dupla de Imperio Agéntico: Benji + Juan." Legal: "Trazo es software libre bajo licencia MIT."

### Slots reservados (Claude Code los rellena — NO los generes con contenido real)

- `<video id="hero-video">` a pantalla completa en el hero (con poster placeholder).
- El `<video class="loop">` dentro del recuadro dot-grid (sección "cómo se usa").
- `<img id="privacy-visual">` y los `<img class="app-logo">` del muro de apps.
- IDs estables en botones: `.download-btn` (descargas), `#ask-chatgpt` / `#ask-claude` / `#ask-perplexity`, `.cta-primary`.

### Qué evitar (esto hizo que la vez pasada saliera plana)

Rectángulos planos sobre fondo sólido sin relieve; secciones sin profundidad ni sombra; tres tarjetas idénticas; degradado de texto como recurso principal; morados/índigo; Inter en titulares; emojis como iconos; ausencia de movimiento. La landing debe respirar profundidad y luz en cada sección.

---

## Qué adjuntar en Claude Design

1. **La imagen de referencia** que te gustó (el recuadro hundido con dot-grid, serif editorial y botón plateado de skalersinc). Es la guía del componente firma nº3 y del "nivel" general.
2. (Opcional) `landing/assets/hero/poster.jpg` como referencia de color de marca, si Claude Design lo acepta.

## Después (lo hace Claude Code)

Cuando traigas el `index.html` + `styles.css`, yo inserto el **video real del hero** (ya generado) con **scroll-scrubbing** (la pincelada escribe "Trazo" al bajar), el video loop del recuadro, las imágenes de sección, el SEO + JSON-LD, y el deploy en Vercel.
