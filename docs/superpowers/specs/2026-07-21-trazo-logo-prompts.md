# Trazo — Definición de logo con GPT Image (unlimited)

Fecha: 2026-07-21 · Estado: exploración · v2 (dirección LIQUID premium)

## Principios

- Minimalista, moderno, premium, elegante. Estética 2026: **liquid glass**.
- **Regla de oro: UNA geometría, DOS pieles.** El símbolo es un trazo
  caligráfico único que sugiere una T. Piel 1: flat vector master (tray 16 px,
  UI, favicon). Piel 2: render liquid glass 3D (app icon, marketing, pitch).
- **Prohibido el micrófono** (cliché de la categoría; Wispr y todos lo usan).
- Paleta: morado #7B2FBE (primario), naranja #F97316 (un solo acento pequeño,
  jamás degradado), blanco/negro. Nada de arcoíris.

## Orden de ejecución (no desperdiciar tiradas)

1. **Geometría primero**: `variation_grid_2x2` hasta encontrar el gesto
   ganador → `flat_master_isolated` para fijarlo limpio.
2. **Piel líquida sobre el ganador**: `material_swap_refine` adjuntando la
   imagen del master (img2img) — así el hero liquid tiene LA MISMA silueta.
3. **Heroes y sistema**: `hero_liquid_glass`, `dark_mode_glow_hero`,
   `liquid_chrome_dark`, `brand_board_dual_finish`, wordmark, lockup.
4. **Aplicaciones**: `app_icon_squircle`, `social_avatar`,
   `application_sheet_system_proof`, `macro_material_backdrop`.

Notas operativas: el aspect ratio se fija en la UI de Higgsfield, no en el
texto (1:1 para marks/iconos; 16:9 solo `macro_material_backdrop`). Verificar
el spelling de "trazo" en toda generación con texto. Ejecutar heroes antes de
fijar geometría = tiradas perdidas.

## Rúbrica de selección

| Criterio | Pregunta |
|---|---|
| Legibilidad 16 px | ¿Se reconoce en el tray? |
| Monocromo | ¿Funciona en blanco puro sobre negro? |
| Unicidad | ¿Se distingue de Wispr/apps genéricas AI? |
| Concepto | ¿Se lee "trazo/voz que escribe" sin explicarlo? |
| Timeless | ¿El liquid es acabado o es muleta? (la silueta plana debe
  sostenerse sola) |

---

## Etapa 1 — Geometría (flat, es lo que se vectoriza)

### variation_grid_2x2 · 1:1

> A clean logo presentation board showing four variations of the same
> abstract mark, arranged in a 2x2 grid on a flat white background with equal
> spacing and thin light-gray divider lines. Each cell contains one version
> of the mark: a single calligraphic brushstroke that implies a letter T,
> drawn as flat vector art in solid deep purple (#7B2FBE) with a small orange
> (#F97316) tapered tail or terminal dot. The four cells vary only in the
> stroke's gesture: 1) one bold diagonal sweep, 2) a horizontal sound-like
> wave settling into a straight written line, 3) a vertical stem crossed by
> one fast swash, 4) a loop that resolves into a T. Same size, same two
> colors, same centered placement in every cell. Flat design, crisp edges, no
> gradients, no shadows, no text, no mockups.

### flat_master_16px_survivor · 1:1 (board con escalera de reducción)

> Minimal vector logo design presented on a clean white identity board, Swiss
> design style. A single continuous calligraphic stroke that abstractly
> suggests an uppercase T: one confident horizontal gesture that turns and
> drops into a vertical tail, with premium curve tension — thick-to-thin
> modulation like a master calligrapher's brush, yet geometrically
> disciplined, built on smooth Bezier transitions. Solid purple #7B2FBE on
> white, completely flat: no gradient, no shadow, no outline, no texture. One
> bold silhouette with generous negative space, no thin hairlines, no inner
> details, so it stays legible as a tiny monochrome glyph. Show the mark
> large and centered, with a row underneath repeating it at progressively
> smaller sizes down to a 16-pixel favicon, plus a solid black one-color
> version. No microphones, no soundwave clichés, no letters or text inside
> the mark.

### flat_master_isolated · 1:1 (la imagen que se vectoriza)

