# Prompt del video del hero — scroll-scrubbing (GATE DE APROBACIÓN)

> **El video consume créditos limitados. NO generar sin la aprobación explícita de Benji.** Este doc define el plan; la generación espera el "sí".

## Concepto (declarado según landing-builder-frame)

- **Efecto:** trazo / morphing (NO zoom, NO "se acerca y gira").
- **Frame inicial:** partículas de luz cián dispersas sobre fondo `#020617` (el murmullo de voz, antes de ser palabra).
- **Progresión:** las partículas fluyen y se ordenan en una pincelada de tinta azul-cián 3D que escribe el wordmark "Trazo".
- **Frame final:** el wordmark "Trazo" nítido = la imagen maestra `landing/assets/hero/master.png` (variante v1 elegida).
- **Requisito de scrubbing:** la secuencia debe funcionar hacia delante Y hacia atrás (el usuario la controla con el scroll). Sin texto extra, sin marcas de agua, sin motion blur agresivo.

## Plan de generación (2 pasos)

1. **Frame inicial (imagen, gratis — Nano Banana Pro):** generar una imagen de partículas de luz cián dispersas sobre `#020617`, misma paleta y encuadre 16:9 que la maestra, SIN wordmark todavía. Es el `start_image`.
2. **Video (Kling 3.0, image-to-video, modo 4K — aprobado por Benji):**
   - `start_image` = el frame inicial de partículas.
   - `end_image` = `master.png` (job `c8a06ff5-60c5-4b15-89cf-2d56f0a39357`).
   - Prompt: "Scattered cyan light particles on a deep near-black background flow and coalesce into a single luminous blue-to-cyan brushstroke that writes the wordmark, settling into a clean glowing logo. Smooth, premium, Apple product-reveal motion, no camera shake."
   - Parámetros: duración 5 s, `mode: 4k`, 16:9, `sound: off` (el hero es silencioso, se controla por scroll).
   - **Costo aprobado: 30 créditos.** Comparativa: Kling std 7.5 · pro 8.75 · 4K 30 · Seedance 1080p 45. Kling salió mucho más barato para un efecto abstracto de luz.
   - Para web: bajar el 4K a 1080/2K (H.264 GOP corto) para el scrubbing; conservar el 4K como master del video.

## Notas técnicas para la integración (Fase B)

- Tras generar, hacer upscale si hace falta, exportar `hero.mp4` (H.264, GOP corto para scrubbing) + `hero.webm`, y una versión móvil ligera. Guardar en `landing/assets/hero/`.
- El `poster.jpg` ya existe (derivado de la maestra).

## Costo

Preflight de créditos registrado en la conversación antes de pedir aprobación.
