# Onda sensible a susurros + pulso de voz detectada — diseño

**Fecha:** 2026-07-24 · **Estado:** dimensionado aprobado por Charly
("adelante con las dos"); esta spec fija los detalles.

## Objetivo

Que el overlay dé confianza de que la app escucha: (1) las barras de la onda
deben reaccionar visiblemente a voz baja/susurros, no solo a voz plena; (2) un
indicador debe distinguir "hay VOZ detectada" de "hay ruido/silencio", usando
el VAD real (Silero) — no un umbral de amplitud, para que un ventilador no
haga pulsar el overlay.

## Diseño

### Sensibilidad: vive en el BACKEND (corregido tras validación en vivo)

**Hallazgo (2026-07-24, validación de Charly):** la primera versión puso la
sensibilidad solo en la curva frontend y no se notó nada. Causa real: el
`AudioVisualiser` normaliza en dB contra un piso fijo `DB_MIN = -55`, y un
susurro (~0.01 de amplitud) cae a ~-58 dB por bucket → llegaba al frontend
como 0 exacto. La curva frontend operaba sobre una señal ya aplastada.

- **visualizer.rs**: `DB_MIN` -55 → **-68** (justo sobre el ambiente de una
  sala silenciosa). Tests de regresión con senos sintéticos: susurro (amp
  0.01) > 0.2, casi-silencio (amp 0.0005) < 0.05, y el habla normal conserva
  headroom sobre el susurro. (Nota: el `noise_floor` adaptativo del
  visualizer se calcula pero nunca se usa — herencia muerta del upstream,
  no tocada.)
- **`src/overlay/waveform.ts`**: `barHeightPx(level)` con `sqrt(level)` —
  presentación, no sensibilidad. Contrato: susurro que llega ~0.3 → ≥10px;
  residuo ambiente ~0.05 → ≤7px (murmullo, no barras bailando); piso, tope,
  monotonía.

### Estado de voz desde el VAD (Rust)

- `SpeechStateTracker` (nuevo, puro, en audio_toolkit/vad): `update(bool) ->
  Option<bool>` — devuelve Some solo en transiciones voz↔no-voz. TDD.
- `AudioRecorder::with_speech_callback(Fn(bool))`: invocado desde
  `handle_frame` vía el tracker cuando el veredicto del VAD cambia. Con VAD
  deshabilitado no se invoca nunca (el frontend queda en neutro).
- `managers/audio.rs` lo cablea a un `emit_to("recording_overlay",
  "speech-active", bool)` gateado por OVERLAY_ENABLED (mismo patrón que
  emit_levels; las transiciones son poco frecuentes, coste despreciable).

### Pulso visual (frontend)

`RecordingOverlay.tsx` escucha `speech-active` → estado `speaking`. El punto
`.sdot` gana la clase `speaking`: pulso más rápido (0.8s vs 1.9s) y brillo
mayor con las vars existentes. Se resetea a false en cada `show-overlay`.
Aplica a los estados recording/streaming (donde hay captura).

## Fuera de alcance

Cambiar el pipeline de VAD o sus umbrales; tocar el modo streaming; nuevos
settings.

## Verificación

TDD frontend (`bun test src/`) y Rust (`cargo test --lib`); manual: dictar en
susurro y ver barras + pulso; ruido no-voz (soplar/ventilador) no debe activar
el pulso.
