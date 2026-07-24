# Prompts de imágenes — Landing de Trazo (Nano Banana Pro)

> Todos los prompts en **inglés** (los modelos responden mejor). Modelo: **Nano Banana Pro** (ilimitado en la cuenta de Benji). Guardar los archivos en las rutas indicadas dentro de `landing/assets/`.

## Reglas de coherencia (leer antes de generar)

1. **Genera primero la imagen maestra (Asset 1).** Todo lo demás usa la maestra como imagen de referencia para mantener la misma paleta, luz y material. Si un asset rompe la coherencia, regenéralo con la maestra adjunta.
2. **Paleta obligatoria (hex):** electric blue `#2563EB`, signal cyan `#22D3EE`, deep space background `#020617`, night blue `#0B1220`. Texto/luz en `#F8FAFC`. **Nunca** morados/índigo (`#6366F1`, `#8B5CF6`, purple→pink gradients): es el "AI slop" que el jurado penaliza.
3. **Estética:** tech premium, oscuro, tipo Apple product reveal + Linear/Vercel. Mucho espacio negativo, luz volumétrica sutil, materiales limpios. Cero cliché: no ondas de audio decorativas, no cerebros de circuitos, no robots, no manos tocando pantallas holográficas.
4. **Sin texto** salvo el wordmark "Trazo" donde se indique. **Sin marcas de agua.** Sin logos de terceros inventados.
5. **Formatos:** hero 16:9; secciones 4:3 o 1:1 según se indique. Pide la máxima resolución disponible.

---

## Asset 1 — Imagen maestra del hero (frame final)
**Ruta:** `landing/assets/hero/master.png` · **Aspecto:** 16:9

```
A cinematic 3D hero image on a deep near-black background (#020617). A single
luminous brushstroke of liquid ink, glowing in electric blue (#2563EB) fading
into signal cyan (#22D3EE), sweeps across the frame and forms the wordmark
"Trazo" in a clean, confident sans-serif — as if the word was just written by
light. Residual glowing particles trail behind the stroke, drifting like the
last of a spoken sentence settling into text. Soft volumetric glow, subtle
depth of field, premium and minimal, lots of negative space. Apple product-
reveal lighting. No other text, no watermark, no UI. 16:9, ultra high detail.
```
Notas: el wordmark "Trazo" debe quedar legible y bien tipografiado. Este es el frame FINAL del video del hero (ver `prompt-hero-video.md`).

---

## Asset 2 — Poster del hero (fallback reduced-motion)
**Ruta:** `landing/assets/hero/poster.png` · **Aspecto:** 16:9

Usa la imagen maestra (Asset 1) como poster estático directamente, o genera una variante con el wordmark "Trazo" ya completamente formado y las partículas más asentadas (estado "en reposo"). Mismo encuadre y paleta. Exportar además una versión `.jpg` optimizada para el atributo `poster` del `<video>` y para la OG image.

---

## Asset 3 — Mockup de la app en contexto
**Ruta:** `landing/assets/images/app-context.png` · **Aspecto:** 4:3

```
A clean product shot of a minimalist desktop dictation app called "Trazo"
floating over a dark blurred workspace (#0B1220). A small elegant recording
overlay pill glows with an electric blue (#2563EB) to cyan (#22D3EE) accent,
showing a live waveform-free "listening" state and the text "Texto copiado"
appearing. The app UI is dark, premium, Linear-like, with crisp typography.
Soft rim light, shallow depth of field. No brand logos other than a subtle
"T" mark. No watermark. 4:3.
```

---

## Asset 4 — Muro de apps (compatibilidad)
**Ruta:** `landing/assets/images/` (o SVGs)

**No generar con IA.** Un muro de logos inventados se ve falso y es un anti-patrón del contrato. En su lugar: usar los SVG oficiales monocromos (p. ej. de simple-icons) de WhatsApp, Gmail, Slack, Notion, VS Code, Cursor, ChatGPT, Discord, en tratamiento neutro `#94A3B8` sobre `#0B1220`, atenuados, en una grilla. Esto lo arma Claude Design / la integración, no Nano Banana Pro. Se documenta aquí para que quede claro el porqué.

---

## Asset 5 — Ilustración de privacidad
**Ruta:** `landing/assets/images/privacy.png` · **Aspecto:** 1:1

```
A premium 3D still: a single computer/laptop silhouette rendered in dark glass
on a deep background (#020617), with a soft glowing shield or enclosure of
electric-blue-to-cyan light (#2563EB → #22D3EE) wrapping only around the device
— signifying that the voice stays inside the machine. A faint dotted line to a
cloud is shown cut/blocked. Minimal, elegant, no text, no clichés (no padlocks
made of circuits, no green matrix code). Volumetric light, lots of negative
space. Square 1:1.
```

---

## Asset 6 — Métrica 4× (velocidad)
**Ruta:** `landing/assets/images/speed.png` · **Aspecto:** 4:3

```
A minimalist data-visualization still on a dark background (#0B1220): two
horizontal light bars compared. A short dim bar labeled area for "45" and a
long bright bar glowing electric blue to cyan (#2563EB → #22D3EE) for "220",
suggesting speed. Clean, premium, Swiss/Linear style, generous negative space.
No decorative audio waveforms. Numbers can be added later in HTML, so keep the
composition text-free. 4:3.
```

---

## Assets 7–10 — Apoyo de features (opcional, según Claude Design)
**Ruta:** `landing/assets/images/feature-*.png` · **Aspecto:** 1:1

Genera solo si Claude Design pide imagen por tarjeta (si resuelve las 4 features con iconografía propia, no hacen falta). Prompts sugeridos, todos coherentes con la maestra, cuadrados 1:1, sin texto:
- **feature-perfiles:** three subtle glowing document cards in blue/cyan light, each with a slightly different tone, on `#020617`.
- **feature-diccionario:** an abstract glowing personal glossary / word chips assembling, blue-cyan, dark bg.
- **feature-historial:** a soft stack of past transcript cards receding in depth, blue rim light, dark bg.
- **feature-idiomas:** an abstract globe of light with language glyphs dissolving into clean text, blue-cyan, dark bg.

---

## Checklist de entrega (Benji)

- [ ] Asset 1 (maestra) generado primero.
- [ ] Assets 2, 3, 5, 6 generados usando la maestra como referencia.
- [ ] Assets 7–10 solo si Claude Design los pide.
- [ ] Todo guardado en `landing/assets/hero/` y `landing/assets/images/`.
- [ ] Ningún morado/índigo; ninguna onda de audio decorativa; sin marcas de agua.
