@AGENTS.md

# Trazo — notas del fork (leer antes de tocar código)

Este repo es el fork **Trazo** de Handy (upstream: cjpais/handy): rebrand para
competir con Wispr Flow sin nube obligatoria. Entrega: 31 de julio de 2026.
El feature-freeze del upstream NO aplica aquí.

## Convenciones obligatorias

- **TDD siempre**: test en rojo primero (visto fallar por la razón correcta),
  luego implementación mínima hasta verde. Sin excepciones, también en bugfixes.
- **Nunca `git push`** (ni commit salvo pedido explícito) **sin confirmación
  manual explícita de Charly** en la conversación.
- **`CARGO_TARGET_DIR=C:\h` es obligatorio en Windows**: con el target dir por
  defecto, el generador de shaders Vulkan de transcribe-cpp-sys revienta el
  límite MAX_PATH (error FTK1011/MSB3491). Ver BUILD.md.
- No renombrar nada de `handy-keys`/`HandyKeys`/`handy_keys`: es la crate de
  teclado (ahora vendorizada), no branding.
- Al editar `%APPDATA%\com.pais.handy\settings_store.json` a mano: **sin BOM**
  (PowerShell `Out-File utf8` mete BOM y serde_json lo rechaza → la app
  resetea la configuración a defaults). Reescribir con python/`utf-8` plano.

## Levantar el entorno de dev (Windows)

```powershell
bun install
mkdir src-tauri/resources/models -Force
curl -o src-tauri/resources/models/silero_vad_v4.onnx https://blob.handy.computer/silero_vad_v4.onnx
$env:CARGO_TARGET_DIR = "C:\h"
bun run tauri dev
```

- La app corre desde `C:\h\debug\handy.exe` y **bloquea sus DLLs**: cerrar
  Handy/Trazo antes de cualquier `cargo build/check/test` que re-enlace.
- `src/bindings.ts` es generado (tauri-specta): no editarlo a mano; se regenera
  al arrancar la app en debug (p. ej. `cargo run -- --list-models`, headless).
- Tests: `cargo test --lib` (rápidos) y `cargo test --lib -- --ignored` para el
  test de idioma que carga el modelo Whisper real (~1 min). La crate vendorizada
  tiene suite propia: `cargo test` dentro de `src-tauri/vendor/handy-keys`.

## Estado del fork (julio 2026) — cambios sin commitear respecto al upstream

1. **Perfiles de post-procesamiento ES** (`settings.rs`): 3 prompts sembrados
   (`default_es_casual`/`_commit`/`_community`) con glosario técnico y
   autocorrecciones habladas; migración de esquema v2 los añade a stores
   existentes y selecciona el casual si no había ninguno.
2. **Red de seguridad del portapapeles** (`clipboard.rs`): núcleo de pegado
   testeable con fakes; ante fallo de pegado el texto siempre queda en el
   portapapeles; default `clipboard_handling = CopyToClipboard` (migración v3).
3. **Audio ducking Windows** (`system_volume.rs`, `managers/audio.rs`):
   setting `recording_volume` (None=off, 0.0=mute, >0 duck por
   `IAudioEndpointVolume`); migración v4 convierte el mute legacy; recuperación
   de volumen tras crash vía archivo en %TEMP%; duck ANTES del sonido de inicio
   (latencia, issue upstream #642); `remove_duck` en cancelación (fix del
   audio estrangulado, upstream #1501). Slider UI solo Windows.
4. **Indicador de GPU activa** (`AccelerationSelector.tsx` +
   `get_active_compute_info`): muestra el dispositivo real enlazado; en "Auto"
   transcribe-cpp elegía la iGPU Intel en vez de la GTX 1650 (confirmado).
5. **Fix de secuestro de teclado**: crate `handy-keys` vendorizada en
   `src-tauri/vendor/handy-keys` (`[patch.crates-io]`) — el hook LL de Windows
   tragaba releases de modificadores cuyo estado resultante coincidía con un
   hotkey de solo-modificador (PTT en `ctrl_left`), dejando Shift/Alt/Win
   clavados a nivel OS. Regla nueva: jamás bloquear releases. Tests de
   regresión en la crate y en `shortcut/handy_keys.rs`. La 0.3.0 de crates.io
   tiene el mismo bug — no "actualizar" sin verificar. Pendiente: PR upstream.
6. **Aviso "texto copiado"** (`overlay.rs` + `RecordingOverlay.tsx`): tras cada
   dictado el overlay muestra "Texto copiado — Ctrl+V para pegar" ~2,4 s con
   auto-cierre protegido por generación; solo cuando el texto quedó de verdad
   en el portapapeles (`transcript_lands_on_clipboard`).
7. **Fix de idioma** : los clips <2 s con `selected_language: "auto"` salían en
   islandés/inglés (falla clásica de Whisper). Config del usuario fijada a
   `"es"`; logging de `detected_language` + duración en `transcription.rs`;
   test de reproducción `#[ignore]` con el WAV real en
   `src-tauri/tests/fixtures/` (contiene voz del usuario).
8. **Rebrand parcial**: paleta Trazo en `src/styles/theme.css` (morado #7B2FBE
   + naranja #F97316), copy "Handy"→"Trazo" en las **21 locales** (en es la
   referencia; check:translations valida las otras 20), título de ventana,
   tooltip del tray, CLI e index.html. Repo propio (JuanIA-sketch/trazo) y
   updater con clave propia: hechos (2026-07-16). Los SVGs del logo
   (`HandyTextLogo`/`HandyHand`) llevan placeholder de texto "Trazo"/"T" en
   el morado de marca (2026-07-23) — los nombres de componente se conservan
   para que el logo final sea drop-in. PENDIENTE (esperan logo/decisión):
   logo final, iconos de app, identifier `com.pais.handy`, productName.
9. **Bug de overlay invisible (2026-07-08)**: no reproducible tras reinicio;
   diagnóstico completo descartó paleta/CSS/eventos (ventana y webview sanos
   verificados por CDP y captura de píxeles). La fragilidad sospechosa (el
   handler de `show-overlay` esperaba dos IPC antes de `setIsVisible(true)`)
   quedó eliminada: la lógica vive en `src/overlay/showOverlayHandler.ts`
   (visibilidad síncrona; idioma/posición en segundo plano, best-effort) con
   tests en `showOverlayHandler.test.ts` (`bun test src/` — acotado a `src/`
   para no pisar los specs de Playwright en `tests/`).
10. **Paso de autostart en el onboarding (2026-07-23)**: pregunta explícita
    con los toggles existentes (`AutostartToggle` + `StartHidden`) entre
    permisos y modelo; secuencia en `onboardingFlow.ts` (función pura con
    tests); defaults siguen en `false`; claves `onboarding.autostart.*` en
    las 21 locales. Spec en `docs/superpowers/specs/`. El bug asociado
    (con `start_hidden=true` y onboarding incompleto la app arrancaba a la
    bandeja sin mostrar el onboarding) quedó arreglado: la decisión vive en
    `should_show_main_window_at_launch()` (lib.rs, función pura con tests
    `launch_visibility_tests`) y ahora consulta `onboarding_completed`.
    PAUSADO (sesión propia): auto-selección de modelo default con descarga
    en background (candidato Nemotron Streaming vs Turbo, probar en es);
    desacoplar `onboarding_completed` de la descarga; pantalla manual como
    fallback.
