# Prompt para Claude Design — Rebrand visual de la app Trazo (azul eléctrico premium)

> Claude Design **propone el look**; luego Claude Code lo aplica en el código real (reskin de `theme.css` + iconos + logo) **sin tocar la estructura ni la lógica** (compatible con lo de Juan). Pega lo de "PROMPT". Adjunta capturas de la app actual si las tienes (opcional pero recomendado).

## Estado actual (lo que hay que reemplazar — ver capturas adjuntas)

Hoy la app usa **logo morado `#7B2FBE` + acentos naranjas `#F97316`** (los toggles encendidos, los botones "Agregar"/"Donar", el badge de VAD, el ítem de sidebar activo) sobre fondo oscuro. El rebrand debe **reemplazar AMBOS**:
- Morado (logo, ítem de sidebar activo) → **azul eléctrico `#2563EB`**.
- Naranja (toggles ON, botones primarios, badges de acción) → **azul eléctrico `#2563EB`**, con **cián `#22D3EE`** como luz de acento (glow, estado de grabación).
El layout y los componentes se mantienen; solo cambia la piel de color + el logo, en clave premium.

Las **5 pantallas reales** (adjuntas) son: **General** (atajos con grabador de teclas, toggles, dropdowns de idioma/micrófono), **Modelos** (tarjetas de modelo con badge Activo/Recomendado y barras de precisión/velocidad), **Avanzado** (dropdowns de pegado, toggle VAD, input "Palabras Personalizadas" + botón, límite de historial), **Historial** (lista de grabaciones con reproductor de audio e iconos de acción), **Acerca de** (idioma, versión, botón Donar, Ver en GitHub, rutas de directorios).

## Contexto de la app (para que Claude Design entienda qué rebrandear)

Trazo es una **app de escritorio** (no móvil) de dictado por voz. Tiene tres superficies:
1. **Ventana de ajustes** (la principal): sidebar izquierdo con el logo "Trazo" arriba y navegación (Transcripción, General, Modelos, Historial, Post-procesamiento, Avanzado, Debug, Acerca de). El área principal es un panel de ajustes con grupos de filas; cada fila tiene título + descripción a la izquierda y un control a la derecha: **toggle switch, dropdown/select, slider, o un grabador de atajo de teclado** (muestra las teclas). También hay **tarjetas de modelo** (nombre, tamaño, botón/barra de descarga).
2. **Onboarding** (primer arranque): logo, bienvenida, tarjetas de descarga de modelo (nombre, tamaño, progreso) y pasos de permiso (micrófono, accesibilidad) con botones.
3. **Overlay de grabación**: una **píldora flotante** pequeña que aparece al grabar, con estado (micrófono/onda) y texto ("Escuchando…", y al terminar "Texto copiado — Ctrl+V para pegar").

## PROMPT

Diseña la **identidad visual rebrandeada** de una app de escritorio de dictado por voz llamada **Trazo**, en estilo **azul eléctrico moderno, premium y elegante** (dark), coherente con Apple/Linear. Es un mockup de referencia para un reskin de código: mantén formas de componente reales de app de escritorio (toggles, dropdowns, sliders, tarjetas), no inventes UI fantástica.

**Paleta (hex exactos):** primario azul eléctrico `#2563EB` (acción, estado activo, foco), acento cián `#22D3EE` (glow, estado de grabación, detalles), fondo `#0B1220` / paneles `#0F1A30` / elevado `#16233F`, bordes `#24314B`, texto `#F8FAFC`, secundario `#94A3B8`, tenue `#64748B`. Éxito `#22C55E`, error `#EF4444`. **Prohibido morados/índigo** (nada de `#6366F1`/`#8B5CF6`), nada de Inter en titulares, nada de emojis como iconos.

**Estilo:** dark premium, mucho aire, tipografía limpia y legible (grotesque tipo Geist/General Sans), esquinas suaves (radios 8/12/20), profundidad sutil (glass, sombras suaves, borde de 1px con luz interior), microinteracciones sobrias. El azul se reserva para acción/estado; el cián es la luz de acento (p. ej. el estado "grabando").

**Diseña estas tres pantallas** en esa identidad:
1. **Ventana de ajustes**: sidebar izquierdo (logo "Trazo" arriba + navegación con iconos de línea: Transcripción, General, Modelos, Historial, Post-procesamiento, Avanzado, Acerca de; el ítem activo en azul) + panel principal con un grupo de ajustes que incluya al menos: una fila con **toggle**, una con **dropdown**, una con **slider**, una con **grabador de atajo** (muestra `Ctrl + Espacio`), y una **tarjeta de modelo** con barra de descarga. Cada fila: título + descripción a la izquierda, control a la derecha.
2. **Onboarding**: pantalla de bienvenida con el logo, una **tarjeta de descarga de modelo** (nombre, tamaño, botón "Descargar" con progreso) y un **paso de permiso** (micrófono) con botón primario.
3. **Overlay de grabación**: la **píldora flotante** en dos estados — "Escuchando…" (con onda/mic y glow cián) y "Texto copiado — Ctrl+V para pegar".

**Salida:** un mockup (una o varias pantallas) que muestre estas superficies con la nueva identidad azul premium. Es la guía visual; el código real lo aplica después el equipo.

## Qué adjuntar (opcional pero recomendado)
Capturas de la app ACTUAL (hoy en morado) para que Claude Design calque tu layout exacto: la ventana de ajustes (2-3 pestañas del sidebar), el onboarding y el overlay si puedes.
