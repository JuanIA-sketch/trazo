# Prompt one-shot para Claude Design — Landing de Trazo

> Pega TODO lo que sigue (desde "PROMPT" hasta el final) en Claude Design. Está autocontenido: Claude Design no ve este repositorio, así que los valores van explícitos. El objetivo es que devuelva un `index.html` + `styles.css` que luego se integran aquí (scroll-scrubbing, SEO, deploy).

---

## PROMPT

Diseña una landing page premium de una sola página para **Trazo**, una app de dictado por voz con IA, gratis, en español y 100% local. Público: hispanohablantes que escriben todo el día y valoran la privacidad. La referencia de conversión es wisprflow.ai, pero el estilo visual es más oscuro y tech (Apple product reveal + Linear/Vercel). Entrega un solo `index.html` + `styles.css`, HTML semántico, `lang="es"`, responsive mobile-first, sin frameworks (solo HTML/CSS; el JavaScript de animación se agrega después).

### Identidad visual (obligatoria, hex exactos)

- Fondo de página: azul noche `#0B1220`. Superficie de tarjetas: `#0F1A30`. Superficie elevada: `#16233F`. Bordes 1px: `#24314B`.
- Primario (CTA, foco, acción): azul eléctrico `#2563EB`; hover: `#1D4ED8`.
- Acento (luz, destellos, enlaces): cián señal `#22D3EE`.
- Texto principal: blanco niebla `#F8FAFC`. Subtítulos: gris pizarra `#94A3B8`. Notas: `#64748B`.
- Tema OSCURO en toda la página. El azul y el cián son luz sobre lo oscuro.
- Tipografía: familia **Geist** (display 600/700 para titulares, 400/500 para cuerpo) y **Geist Mono** solo para el texto "antes" del demo y etiquetas de código. Nunca Inter en titulares.
- Radios: 8px (chico), 12px (medio, botones y tarjetas internas), 20px (grande, tarjetas). Nada de "16px en todo".
- Espaciado generoso: mucho espacio negativo, secciones con respiración (equivalente a 112–160px verticales en desktop). El aire es parte del look premium.
- Estética Apple/Linear: composiciones asimétricas elegantes, jerarquía tipográfica fuerte, profundidad sutil por translucidez y luz (no glassmorphism como muleta), microinteracciones sobrias.

### Prohibido (anti-slop, se audita)

Nada de: morados/índigo (`#6366F1`, `#8B5CF6`, degradados morado→rosa), hero centrado genérico con dos botones iguales, tres tarjetas idénticas con icono-título-dos-líneas, degradado de texto (`background-clip:text`) como recurso principal, Inter en titulares, emojis como iconos, sombras difusas gigantes (>40px), ondas de audio decorativas sin función, ni muros de logos inventados. Nada de `transition: all` ni de animar propiedades de layout (width/height/top/left/padding/margin): solo `transform` y `opacity`.

### Estructura (11 secciones, en este orden)

1. **Navbar** (sticky, no colapsa brusco): logo "Trazo" a la izquierda; enlaces "Cómo funciona", "Features", "Privacidad", "GitHub"; a la derecha un botón primary "Descargar gratis". Es el único primary del navbar.

2. **Hero** (pantalla completa): reserva un contenedor de video a pantalla completa con `id="hero-video"` — deja un `<video id="hero-video" muted playsinline preload="auto" poster="assets/hero/poster.jpg">` con dos `<source>` (`assets/hero/hero.webm` y `assets/hero/hero.mp4`) y, encima, en una capa de texto: H1 "Habla como piensas. Envía como si lo hubieras escrito.", subtítulo "Dictado por voz con IA, gratis y en español. Tu voz nunca sale de tu computador.", un botón primary "Descargar gratis" y un botón ghost "Ver cómo funciona", tres badges "Windows · macOS · Linux", y microcopy "Sin cuenta. Sin suscripción. Código abierto." La sección del hero debe poder ser alta/sticky (dale `id="hero-scroll"`). El texto puede solaparse elegantemente con el video.

3. **Demo antes/después**: dos paneles lado a lado (apilados en móvil). Izquierda, etiqueta "Lo que dijiste", en Geist Mono, texto desordenado: "oye eh… escríbele a la Cami que llego a las dos… no, mejor a las tres, y que lleve, o sea, los contratos". Derecha, etiqueta "Lo que Trazo escribió", texto limpio: "Cami, llego a las 15:00. Por favor, lleva los contratos." Pie: "Quita las muletillas, entiende el 'no, mejor…' y deja solo la versión final." Etiqueta de sección arriba: "Tú hablas natural. Trazo entrega lo que enviarías."