> A single flat vector logo glyph centered on a pure white background: one
> continuous calligraphic brushstroke that abstractly forms a letter T, solid
> deep purple (#7B2FBE), bold confident silhouette with thick-to-thin stroke
> modulation and smooth Bezier curves. Completely flat: no gradient, no
> shadow, no outline, no texture, no background elements, no text, no
> presentation board, no size ladder — only the glyph itself, very large,
> filling about 70% of the frame, crisp clean edges ready for vector tracing.

## Etapa 2 — Refinamiento img2img (adjuntar el master ganador)

### material_swap_refine · adjuntar imagen del candidato

> Keep the exact silhouette, proportions, position and camera angle of the
> logo mark in the attached image — do not redraw, restyle or reinterpret its
> shape in any way. Change only the material and finish: render the existing
> stroke as thick liquid chrome tinted deep violet purple (#7B2FBE),
> mirror-polished, with flowing specular highlights and soft studio
> reflections, plus one thin orange (#F97316) light streak tracing its inner
> edge. Replace the background with a seamless neutral light-gray studio
> sweep and add a soft contact shadow directly beneath the mark. Everything
> else — outline, curvature, negative space, framing — must remain identical
> to the reference. Photorealistic product-photography lighting, premium and
> minimal, no added elements, no text.

## Etapa 3 — Heroes liquid (piel premium)

### hero_liquid_glass · 1:1 (el hero principal)

> A single calligraphic brushstroke forming an abstract letter T, sculpted as
> a three-dimensional ribbon of translucent liquid glass in deep violet
> (#7B2FBE). The stroke tapers like ink from a loaded brush — one confident
> gesture, thick entry, flicked exit. Material: polished optical glass with
> strong refraction, subsurface scattering, and internal caustics casting
> soft violet light patterns onto a seamless pale-grey studio backdrop. Crisp
> specular highlights from two large softboxes; one subtle warm orange
> (#F97316) rim light along a single edge only. Centered composition,
> generous negative space, shallow depth of field, product-photography
> realism, 8k render aesthetic. Absolutely no microphones, no rainbow
> gradients, no generic blob shapes — the calligraphic T silhouette must stay
> sharp and instantly readable.

### liquid_chrome_dark · 1:1 (variante oscura cromo)

> An abstract letter T drawn as one fluid calligraphic stroke, rendered as
> dark liquid chrome — molten metal frozen mid-flow. Surface: mirror-polished
> with a strictly single-hue deep aubergine-purple sheen (base #7B2FBE
> shifted darker — no multicolor iridescence), anisotropic reflections
> stretching along the stroke's curvature, razor-sharp specular highlights,
> and a faint warm orange (#F97316) glow reflected in the metal from an
> off-camera source. The stroke has real dimensional relief: rounded and
> tense like surface-hardened mercury, ending in a tapered brush tip.
> Background: near-black charcoal studio sweep with a soft vignette.
> Dramatic single key light plus edge rim light, cinematic contrast,
> luxury-watch advertising quality. High-end 3D render realism with softbox
> shapes visible in the reflections. No rainbow hues, no microphones, no
> text — only the sculptural chrome stroke, unmistakably a T.

### ferrofluid_ink · 1:1 (tinta líquida — el puente conceptual)

> Macro studio photograph of a suspended stream of liquid ink frozen in
> mid-air, forming a single calligraphic brushstroke that reads as an
> abstract letter T. The ink is deep violet (#7B2FBE), glossy and viscous
> like slow-pouring enamel: taut surface tension, a few tiny satellite
> droplets trailing the stroke's flicked tail, micro-ripples along its spine
> catching sharp specular highlights. Subtle subsurface glow where light
> passes through the thinnest sections; one restrained warm orange (#F97316)
> reflection on the underside. Pure white seamless background, high-key
> studio lighting, ultra-sharp focus with a faint soft shadow below to ground
> the shape. Shot on a macro lens, high-speed liquid-photography realism like
> premium splash advertising. The gesture must stay controlled and elegant —
> deliberate calligraphy, not chaotic splatter. No microphones, no rainbow
> gradients.

### glass_sculpture_photo · 1:1 (plan B fotográfico si el render sale plástico)

> Studio photograph of a hand-blown glass sculpture displayed on a low white
> pedestal against an infinity-cove white background. The sculpture is a
> single elegant brushstroke frozen in mid-motion, its sweep clearly reading
> as an abstract letter T — sharp, deliberate, unmistakable in silhouette:
> translucent deep-purple glass (#7B2FBE) with a mirror-smooth, almost liquid
> surface tension, and a slender vein of glowing amber-orange (#F97316) fused
> inside the glass. Shot on a medium-format camera with an 85mm lens, shallow
> depth of field, tack-sharp focus on the sculpture. Two large softboxes
> create long specular highlights that reveal the poured, molten quality of
> the glass; a faint caustic light pattern spills onto the pedestal.
> Gallery-like, minimal, premium. Centered composition with breathing room,
> nothing else in the scene.

### dark_mode_glow_hero · 1:1 (hero sobre negro, glow controlado)

> Product photography of a liquid-glass logo sculpture on a pure black
> seamless background. The object: a single calligraphic brushstroke
> suggesting a letter T, made of translucent deep-violet glass (#7B2FBE),
> glossy and fluid, edge-lit so its contours glow from within. Lighting is
> strict and controlled: two thin violet rim lights tracing the stroke's
> outline, one small orange (#F97316) specular highlight at the stroke's
> terminal, and a faint purple bloom halo hugging the object tightly — the
> glow fades to true black within a short distance, keeping the outer third
> of the frame completely black. No fog, no smoke, no visible light rays, no
> rainbow dispersion, no lens flare. Centered, square 1:1, the sculpture is
> the only visible element. Premium, dark, restrained.

## Etapa 4 — Sistema de marca

### brand_board_dual_finish · 1:1 (la lámina que fija la regla del sistema)

> Professional brand identity board on a clean neutral studio background,
> presented like a Pentagram case study. One single logomark shown twice,
> side by side, identical geometry: a bold abstract calligraphic brushstroke
> that subtly forms a letter T — one confident stroke, like a voice leaving a
> written trace. Left version: flat vector master, solid purple #7B2FBE on
> white, crisp edges, no gradients, no shadows. Right version: the exact same
> shape rendered as premium 3D liquid glass — translucent violet glass with
> soft internal refraction, liquid-chrome highlights, a subtle orange
> #F97316 rim light, floating over a deep charcoal panel. Small caption
> labels 'Flat master' and 'Liquid render', faint grid lines, generous white
> space. No microphones, no rainbow gradients, no sparkles, no robot or AI
> imagery. Photorealistic render quality on the glass version only.

### wordmark_liquid_terminal · 1:1

> Modern wordmark design: the word 'trazo' in lowercase, custom
> geometric-humanist sans-serif with subtle calligraphic DNA — clean skeletal
> letterforms, slightly condensed, medium weight, premium letterspacing.
> Solid deep purple #7B2FBE on an off-white background, flat vector finish.
> One single liquid detail only: the terminal of the final letter 'o'
> resolves into a small elegant ink-drop tail, as if the letter were still
> wet, with one refined droplet of orange #F97316 detaching from the stroke —
> understated, never cartoonish. Everything else stays strictly flat and
> sober. Present as a professional type specimen board: wordmark large and
> centered, faint baseline and x-height guides, generous margins, small
> enlarged detail circle highlighting the drop terminal. No gradients, no 3D
> on the letters, no microphones, no glitter, no taglines, no extra
> decoration.

### dark_lockup_liquid_glass · 1:1 (símbolo liquid + wordmark plano)

> Elegant logo lockup on a premium dark background: deep charcoal-black
> surface with a faint violet vignette, studio-lit like a luxury tech brand
> hero shot. The brand symbol — one bold calligraphic stroke forming an
> abstract letter T — rendered in 3D liquid glass: translucent purple
> #7B2FBE glass with liquid-chrome highlights, soft internal refraction,
> delicate caustics on the surface below it, and one thin orange #F97316
> edge light. Beside it, the wordmark 'trazo' in lowercase, clean modern
> sans-serif, printed perfectly flat in soft warm white with no effects on
> the type. Balanced symbol-to-wordmark spacing, centered composition,
> abundant negative space, Apple-keynote-grade polish, 2026 liquid glass
> aesthetic. Photorealistic glass render, crisp flat typography. No
> microphones, no rainbow gradients, no particles, no circuit patterns, no
> glowing AI imagery.

### application_sheet_system_proof · 1:1 (esperar 2-3 tiradas, es el más complejo)

> Brand application sheet on a clean light-gray identity board, three
> labeled mockups in a row proving one coherent system. First: a Windows 11
> desktop app icon — rounded squircle tile in liquid glass style,
> translucent purple #7B2FBE glass with glossy depth, the calligraphic
> T-stroke logo embossed as refractive glass relief, a subtle orange
> #F97316 glow on one edge. Second: a zoomed detail of a Windows system
> tray — the same T-stroke as a tiny 16-pixel flat monochrome white glyph on
> a dark taskbar, perfectly legible, with an enlarged inset showing its
> pixel-crisp silhouette. Third: a minimal splash screen mockup — dark
> background, flat purple stroke symbol centered above the lowercase
> wordmark 'trazo' in white. Identical geometry across all three;
> liquid-glass skin appears only on the app icon, everything else flat.
> Clean annotations, generous spacing. No microphones, no rainbow gradients.

## Etapa 5 — Aplicaciones

### app_icon_squircle · 1:1

> Premium desktop app icon: a rounded squircle with a smooth vertical
> gradient from deep violet (#7B2FBE) to near-black plum, matte-satin
> finish. Rising from its surface in true 3D relief, a single calligraphic
> brushstroke shaped like an abstract letter T, made of translucent liquid
> glass — refractive, with subsurface scattering, internal caustics tinting
> the squircle surface beneath it, and a hairline warm orange (#F97316) glow
> tracing only its bottom edge. The glass stroke reads distinctly brighter
> than the dark squircle behind it — high-contrast, legible even at small
> sizes — and catches two crisp specular highlights from soft studio
> lighting above. Slight top-down perspective as in modern macOS and Windows
> icon renders, with a soft contact shadow under the raised glass. Clean,
> centered, generous margins inside the squircle. Apple-grade icon
> craftsmanship, 2026 liquid-glass design language. No microphones, no
> rainbow gradients, no plastic toy look — refined optical-grade glass only.

### social_avatar · 1:1 (GitHub/Discord/X)

> Square social media avatar: solid deep violet purple (#7B2FBE) background,
> a single bold white calligraphic brushstroke glyph that abstractly forms a
> letter T, perfectly centered, filling about 60% of the frame. Completely
> flat vector: pure monochrome white mark, crisp edges, no gradients, no
> shadows, no border, no text. Clean, high-contrast, instantly recognizable
> at tiny thumbnail size.

### macro_material_backdrop · 16:9 (fondo para slides del pitch)

> Extreme macro shot for a widescreen presentation background: the surface
> of a liquid-glass sculpture in deep violet (#7B2FBE), photographed so
> close that only one sweeping curved section of a calligraphic stroke fills
> the frame, entering from the lower left and dissolving into soft bokeh
> toward the upper right. Material detail is the hero: refraction bending
> light inside the glass, subsurface scattering glowing faintly at the thin
> edge, caustic light patterns projected across the dark charcoal surface
> below, micro specular glints, and one distant warm orange (#F97316)
> highlight melting into the blur. Very shallow depth of field, cinematic
> low-key studio lighting, abundant calm dark negative space on the right
> side for overlaid text. Luxurious, quiet, and premium — like a fragrance
> campaign, not tech clip-art. No rainbow gradients, no microphones.

---

## Etapa 6 — Profundización de los gestos finalistas (3: asta+swash, 4: bucle→T)

### deep_dive_gesto3 · 1:1 (variaciones controladas del asta cruzada)

> A clean logo presentation board showing six refined variations of one
> abstract mark, arranged in a 2x3 grid on a flat white background with thin
> light-gray divider lines. Every cell contains the same concept: a single
> calligraphic vertical stem crossed by one fast horizontal swash, together
> implying a letter T, drawn as flat vector art in solid deep purple
> (#7B2FBE) with a small orange (#F97316) accent only at the swash's tapered
> end. The six cells vary ONLY in three parameters: stem curvature (perfectly
> straight vs slightly bowed), swash angle (flat horizontal vs rising about
> ten degrees), and taper intensity (subtle vs dramatic thick-to-thin). Same
> size, same two colors, same centered placement in every cell. Flat design,
> crisp edges, no gradients, no shadows, no text, no mockups.

### deep_dive_gesto4 · 1:1 (variaciones controladas del bucle→T)

> A clean logo presentation board showing six refined variations of one
> abstract mark, arranged in a 2x3 grid on a flat white background with thin
> light-gray divider lines. Every cell contains the same concept: one single
> continuous calligraphic stroke that begins as an open elegant loop and
> resolves into the silhouette of a letter T, drawn without lifting the pen,
> flat vector art in solid deep purple (#7B2FBE) with a small orange
> (#F97316) accent only at the stroke's final tapered exit. The six cells
> vary ONLY in three parameters: loop size (small and tight vs generous and
> open), loop position (upper-left entry vs lower-left entry), and taper
> intensity (subtle vs dramatic thick-to-thin). Same size, same two colors,
> same centered placement in every cell. Flat design, crisp edges, no
> gradients, no shadows, no text, no mockups.

Tras elegir el ganador: correr `flat_master_isolated` describiendo ese gesto
exacto, luego `material_swap_refine` adjuntándolo para la piel liquid.

## Etapa 7 — Logo animado (turntable 360°)

Modelo: **Kling 3.0** (unlimited del plan, 1080p, sin rostros = su cancha).
Nota técnica: ningún modelo de video genera canal alfa ("sin fondo" real). La
solución estándar: generar sobre **negro puro** y montarlo en CapCut/web con
blend mode *screen/lighten* (perfecto para vidrio/glow), o sobre gris neutro
y hacer key. Un giro de exactamente 360° que termina donde empezó = **loop
infinito** para el hero de la web.

### logo_turntable_img2video · Kling 3.0, 1080p, 5-10 s, adjuntar el hero liquid como start frame

> Seamless 360-degree turntable animation of the logo object in the attached
> image. The object — a sculpted liquid-glass calligraphic stroke in deep
> violet purple (#7B2FBE) — rotates slowly and continuously around its
> vertical axis at constant speed, completing exactly one full revolution and
> ending in the same position it started, so the clip loops perfectly. Camera
> completely locked, object centered, no camera movement, no zoom. Background:
> pure solid black, completely empty. Studio lighting travels across the glass
> as it turns: crisp specular highlights sweeping along the curves, soft
> internal refraction and faint caustics shifting with the rotation, one thin
> warm orange (#F97316) glint appearing briefly at the stroke's tip
> mid-rotation. No text, no particles, no dust, no background elements, no
> flicker. Photorealistic product-render quality, premium and minimal.

### logo_turntable_text2video · fallback sin imagen adjunta

> A premium 3D product animation on a pure black empty background: a single
> sculpted calligraphic brushstroke forming an abstract letter T, made of
> translucent liquid glass in deep violet purple (#7B2FBE), slowly rotating
> around its vertical axis in a seamless 360-degree turntable, ending exactly
> where it began for a perfect loop. Locked camera, centered composition.
> Studio specular highlights sweep across the glass as it turns, revealing
> internal refraction; one small warm orange (#F97316) glint at the stroke's
> tapered tip appears once mid-turn. No text, no particles, no camera motion,
> no background elements. Photorealistic, elegant, minimal.

### logo_reveal_ink · bonus para intro de videos (Kling 3.0, fondo negro)

> On a pure black background, liquid violet-purple ink (#7B2FBE) pours into
> frame and draws a single calligraphic stroke in one continuous motion, as
> if an invisible master calligrapher were writing it mid-air: the stroke
> curves and resolves into an abstract letter T, its surface settling from
> flowing liquid into polished glass, finished by one small orange (#F97316)
> spark at the final taper. Locked camera, centered, photorealistic liquid
> simulation, controlled and elegant motion — deliberate calligraphy, not
> splatter. No text, no particles beyond the single spark, no camera
> movement.

## Después de elegir

1. Vectorizar `flat_master_isolated` ganador (SVG limpio, paths simples).
2. Reemplazar `src/components/icons/TrazoMark.tsx` y `TrazoTextLogo.tsx`.
3. Master 1024×1024 (puede ser el render liquid del app icon) → `tauri icon`.
4. Rehacer trays de `src-tauri/resources/` con el glifo plano monocromo.
5. Recordatorio aparte del rebrand: `tauri signer generate` para la clave
   propia del updater antes del primer release.
