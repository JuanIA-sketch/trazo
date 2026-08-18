# Doble-tap → grabación continua — diseño

**Fecha:** 2026-07-24 · **Estado:** dimensionado aprobado por Charly
("adelante con las dos"); esta spec fija los detalles.

## Objetivo

Con Push-to-Talk configurado, un doble-tap rápido del atajo de transcripción
deja el micrófono grabando (modo continuo latcheado) hasta presionar el atajo
una vez más. PTT normal (mantener presionado) sigue funcionando exactamente
igual. El modo toggle existente (`push_to_talk=false`) no cambia.

## Semántica del gesto (regla clave: PTT normal sin penalización)

- Press en Idle → arranca grabación (como hoy, latencia intacta).
- Release tras hold **≥ 450 ms** (TAP_MS) → stop normal de PTT, **inmediato**.
  Incluso un dictado de una palabra mantiene bastante más de 450 ms: el flujo
  de siempre no espera nada.
- Release tras hold **< 450 ms** → "tap pendiente": la grabación SIGUE y se
  arma un deadline de **550 ms** (DOUBLE_TAP_WINDOW).
- _(Los valores originales 250/350 ms se descartaron en validación en vivo:
  exigían timing de máquina — varios intentos para latchear. Un doble-tap
  humano relajado es ~180 ms de hold con ~300-450 ms entre taps; hay test de
  regresión con ese perfil.)_
  - Segundo press dentro de la ventana → **latch continuo**: grabando sin
    tecla; su release se ignora.
  - Ventana expira sin segundo press → stop normal (el mini-clip se procesa
    como lo habría hecho hoy, solo que ~350 ms más tarde; solo afecta a taps
    accidentales de <250 ms).
- Press en modo continuo → stop → procesamiento normal.
- Cancel (Escape) y fin de procesamiento resetean el gesto.

## Componentes

### `src-tauri/src/shortcut/tap_gesture.rs` (nuevo, puro, TDD)

`TapGestureDetector` — máquina de estados con tiempos inyectados
(`on_press(now)` / `on_release(now)` / `deadline()` / `on_deadline(now)` /
`reset()`), que emite `Gesture::{HoldStart, HoldEnd, TapPending, DoubleTap,
PendingExpired, LatchedPress, Ignored}`. **Unidad reutilizable a propósito**:
si Command Mode (concepto futuro) necesita gestos de hotkey, se extiende aquí
sin tocar el coordinator.

### `TranscriptionCoordinator` (integración, glue)

Solo en la rama `push_to_talk`: los press/release pasan por el detector y las
acciones se derivan del gesto (HoldStart→start, HoldEnd/PendingExpired→stop,
DoubleTap→latch + overlay continuo, LatchedPress→stop, Ignored→nada). El loop
pasa de `recv()` a `recv_timeout()` cuando el detector tiene deadline armado,
para poder disparar `PendingExpired` sin input. `Cancel`/`ProcessingFinished`
resetean el detector. La rama toggle no toca el detector.

### Indicador de overlay (obligatorio: mic abierto sin tecla)

Estado nuevo `"continuous"` en `OverlayState` (mismo tamaño compacto):
`show_overlay_state(app, "continuous")` desde el coordinator al latchear. El
pill muestra la fila de escucha (punto + onda + cancelar) con un badge "∞"
(aria-label i18n `overlay.continuous`) y borde acentuado vía clase CSS
`continuous`. En `showOverlayHandler`, "continuous" NO limpia el texto ni la
sesión (es la continuación de la misma grabación) — test primero.

## i18n

`overlay.continuous` en las 21 locales (etiqueta corta, p. ej. es "Escucha
continua").

## Sin settings nuevos

El gesto va siempre activo en modo PTT: es deliberado (dos taps rápidos), el
overlay lo señala, y Escape lo cancela. Si molesta en la práctica, un setting
de opt-out es trivial de añadir después.

## Verificación

TDD Rust del detector (`cargo test --lib tap_gesture`); test nuevo de
`showOverlayHandler` (`bun test src/`); manual: doble-tap → pill con ∞ y
grabación persistente; tap simple corto → se procesa tras ~350 ms; PTT
mantenido → idéntico a hoy; Escape en continuo → cancela.