4. **Universalidad**: H2 "Funciona donde ya escribes." Subtítulo "WhatsApp, Gmail, Slack, Notion, VS Code, Cursor, ChatGPT. En cualquier campo de texto de tu computador." Debajo, una grilla de logos de apps monocromos en `#94A3B8` atenuados (deja marcadores `<img class="app-logo">` o slots; los SVG reales se insertan después).

5. **Métrica**: H2 "4× más rápido que teclear." Subtítulo "Tecleas unas 45 palabras por minuto. Hablas cerca de 200. La cuenta la haces tú." Visual: dos barras horizontales comparando 45 vs 220, la larga con degradado de luz `#2563EB`→`#22D3EE`.

6. **Features**: H2 "Una herramienta. Tu forma de trabajar." Subtítulo "Trazo se adapta a cómo escribes, no al revés." Cuatro tarjetas **no idénticas** (cada una lidera con su propio dato, distinto layout/acento): (1) "Perfiles en español" — Casual, commit o community, cada uno con su tono y glosario técnico. (2) "Diccionario personal" — Aprende tus nombres, marcas y siglas. (3) "Historial recuperable" — Vuelve a pegar lo de hace cinco minutos o lo de ayer. (4) "Más de 100 idiomas" — Detecta el idioma solo, cambia del español al inglés sin tocar nada.

7. **Privacidad** (sección estelar, con más peso visual): H2 "Tu voz nunca sale de tu computador." Cuerpo: "Trazo transcribe 100% local, en tu máquina. Sin cuenta, sin suscripción y con código abierto bajo licencia MIT. Otros cobran USD 12 al mes y suben tu voz a la nube. Trazo no." Tres pruebas como ítems (no como tres tarjetas iguales): "Procesamiento local: el audio se queda en tu equipo", "Sin registro: lo abres y funciona", "Código abierto: puedes leer qué hace." Reserva un slot de imagen `<img id="privacy-visual">`.

8. **Prueba social**: H2 "Lo que dice la comunidad." Tres citas cortas atribuidas a "beta tester, Imperio Agéntico" (son placeholders, mantenlos así): "Dejé de escribir a mano los mensajes largos. Hablo y ya está.", "Que sea local me cambió la decisión. Dicto cosas de trabajo sin dudarlo.", "Los perfiles en español entienden cómo hablo de verdad."

9. **CTA final**: H2 "Empieza a trazar." Subtítulo "Descárgalo, habla y mira cómo aparece tu texto. Sin cuenta." Tres botones de descarga con `class="download-btn"`: "Descargar para Windows", "Descargar para macOS", "Descargar para Linux". Microcopy: "Gratis y de código abierto. Para siempre."

10. **Manejo de objeciones**: H2 "Pregúntale a tu IA antes de decidir." Subtítulo "Que ChatGPT, Claude o Perplexity te digan si un dictado local y gratuito te conviene más que uno de pago en la nube." Tres botones con IDs `id="ask-chatgpt"`, `id="ask-claude"`, `id="ask-perplexity"`: "Preguntar a ChatGPT", "Preguntar a Claude", "Preguntar a Perplexity".

11. **Footer**: tres columnas — Producto (Descargar, Cómo funciona, Features, Privacidad); Proyecto (Repositorio en GitHub, Licencia MIT, Reportar un problema); Créditos ("Construido sobre Handy y ggml. Motor de voz a texto local."). Firma: "Una dupla de Imperio Agéntico: Benji + Juan." Legal: "Trazo es software libre bajo licencia MIT."

### IDs y clases obligatorios (para el cableado posterior)

- `#hero-scroll` (sección del hero, alta/sticky), `#hero-video` (el `<video>`).
- `.download-btn` en los botones de descarga (hero, CTA final, navbar).
- `#ask-chatgpt`, `#ask-claude`, `#ask-perplexity` en los botones de objeciones.
- `.app-logo` en los slots del muro de apps, `#privacy-visual` en la imagen de privacidad.
- Botón primary del navbar y del hero con `class="cta-primary"`.

### Salida esperada

Un `index.html` con las 11 secciones y un `styles.css` con la paleta anterior como variables CSS. No incluyas librerías de animación ni JavaScript; el scroll-scrubbing y las interacciones se agregan después. Prioriza jerarquía, aire y coherencia de marca sobre cantidad de efectos.
