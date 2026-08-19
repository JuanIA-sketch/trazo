# Trazo — traspaso de sesión

**Última actualización:** 2026-08-18 (noche) · **Rama:** `main` =
`origin/main` = `227e954` (pusheado con autorización) + el commit local de
este traspaso
**Entrega del hackathon:** 31 de julio de 2026

> **⚠️ LO PRIMERO AL RETOMAR — 2026-08-18 noche (§17): HAY PLAN ACORDADO**
>
> 1. **Charly dejó un plan de 4 puntos EN ORDEN para esta sesión** (§17.2):
>    validar el banner de GPU en pantalla → aterrizar el wakeword (el micrófono
>    NO puede quedar siempre abierto por defecto) → guard del autostart →
>    **cortar release para su novia** (Windows, micrófono normal). Todo lo
>    demás queda EN PAUSA por decisión explícita (§17.2, último punto).
> 2. **El bug B (palabras duplicadas del prefill) está ARREGLADO y commiteado**
>    en `main` (`227e954`), validado en vivo. **Sin pushear.** El bug A
>    (titubeo del onset) queda EN ESPERA del WAV de Benja — decisión de Charly,
>    no adivinar umbrales sin datos (§17.1).
> 3. **El selector de canal vive en la rama `propuesta/selector-de-canal`**
>    (`de2efc9` preservación + `8ada533` blindaje contra sus tres puntos
>    ciegos, 17 tests). Sin enganchar al grabador, a propósito: el enganche
>    espera a que aterrice el wakeword porque comparten `recorder.rs`.
> 4. **Trampa de entorno nueva:** si rustc muere con `0xc0000409`
>    (STATUS_STACK_BUFFER_OVERRUN) con el commit libre en ~3 GB, lo destraba
>    borrar `C:/h/debug/incremental/handy_app_lib-*` (solo caché; **nunca**
>    `cargo clean`). Pasó 3 veces el 18/08 por la noche.
>
> ---
>
> **⚠️ LO PRIMERO AL RETOMAR — 2026-08-18 (§16)**
>
> 1. **El bug del VAD de Benja está REPRODUCIDO** sin su grabación, con su
>    magnitud exacta (16,6 %): un segundo canal con ruido de banda ancha 6 dB
>    bajo la voz, hundido por la mezcla por media. Es la SEÑAL, no el
>    suavizador (§16.1), y eso baja de rango la hipótesis del titubeo (§16.2).
> 2. **Hay una propuesta SIN COMMITEAR**: el selector de canal, 3 archivos y
>    10 tests, que lleva ese 16,6 % al 96,5 % (§16.3). Charly la quería ver
>    antes de desplegarla.
> 3. **Las muestras en inglés NO llegaron**, y el historial rota en 1,5 horas:
>    sin marcar con la estrella se pierden (§16.4).
> 4. `code quality` llevaba semanas rojo por `format:check`; arreglado en
>    `eb650f8`. En Windows ese check acusa 202 archivos y solo 51 son reales
>    (CRLF): separar con `git diff --ignore-cr-at-eol --numstat`.
>
> ---
>
> **Cierre del 2026-08-17 (§15)**
>
> 1. **La lentitud de transcripción está RESUELTA y medida** (§15.1): la GTX 1650
>    se cayó del bus PCI, el índice de GPU guardado quedó caducado y la carga
>    replegó a la iGPU Intel — **66x más lenta** en la medición A/B. La GPU ya
>    está recuperada, y el aviso en pantalla está commiteado (`e93ed62`).
> 2. **`main` local = `origin/main` = `e93ed62`.** Todo lo commiteado está
>    pusheado. §14.3 decía lo contrario y estaba equivocada (§15.2).
> 3. **El árbol tiene TRES grupos de WIP, no uno** (§15.3). El grupo B (atajo
>    F10 dictar-en-inglés) está **terminado y en verde**, solo falta autorización
>    para commitear. El grupo C (wakeword) **no es distribuible**:
>    `FORCE_ALWAYS_ON = true` abre el micrófono permanentemente.
> 4. **§14 se quedó vieja en casi todo.** Antes de creerle nada, leer §15.4.
> 5. Ante cualquier reporte de lentitud, lo PRIMERO es descartar el dispositivo:
>    `C:/h/debug/handy.exe --transcribe-file <wav> --device-index N --repeat 2`.
>
> ---
>
> **Cierre del 2026-08-02 (§13) — parcialmente superado por §15**
>
> 1. **`feat/rebrand-material` YA ESTÁ FUSIONADA en `main`** (`8d83fcc`,
>    autorizado por Charly el 2026-08-02). El rediseño de material y el overlay
>    reactivo están en `origin/main`. ⚠️ **`main` local en `C:\Handy` se quedó en
>    `eafbf8d`, un commit por detrás**, a propósito: ponerlo al día toca dos
>    archivos que el WIP de wakeword tiene sucios (§13.7).
> 2. **RUST VUELVE A COMPILAR** sin haber tocado el pagefile: bastó con cerrar
>    Chrome. **Pero eso NO deroga §11.1** — los builds de hoy fueron
>    incrementales; uno completo probablemente siga sin entrar (§13.1).
> 3. **HAY UN SEGUNDO WORKTREE Y ES EL QUE CORRE**: `C:\trazo-material`. El Vite
>    del 1420 sirve **ese**, no `C:\Handy`. Los dos comparten `target-dir=C:/h`,
>    así que compilar en uno pisa el binario del otro (§12.6, §13.2).
> 4. **El overlay está verificado en vivo**: sin letra "T", píldora sin cortar y
>    capas arregladas. Lo que Charly veía mal **era la corona misma, no el
>    centrado** — y se deja así a propósito hasta que llegue el SVG definitivo,
>    que `CLAUDE.md` sigue dando por `PENDIENTE` sin fecha (§13.3).
> 5. **Wispr Flow impide grabar**: 11 procesos reteniendo el micrófono, arranca
>    solo. Charly pidió no tocarlo; para verificar sin micro, forzar el overlay
>    por CDP (§13.4).
> 6. **El WIP de wakeword de Charly sigue sin commitear** e intacto. Bloquea
>    commitear el selector de tema y la ventana 1100x880, que están **hechos y
>    probados** pero enredados con él en los mismos archivos (§13.5).
> 7. **`gh` apunta al repo equivocado por defecto** (`cjpais/handy`, el
>    upstream). Usar siempre `--repo JuanIA-sketch/trazo` (§11.5).
>
> **El estado consolidado al cerrar, y dos correcciones que importan, están en §14.**
>
> Orden sugerido: **§14.5**. Estado de la máquina: **§14.6**.
>
> **Estado del 2026-07-31 por la tarde (§10)**
>
> 1. **Release [v0.9.1](https://github.com/JuanIA-sketch/trazo/releases/tag/v0.9.1)
>    publicada** con los 7 instaladores, y **validada con instalación limpia
>    real**: instala, arranca, carga el modelo en la GPU y dicta de punta a
>    punta (§10.4). Es la primera vez que alguien prueba el paquete final.
> 2. **Tres cambios en la máquina de Charly** que hay que conocer antes de
>    trabajar: su `bun run tauri dev` está PARADO, el autostart apunta al
>    binario instalado, y su store está en `settings_schema_version: 9`.
>    Cómo revertir cada uno en **§10.5**.
> 3. **A v0.9.1 le faltan dos cosas** (§10.6): el fix del toggle
>    (`f64400b` es posterior al commit que compiló) y el ejecutable dentro del
>    bundle sigue llamándose `handy.exe`.
> 4. **Hey Trazo: el Colab NO ha entregado el `.onnx`.** La integración está
>    hecha y funcionando con un modelo preentrenado, pero **sin commitear** y
>    con `FORCE_ALWAYS_ON = true`, que **mantiene el micrófono abierto** (§10.7).
> 5. **whisper-large-v3-turbo NO traduce.** Medido. Eso convirtió el atajo
>    ES→EN en un no-op y destapó que el toggle "Translate to English" llevaba
>    roto desde siempre (§10.3).

Documento de continuidad entre sesiones de Claude Code. Léelo antes de tocar
nada. Complementa a `CLAUDE.md` (convenciones del fork) y a
`docs/superpowers/specs/` (diseños detallados); aquí está el _estado_ y el
_porqué_, no las convenciones.

> **⚠️ ESTADO AL CERRAR LA SESIÓN DEL 2026-07-30**
>
> 1. **Ya no hay ramas divergentes: `main` y `origin/main` están sincronizados.**
>    Se acabó el enredo de tres estados de las sesiones anteriores. La única otra
>    rama local es `revision-benja`. El release v0.9.0 salió de `a74d97c`.
> 2. **El formalizador de correo está VALIDADO en vivo por Charly e integrado**
>    en `main` (fast-forward de 12 commits, §9.1). La rama
>    `feat/formalizador-correo` **ya no existe**: se borró tras el merge. Suite
>    tras integrar: 39/39 frontend y 275 passed / 0 failed / 1 ignored backend.
> 3. **El repositorio es PÚBLICO desde el 2026-07-28** (§8.1). Antes era
>    privado; se abrió para desbloquear Actions. Los emails de commit y los
>    documentos internos (este archivo incluido) son visibles.
> 4. **Release v0.9.0 publicado** con los 7 instaladores, descarga anónima
>    verificada (§8.2).
> 5. **`batch_vs_loop.rs` se borró** el 30/07 sin haberse commiteado nunca
>    (§4.1: el harness habría que rehacerlo). El `src-tauri/Cargo.toml`
>    modificado es un fantasma de CRLF, no un cambio real: **dejarlo así**.
> 6. **El updater ya firma** (§9.4): clave rotada, `Main Branch Build` de 0/7 a
>    3/7. Los 4 rojos que quedan son macOS y Windows, y **no dependen de
>    trabajo técnico** sino de una cuenta de Apple ($99/año) y de infra de firma
>    de Windows. No perder tiempo depurándolos.
> 7. **El truncado por silencio largo tiene causa raíz y arreglo** (§9.8). El
>    experimento de `extra_recording_buffer_ms` quedó **descartado por datos**:
>    no era pérdida de cola. **No subir ese default.**
> 8. **Diccionario: Tareas 1-3 hechas y en verde, pero SIN VALIDAR EN VIVO**
>    (§9.10). Se paró **a propósito** antes de las Tareas 4-5. Lo primero al
>    retomar es probarlo a mano.
> 9. **Hay tres frentes NUEVOS sin empezar** (§4.0, puntos 6-8): mapa de
>    actividad diaria, openWakeWord para "Hey Trazo", y un bug de
>    reconocimiento en inglés. **Solo existe el enunciado**, no hay diseño ni
>    investigación: hablarlos antes de tocar código.
> 10. **No ejecutar `bun run format:frontend` sobre todo el repo** (§9.11): el
>     proyecto no está formateado según su propio `.prettierrc` y el comando
>     reescribe ~190 archivos.

---

## 1. Estado actual

`main` y `origin/main` están sincronizados al cerrar la sesión.

Respecto a `upstream/main` (cjpais/handy) sigue muy por detrás; ese frente no se
tocó hoy y se revisa después del 31 de julio (§4.4).

### 1.1 Commits clave (orden cronológico inverso)

Los 3 de la sesión de tarde del 2026-07-31 (§10), todos pusheados:

| Commit    | Qué es                                         |
| --------- | ---------------------------------------------- |
| `f64400b` | Fix: turbo deja de anunciar traducción (§10.3) |
| `a48fc8d` | Versión 0.9.1 para cortar instaladores nuevos  |
| `125e9cf` | Mapa de actividad diaria (§10.1)               |

Los 12 de hoy (2026-07-28), del más nuevo al más viejo:

| Commit    | Qué es                                                             | Pusheado |
| --------- | ------------------------------------------------------------------ | -------- |
| `5f1975c` | README: cómo abrir las builds sin firmar (Gatekeeper, SmartScreen) | sí       |
| `481b5b6` | Harness `vad_survival.rs` (diagnóstico del bug de Benja)           | sí       |
| `2c97e4e` | Fix del cuelgue tras descarga de modelo (§7.3)                     | sí       |
| `80f3cbe` | VAD off por defecto + migración v6 (§7.2)                          | sí       |
| `ede3455` | Fix de un escape roto en el parche de config sin firma             | sí       |
| `b7c50a2` | `build.yml` produce build sin firma sin fingir credenciales (§7.5) | sí       |
| `653c056` | Control de ganancia de micrófono en Ajustes (§7.4)                 | sí       |
| `bda3139` | Workflow de build cross-platform sin firma                         | sí       |
| `fbdd2cb` | Handoff: rechazo de `run_batch` + conflicto de la rama de Benja    | sí       |
| `99e0c01` | `history_limit` 5→20 + migración v5                                | sí       |
| `8ad914f` | Reintento troceado cuando el decode entero sale truncado           | sí       |
| `9663e76` | Puerta de silencio + segmentación (`silence_gate.rs`)              | sí       |

Anteriores:

| Commit    | Qué es                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| `a24974b` | Handoff de sesión (este archivo)                                                                             |
| `c4f85e3` | Reglas de reemplazo del diccionario (abreviatura → texto) + importación CSV                                  |
| `bb48136` | Toggle de limpieza con IA visible en Ajustes                                                                 |
| `5f4552e` | Fix: no copiar al portapapeles en paralelo a una inserción exitosa                                           |
| `c2b04b6` | Identidad azul de Trazo (paleta, emblema corona, iconos)                                                     |
| `b152e2f` | **Punto de restauración** del stack de dictado validado + default por hardware + auto-descarga en onboarding |
| `15c7c43` | Watchdog `StreamHealth` + coalescer                                                                          |
| `5a2f371` | Fijar idioma en modelos con códigos regionales (`es` → `es-ES`)                                              |
| `7472764` | Rediseño del overlay como objeto de marca                                                                    |
| `95337a9` | Doble-tap de PTT → grabación continua (badge ∞)                                                              |
| `cb5dee7` | Onda sensible a susurros + pulso por VAD real                                                                |
| `8477b61` | Fix del secuestro de teclado (crate `handy-keys` vendorizada)                                                |
| `13b039c` | Red de seguridad del portapapeles                                                                            |
| `e836a0b` | Perfiles de dictado en español                                                                               |

### 1.2 Sin commitear

> **⚠️ La tabla de abajo es del 2026-07-28 y está OBSOLETA.** El grupo b se
> commiteó en `b170a9e` y el grupo c en `019207e`. **Lo que hay sin commitear
> ahora mismo está en §10.9** (Hey Trazo, atajo ES→EN y el flag `--translate`
> del harness). Se conserva la tabla como registro histórico.

#### Registro histórico (al cerrar el 2026-07-28)

| Archivo                                      | Δ         | Grupo | Qué                                               |
| -------------------------------------------- | --------- | ----- | ------------------------------------------------- |
| `src-tauri/src/rebrand_migration.rs`         | **nuevo** | c     | Migración de datos + limpieza de autostart        |
| `src-tauri/tauri.conf.json`                  | +11 −5    | c     | `productName: Trazo`, `identifier: com.trazo.app` |
| `src-tauri/src/lib.rs`                       | +19 −5    | c     | Llama a la migración; autostart con warning       |
| `src-tauri/src/shortcut/mod.rs`              | +9 −3     | c     | Autostart con warning                             |
| `src-tauri/src/actions.rs`                   | +12 −4    | c     | Identifier nuevo con fallback al viejo            |
| `src-tauri/src/clipboard.rs`                 | +106 −1   | **b** | Espacio separador entre dictados (§2.4)           |
| `src-tauri/src/transcription_coordinator.rs` | +104 −9   | **b** | Reloj del gesto PTT (§2.1)                        |
| `src-tauri/src/shortcut/handler.rs`          | +14 −1    | **b** | Sella el timestamp del evento de teclado          |
| `src-tauri/src/signal_handle.rs`             | +3 −1     | **b** | Firma de `send_input` con timestamp               |
| `src-tauri/examples/batch_vs_loop.rs`        | **nuevo** | —     | Experimento rechazado (§4.1)                      |

> **Ojo con `git status` en esta máquina.** Marca ~80 archivos, pero solo los de
> arriba tienen contenido distinto. El resto son fantasmas de CRLF: `git status`
> los marca y `git diff` no produce ni una línea. Usar siempre:
>
> ```bash
> git diff --numstat   # solo salen los que de verdad cambiaron
> ```
>
> **Nunca `git add -A`.** Metería los fantasmas y los experimentos rechazados.

### 1.2.1 Los tres grupos

| Grupo | Qué                                       | Estado                                          |
| ----- | ----------------------------------------- | ----------------------------------------------- |
| **a** | Probado y en verde                        | **Todo commiteado hoy.** Ya no queda nada aquí. |
| **b** | Pendiente de validación en vivo de Charly | Sin commitear desde el 26/07 (§4.2)             |
| **c** | Rebrand + migración + autostart           | **Commiteado en `019207e`** y pusheado          |

Al cerrar la sesión solo queda el grupo **b** sin commitear, más
`batch_vs_loop.rs` sin trackear.

**Estado de verificación (2026-07-28, con el grupo c aplicado):**
`cargo test --lib` → **237 passed, 0 failed, 1 ignored**. `bun test src/` → 38
passed. `bun run lint` → limpio. `bun run build` → ✓. `check:translations` →
20/20 idiomas. `cargo clippy` → nada nuevo en los archivos tocados.
`cargo fmt --check` → limpio (salvo la deriva conocida de `text.rs`).

### 1.3 Ramas

- `revision-benja` → `origin/feat/rebrand-azul-app` (solo consulta).
- `origin/feat/landing-trazo` → landing de Benjamin, **no integrada**, sin
  worktree montado.

### 1.3.1 ⚠️ CONFLICTO: `c2b04b6` (mío) vs `feat/rebrand-azul-app` (Benjamin)

**Hablar esto con Benjamin ANTES de que siga trabajando sobre esa rama.**
Los dos hicimos el mismo rebrand azul, por separado, partiendo del mismo punto.

**Los datos** (medidos el 2026-07-27, no estimados):

```
merge-base(main, origin/feat/rebrand-azul-app) = 37814bc
  "refactor: swap Handy logo art for a Trazo text placeholder"
```

- Su rama tiene **2 commits** sobre `37814bc`:
  `03a23af` (identidad azul en app + overlay) y `93720e7` (icono de app).
- `main` tiene **11 commits** sobre `37814bc` que su rama **no tiene**,
  incluidos `cb5dee7` (onda sensible al susurro + pulso VAD), `95337a9`
  (doble-tap → grabación continua), `7472764` (rediseño del overlay) y mi
  propio `c2b04b6` (identidad azul).

**Comparación fichero a fichero (2026-07-27): el conflicto es MUCHO más pequeño
de lo que parecía.** Él tocó 55 archivos; `main` tocó esos mismos 55. Pero al
comparar el contenido resultante, **52 de los 55 ya son byte-idénticos**:

| Archivos                           | Estado `main` vs su rama               |
| ---------------------------------- | -------------------------------------- |
| 50 PNG/ICO/ICNS de iconos          | ✅ **idénticos** — cero conflicto      |
| `src/overlay/corona.png`           | ✅ **idéntico**                        |
| `src/styles/theme.css`             | ✅ **idéntico** (mismo blob `f64ef68`) |
| `src/overlay/RecordingOverlay.tsx` | ❌ difiere                             |
| `src/overlay/RecordingOverlay.css` | ❌ difiere                             |
| `src-tauri/src/overlay.rs`         | ❌ difiere                             |

**`theme.css` es literalmente el mismo cambio, no dos cambios parecidos.** Los
dos lados parten del blob `33fa5c2` y llegan al blob `f64ef68`: mismos hex,
mismos comentarios, misma línea `/* Navy premium del rebrand Trazo (mockup
#0B1220) */`. No es coincidencia — es el patrón "extraer, no fusionar" de §2.7:
`c2b04b6` se llevó su paleta y sus iconos **tal cual**. Lo mismo vale para los
50 iconos y `corona.png`.

**Corrección a lo que decía antes esta sección:** los iconos NO son un "uno u
otro". Ya están resueltos, y a favor de los suyos. La conversación con
Benjamin se reduce a **tres archivos, todos del overlay**.

**Y ni siquiera esos tres son un choque de diseño simétrico.** El diff completo
`main` → su rama son **−3640 líneas**: su rama no es un rebrand rival, es una
**base vieja**. Yendo de `main` a su rama se _borran_, entre otras cosas:

```
-pub fn show_continuous_overlay(...)   // el badge ∞ del doble-tap
-pub fn emit_speech_state(...)         // el pulso por VAD real
```

más `tap_gesture.rs` entero (−262), `waveform.ts` (−17), `silence_gate`… Su
`03a23af` estilizó el overlay **antes** de que `7472764` lo rediseñara como
objeto de marca (pill negro, borde degradado, marca "T" con trazo animado).

**Ninguna de las dos ramas está pusheada la una contra la otra**, así que hoy
nadie ha perdido nada. La decisión sigue abierta.

**Lo único que hay que decidir con él:** si en su estilizado azul del overlay
(`03a23af`) queda algo que valga la pena rescatar dentro del rediseño de
`7472764`, o si ese commit ya está superado y se descarta. Es una pregunta de
diseño, de 3 archivos, no un problema de merge.

**Lo que NO hay que hacer:** `git merge origin/feat/rebrand-azul-app` a ciegas
(traería el borrado de las features de arriba), ni que él siga añadiendo commits
sobre `37814bc` — cada commit nuevo suyo sobre esa base parte de un árbol al que
le faltan 11 commits. Lo sano es que **rebase sobre `main` ya pusheado**.

### 1.4 Configuración local de Charly (su máquina, no son defaults)

| Ajuste                 | Valor            | Nota                                                      |
| ---------------------- | ---------------- | --------------------------------------------------------- |
| `selected_model`       | Whisper Turbo Q8 | Su GTX 1650 lo corre mejor que Nemotron                   |
| `selected_language`    | `es`             | Fijado a propósito, no `auto`                             |
| `clipboard_handling`   | `dont_modify`    | **Solo su máquina**; el default sigue `copy_to_clipboard` |
| `paste_method`         | `ctrl_v`         |                                                           |
| `bindings.transcribe`  | **`alt_left`**   | Modificador desnudo, PTT. Cambió desde Ctrl+Espacio       |
| `push_to_talk`         | `true`           | Usa doble-tap para latchear, casi nunca mantiene          |
| `history_limit`        | **20** (era 5)   | Migrado por v5, confirmado en el store                    |
| `post_process_enabled` | `true`           | OpenAI + gpt-4o-mini, perfil `default_es_casual`          |

---

## 2. Decisiones del 2026-07-26 y su porqué

### 2.1 El bug de la tecla Alt: el reloj del gesto, no el teclado

**Resuelto.** El handoff anterior lo planteaba como interferencia de un
modificador ajeno. Era falso: **`alt_left` ES su tecla de dictado** (binding
`transcribe`), así que "la tecla Alt corta el dictado" significaba "mi tecla
de dictado corta el dictado".

Causa raíz confirmada con logs: `transcription_coordinator.rs` llamaba
`action.start()` de forma **síncrona** sobre su propio hilo (abre micrófono,
tray, overlay: **298–774 ms medidos**) y fechaba los gestos con
`Instant::now()` **al desencolar**. El hold medido = hold real + bloqueo.
El 2026-07-25 a las 14:36:33 el arranque tardó **774,57 ms** > `TAP_MS`
(600 ms) → el tap se leyó como `HoldEnd` → parada inmediata →
`sample count: 0`. Correlación 4 de 4: el único arranque que superó 600 ms
fue el único dictado que murió.

Fix: sellar el evento con `Instant::now()` en `shortcut/handler.rs` (antes de
tocar settings, que puede bloquear) y propagarlo por el canal
(`Command::Input { at }`) hasta el detector. El mismo arreglo se aplicó al
debounce, que tenía el bug espejo (dos pulsaciones encoladas se desencolan
juntas y la segunda se descartaba como repetición de tecla).

Tests: `a_tap_dequeued_after_a_blocking_start_is_still_a_tap` (lleva un
`sleep(700ms)` a propósito: es la única forma de reproducir un sesgo que
consiste en que el reloj avanzó) y
`a_real_long_hold_is_still_a_hold_when_dequeued_immediately` (cierra la puerta
al arreglo tramposo de ignorar el tiempo).

**Pendiente:** validación en vivo con arranque en frío + doble-tap inmediato.
En `handy.log`, buscar `TranscribeAction::start completed in` > 600 ms y
confirmar que aun así latchea.

### 2.2 Whisper trunca al encontrar silencio largo — descubrimiento clave

Con nivel de micrófono sano, un dictado de 29,4 s devolvía **9 palabras**.
Quitándole **1,8 s** de silencio sostenido devolvía **68**. El VAD no lo
evita: Silero da `prob > 0.3` sobre ruido de sala, así que `SmoothedVad` nunca
sale del estado de habla y su hangover nunca expira.

Cosas que se descartaron **con experimento**, no por intuición:

- **Ganancia de audio:** +14,7 dB sobre el mismo WAV no cambió una coma.
- **Subir el volumen de entrada en Windows:** Charly lo hizo (~20 dB, visible
  en los datos: p90 pasó de −36 a −15 dBFS). **El truncado siguió igual.** Era
  un factor, no la causa.
- **Meter la puerta dentro de la cadena VAD:** el prefill de 450 ms de
  `SmoothedVad` reinyecta el silencio que se acaba de quitar (29,4 → 29,2 s,
  26 de 68 palabras). El prefill protege el ataque de las palabras y debe
  seguir siendo generoso.
- **Recortar el silencio en sitio:** la recuperación resultó **caótica y no
  monótona** (9/18/26/42/68 palabras para entradas casi idénticas). Empujar a
  un sistema caótico no es un arreglo.

**Trazo no tiene control de ganancia/sensibilidad de micrófono.** Lo único
parecido es `RecordingVolume`/`VolumeSlider`, que es ducking del volumen de
**salida** en Windows. El `GAIN` de `visualizer.rs` es cosmético (la onda).
Se evaluó añadir uno y el experimento dice que **no resolvería esto**.

### 2.3 La estrategia final: entero primero, trocea solo si sale truncado

Trocear **siempre** fue una regresión neta, medida contra el audio con un A/B
(`es_model_eval` = archivo entero sin trocear, vs. el camino troceado): perdía
"número 7 con términos técnicos como cloud code", ~17 palabras en otra, y
convertía "si yo hablo, termino de hablar" en "si yo Pablo e terminó la".
Cortar en silencios parte palabras a caballo del corte y deja tramos sin
contexto.

Pero el decode entero truncaba en **otras** tres. Ninguna estrategia gana
siempre, así que `transcribe_recording` (en `managers/transcription.rs`)
decodifica entero primero y **solo reintenta troceado si el resultado parece
truncado**, medido en palabras por segundo-de-voz (`looks_truncated`).

- Umbral: **2,7 palabras/segundo-de-voz**. Calibrado con los conteos del
  decode **entero** sobre el corpus 404-408: las truncadas iban a 1,31 / 1,86 /
  2,08; las completas a 3,48 / 4,09.
- `MIN_JUDGEABLE_SPEECH_S = 3.0`: por debajo no se juzga (una respuesta corta
  no es un fallo).
- **El reintento se descarta si no recupera palabras.** Eso hace barato un
  falso positivo: cuesta tiempo, nunca precisión.

Coste: el camino normal **no paga nada** (71 s de audio en 6,7 s, 10,6× tiempo
real). Solo el reintento cuesta ~2-2,6× tiempo real.

**No cambiar esta lógica ni el umbral sin volver a correr un corpus.**

### 2.4 Espacio separador entre dictados consecutivos

Dictar dos veces en el mismo campo pegaba los transcriptos ("holamundo").
`needs_separating_space(previous, next)` en `clipboard.rs`, con un
`static LAST_INSERTION` que guarda lo último insertado.

Detalle de diseño: **no se puede leer el carácter anterior al cursor** en una
app ajena, así que la decisión se toma sobre _nuestra propia inserción
anterior_ — que es exactamente el caso "tras un dictado anterior".

Compone solo con `append_trailing_space` sin caso especial (si esa opción está
activa, el texto previo ya acaba en espacio y la función devuelve `false`).
Se limpia cuando el pegado falla o cuando el auto-submit envía el campo.
`PasteMethod::None` no lee ni escribe el historial (no inserta en ningún sitio).

### 2.5 `history_limit` 5 → 20 + migración de esquema v5

**El default de 5 borró tres corpus de evaluación en un solo día**, uno de
ellos _mientras se copiaban los archivos_. Con
`recording_retention_period = PreserveLimit` (el caso de Charly) se lleva
también los WAV, así que el audio se pierde para siempre.

- Setting: `history_limit: usize` (`settings.rs`), default en
  `default_history_limit()`, ahora **20**.
- Constante nueva `LEGACY_HISTORY_LIMIT = 5`, pública, para que la migración
  distinga un default heredado de un número elegido.
- **Migración v5** (`CURRENT_SETTINGS_SCHEMA_VERSION` 4 → 5): sube a 20
  **solo si el valor guardado es exactamente 5**. Cualquier otro número
  sobrevive intacto.
- Límite aceptado y documentado: quien eligiera deliberadamente 5 también se
  mueve, porque el store no guarda quién lo eligió. Es un clic revertirlo.
- Disco: un dictado de 30 s pesa <1 MB; 20 grabaciones son decenas de MB.

Tests nuevos: `default_history_limit_holds_a_test_corpus`,
`history_limit_migration_raises_the_untouched_legacy_default`,
`history_limit_migration_keeps_a_deliberate_choice` (prueba 3, 50 y 200).

**Confirmado aplicado:** tras reiniciar la app, el store de Charly muestra
`history_limit = 20` y `settings_schema_version = 5`.

### 2.6 Experimento rechazado: ventanas de segmento más grandes

`MIN_SEGMENT_MS` 1500→2500 y `MAX_SEGMENT_MS` 8000→12000, para gastar menos
decodes. **Rechazado con datos**, y está documentado en la propia constante
para que nadie lo reintente a ciegas.

A/B sobre el mismo audio: ahorró **un solo decode en todo el corpus (9 → 8)**
y en una grabación la fusión creó un tramo de 10,0 s que **se truncó
internamente y perdió 13 palabras** (32 → 19). Reproducido dos veces, salida
idéntica.

Detalle que importa: **el mecanismo de auto-corrección no lo salva.** El
reintento solo compara contra el decode entero (19 > 16, así que lo acepta) y
nunca ve las 32 palabras que producían las ventanas pequeñas. La detección
sirve para "el decode entero se cortó", no para "el tramo fusionado se cortó".

### 2.7 Decisiones anteriores que siguen vigentes

Resumen; el detalle está en el historial de git y en `CLAUDE.md`.

- **El rebrand de Benjamin se extrajo, no se fusionó.** Si sube más diseño,
  repetir el patrón: extraer, no fusionar.
- **`DontModify` solo en la máquina de Charly.** El default distribuido sigue
  siendo `CopyToClipboard`. **No cambiar sin pedírselo otra vez.**
- **El default de modelo lo decide `has_dedicated_gpu`** (las iGPU no cuentan).
  GPU dedicada → Turbo; solo CPU → Nemotron.
- **El watchdog de streaming existe por Nemotron** y aplica a cualquier modelo
  streaming futuro.
- **El post-procesado con LLM es manual por diseño.** No convertirlo en
  automático sin decisión explícita de Charly.
- **Timings del doble-tap: 600/800 ms**, calibrados con su mano. No bajarlos
  sin volver a probarlos.

---

## 3. Bugs conocidos y riesgos aceptados

### 3.1 ~~La tecla Alt corta el final~~ — RESUELTO (§2.1)

Falta la validación en vivo descrita al final de §2.1.

### 3.2 ~~Riesgo aceptado~~ → ERA UN BUG, y está ARREGLADO (2026-07-30)

**Lo que decía esta sección era falso.** Afirmaba que el `DontModify` de la
máquina de Charly era «un trade-off que él aceptó a sabiendas, no un bug».
Charly confirmó el 30/07 que **nunca tocó ese ajuste**, y la investigación
encontró la causa: un bug de la interfaz (§9.5). No era una preferencia, era
corrupción silenciosa de un ajuste de seguridad de datos.

Consecuencia de haberlo dado por elegido: quedó **cuatro días** catalogado como
riesgo aceptado en vez de investigarse, y en ese tiempo cualquier pegado que
fallara en silencio perdía el dictado sin dejar respaldo.

**Lección:** «el usuario lo eligió» es una hipótesis, no un hecho, mientras no
se le pregunte. Aquí se escribió como hecho y cerró la investigación.

### 3.3 Efecto colateral — ya no aplica

Con `DontModify` el aviso "Texto copiado" no aparecía en pegados exitosos.
Tras el arreglo de §9.5 y la migración v8 el default vuelve a ser
`CopyToClipboard`, así que el aviso reaparece. Solo sigue faltando para quien
haya elegido `DontModify` **a propósito** después de la v8, que es el
comportamiento correcto.

### 3.4 Calidad residual del reintento troceado

El reintento recupera contenido pero no iguala al decode entero cuando este
funciona: pierde contexto entre tramos, así que la puntuación y las mayúsculas
salen menos consistentes. El post-procesado con LLM lo limpia. Casos
observados: "la función de" → "la flor de" en un tramo corto.

### 3.5 Disco C

Vigilar antes de builds grandes. `C:\h` (target de Rust) ocupa ~25 GB. Solo se
libera con `cargo clean` completo; borrar por partes rompe la caché.

---

### 3.6 Causa raíz del truncado del VAD — ABIERTA

Contenido con el default en `false` + migración v6 (`80f3cbe`), pero la causa
real sigue sin identificarse. Bloqueado esperando el experimento de Benja.
Detalle completo en §7.2.

### 3.7 `unload_model()` ignora `active_engine_lease`

Puede limpiar `current_model_id` y emitir "unloaded" mientras el worker de
streaming todavía tiene el motor prestado fuera del mutex. Estado inconsistente
real, detectado al diagnosticar §7.3, **no arreglado** y no es la causa de aquel
cuelgue. Mirar al tocar esa zona.

## 4. Próximos pasos

### 4.0 Inmediatos (orden sugerido al retomar) — actualizado 2026-07-30

**Hechos y cerrados:** ~~validar la migración del rebrand~~ (§8.3, 19/19)
· ~~revisar el matrix con el nombre nuevo~~ (§8.2, 5/5 y release publicado)
· ~~validar y commitear el grupo b~~ (§8.5, `b170a9e`)
· ~~validar e integrar el formalizador~~ (§9.1 — validado en vivo por Charly
y mergeado a `main` en fast-forward)
· ~~la contraseña del updater~~ (§9.4 — clave rotada, CI de 0/7 a 3/7; el
diagnóstico de §7.6 resultó ser falso)
· ~~el `dont_modify` que nadie eligió~~ (§9.5 — arreglado, con migración v8)
· ~~auditoría de los fallbacks de la interfaz~~ (§9.6 — tres desalineados).

Lo que queda, por orden:

1. **~~El experimento de `extra_recording_buffer_ms`~~ → DESCARTADO por datos.**
   No era pérdida de cola: las 25 grabaciones tienen 1540 ms de silencio final
   de mediana (§9.2). La causa real era otra y **ya está arreglada** (§9.8): el
   rescate no se disparaba porque su medida de habla depende del nivel de
   grabación. **No subir ese default.**

   Lo que queda de ese hilo: **el suelo absoluto de −50 dBFS sigue sin tocarse**
   (§9.8, "sigue abierto"). La segunda red tapa el síntoma en el rescate, pero
   `speech_seconds` sigue midiendo de menos y esa medida la usan también
   `speech_segments` y el troceado. Con el WAV de Benja:
   `cargo run --example silence_gate_probe -- <wav> [palabras]`.

2. **~~Preguntar a Benja qué `paste_method` tiene~~ → RESPONDIDO: `ctrl_v`.**
   La predicción era `Direct`, así que **el diagnóstico del bug 1 en §8.8 queda
   refutado**. La causa real resultó ser otra y ya está arreglada: no era el
   método de pegado sino `clipboard_handling` en `dont_modify`, puesto ahí por
   el bug de la interfaz (§9.5). Benja y Charly tenían el mismo `ctrl_v`; lo que
   los igualaba era el otro ajuste.
3. **Esperar el resultado de Benja con `vad_survival.rs`** (§7.2). Decide entre
   dos causas incompatibles y no se puede avanzar sin su hardware. Preguntarle
   también con qué prueba concreta descartó el downmix.
4. **Validar en vivo el diccionario** (§9.10). Tareas 1-3 hechas y en verde,
   pero **nadie las ha probado a mano**: abrir Historial → icono de corrección
   → ver el impacto antes de guardar → comprobar que el **siguiente** dictado
   sale corregido, y que el dictado guardado **no** cambió.
5. **Diccionario, Tareas 4 y 5** (siembra y propuestas automáticas). Paradas a
   propósito. Al retomar la siembra, respetar el guardarraíl del plan: **ninguna
   regla sembrada puede coincidir con palabras españolas comunes ni nombres de
   persona** — está medido en el spec por qué (§3 del spec).

### Frentes NUEVOS — ESTADO ACTUALIZADO el 2026-07-31 por la tarde

> **⚠️ Los tres puntos de abajo YA SE TRABAJARON.** Resumen y punteros:
>
> 6. **Mapa de actividad diaria** → **HECHO y pusheado** en `125e9cf` (§10.1).
> 7. **openWakeWord / "Hey Trazo"** → investigado **e integrado**, funcionando
>    con un modelo preentrenado. **Sin commitear** y esperando el `.onnx` del
>    Colab (§10.7).
> 8. **Bug de reconocimiento en inglés** → reproducido y acotado con el WAV real
>    (§10.2). **No estaba resuelto**: falta una muestra de más de 6-7 s marcada
>    con estrella. Y por el camino apareció algo más gordo: turbo **no traduce**,
>    lo que dejó muerto el toggle "Translate to English" (§10.3, arreglado en
>    `f64400b`).
>
> Lo de abajo es el enunciado original, conservado como registro.

6. **Mapa de actividad diaria.** Sin definir: qué mide, dónde se ve y para qué
   sirve. Los datos que ya existen y podrían alimentarlo son `history.db`
   (timestamps de cada dictado) y la carpeta `recordings`.
7. **Investigar openWakeWord para "Hey Trazo".** Palabra de activación por voz.
   Es **investigación, no implementación**: hoy la app solo se dispara por
   atajo, y una escucha permanente toca privacidad, CPU y batería. Ojo con
   `always_on_microphone`, que hoy viene en `false`.
8. **Bug de reconocimiento en inglés.** Reportado sin detalle. Antes de nada
   hace falta **un caso reproducible**: qué se dictó, qué salió, y el WAV — que
   la app guarda solo en `recordings`. Con eso, `scripts/tail_silence.py` y
   `cargo run --example silence_gate_probe` dicen en un minuto si es captura,
   truncado o el modelo. Recordar que `selected_language` está fijado a `"es"`
   (§7 de CLAUDE.md), lo cual es sospechoso de entrada para un dictado inglés.

### Registro del encargo original del diccionario

**Diccionario de reemplazos — SPEC APROBADO, Tareas 1-3 hechas (§9.10).**
Spec en `docs/superpowers/specs/2026-07-30-diccionario-reemplazos-design.md`
(`55d871b`), aprobado por Charly el 30/07 incluido el giro de diseño: la
lista **no** va al motor difuso porque se midió y corrompe (5 de 12 frases:
"flujo"→"Flux", "Claudia"→"Claude"). Las reglas se proponen desde el
historial del propio usuario, con previsualización del radio de impacto.
Decidido también: **quitar `custom_words: ["Claude"]`** de los ajustes de
Charly y cubrirlo con la regla exacta `cloud → Claude` (2 aciertos, 0 roturas
en su corpus). **Pendiente de ejecutar**, requiere cerrar la app.
Registro histórico del encargo original:
junto al formalizador y se decidió hacerlas en secuencia, con spec propio:
(a) lista precargada de términos de la comunidad de IA, (b) corrección rápida
desde el Historial que alimente `custom_replacements`. Reutiliza el motor ya
construido (`apply_custom_replacements`, `audio_toolkit/text.rs:113`), no es
infraestructura nueva. **No empezada.**

**Backlog explícito de Charly (post-hackathon):** cancelación de ruido (no
priorizar antes del viernes) · aprendizaje "puro" — usar la confianza interna del
modelo para detectar sus propias palabras dudosas y pasarle el vocabulario del
usuario a Whisper como pista **antes** de transcribir, no corrigiendo después. De
esto último **queda una investigación de 10-15 min sin hacer**: averiguar si
`transcribe-cpp` expone datos de confianza por palabra. Sin compromiso de
construir nada.

### 4.1 ~~Experimento pendiente~~ → RECHAZADO con datos (2026-07-27)

`run()` en bucle vs `Session::run_batch()`. Era la última optimización de
velocidad viva tras la investigación de §5. **Medida y descartada.**

Harness: `src-tauri/examples/batch_vs_loop.rs`, **borrado el 2026-07-30 sin
llegar a commitearse** (era el grupo c de §1.2.1). Usaba el `speech_segments()`
real, así que decodificaba exactamente los tramos que decodificaría el reintento
troceado. Se invocaba así:

```bash
cargo run --example batch_vs_loop -- <model.gguf> --lang es \
    --backend vulkan --gpu 1 [--repeat 3] [--control] <wav>...
```

Se borró a propósito: el experimento está cerrado con datos y el archivo solo
ensuciaba el `git status`. **Si alguien quiere reabrir esto, el harness hay que
rehacerlo** — no está en el historial de git, en ninguna rama. Lo que sí queda
es el diseño, que es la parte con valor: 274 líneas cuyo detalle importante es
el modo `--control` descrito abajo.

**Criterio de éxito era: el texto no debe cambiar. Cambió.**

Corpus: `handy-1785086655.wav` (7,3 s → 2 tramos: 4,2 s + 2,0 s), Whisper
Turbo Q8, Vulkan sobre la GTX 1650.

```
tramo 1: LOOP  |Pueden ver cómo funciona.|
         BATCH |Puedes ver cómo funciona.|
```

Idéntico en las 3 pasadas. El tramo largo sale igual siempre; el que cambia es
el corto.

**El control es lo que hace que valga la conclusión.** Con `--control` el
harness corre el camino de bucle **dos veces** en vez de bucle-vs-batch:
6 decodes, texto idéntico bit a bit. O sea que la diferencia no es
no-determinismo de Vulkan ni deriva de sesión — **es `run_batch` produciendo
otro decode.**

**Y encima es más lento**, no más rápido (warm-up descartado antes de medir):

| pasada | bucle | batch | speedup |
| ------ | ----- | ----- | ------- |
| 1      | 2,76s | 2,92s | 0,94×   |
| 2      | 2,94s | 3,13s | 0,94×   |
| 3      | 2,91s | 3,05s | 0,95×   |

**Conclusión:** `run_batch` no es "los mismos tramos agrupados". El camino
batched del C++ usa máscara de cross-pad por utterance (§5.3), o sea otra ruta
de cómputo. No cumple el criterio y no aporta velocidad en este hardware.
Tercer experimento de optimización rechazado con datos, junto a la fusión de
tramos (§2.6) y las ventanas grandes.

**Límite honesto de la medición:** n=1 archivo, 2 tramos. El veredicto de
_texto_ es sólido (reproducible + control limpio). El de _velocidad_ no se
generaliza: con 4-6 tramos batch podría ganar tiempo. Da igual — el criterio
era el texto.

**Trampa de entorno descubierta aquí:** con `--backend vulkan` sin `--gpu`, el
device 0 es la iGPU Intel y el mismo audio tarda **64 s en vez de 2,7 s** (24×).
Es la misma trampa del §4 de `CLAUDE.md`. En cualquier medición sobre esta
máquina, **pasar `--gpu 1` siempre**.

### 4.2 ~~Validaciones en vivo pendientes~~ → HECHAS (§8.5, `b170a9e`)

> **Esta sección está cerrada.** El grupo b se validó en vivo y se commiteó en
> `b170a9e`. Lo de abajo se conserva solo como registro de qué se probó y cómo;
> **no es una lista de tareas pendientes.**

- **Fix del reloj del gesto / bug de Alt** (§2.1) — arranque en frío +
  doble-tap inmediato. En `handy.log`, buscar `TranscribeAction::start
completed in` > 600 ms y confirmar que **aun así latchea**.
  Archivos: `transcription_coordinator.rs`, `shortcut/handler.rs`,
  `signal_handle.rs`.
- **Espacio separador** (§2.4) — dictar dos veces seguidas en el mismo campo y
  ver que no sale "holamundo". Archivo: `clipboard.rs`.
- **Onboarding hardware-aware** (default de modelo por `has_dedicated_gpu`,
  §2.7) — ⚠️ **esto ya está commiteado en `b152e2f`**, no se puede "dejar
  fuera del commit". Si la validación en vivo falla, hay que revertirlo o
  arreglarlo encima, no descommitearlo. Está entre los 11 sin pushear, así que
  aún se puede decidir antes de que llegue a `origin`.

### 4.3 Corpus de evaluación

Con `history_limit = 20` ya se puede juntar un corpus de 10-15 dictados sin
que se auto-borre. Sirve para reconfirmar el umbral de 2,7 (calibrado con
n=5) y para el experimento de §4.1. Hay copias de seguridad del corpus del
26/07 en el scratchpad de la sesión (`scratchpad/corpus/`), que **desaparece
al cerrar la sesión** — si hacen falta, copiarlas a un sitio estable.

### 4.4 Otros

1. **Las ramas de Benjamin NO se tocan** (`origin/feat/landing-trazo`,
   `origin/feat/rebrand-azul-app`). Decisión de Charly del 2026-07-30: las
   maneja él y la fusión se hace **cuando los dos estén listos**, no antes. Esto
   deja sin efecto la urgencia que plantea §1.3.1: no montar worktrees ni
   preparar merges de esas ramas por iniciativa propia.
2. **Pendiente del rebrand: SOLO el logo definitivo.** El identificador ya es
   `com.trazo.app` y el `productName` ya es `Trazo` (verificado en
   `tauri.conf.json` el 30/07; la nota 8 de `CLAUDE.md` sigue diciendo lo
   contrario y también está desfasada). Ojo con el logo: son placeholders de
   texto **sin ningún `TODO` en el código**, así que no aparecen en ninguna
   búsqueda — es el pendiente más fácil de olvidar.
3. **Después del 31 de julio**: revisar los 58 commits del upstream sin
   integrar (`eb9301e`, `0470d9a`, `fc465b4`, bumps de `handy-keys`
   0.3.1/0.3.2 — **verificar si arreglan el secuestro antes de
   des-vendorizar**), PR al upstream con el fix de `handy-keys`.

---

## 5. Investigación cerrada: la ventana de 30 s de Whisper

Pregunta: ¿se puede abaratar cada decode acortando la ventana fija de 30 s
para tramos cortos? Investigado sobre el código real de `transcribe-cpp 0.1.1`
y `transcribe-cpp-sys 0.1.1` en el registro de cargo.

**Aviso previo: esto NO es whisper.cpp upstream.** Es una reimplementación
propia (`arch/whisper/`, `transcribe-bin-loader`). Lo que se sepa de
`whisper_full_params.audio_ctx` no aplica directamente.

### 5.1 ¿Existe el parámetro? A nivel de API, no

`WhisperRunOptions` (`family.rs`) expone `initial_prompt`,
`condition_on_prev_tokens`, `temperature`, `temperature_inc`,
`compression_ratio_thold`, `logprob_thold`, `no_speech_thold`,
`max_prev_context_tokens`, `seed`, `max_initial_timestamp`. **No hay
`audio_ctx` ni equivalente.** `SessionOptions.n_ctx` es contexto de texto/KV,
no de audio.

**Pero el motor por dentro sí lo soporta.** El encoder se construye con
`T_enc = n_mel_frames / 2` y toma una vista prefijo de los embeddings
posicionales cuando `T_enc < enc_max_source_positions`
(`arch/whisper/encoder.cpp:249-254`). El grafo es de longitud variable; el
1500 no está clavado en la arquitectura.

Quien rellena es el llamante, a propósito (`arch/whisper/model.cpp:1222-1229`):

> _"Short-form (n_samples <= fe_n_samples): pad PCM to fe_n_samples (480000)
> -> exactly fe_nb_max_frames (3000) mel frames."_

**Conclusión: la capacidad existe, la decisión de rellenar es deliberada del
llamante y no es configurable desde fuera.** Aprovecharla exigiría parchear la
crate.

### 5.2 ¿Qué efecto tendría en la calidad? Sin datos, y mala apuesta

No hay medición en este repo. Lo que sí se sabe es **por qué** el código
rellena a propósito: Whisper fue entrenado con ventanas de 30 s rellenadas, así
que el padding es parte de la distribución que el modelo espera. Acortar la
ventana es el truco `audio_ctx` de whisper.cpp, cuya reputación es que acelera
pero degrada de forma no lineal e impredecible.

**Descartado**: es la misma clase de apuesta que ya falló dos veces hoy
(fusión de tramos, ventanas grandes). Sonaba bien y los datos no acompañaron.

### 5.3 Alternativas

- **Rellenar el tramo con silencio propio: no sirve.** El motor ya rellena a
  480000 muestras internamente; darle silencio nuestro produce el mismo
  `T_enc = 1500` y el mismo coste. Cero ganancia.

- **Batchear varios tramos: existía, se midió, se rechazó (§4.1).** Lo que
  sigue era la hipótesis; la medición del 27/07 la refutó — el texto cambia y
  el tiempo empeora. Se deja escrito para que nadie la vuelva a proponer
  creyendo que no se probó.
  `Session::run_batch(pcms: &[&[f32]], options) -> Result<Vec<Result<Transcript>>>`
  (`transcribe-cpp-0.1.1/src/session.rs:185`), documentado como
  _"Transcribe several buffers in one call (throughput path)"_. Cada tramo
  mantiene su decode independiente y su resultado propio; un tramo malformado
  solo falla su slot. **No los concatena como audio continuo**, que es
  justo lo que rompía la fusión. El C++ lo confirma: hay un camino batched con
  `T_enc == 1500` por utterance y máscara de cross-pad por utterance
  (`arch/whisper/model.cpp:231-233`).

  Ganancia esperada: paralelismo sobre varios encoders, **no** eliminación del
  relleno. Cada tramo sigue costando su ventana, pero se computan juntos.
  Experimento en §4.1.

---

## 6. Contexto de entorno (Windows)

```powershell
# OBLIGATORIO en Windows (ya permanente vía .cargo/config.toml con skip-worktree)
$env:CARGO_TARGET_DIR = "C:\h"

bun install
bun run tauri dev
```

- **Cerrar `handy.exe` antes de cualquier `cargo build/check/test` que
  re-enlace.** Ojo: puede haber **procesos huérfanos con PID distinto** al que
  cerró el usuario (pasó hoy: cerró 39224 y seguía vivo 86756). Comprobar con
  `Get-Process handy*`.
- **NUNCA editar fuentes con `Get-Content`/`Set-Content` de PowerShell 5.1.**
  Decodifica como ANSI y **corrompe el UTF-8** (los guiones largos de los
  comentarios se vuelven `â€"`). Pasó hoy con `actions.rs` y `lib.rs`; se
  detectó con `grep -c 'â€\|Ã'` y se arregló con `git checkout` + la
  herramienta Edit. Para editar código, usar siempre Edit.
- **`cargo fmt` reformatea `src-tauri/src/audio_toolkit/text.rs`** cada vez
  (deriva preexistente: `c4f85e3` se commiteó sin formatear). Se revierte con
  `git checkout -- src-tauri/src/audio_toolkit/text.rs` para no ensuciar el
  diff. Conviene arreglarlo en un commit aparte.
- **Regenerar `src/bindings.ts`**: `cargo run -- --list-models` **desde
  `src-tauri/`**. Desde la raíz escribe en `C:\src\bindings.ts`.
- **Editar `settings_store.json` a mano**: sin BOM, y con la app cerrada.
- **Herramienta de diagnóstico útil**: `cargo run -- --transcribe-file <wav>`
  corre el camino real de la app (entero → detección → reintento) y registra
  los tramos con `RUST_LOG=handy_app_lib::managers::transcription=warn`.
  `cargo run --example es_model_eval -- <model.gguf> --lang es <wav>...` da la
  línea base **sin trocear** — sirve para A/B, pero **no ve la segmentación**,
  así que no vale para validar cambios en `silence_gate.rs`.
  El modelo está en
  `~/.cache/huggingface/hub/models--handy-computer--whisper-large-v3-turbo-gguf/snapshots/<hash>/whisper-large-v3-turbo-Q8_0.gguf`.
- **Tests:**
  - `cargo test --lib` → **212 tests**.
  - `cargo test --lib -- --ignored` → incluye el que carga Whisper real (~90 s).
  - `bun test src/` → 38 tests, acotado a `src/` a propósito.
  - `bun run check:translations` → valida las 21 locales.
  - `cargo test` dentro de `src-tauri/vendor/handy-keys`.
- **Los tests de perfiles ES llaman a la API real de OpenAI.** Fallan
  esporádicamente por red o por no determinismo del LLM — pasó dos veces hoy y
  ambas pasaron al reintentar. Reintentar antes de sospechar una regresión.
- **Convención del repo:** TDD siempre (test en rojo visto fallar primero) y
  **nunca commitear ni pushear sin confirmación explícita de Charly.**

---

## 7. Sesión 2026-07-28

### 7.1 Rebrand + migración de datos + autostart — `019207e`

Commiteado y pusheado. Charly respaldó su carpeta de datos antes de aprobarlo.

- `productName`: `Handy` → **`Trazo`**
- `identifier`: `com.pais.handy` → **`com.trazo.app`**

**Por qué hizo falta una migración.** Tauri deriva el directorio de datos del
`identifier`, así que cambiarlo apunta la app a un directorio vacío: ajustes,
historial, grabaciones y **claves de API guardadas** parecen haberse esfumado.
El módulo nuevo `rebrand_migration.rs` copia `com.pais.handy` → `com.trazo.app`
en el primer arranque.

Decisiones, cada una con test:

- **Copia, no mueve.** Si la build nueva falla, la instalación anterior sigue
  intacta y reinstalar la versión vieja encuentra sus datos.
- **La condición es que exista `settings_store.json` en el dir viejo y NO en el
  nuevo.** No sirve "el dir nuevo no existe": Tauri lo crea antes de que esto
  corra, así que esa condición nunca se cumpliría.
- **Nunca sobrescribe** ajustes ya escritos bajo el identifier nuevo.
- **Fallo no fatal.** Si la copia falla, warning y la app arranca igual.
  Arrancar en blanco se arregla a mano; no arrancar, no.
- **Instalaciones portables se saltan la migración** (sus datos viven junto al
  ejecutable, nunca tuvieron dir derivado del identifier).
- Corre en `setup()` **antes de que nada lea el store**.

**Dato tranquilizador medido:** los modelos NO viven bajo el identifier (están
en `~/.cache/huggingface/hub`), así que el rebrand no obliga a re-descargar
gigas. El dir de datos son ~7,8 MB.

`actions.rs` (test de perfiles ES que lee la clave de OpenAI) prueba primero
`com.trazo.app` y cae a `com.pais.handy`, para seguir funcionando en una máquina
sin migrar.

**Autostart, los dos problemas resueltos en el mismo trabajo:**

- **(a) Fallo silencioso.** Los cuatro `let _ = autostart_manager.enable()`
  descartaban el `Result`. Si el registro fallaba (política de grupo, permisos,
  LaunchAgent no escribible), **el toggle quedaba en "activado" en la UI sin
  nada registrado**. Ahora se loguea un warning; la decisión de qué loguear
  salió a `autostart_failure_message()`, función pura con tests.
- **(b) Registros huérfanos por el rebrand.** `tauri-plugin-autostart` registra
  por nombre de app y ruta del ejecutable: tras el rename la entrada vieja
  apunta a un binario inexistente y el SO reintenta un arranque condenado en
  cada login. `cleanup_legacy_autostart()` borra LaunchAgents de macOS,
  `.desktop` de XDG y la entrada `Run` del registro de Windows (vía `winreg`,
  que ya era dependencia), probando tanto `Handy` como `com.pais.handy` porque
  el nombre usado depende de la versión del plugin. Borrar algo inexistente es
  no-op, así que ser generoso es seguro.

**Pendiente de validación en vivo (es el caso de Charly):** al primer arranque
tras commitear, sus datos deben aparecer en `%APPDATA%\com.trazo.app`.
**Recomendado copiar `com.pais.handy` antes de probar**, aunque la migración no
lo toca.

**Efecto colateral:** los instaladores pasan a llamarse `Trazo_0.9.0_*`, lo que
invalida los artefactos del matrix actual (§7.5).

### 7.2 Bug crítico del VAD — contenido, causa raíz abierta

**Reportado por Benja:** con `vad_enabled = true` (el default de entonces), un
dictado de 13 s llegaba a disco como **1,05–2,16 s**. Micrófono
"Varios micrófonos (2- Realtek Audio)", 48 kHz, 2 canales, Windows 11. Él ya
había descartado micrófono, motor, idioma, sample rate/downmix y modelo.

**Contención — `80f3cbe`, commiteado y pusheado.** Default `vad_enabled: false`
**más migración de esquema v6**. La migración es la parte que importa: cambiar
solo el default no protege a nadie que ya tenga Trazo instalado, porque serde
nunca toca un campo que ya está en el store. A diferencia de la migración del
`history_limit`, esta **no puede** distinguir una elección deliberada del viejo
default, porque el viejo default ERA `true`. Aceptado: el costo de apagarlo a
quien le funcionaba es algo de silencio extra, que el modelo maneja; el de
dejarlo encendido a quien no, es su dictado.

**Mecanismo confirmado en el código.** Con el VAD activo, `processed_samples`
—que es a la vez lo que se guarda en disco y lo que va al modelo— acumula
únicamente los frames etiquetados `Speech`. No existe ninguna parada automática
por silencio: la pérdida es filtrado de frames.

**Descartado con rigor:**

- **No es desajuste de tamaño de frame.** `SileroVad` exige exactamente 480
  muestras y falla, pero `handle_frame` hace
  `.unwrap_or(VadFrame::Speech(samples))` — **falla-abierto**. Un desajuste
  produciría _más_ audio, nunca menos.
- **No es el nivel.** Hipótesis propia, refutada con medición propia: el harness
  `vad_survival.rs` (commiteado en `481b5b6`) corre la cadena de producción
  exacta sobre grabaciones reales atenuándolas. **A −24 dB todavía sobrevive el
  100%.** Coherente con lo ya sabido: Silero dispara hasta con ruido de sala.

**Hipótesis viva:** si Silero es tan permisivo, que rechace ~88% del audio de
Benja significa que lo que le llega **no se parece a voz**. Lo más probable en
un dispositivo agregado: el segundo canal lleva algo que no es habla (zumbido,
referencia de AEC, un micro muerto) y el promedio queda dominado por eso.
Whisper es robusto a eso; Silero está entrenado justo para rechazarlo. Explica
las tres cosas: por qué con VAD off funciona, por qué falla con VAD on, y por
qué solo pasa en ese dispositivo.

**Experimento decisivo, PENDIENTE del resultado de Benja.** Que grabe sus 13 s
con VAD off y los pase por:

```bash
cargo run --example vad_survival -- src-tauri/resources/models/silero_vad_v4.onnx <wav>
```

- **Supervivencia se desploma** → el VAD rechaza correctamente su señal; el
  arreglo va en la captura/downmix.
- **Supervivencia ~100%** → los veredictos son correctos y la pérdida está en el
  camino en vivo (hilos/resampler/framing).

**También se le pidió con qué prueba concreta descartó el downmix**, porque si
fue "suena bien con el VAD apagado" eso NO descarta esta hipótesis: la mezcla
puede ser perfectamente inteligible para Whisper y aun así ser rechazada por
Silero. **Sin respuesta todavía.**

### 7.3 Bug del cuelgue tras descarga de modelo — ARREGLADO (`2c97e4e`)

**Síntoma:** tras `Model idle for 306s (limit: 300s), unloading`, ninguna
grabación vuelve a completarse hasta reiniciar la app.

**Causa raíz:** `initiate_model_load()` ponía `is_loading = true`, lanzaba un
hilo suelto y limpiaba el flag **como última sentencia de ese hilo**. Cualquier
pánico en el camino se salta la limpieza. Y hay dos esperas sobre el condvar
**sin timeout** — `transcribe()` y el worker de streaming — así que toda
grabación posterior se cuelga exactamente donde iría a transcribir.

**Lo revelador:** justo al lado ya existía `try_start_loading()`, que devuelve un
`LoadingGuard` con `Drop` que limpia el flag y despierta a los que esperan. Pero
solo lo usaba `commands/models.rs`; el camino que corre en cada grabación hacía
el flag a mano.

**Por qué aparece tras la descarga:** con el modelo cargado,
`initiate_model_load` retorna temprano y nunca toca el flag. La descarga es lo
que devuelve a la app al camino frágil.

**Fix:** usa `try_start_loading()` y **mueve el guard al hilo**, así el `Drop` lo
libera incluso desenrollando un pánico. Se extrajo `load_holding_guard()` para
que el camino de pánico sea testeable. 2 tests, rojo primero; el que falla
reprodujo el síntoma literal ("a dictation after a failed load waited forever"),
acotado con timeout en vez de colgar la suite.

**No arreglado, anotado:** `unload_model()` ignora `active_engine_lease` y puede
limpiar `current_model_id` mientras el worker de streaming aún tiene el motor
prestado. Real, pero no es la causa de este cuelgue.

### 7.4 Control de ganancia de micrófono (`653c056`)

Slider en Ajustes → Sonido, 0.5×–4.0×, default **exactamente 1.0×** (una
instalación existente suena igual). Aplicado en el callback de captura, antes de
todo lo demás, para que onda, VAD y transcripción vean la misma señal.

**Es usabilidad, NO un arreglo del truncado**, y así está escrito en el módulo,
en el componente y en el texto que ve el usuario: la ganancia sube voz y ruido
por igual. Medido el 26/07: +14,7 dB no cambió una palabra.

`SharedGain` es un atómico, no un `f32`: el callback de cpal se queda con su
closure durante toda la vida del stream, así que mover el slider tiene que
llegar a un dictado en curso. 12 tests, rojo primero. Claves en las 21 locales.

### 7.5 CI cross-platform — **VERDE en las 3 plataformas**

**El problema no era el código.** `main-build.yml` corre con
`sign-binaries: true` y todos los jobs morían por secrets, no por fuentes. En
macOS moría a los ~20 s importando un `APPLE_CERTIFICATE` vacío, así que **una
build de macOS rota y un certificado ausente se veían idénticos**.

Workflow nuevo `cross-platform-check.yml` (`bda3139`) + arreglo de `build.yml`
(`b7c50a2`, `ede3455`):

- **Pasar un string vacío no es lo mismo que no pasar nada:** `tauri-action`
  interpreta un `APPLE_CERTIFICATE` definido-pero-vacío como "hay certificado" e
  intenta importarlo. El paso de build se dividió en dos mutuamente excluyentes;
  el sin firma **omite** las variables.
- **El paso firmado es el original, byte a byte** — verificado por diff
  programático, no por lectura. Un release ejecuta lo mismo que siempre.
- `bundle.windows.signCommand` (que apunta a la cuenta de Azure de cjpais) y
  `createUpdaterArtifacts` se eliminan del config **solo** en builds sin firma.

**Resultado — run 30320020966, 5/5 success:**

| Plataforma           | Artefacto                                     |
| -------------------- | --------------------------------------------- |
| macOS ARM            | `trazo-unsigned-aarch64-apple-darwin` (39 MB) |
| macOS Intel          | `trazo-unsigned-x86_64-apple-darwin` (44 MB)  |
| Linux `.deb` (22.04) | 66 MB                                         |
| Linux AppImage+RPM   | 189 MB                                        |
| Windows x86_64       | 62 MB                                         |

**⚠️ NO se volvió a correr con el nombre nuevo**, porque el rebrand sigue sin
commitear. Los artefactos actuales dicen `Handy_0.9.0_*`. Hay que relanzarlo
tras commitear el grupo c.

### 7.6 Secrets del updater — RESUELTO el 2026-07-30, y el diagnóstico era falso

> **⚠️ ESTA SECCIÓN QUEDÓ OBSOLETA. Ver §9.4.**
>
> Lo de abajo se escribió el 28/07 y da por hecho que **Charly perdió la
> contraseña**. **Era falso.** La clave del 16/07 se generó con **contraseña
> vacía**, y el firmador de tauri no puede abrir esas claves: era irrecuperable
> por diseño, no por olvido. Buscarla en un gestor no habría servido de nada, y
> la "decisión pendiente de Charly" que plantea el último punto nunca tuvo dos
> opciones reales — solo cabía rotar. Se rotó el 30/07 y el CI ya firma.
>
> Se conserva el texto porque el trabajo de descarte (BOM, correspondencia de
> clave, contraseñas probadas) sigue siendo válido y es lo que acotó el problema.

- **El BOM está resuelto.** El archivo local nunca lo tuvo (empieza en
  `64 57 35`); se introducía al subirlo. Resubido con
  `gh secret set ... < archivo` desde Git Bash, sin PowerShell.
- **La clave corresponde**: mismo ID `6596EF54BD66B296`, pública idéntica a la
  de `tauri.conf.json`.
- **El error cambió**, y eso confirma el arreglo: de `Invalid symbol 239` (BOM) a
  `Wrong password for that key` — ahora la clave se decodifica y llega al
  descifrado.
- **La contraseña vacía NO sirve.** Verificado implementando el descifrado
  minisign (scrypt + XOR + checksum blake2b) y validándolo contra una clave cuya
  contraseña se conocía. Probadas `""`, `" "`, `"trazo"`, `"Trazo"`: ninguna.
- **Decisión pendiente de Charly:** o recupera la contraseña (¿gestor de
  contraseñas?), o hay que **generar keypair nueva**, lo que obliga a actualizar
  el secret **y** el `pubkey` de `tauri.conf.json`, invalidando la verificación
  de updates de cualquier build ya distribuida. **No se generó nada.**

**Además, dos bloqueos ajenos al updater** para un release firmado completo: no
hay `APPLE_CERTIFICATE` (sin cuenta Apple Developer, $99/año) y el `signCommand`
de Windows apunta a infra de cjpais.

### 7.7 README de builds sin firmar (`5f1975c`)

Sección "Opening an unsigned build": macOS (click derecho → Abrir, `xattr`, y la
advertencia de que los permisos de Accesibilidad/Micrófono se reconceden en cada
actualización porque van atados a la firma), Windows (SmartScreen) y Linux
(`mesa-vulkan-drivers` no declarado como dependencia → cae a CPU en silencio; y
Wayland sin atajos globales).

---

## 8. Sesión 2026-07-28/29

### 8.1 El repositorio pasó a PÚBLICO — y por qué

**Actions llevaba horas sin arrancar**, y no por el código: cada job moría en
1-5 s con _"The job was not started because recent account payments have failed
or your spending limit needs to be increased"_. Cayeron **11 runs seguidos**
desde las 01:45 UTC del 28/07, en los cuatro workflows, incluido el `test`
barato de Ubuntu — que caiga ese descarta el código.

La causa de fondo: `JuanIA-sketch/trazo` era **privado**, y en repos privados
los minutos se facturan con multiplicadores (macOS ×10, Windows ×2). El matrix
usa dos runners de macOS y uno de Windows.

**Decisión de Charly: abrir el repo.** Antes se escaneó el historial completo
(1.248 commits): 0 credenciales en 9 patrones (`sk-`, `ghp_`, `AKIA`, claves
privadas, secret key de minisign), 0 nombres de archivo sensibles, ningún path
personal en archivos trackeados. **El WAV con la voz de Charly
(`short-es-misdetected-as-is.wav`) no está trackeado y está cubierto por
`.gitignore:47`.**

**Consecuencias aceptadas a sabiendas:** los emails de commit quedan expuestos
(`juancharly.ia@gmail.com`, 39 commits; el de Benjamin), y `SESSION_HANDOFF.md`

- `CLAUDE.md` son públicos — incluida la §1.3.1 sobre la rama de Benjamin.
  Sacarlos del árbol no serviría: seguirían en la historia. **Ojo al escribir aquí
  de ahora en adelante.**

### 8.2 Release v0.9.0 publicado

<https://github.com/JuanIA-sketch/trazo/releases/tag/v0.9.0> — pre-release (sin
firmar), con los **7 instaladores** del matrix.

**El tag apunta a `a74d97c`, no al HEAD de entonces**, y es deliberado: esos
binarios los compiló el matrix desde ese commit. Un tag en un commit posterior
diría que los instaladores llevan código que no está dentro. **Para una build
con el formalizador hay que relanzar el matrix y sacar v0.9.1.**

**Descarga anónima verificada de verdad**, no supuesta: `curl` sin token sobre
tres assets → HTTP 200 y el archivo completo. Link para el tester de Mac:
`https://github.com/JuanIA-sketch/trazo/releases/download/v0.9.0/Trazo_0.9.0_aarch64.dmg`

Las notas (en español) llevan tabla de qué archivo bajar, el paso de clic derecho
→ Abrir para Gatekeeper, el aviso de que macOS pide de nuevo los permisos de
Accesibilidad y Micrófono en **cada** build sin firma, SmartScreen en Windows,
`mesa-vulkan-drivers` en Linux, y que el updater no funciona.

### 8.3 Migración de datos del rebrand — VALIDADA en vivo

§7.1 quedaba pendiente de confirmar. Confirmado: **19/19 comprobaciones**, más
los **14 WAV verificados hash a hash**. `%APPDATA%\com.trazo.app` con los 17
archivos, `history.db` con el mismo SHA, clave de OpenAI intacta, y
`com.pais.handy` **sin tocar** (copia, no movimiento). El log mostró
`Rebrand: migrated 17 file(s)` y la eliminación de la entrada `Run` huérfana.

Efectos colaterales observados:

- **El autostart se re-registró como `Trazo`**, apuntando a `C:\h\debug\handy.exe`
  (el binario de dev). No es regresión —la entrada vieja apuntaba al mismo
  sitio— pero un `cargo clean` dejaría el arranque roto hasta instalar un bundle.
- **En dev el ejecutable sigue siendo `handy.exe`** (el nombre sale de
  `[package] name` de Cargo, no de `productName`), y el log sigue llamándose
  `handy.log`, ahora bajo `%LOCALAPPDATA%\com.trazo.app\logs\`.

**Los instaladores sí llevan el nombre nuevo, verificado abriendo el bundle:**
`Trazo_0.9.0_x64.dmg`, `Trazo.app` con `CFBundleIdentifier = com.trazo.app`,
`Trazo_0.9.0_x64_en-US.msi`, `Trazo_0.9.0_x64-setup.exe`,
`Trazo_0.9.0_amd64.deb`, `.AppImage` y `.rpm`.

**Pendiente del rebrand, con su coste real medido:** el ejecutable dentro de los
bundles sigue siendo `handy`/`handy.exe`. Poner `"mainBinaryName": "Trazo"` **no
es una línea**: `build.yml` tiene **8 asserts** que exigen ese nombre
(`usr/bin/handy` en deb/rpm/AppImage, líneas 726, 748 y 764; el smoke test de
Linux en 717; y tres de `handy.exe` en 837-849). Tocar solo el config pone el
matrix rojo en los cinco jobs. **Charly decidió no tocarlo antes del viernes.**

### 8.4 Formalizador de correo — TERMINADO, VALIDADO y MERGEADO

> Estado final: validado en vivo por Charly e integrado en `main` el
> 2026-07-30. **La rama ya no existe.** Ver §9.1 para la validación y el merge.
> Lo de abajo es el registro de las decisiones de diseño, que sigue vigente.

Rama **`feat/formalizador-correo`** (`9c6e7f9` cuando se escribió esto; acabó en
`a9a7918`), 11 commits, 37 archivos, +1682/−60. Suite: **275 passed, 0 failed,
1 ignored**.

Spec: `docs/superpowers/specs/2026-07-29-formalizador-correo-design.md`.
Plan: `docs/superpowers/plans/2026-07-29-formalizador-correo.md`.

**Qué hace:** pulsas **`f9`**, dictas casual, y sale un correo con saludo según
la hora local, cuerpo reestructurado, despedida y firma, tuteando o de usted
según ajuste. Reutiliza el post-procesado LLM existente.

**Decisiones y su porqué (no reabrir sin motivo nuevo):**

- **Atajo propio, no cambiar el perfil en Ajustes.** Qué prompt corre lo decide
  un único valor global (`post_process_selected_prompt_id`); sin atajo propio el
  flujo sería Ajustes → cambiar → dictar → Ajustes → deshacer.
- **Tú/usted es un ajuste fijo, no inferido por el LLM.** En español atraviesa la
  gramática: inferirlo haría que el mismo dictado saliera distinto en dos
  intentos, y eso no se puede cubrir con tests.
- **La hora la calcula Rust** (`greeting_for_hour`, determinista y con tests de
  límites); **a quién saluda lo extrae el LLM del dictado**. Riesgo aceptado y
  documentado: puede confundir destinatario con mencionado ("dile a Ana que Pedro
  no viene"). Plan B si molesta en uso real: saludo genérico siempre.
- **Un solo perfil, forma de correo.** Para chat ya está `default_es_casual`.
- **`formalize_prompt_id` como ajuste propio**, en vez de fijar el perfil a fuego
  o refactorizar "cada binding lleva su perfil" (descartado por alcance).

**El default del atajo cambió a `f9` A MITAD DE IMPLEMENTACIÓN.** El spec decía
`ctrl_right`/`cmd_right` y la corrección está anotada allí. Dos razones que el
diseño no previó:

1. **Un modificador desnudo bloquea la _pulsación_.** Con `ctrl_right`
   registrado, pulsar Ctrl derecho para hacer Ctrl+C arranca una grabación y la
   app recibe una `c` literal. En macOS `cmd_right` es peor. **La regla "jamás
   bloquear _releases_" de `CLAUDE.md` §5 sigue respetada: esto es sobre
   pulsaciones, es otro asunto.**
2. **Bajo la implementación Tauri (la de por defecto en Linux)**, `ctrl_right`
   pasaba `validate_shortcut` pero fallaba al parsear, así que el atajo aparecía
   en Ajustes y no respondía nunca, en silencio.

`f9` es una tecla, no modificador, y ambos validadores la aceptan. Hay test que
fija el literal: los de "forma" no bastaban (con `ctrl_right` restaurado seguían
verdes).

**Migración v6 a v7 ya aplicada al store real de Charly** (regenerar
`bindings.ts` arranca la app headless): versión 7, perfil `default_es_casual`
**intacto**, `default_es_email` sembrado, `formalize_prompt_id` puesto, clave y
resto de ajustes sin tocar. Solo siembra el perfil de correo (no los cuatro: si
el usuario borró uno, no resucita) y no pisa un prompt con el mismo id.

**Residuos aplazados a propósito:**

- El `<select>` de perfil no tiene `<option value="">` para `null` (hoy
  inalcanzable: default y migración garantizan `Some`).
- **No hay equivalente de `--toggle-post-process` ni de `SIGUSR1` para
  formalizar** (`lib.rs:762`, `signal_handle.rs:32`). Preexistente y fuera del
  spec.
- **Reintentar un correo desde el Historial lo re-ejecuta con el perfil global**,
  nunca como formalizado: `post_process_requested` es un bool sin perfil por
  entrada. Limitación del esquema previo, documentada en el código.
- El prompt sembrado necesitó **tres iteraciones** para que `gpt-4o-mini` dejara
  de escribir una coma colgando sin firma. **Es prompt engineering contra un
  modelo concreto: si se cambia de modelo o proveedor, revalidar.**

**FALTA LA VALIDACIÓN EN VIVO DE CHARLY:** que `f9` latchee con doble-tap; que el
nombre y el tratamiento **se guarden y sobrevivan a un reinicio** (fue el bug que
casi se escapó); y que un correo real salga presentable.

### 8.5 Grupo (b) — validado y commiteado por fin

Pendiente desde el 26/07. Charly validó el doble-tap con Alt y el espacio
separador. Commiteado en **`b170a9e`** (`clipboard.rs`,
`transcription_coordinator.rs`, `shortcut/handler.rs`, `signal_handle.rs`) tras
237 tests en verde, y pusheado.

**Matiz honesto sobre esa validación:** el caso que §2.1 arregla exige que
`TranscribeAction::start` supere los 600 ms, y en la prueba tardó **377 ms** —
pasaron 76 s entre que los atajos quedaron listos y la pulsación. Lo que quedó
demostrado es que **el camino feliz no se rompió**, que era el riesgo real del
cambio. El caso patológico lo cubren los tests unitarios con `sleep(700ms)`
deliberado. Dato útil: el histórico de `start completed in` solo tiene 272 ms,
377 ms y **580 ms** — esa última se quedó a 20 ms del umbral, así que el bug era
plausible, no exótico.

Del 93% del tiempo de arranque que es abrir el micrófono, **167 ms son
`vad_ensure`, con `vad_enabled: false`**. No es "sobra, quítalo" —el pulso de la
letra del overlay usa el VAD real (§11 de `CLAUDE.md`)— pero es la mitad del
presupuesto de latencia y merece una mirada al tocar esa zona.

### 8.6 `nix build check` — VERDE tras 12 días rojo

Estaba rojo en **todas** las ejecuciones desde `bca3ac4` (2026-07-16), que añadió
`@types/bun` a `package.json` y `bun.lock` sin regenerar `.nix/bun.nix`. Incluido
el 24/07, con el resto del CI en verde: nadie lo miró. Arreglado en `3d7a67b` con
el comando que sugiere el propio workflow:

```bash
bunx bun2nix -o .nix/bun.nix
```

Funciona desde Windows y solo toca ese archivo (`bun.lock` queda intacto pese al
mensaje "Saved lockfile").

### 8.7 `Main Branch Build` — de 0/7 a 3/7; quedan DOS bloqueos, no tres

**Nunca falló por el código.** Eran tres causas distintas; **la del updater se
resolvió el 30/07** (§9.4) y con ella los 3 jobs de Linux:

| Jobs       | Error literal                                                                                 | Estado                    |
| ---------- | --------------------------------------------------------------------------------------------- | ------------------------- |
| Linux ×3   | ~~`incorrect updater private key password: Wrong password for that key`~~                     | **VERDE** desde §9.4      |
| macOS ×2   | `security: SecKeychainItemImport: One or more parameters passed to a function were not valid` | rojo — falta Apple (§7.5) |
| Windows ×2 | `failed to bundle project 'failed to run trusted-signing-cli'` (variables AZURE vacías)       | rojo — falta Azure (§7.5) |

**La pista que descartó el código:** los jobs de Linux **compilaron 12-21 minutos
enteros** y morían al firmar el artefacto del updater; Windows corrió 30 min. Si
el código estuviera roto, petaría al compilar. Confirmado a posteriori: al
arreglar solo la clave, esos tres pasaron a verde sin tocar una línea de código.

**Los dos que quedan no dependen de trabajo técnico sino de dinero y cuentas:**
cuenta de Apple Developer ($99/año) e infraestructura de firma de Windows propia
(hoy apunta a la cuenta de Azure de cjpais). Mientras no existan, ese workflow
no puede pasar de 3/7 — **no perder tiempo depurándolo**.

`Cross-Platform Build Check` sí pasa 5/5 porque **omite** las variables de firma
en vez de pasarlas vacías (`b7c50a2`), y es el que alimenta el release.

### 8.8 Reportes de Benja en Mac — dos bugs con diagnóstico, sin arreglar

Probó el `.dmg` ARM: **funcionó en ambas pruebas, sin cortes de audio.** Errores
de reconocimiento puntuales ("voz" salió "vos", "ballerina" salió "valentina").

**Bug 1 — el respaldo al portapapeles no siempre ocurre.** Diagnóstico:
**`5f4552e` no es que no lo cubra, es que lo causó.** Antes copiaba con
`CopyToClipboard` para **todos** los métodos; ahora solo con `PasteMethod::None`
(`clipboard.rs:646`). Con **`Direct`** (la inserción directa que describe Benja)
ya no queda respaldo. Y hay una contradicción: `transcript_lands_on_clipboard()`
devuelve `true` para `CopyToClipboard` **sin mirar el método**, así que el overlay
dice "Texto copiado" cuando con `Direct` no se copió nada. Alejarse del campo **no
se puede detectar**: Enigo informa éxito si logró enviar las pulsaciones.
**Confirmar con Benja qué `paste_method` tiene** — la predicción es `Direct`; si
fuera `CtrlV`, el diagnóstico está mal.

**Bug 2 — se pierden las últimas palabras, intermitente.** El umbral de 2,7
palabras/segundo **no puede verlo, por aritmética**: 12 s con 36 palabras van a
3,0 w/s; perder las dos últimas deja 2,83, por encima del umbral. Se calibró
contra truncados catastróficos (1,31 / 1,86 / 2,08), no contra pérdida de cola.
**No es el VAD ni el nivel** (100% de supervivencia a −24 dB, y el VAD viene
apagado desde `80f3cbe`). **Sospechoso real: la cola del audio.**
`extra_recording_buffer_ms` tiene default **0** (`settings.rs:981`), así que al
soltar la tecla la grabación se detiene de golpe, y Whisper —entrenado con
ventanas rellenadas de silencio— tiende a soltar los tokens finales. Que sea
intermitente encaja. **Experimento barato pendiente: que Benja lo suba a 200-300
ms y repita.** Si dejan de perderse, es cambiar un default.

### 8.9 Falso positivo que NO hay que "arreglar"

Un revisor marcó `settings.rs:1129` (el `debug!` que imprime los settings) como
fuga de la clave de API al log. **Es falso.** `post_process_api_keys` es un
`SecretMap` con `impl Debug` propio (`settings.rs:332`) que sustituye cada valor
no vacío por `[REDACTED]`, con dos tests que lo protegen. Verificado también
contra el log real: la clave **no aparece**; `[REDACTED]` sale 4 veces. **No
tocar.**

(La clave sí se imprimió en claro en el transcript de la sesión, por un comando de
inspección de `settings_store.json` con `ConvertFrom-Json` — no por la app.
Rotarla es decisión de Charly.)

### 8.10 Lecciones del proceso de subagentes, para la siguiente feature

El formalizador se ejecutó con un subagente por tarea y revisión entre cada una.
**Encontró 9 defectos reales, 7 de ellos huecos del plan**, ninguno detectable por
la suite. Los más caros, para calibrar dónde mirar la próxima vez:

1. **Los ajustes de UI no se persistían.** No había comando Tauri ni entrada en
   `settingUpdaters`: la UI mostraba los valores y el backend seguía en los
   viejos. **Al añadir un ajuste, la cadena es de cinco eslabones** (comando Rust
   → `invoke_handler` → `bindings.ts` → `settingUpdaters` → componente);
   verificarlos uno a uno.
2. **Un atajo nuevo debe enseñarse en 5 sitios**, no en 2: los tres
   `init_shortcuts` (`mod.rs`, `handy_keys.rs`, `tauri_impl.rs`), el cambio en
   caliente (`change_post_process_enabled_setting`) y `is_transcribe_binding` del
   coordinador. Si falta el último, el atajo se salta el
   `TranscriptionCoordinator`: sin toggle, sin debounce y **sin doble-tap a
   continuo**. Ahora hay un predicado compartido,
   `is_post_process_gated_binding`.
3. **Un test puede "proteger" un orden sin protegerlo.** El primer test del orden
   de sustitución fijaba el orden a mano, así que habría seguido verde si se
   invirtiera en la función real. **Criterio: revertir el arreglo y ver el test
   caer.** Se aplicó en la última oleada a los 6 hallazgos.
4. **No dar por buenos los informes de los subagentes.** Un revisor solo corrió
   el subconjunto de su tarea y declaró 242 passed; la suite completa daba 241 +
   1 fallo (inestabilidad conocida de los perfiles ES). Y el falso positivo de
   §8.9 llegó a relayarse antes de verificarlo.
5. **Test inestable identificado por fin:**
   `casual_profile_restores_spanish_opening_question_marks` (API real de OpenAI).
   Reintentar antes de sospechar una regresión.
6. **No exportar `CARGO_TARGET_DIR` desde Git Bash**: `C:\h` se degrada a un `h`
   relativo y crea un `src-tauri/h/` basura. `.cargo/config.toml` ya lo fija.

### 8.11 Cómo levantar la app (para Charly)

Desde `C:\Handy`, y nada más:

```powershell
bun run tauri dev
```

**No hace falta `$env:CARGO_TARGET_DIR`**: `.cargo/config.toml` ya fija
`target-dir = "C:/h"` con `skip-worktree`. La app está lista cuando aparece
`Shortcuts initialized successfully`; antes de esa línea los atajos no responden.
`Ctrl+C` en la terminal para cerrarla — **la X solo la manda a la bandeja** y
sigue bloqueando las DLLs.

---

## 9. Sesión 2026-07-30

### 9.1 Formalizador de correo: validado en vivo e integrado en `main`

**Charly lo validó y lo aprobó.** Las tres cosas que estaban en duda salieron
bien: `f9` latchea con doble-tap, el tratamiento de usted se respeta **en todo**
el correo (no solo en el saludo, que era el riesgo real), y el nombre y el ajuste
**sobrevivieron a cerrar y reabrir la app** — que era la parte con historial de
fallos, porque la cadena de persistencia tiene cinco eslabones (§8.10).

Integrado con la skill `finishing-a-development-branch`. Cómo quedó:

- **Fast-forward, sin commit de merge.** `main` era ancestro directo de la rama y
  no tenía commits propios, así que los 12 entraron limpios: 38 archivos,
  +2031/−83. Cero conflictos, cero posibilidad de tenerlos.
- **La suite se corrió DOS veces**: sobre la rama y **otra vez sobre el resultado
  ya mergeado**. Verde las dos: `bun test src/` 39/39, `cargo test --lib`
  275 passed / 0 failed / 1 ignored, y la crate vendorizada 51/51 en `--lib`.
  El segundo pase es el que cuenta — verde antes del merge solo prueba el árbol
  de antes.
- **Rama borrada con `git branch -d`** (no `-D`): así git solo la borra si
  confirma que no se pierde nada.
- `main` = **`a9a7918`**, pushado a `origin/main` el mismo día por petición
  explícita de Charly ("quiero esto respaldado antes del viernes"). Iban 14
  commits acumulados sin subir.

### 9.2 Limpieza y dos trampas del entorno

**Borrado `src-tauri/examples/batch_vs_loop.rs`** (274 líneas, nunca
commiteado). Consecuencia registrada en §4.1: si alguien reabre ese experimento,
**el harness hay que rehacerlo**, no está en ningún sitio del historial.

**El `M` de `src-tauri/Cargo.toml` se deja a propósito.** No es un cambio de
contenido: `git diff` sale vacío y con `--ignore-cr-at-eol` también. Es solo
normalización LF→CRLF de Windows. **No lo "arregles"** y no pierdas tiempo
buscando qué cambió: no cambió nada.

Dos trampas que costaron tiempo esta sesión:

- **Nunca exportar `CARGO_TARGET_DIR` a mano.** Ya lo fija
  `.cargo/config.toml`. Y si se escribe mal en bash, `C:h` (sin barra) es una
  ruta **relativa al directorio actual de la unidad C:**, no un error: cargo se
  pone a crear artefactos en `src-tauri/h` y falla con `os error 3` cientos de
  líneas después. Silencioso y desconcertante.
- **`taskkill //PID <n> //T` desde el shell bash no mató la app**: informó de
  procesos hijos de otro PID y dejó `handy.exe` vivo. Lo que funciona es
  PowerShell: `Stop-Process -Id <n> -Force`. Hay que cerrarla antes de cualquier
  build que re-enlace.

### 9.3 Tarea pequeña detectada, no arreglada

El ejemplo `basic` de la crate vendorizada **no compila**: importa
`handy_keys::check_accessibility` y `open_accessibility_settings`, que ya no
existen. Viene de `8477b61`, **el propio commit de vendorización**, así que lleva
roto en `main` desde entonces — no lo trajo el formalizador.

Efecto real, acotado: un `cargo test` pelado dentro de
`src-tauri/vendor/handy-keys` falla al compilar el ejemplo. El `--lib` va 51/51,
y la app no usa ese ejemplo. Arreglo estimado en dos minutos: borrar el ejemplo o
quitarle esos dos imports.

### 9.4 Updater: la contraseña nunca se perdió — la clave nació inservible

**Resuelto.** `Main Branch Build` pasó de **0/7 a 3/7** jobs (`16d4390`).

**El diagnóstico de §7.6 era falso.** No hubo contraseña perdida: la clave del
16/07 **se generó con contraseña vacía**, y el firmador de tauri no puede abrir
esas claves. Era irrecuperable por diseño. Cualquier rato invertido en buscarla
en un gestor habría sido tiempo tirado.

**Cómo se demostró, porque el control es lo que hace válida la conclusión:**

| Prueba                                               | Resultado                           |
| ---------------------------------------------------- | ----------------------------------- |
| Clave con contraseña real, firmar con ella (control) | ✅ firma generada                   |
| Clave con `-p ""`, firmar con `-p ""`                | ❌ `Wrong password for that key`    |
| Clave con `-p ""`, firmar con la env vacía           | ❌ `Wrong password for that key`    |
| Clave con `-p ""`, sin contraseña ninguna            | ⏳ se cuelga pidiéndola por teclado |

Sin el control, el fallo parecería "contraseña incorrecta". Con él queda claro
que la ruta de firma funciona y lo que no existe es la contraseña vacía.
**`kdf_alg` es scrypt (`0x5363`) en todas las claves que genera tauri: "sin
contraseña" NO es una opción en esta herramienta**, aunque el `--help` sugiera
que la contraseña es opcional.

**Por qué rotar salió gratis, y por qué no lo será la próxima vez:** el release
v0.9.0 no publicó ningún `latest.json` ni `.sig` — el endpoint del updater daba
**HTTP 404** —, así que ninguna build podía autoactualizarse y no había nada que
invalidar. Descargas reales: 2 en el `aarch64.dmg` (Benja), 0 en todo lo demás.
**Con updates ya distribuidos, esta misma rotación obligaría a reinstalar a
mano.**

**Estado actual:**

- Clave activa **`426215DA45AC6776`**, con contraseña de 32 caracteres.
  La contraseña la movió Charly a su gestor el 30/07; el archivo intermedio era
  `~/.tauri/trazo-key-password.txt`.
- Clave vieja (`6596EF54BD66B296`) respaldada en `~/.tauri/*.bak-20260730`.
- Ambos secrets reescritos **desde Git Bash, nunca PowerShell** (el BOM que metía
  PowerShell costó una sesión entera, §7.6).
- `pubkey` de `tauri.conf.json` actualizada en el mismo commit.

**Verificación doble, y la segunda importa más de lo que parece:** el CI emitió
`Finished 1 updater signature at: .../Trazo_0.9.0_amd64.deb.sig`; y en local, el
key ID **dentro de una firma** coincide con el de la pubkey commiteada
(`426215DA45AC6776`). Si solo se comprobara el CI, una pubkey desparejada daría
verde igualmente y los updates se rechazarían **en el cliente**, un fallo que no
aparece hasta la primera actualización real.

**Trampa de `gh` que costó un susto:** el repo tiene dos remotos (`origin` =
Trazo, `upstream` = cjpais/handy) y **no hay default configurado**. Un
`gh release view v0.9.0` sin `--repo` leyó el release de **cjpais**, con
instaladores `Handy_0.9.0_*` y decenas de miles de descargas — y por un momento
pareció que el rebrand no había funcionado y que había miles de usuarios
afectados por la rotación. **Usar siempre `--repo JuanIA-sketch/trazo`.**

### 9.5 El `dont_modify` que nadie eligió: dos defectos que solos no hacían nada

**Arreglado** (`015ef9d` interfaz, `4f1b4c6` migración v8, `5eaf2ad` guard).

Charly apareció con `clipboard_handling = dont_modify` sin haberlo elegido. El
§3.2 llevaba cuatro días dando eso por «un trade-off aceptado a sabiendas», y
por eso nadie lo investigó.

**La migración v3 NO tuvo la culpa** — era la sospecha inicial y era falsa. Un
backup del 21/07 muestra el store en v4 con `copy_to_clipboard`: la migración
hizo su trabajo y el valor se volteó **después**.

La causa eran dos defectos que por separado son inofensivos:

1. `ClipboardHandling.tsx` pintaba `dont_modify` como seleccionado mientras
   `getSetting` devolvía `undefined`, contradiciendo el default del backend.
2. `Dropdown.handleSelect` llamaba a `onSelect` **sin comparar** con el valor
   actual, así que pulsar la opción ya marcada escribía igual.

Juntos: abres Ajustes antes de que carguen, ves "No modificar", pulsas lo que
ya aparecía marcado, y se guarda un valor que nunca elegiste. **Para el usuario
no es un cambio, es confirmar lo que le muestran.**

**Migración v8** para reparar a los afectados, mismo criterio que la v6 con el
VAD y con el mismo precio: el store no guarda quién escribió el valor, así que
pisa también a quien eligió `dont_modify` a propósito. Se acepta porque los dos
lados no cuestan igual — a quien lo quería le sobra un dictado en el
portapapeles y lo devuelve con un clic; al afectado se le perdía el dictado
entero, en silencio.

**Límite honesto:** el mecanismo está demostrado y es reproducible, pero **no
hay prueba de que fuera eso lo que pasó el 26/07**; no existe log de esa
escritura. Un editado a mano del JSON también encajaría.

### 9.6 Auditoría del patrón `getSetting(x) || fallback` (`72d7550`)

Tras el bug anterior se revisaron los ~20 usos del patrón. **Tres no coincidían
con el default real** de `settings.rs`, y los tres mentían en la dirección
peligrosa:

| Ajuste                       | Interfaz decía | Backend hace     |
| ---------------------------- | -------------- | ---------------- |
| `vad_enabled`                | `true`         | `false` (v6)     |
| `history_limit`              | `5`            | `20`             |
| `recording_retention_period` | `never`        | `preserve_limit` |

El del VAD mostraba activo lo que la v6 apagó **porque se comía dictados
enteros**. El de `history_limit` proponía el valor viejo que **borra
grabaciones**. El de retención prometía "no borrar nunca" mientras el
comportamiento real borra por encima del límite.

Los valores viven ahora en `src/components/settings/settingFallbacks.ts` con
tests. **Regla: si cambia un default en `settings.rs`, cambia ahí.**

**Queda sin hacer:** los ~17 usos restantes coinciden con su default hoy, pero
nada lo comprueba automáticamente. La protección real sería no pintar el
control hasta que los ajustes carguen; es un refactor mayor y no se hizo.
También queda consolidar `clipboardHandlingDefault.ts` dentro de
`settingFallbacks.ts` — hoy conviven por no tocar código ya validado en
vísperas de la entrega.

### 9.7 Audio bajo en el Mac de Benja — ABIERTO, con un efecto oculto

Benja reporta captura muy floja, y **es de la app**: Wispr Flow suena bien en el
mismo hardware. Charly lo confirmó de oído. Sin causa identificada.

**El efecto que no era evidente:** con audio muy bajo se desactiva **en
silencio la red de rescate**. El reintento troceado solo se dispara si
`looks_truncated` lo pide, y esa función [devuelve `false` de entrada]
(`silence_gate.rs`) cuando hay poco habla detectada. El detector usa un suelo
**absoluto** de −50 dBFS (`ABSOLUTE_FLOOR_DB`), así que con señal floja cuenta
poco o nada de habla y nunca hay reintento. Benja pierde palabras **y** pierde
el mecanismo que existía para recuperarlas.

**Lo que ya se descartó como remedio:** el slider de ganancia (hasta +12 dB)
**no** arregla la truncación — medido el 26/07, +14,7 dB no cambió ni una
palabra. Pero ojo, eso se midió sobre un micro **ya a nivel sano**; el caso de
Benja es distinto porque su señal podría estar por debajo del suelo absoluto,
y ahí sí cambiaría algo. Merece la prueba, sin esperar que arregle lo otro.

**Hipótesis sin verificar** de por qué Wispr Flow suena bien: usa la unidad de
_Voice Processing_ de macOS (control automático de ganancia), que cpal no
activa. No se puede comprobar desde fuera.

### 9.8 El truncado por silencio largo: causa raíz y arreglo (`015aca3`)

**Reproducido en la máquina de Charly, no solo en la de Benja.** Un dictado de
27,1 s devolvió **26 palabras**, con un silencio sostenido de 1610 ms en medio
(el fallo de §2.2: Whisper termina el decode al toparse con un silencio largo).

**Lo nuevo, y lo grave: el reintento de rescate NO se disparó**, existiendo
precisamente para esto.

**Por qué no se disparó.** `looks_truncated` divide las palabras por los
**segundos de habla** que mide el gate, y esa medida **no es independiente del
nivel de grabación**: `ABSOLUTE_FLOOR_DB` es un suelo absoluto de −50 dBFS y esa
voz está a −39,6, así que las sílabas átonas caen por debajo y cuentan como
silencio.

| Medida                    | Valor                            |
| ------------------------- | -------------------------------- |
| Duración real             | 27,15 s                          |
| Habla según el gate       | **6,90 s**                       |
| 26 palabras sobre habla   | 3,77 p/s → "sano", no dispara    |
| 26 palabras sobre el clip | **0,96 p/s** → truncado evidente |

**Medido sobre las 25 grabaciones reales**, la correlación es limpia: el gate ve
el **13%** del clip como habla con la voz a −47 dBFS y el **53%** a −14 dBFS. Es
decir: **cuanto más floja la grabación, más sano parece un dictado truncado.**

> **La frase que resume el bug:** el fallo (audio flojo → Whisper se rinde) y el
> punto ciego de su remedio (audio flojo → el gate mide de menos) **tenían la
> misma causa**. Por eso a Benja le pasa más que a Charly. Y explica su caso sin
> necesidad de su WAV.

**Daño real antes del arreglo:** de los 20 dictados con transcripción, el rescate
saltó **en 1**. Al menos cuatro salieron truncados y pasaron por buenos (12
palabras en 18,6 s; 21 en 22,2 s).

**El arreglo:** `looks_truncated_by_duration(palabras, segundos_de_clip)`, una
segunda red **independiente del nivel**, combinada con OR en el llamante. **No se
tocó el umbral de 2,7**, que está calibrado contra un corpus.

Es seguro por una razón concreta y verificada en el código: el reintento **ya se
descarta salvo que recupere más palabras** (`transcription.rs:1284`), así que
disparar de más cuesta decodes, nunca precisión. Coste medido: 4 clips de 20
pasan a reintentar.

**Por qué va en función aparte y no como tercer parámetro de `looks_truncated`:**
los tests de esa función encodean un corpus real (palabras y segundos de habla
medidos en cinco dictados) y **nadie midió las duraciones totales** de esos
clips. Añadir el parámetro habría obligado a inventárselas, convirtiendo
evidencia medida en ficción dentro del test que vale justo por ser real.

**Herramienta:** `cargo run --example silence_gate_probe -- <wav> [palabras]`
imprime lo que ve el gate y cuál de las dos redes dispara. Es la que encontró
esto y la que sirve para el WAV de Benja.

**Sigue abierto:** el suelo absoluto de −50 dBFS no se tocó. La segunda red tapa
el síntoma, pero `speech_seconds` sigue midiendo de menos en grabaciones flojas,
y esa medida la usan también `speech_segments` y el propio troceado.

### 9.9 ⚠️ Test intermitente SIN IDENTIFICAR (2026-07-30)

En una pasada de `cargo test --lib` durante el trabajo de §9.8: **280 passed, 1
failed**. No se capturó la salida y **no se supo cuál era**. En las **cinco
pasadas siguientes** salieron los 281 en verde.

**Hipótesis descartada, no confirmada:** se sospechó contención por el archivo
temporal compartido `handy_volume_recovery.txt` (ruta fija en
`system_volume.rs:49`) porque la app estaba corriendo a la vez. **Se comprobó y
es falsa**: esos tests se aíslan con `tempfile::tempdir()`, cada uno con su
directorio. La ruta fija la usa solo el código de producción.

**Queda sin explicar.** No darlo por benigno. Si reaparece, lo primero es
**guardar la salida completa** (`cargo test --lib > salida.txt 2>&1`) para saber
al menos qué test es — que es exactamente lo que faltó esta vez.

Que la app estuviera corriendo durante la pasada es la única circunstancia
anómala conocida, pero no se ha establecido ninguna relación causal.

### 9.10 Diccionario: Tareas 1-3 hechas, SIN validar en vivo (`4912e6d`)

**Corregir una palabra desde el Historial, con el radio de impacto a la vista
antes de guardar.** Tareas 1-3 del plan `2026-07-30-diccionario-reemplazos.md`.

| Qué                                                          | Tests |
| ------------------------------------------------------------ | ----- |
| `dictionary.rs` → `rule_impact`                              | 7     |
| `build_impact_report` + comando `preview_replacement_impact` | 4     |
| Botón "Corregir palabra" + diálogo (`correctWord.ts`)        | 8     |

**Verde:** 292 tests Rust (desde 281) y 56 de frontend (desde 48). Typecheck,
eslint y las 21 locales en verde. La app arranca limpia.

> ⚠️ **DOS COSAS QUE FALTAN, no darlas por hechas:**
>
> 1. **Sin validar en vivo.** Nadie ha abierto el Historial a comprobar que el
>    impacto se ve antes de guardar y que la corrección se aplica al **siguiente**
>    dictado. Es el primer paso de la próxima sesión.
> 2. Se paró **a propósito antes de las Tareas 4 y 5** (siembra y propuestas
>    automáticas), por decisión de Charly al quedar poco tiempo.

**Decisiones tomadas durante la implementación** (más detalle en el mensaje de
`4912e6d`):

- **`rule_impact` delega en `apply_custom_replacements`.** Lo que se enseña
  antes de guardar tiene que ser exactamente lo que la regla hará después; una
  segunda implementación "equivalente" divergiría en los bordes y la
  previsualización mentiría justo en los casos difíciles.
- **El impacto se mide contra `transcription_text`, NO contra
  `post_processed_text`**: los reemplazos actúan sobre la transcripción, no
  sobre la salida del LLM.
- **`total` cuenta dictados afectados, no apariciones.** Contar apariciones
  inflaría la cifra con la que el usuario decide.
- `Input` no reenvía refs (es un `FC` sin `forwardRef`), así que el diálogo usa
  `autoFocus` en vez de tocar un componente compartido en vísperas de entrega.

### 9.11 ⚠️ El repo NO está formateado según su propio `.prettierrc`

Ejecutar `bun run format:frontend` reescribió **~190 archivos**: workflows de
CI, `tauri.conf.json`, el README de la crate vendorizada y hasta `.prettierrc`.

Se separó lo real de los fantasmas de CRLF: **solo 38 archivos tenían contenido
distinto**, y de esos **9 no eran de la feature**. Se revirtió todo lo ajeno y
los ~150 fantasmas, dejando el árbol limpio.

**Es preexistente, no lo causó esta sesión**, pero significa que **ejecutar el
formateador del proyecto produce un diff gigantesco**. Si `code-quality.yml`
corre `format:check`, ya estaría fallando por esto.

**Regla práctica hasta que se decida qué hacer: no ejecutar
`bun run format:frontend` sobre todo el repo.** Formatear solo los archivos
tocados, o revisar `git status` a conciencia antes de commitear.

---

## 10. Sesión 2026-07-31 (tarde)

Estado al cerrar: `main` = **`f64400b`**, sincronizado con `origin/main`.
`cargo test --lib` sobre lo commiteado: **320 passed / 0 failed / 1 ignored**.
Con el trabajo sin commitear aplicado: **337 passed**. Frontend: 66 tests.

### 10.1 Mapa de actividad diaria — `125e9cf`

Tabla propia `insights_daily`, migración 5→6 de `rusqlite_migration`, más el
índice `idx_history_timestamp`. Heatmap de 13 semanas al principio de Ajustes →
Historial, con racha, dictados, palabras y días activos.

**El porqué del diseño, que es lo que no se puede perder:** el historial se poda
en cada dictado (20 entradas), así que cualquier métrica derivada de
`transcription_history` daría un mapa de dos días. Los contadores se congelan al
escribir, dentro de la misma llamada que inserta la fila del historial y **antes**
de `cleanup_old_entries()`.

Tres reglas, cada una con el test que cae si se rompe:

| Regla                               | Test                                                              |
| ----------------------------------- | ----------------------------------------------------------------- |
| El contador sobrevive a la poda     | `the_activity_map_survives_the_history_being_pruned`              |
| No depende de que el WAV verifique  | `a_dictation_whose_wav_failed_still_counts_without_a_history_row` |
| Un dictado sin palabras es `failed` | `a_dictation_without_words_is_a_failure_not_a_dictation`          |

El primero mete 25 dictados, poda a 20 como hace `cleanup_by_count` y exige que
el mapa siga diciendo 25: **cae si alguien reescribe el mapa como una consulta al
historial**, que es exactamente el error que se quería prevenir.

`profile_hist` necesita el **id** del perfil y el historial solo guardaba el
_texto_ del prompt, así que `ProcessedTranscription` lleva ahora
`post_process_prompt_id` — el que corrió de verdad, no la selección global.

Decisión de producto: **la racha no se rompe si hoy aún no se ha dictado.** A las
nueve de la mañana nadie ha dictado y un cero castigaría al que madruga.
Cualquier otro hueco sí la rompe. Está en `current_streak`, con test.

**Validado en vivo**: el mapa registró dictados reales, incluidos los del build
instalado (§10.4).

### 10.2 El bug de inglés: acotado, y no era lo que parecía

`selected_language` está en `"es"`, y el selector de idioma **sí existe** (Ajustes
→ General → "Ajustes de \<modelo\>", con opción Auto). Pero cambiar a Auto **no
es la solución**, y eso se midió sobre el WAV real del dictado inglés de Charly
(`handy-1785518377.wav`, 4,7 s con solo 2,4 s de habla):

| Idioma       | Salida                          | Detectado           |
| ------------ | ------------------------------- | ------------------- |
| `es` (hoy)   | `Sípor for arma meirnin saggi.` | —                   |
| `en` forzado | `Sipur Thor arma meilin sagði.` | —                   |
| Auto         | `Síbúð fór arma meilinn sagði.` | **`is`** (islandés) |

Las tres son basura. Es el fallo de clips cortos + auto que **ya tiene test de
reproducción** (`short_spanish_clip_misdetected_on_auto_is_fixed_by_forcing_es`,
transcription.rs). Cambiar a Auto cambiaría un bug por otro.

**Dos conclusiones que hay que mantener separadas:**

1. El pin a `es` **sí** rompe el inglés: con idioma forzado Whisper escribe
   fonética inglesa con ortografía española. Es determinista, no aleatorio.
2. **Este clip no lo demuestra**, porque falla igual en las tres. 2,4 s de habla
   es territorio de alucinación pura.

**Falta la muestra buena, y hay que pedírsela a Charly:** 2-3 frases en inglés de
**más de 6-7 segundos**, marcadas con la **estrella** en el Historial para que la
poda no se las lleve. Las pruebas de inglés del 30/07 **ya se perdieron** — el
historial solo guarda 20 entradas y ninguna estaba marcada.

**Recomendación de diseño (no construida):** un usuario bilingüe no quiere entrar
a Ajustes cada vez. El patrón ya resuelto en el repo es el atajo propio del
formalizador (F9). Ver §10.3 para por qué eso resultó ser más complicado de lo
que parecía.

### 10.3 whisper-large-v3-turbo NO traduce — y el toggle llevaba roto siempre

**Hallazgo de la sesión, y el que más consecuencias tuvo.**

Al construir el atajo ES→EN se probó con audio real (un dictado de 35 s en
español) por la tarea `translate` del motor:

| Variante                              | Salida             |
| ------------------------------------- | ------------------ |
| `--lang es` + `target_language: "en"` | español, sin tocar |
| sin `--lang`, target `en`             | español, sin tocar |
| `--lang es`, sin target (**control**) | español, sin tocar |

**No es el código: es el checkpoint.** Turbo se destiló excluyendo datos de
traducción y devuelve el idioma de origen aunque se le pida `translate`. Lo
documenta OpenAI en `openai/whisper#2363`. La medición y la documentación
coinciden.

**Consecuencia que importa más que el atajo:** el toggle **"Translate to English"
llevaba sin hacer nada** para cualquiera con turbo — que es el default en toda
máquina con GPU dedicada. Bug preexistente, no introducido.

**Arreglado en `f64400b`.** La corrección vive en `checkpoint_translates`
(`model_capabilities.rs`) y hay que aplicarla en **DOS sitios**, porque olvidar el
segundo deshace el primero en silencio:

1. **La conversión del catálogo.** `catalog.json` declara `translate: true` para
   turbo, y **no se puede arreglar en el JSON**: se genera en build time con
   `scripts/gen_catalog.py` desde las fichas de Hugging Face, así que la
   siguiente regeneración se lo llevaría.
2. **`set_runtime_capabilities`**, que sobrescribe la capacidad con la que
   reporta el motor en cuanto el modelo carga. El motor dice `true` porque
   informa de la **familia** Whisper, no del checkpoint. Sin este segundo punto
   el toggle desaparecía al abrir Ajustes y **reaparecía tras el primer
   dictado** — intermitente, que es peor que dejarlo visible.

Detalle revelador: `model.rs:572` **ya sabía esto**
(`supports_translation: false, // Turbo doesn't support translation`, en la tabla
heredada), pero el catálogo se siembra primero y gana, así que ese conocimiento
no llegaba al camino que se usa.

La coincidencia es **por repo exacto, jamás por "contiene turbo"**. Hay test de
control sobre `large-v3` (que sí traduce y es el reemplazo natural) para que la
regla no se ensanche: ese control **cayó en la primera pasada** y evitó apagar la
traducción en el modelo bueno.

### 10.4 v0.9.1: release y **validación de instalación limpia**

Release: <https://github.com/JuanIA-sketch/trazo/releases/tag/v0.9.1> —
pre-release con los **7 instaladores**, matrix 5/5 en verde
([run 30658845257](https://github.com/JuanIA-sketch/trazo/actions/runs/30658845257)).

**Dos premisas que había que corregir antes de cortarla:**

- **Ningún workflow se dispara con un tag.** `release.yml` es `workflow_dispatch`
  y saca la versión de `tauri.conf.json`.
- **`release.yml` corre con `sign-binaries: true`**, así que sus jobs de Windows
  y macOS mueren firmando (§8.7). El workflow llamado "Release" es justo el que
  **no puede** producir los instaladores de Windows y Mac. El camino bueno es
  `cross-platform-check.yml`, que omite la firma — el mismo que produjo v0.9.0.

**El tag apunta a `a48fc8d`**, el commit del que compiló el matrix, no al HEAD.

**Validación de instalación limpia — nadie había probado el paquete final:**

| Comprobación                        | Resultado                                                                                                |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Descarga pública sin token          | 20.993.165 bytes, SHA256 `3FDA5C71…`                                                                     |
| Firma                               | `NotSigned` (esperado)                                                                                   |
| Instalación `/S`                    | exit 0, en `%LOCALAPPDATA%\Trazo`, **sin admin**                                                         |
| Bundle                              | `ggml-vulkan.dll` (70 MB), 9 variantes CPU, `onnxruntime.dll`, `transcribe.dll`, Silero, sonidos, iconos |
| Arranque                            | 3 dispositivos (Vulkan0 Intel, Vulkan1 GTX 1650, CPU), `Shortcuts initialized successfully`              |
| Transcripción del binario instalado | 35,19 s de audio en 6,29 s (**5,59× tiempo real**), texto correcto                                       |
| Camino completo con micrófono       | Entrada de historial creada + texto en el portapapeles                                                   |
| Mapa de actividad                   | Vivo en el build de release                                                                              |
| Clave de API en el log              | `[REDACTED]` (§8.9 confirmado en release)                                                                |

**Cómo se probó el dictado, y su límite honesto:** un agente **no tiene voz**. Se
hizo un **bucle acústico** — reproducir un WAV por los altavoces mientras la app
instalada grababa, con Notepad enfocado para que el pegado cayera en sitio
inofensivo. Funcionó: se creó la entrada y el texto llegó al portapapeles. El
texto salió degradado (`"que me ayudes a hacer un guion y Atún Chelos loES"`) por
el propio montaje: altavoz→micrófono ya degrada, y encima `recording_volume: 0.33`
bajó la reproducción al 33% mientras grababa (el ducking funcionando, contra la
prueba).

> **Lo que sigue SIN probar: la calidad de dictado con la voz de Charly sobre el
> build instalado.** Eso solo lo puede hacer él.

### 10.5 ⚠️ Tres cambios en la máquina de Charly, y cómo revertirlos

Hechos para poder probar la instalación limpia. **Leer antes de trabajar.**

1. **`bun run tauri dev` está PARADO.** Había que matarlo: el watcher relanzaba
   la app de dev y el plugin de instancia única hacía que la instalada cediera y
   saliera. El servidor de Vite sigue levantado.
   → **Revertir:** `bun run tauri dev` desde `C:\Handy`.
2. **El autostart apunta al binario instalado.** La clave
   `HKCU:\...\CurrentVersion\Run\Trazo` pasó a `%LOCALAPPDATA%\Trazo\handy.exe`.
   En el próximo login arranca la versión instalada, no la de dev.
   → **Revertir:** desinstalar con `%LOCALAPPDATA%\Trazo\uninstall.exe`, o
   reescribir esa clave a mano.
3. **El store está en `settings_schema_version: 9`**, con el binding
   `transcribe_to_english` dentro. Lo migró una ejecución de dev con el atajo
   ES→EN **sin commitear**. El build de release lo lee sin problema y lo ignora
   (F10 no hace nada ahí), pero es un residuo de trabajo no commiteado dentro de
   su configuración real. **Si el atajo ES→EN se descarta, hay que decidir qué
   hacer con ese binding huérfano.**

**Respaldo completo** de `%APPDATA%\com.trazo.app` (30 archivos) antes de
instalar, en `~\trazo-backup-preinstall-20260731`.

La instalación sigue en disco a propósito, por si se quiere inspeccionar.

### 10.6 Lo que le falta a v0.9.1

1. **No lleva el fix del toggle.** `f64400b` es posterior a `a48fc8d`, del que
   compiló el matrix. Quien instale esta build **sigue viendo "Translate to
   English" muerto**. Para arreglarlo hace falta relanzar el matrix y sacar
   **v0.9.2**.
2. **El ejecutable dentro del bundle sigue llamándose `handy.exe`**, no
   `Trazo.exe`. Es el pendiente de §8.3, y su coste está medido: `build.yml`
   tiene **8 asserts** que exigen ese nombre. Tocar solo el config pone el matrix
   rojo en los cinco jobs.

### 10.7 Hey Trazo — integración hecha, modelo pendiente

**El Colab NO ha entregado el `.onnx`.** No hay `hey_trazo.onnx` en
`src-tauri/resources/models/wakeword/`. **Un agente no puede vigilar el Colab**
(sin navegador ni cuenta Google): solo puede mirar si aparece el archivo en
disco, y ese archivo lo tiene que bajar Charly.

**Lo que sí está hecho y funcionando** (sin commitear):

- Cadena ONNX completa en Rust: `melspectrogram.onnx` → `embedding_model.onnx` →
  clasificador, sobre el `ort 2.0.0-rc.12` que **ya estaba en el árbol** vía
  transcribe-rs/vad-rs → **cero DLLs nuevas**.
- **El tap de audio** (`recorder.rs`): `with_wake_callback` corre **antes** del
  `if !recording { return; }`. Ese return era justo lo que hacía que el modo
  always-on no sirviera para nada más que ahorrar latencia de apertura.
- Inferencia **fuera del hilo de captura** (canal acotado de 32 con `try_send`):
  si el detector se atrasa se pierde audio de escucha, nunca se estrangula la
  captura.
- El disparo llama a `send_transcription_input(app, "transcribe", "wake-word")` —
  el mismo camino que el atajo de teclado.
- Validado en vivo con el preentrenado `hey_jarvis`: el listener procesa audio
  real (`input peak 0.0147`) y puntúa 0.000 sobre ruido de sala, o sea que no se
  autodispara.

**Cuando llegue el modelo:** dejarlo en `resources/models/wakeword/hey_trazo.onnx`
y cambiar **una constante**, `ACTIVE_CLASSIFIER`. El melspectrograma y el
embedding son compartidos por cualquier palabra.

> **⚠️ `FORCE_ALWAYS_ON = true` mantiene el micrófono abierto de forma
> permanente.** Es temporal y a propósito (sin eso el grabador no entrega tramas
> fuera de la grabación). **Debe convertirse en un ajuste con toggle antes de
> distribuirse.** Revertirlo es una línea en `wakeword/mod.rs`.

**Calibración del refractario, que costó un test:** dos tests se contradijeron y
**el fixture era el equivocado**, no la lógica. Una frase mantiene la puntuación
alta mientras siga dentro de la ventana del clasificador (~1,3 s), así que el
refractario tiene que ser **mayor** que esa ventana o una sola "Hey Trazo"
arranca varias grabaciones. Quedó en 25 trozos (2 s).

**Investigación de openWakeWord (lo que decide el futuro):**

- **Licencia**: el código es Apache 2.0 y el backbone también (el embedding es de
  Google, Apache-2.0). Pero **los modelos preentrenados son CC-BY-NC-SA**, no
  comerciales. La restricción viene de los **datos de entrenamiento**, así que un
  modelo propio hereda la licencia de los negativos que se usen (ACAV100M, Free
  Music Archive, impulsos del MIT). **Auditarlos antes de distribuir.**
- **El riesgo técnico del español**: el generador multi-hablante de
  `piper-sample-generator` es **solo inglés**. El atajo práctico es sembrar la
  palabra con grafías fonéticas inglesas (`hey trasso`, `hey trahso`,
  `hey tratho`, `hey tratzo`) para cubrir el /s/ latinoamericano y el /θ/
  peninsular sin pelearse con voces Piper en español.

### 10.8 Cosas que NO hay que volver a construir

- **El segundo disparador del rescate por duración YA EXISTE**, desde `015aca3`
  (30/07), con estos números exactos: `MIN_WORDS_PER_TOTAL_SECOND = 1.0` y
  `MIN_JUDGEABLE_TOTAL_S = 10.0`, combinados con OR sin tocar el umbral 2,7. Se
  pidió construirlo en esta sesión y **ya estaba hecho**. La sonda
  `silence_gate_probe` lo imprime: `sobre duración : X palabras/s (umbral 1.00)`.
- **El diccionario (Tareas 1-3) ya estaba pusheado** en `4912e6d`. También se
  pidió subirlo y ya estaba arriba.

**Lección de proceso:** antes de construir algo "ya diseñado y aprobado",
comprobar si ya está en el árbol. Dos de dos en esta sesión.

### 10.9 Trabajo SIN COMMITEAR al cerrar

| Archivo / grupo                                                                                                                    | Qué                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `src-tauri/src/wakeword/` (**nuevo**, 5 archivos)                                                                                  | Hey Trazo completo (§10.7)                                              |
| `src-tauri/resources/models/wakeword/` (3 `.onnx`)                                                                                 | Backbone + `hey_jarvis` preentrenado. **No están gitignored**           |
| `recorder.rs`, `managers/audio.rs`                                                                                                 | Tap de audio + `FORCE_ALWAYS_ON`                                        |
| `Cargo.toml` / `Cargo.lock`                                                                                                        | `ort` + `ndarray`                                                       |
| `settings.rs`, `actions.rs`, `transcription.rs`, `transcription_coordinator.rs`, `shortcut/*`, `ModelSettingsCard.tsx`, 21 locales | Atajo ES→EN en F10, con migración v9. **Es un no-op con turbo** (§10.3) |
| `examples/es_model_eval.rs`                                                                                                        | Flag `--translate` (diagnóstico, útil)                                  |

**Nunca `git add -A`**: metería los tres `.onnx` (3,7 MB) y los fantasmas de
CRLF. Usar rutas explícitas, y `git diff --numstat` para ver qué cambió de verdad.

**Truco que funcionó tres veces esta sesión** para commitear un subconjunto y
verificar que _lo que se sube_ compila solo: `git add <rutas>` +
`git stash push --keep-index` + correr la suite + commit + `git stash pop`.
**Ojo:** el pop falla si `Cargo.lock` se regeneró mientras tanto
(`git checkout -- src-tauri/Cargo.lock` antes de hacer pop).

### 10.10 Backlog explícito, decidido con Charly

- **EN→ES (Canary): NO empezar sin decidirlo con él.** Whisper solo traduce
  **hacia** el inglés. Para EN→ES hace falta un modelo any-to-any; el catálogo ya
  trae Canary (`canary-1b-flash`: en/de/es/fr; `canary-1b-v2`: 25 idiomas), pero
  eso significa un segundo modelo residente, con coste de RAM y de carga. **Es
  bastante más que el patrón del F9.**
- **El atajo ES→EN no se commitea** por ahora: está bien construido y es un no-op
  con turbo.

---

## 11. Sesión 2026-07-31 (noche) → 2026-08-01 (madrugada)

Sesión larga con un único hilo: **montar el diseño de Trazo de Benja sobre la
app y publicarlo**. Terminó con el diseño fusionado en `main`, una release
publicada, y un bloqueo de máquina que impide seguir con lo que toca Rust.

### 11.1 BLOQUEO ACTIVO — el pagefile (hacer esto primero)

**Ningún build de Rust entra en esta máquina hasta subir el pagefile y
reiniciar.** Se intentó tres veces y falló tres veces, siempre por la misma
causa aunque con tres síntomas distintos:

| Intento | Commit libre | Dónde murió                                                                             |
| ------- | ------------ | --------------------------------------------------------------------------------------- |
| 1       | 1,6 GB       | `error[E0786]` al mapear `libwindows-*.rlib` — `os error 1455` (ERROR_COMMITMENT_LIMIT) |
| 2       | 2,9 GB       | `memory allocation of 2129936 bytes failed` en MIR (`elaborate_drops`)                  |
| 3       | 7,0 GB       | `rustc-LLVM ERROR: out of memory` en codegen                                            |

Cada intento llegó más lejos, lo que confirma que es memoria y no un bug.

⚠️ **Corrección a un diagnóstico previo:** durante la sesión se afirmó que el
pagefile estaba "en su tope de 20 GB, ya asignado por completo". **Es falso.**
La lectura real era `InitialSize 2048 MB / MaximumSize 20480 MB` con un límite
de commit de 28,9 GB: el archivo solo había crecido a ~5 GB. El fallo no era
chocar contra el tope, **era que el pagefile no crecía lo bastante rápido
durante el pico de asignación del compilador**. Por eso lo que arregla el
problema es subir el **tamaño inicial** (pre-asignado), no tanto el máximo.

```powershell
# PowerShell COMO ADMINISTRADOR
$pf = Get-CimInstance Win32_PageFileSetting
$pf.InitialSize = 12288    # 12 GB pre-asignados - esto es lo que arregla el pico
$pf.MaximumSize = 24576    # 24 GB de tope (32 NO entra: C: tiene ~30 GB libres)
Set-CimInstance -InputObject $pf
Restart-Computer           # el cambio NO surte efecto sin reiniciar
```

No se pudo aplicar en la sesión: **acceso denegado** (el agente no corre
elevado), y además 32 GB fue rechazado por rango porque no cabe en disco.

Después de reiniciar, comprobar que subió de verdad antes de compilar:

```powershell
(Get-CimInstance Win32_OperatingSystem).TotalVirtualMemorySize / 1MB
Get-CimInstance Win32_PageFileSetting | Select-Object InitialSize, MaximumSize
```

Dos consumidores que vuelven solos y hay que vigilar: **Chrome** (llegó a 10 GB
en 42 procesos) y **rust-analyzer** (~3,2 GB; VS Code lo relanza al recargar).

### 11.2 Lo que se fusionó y se publicó

- **Merge `daef7e1`**: `feat/rebrand-material` hacia `main`. Limpio, sin conflictos.
- **`main` = `56e0ed6`** (bump de versión), empujado a `origin/main`.
- **Release v0.9.5** publicada como pre-release sin firmar, con 7 instaladores,
  tag sobre `56e0ed6`:
  https://github.com/JuanIA-sketch/trazo/releases/tag/v0.9.5
- Se saltó 0.9.3 y 0.9.4 a propósito: esos tags y sus releases ya existían,
  heredados del fork de cjpais/Handy.
- ⚠️ **`src-tauri/Cargo.toml` sigue en 0.9.2**, a propósito: está dentro del WIP
  de wakeword sin commitear y no correspondía meter un bump de release en ese
  diff. El bundle y el updater leen `tauri.conf.json`, así que la release salió
  como 0.9.5 igualmente. **Alinearlo al commitear el wakeword.**

**La release v0.9.2 fue sobrescrita a petición de Charly**: se borraron sus 7
instaladores, se subieron los de 0.9.5 y se reemplazó su descripción. Quedan
tres incoherencias conocidas y aceptadas: el título sigue diciendo v0.9.2, su
tag sigue apuntando a `37e97dc` (anterior a la fusión), y la descripción empieza
con una frase que se compara consigo misma. Los binarios originales son
recuperables de los artefactos del run `30667493544` **hasta el 30 de agosto**.

### 11.3 Punto 1 — completado y verificado

**Desplegables con la receta de pozo.** `Dropdown` pasa a superficie hundida
(`--wl-bg`, borde `--wl-bd`, sombra interior), chevron que gira con la curva
única, y menú desplegado como panel con la opción activa en el acento.

**Chips de fila en 31 componentes** de Avanzado, Depuración y Acerca de.

Medido en vivo por CDP: General 8 chips / 2 pozos · Avanzado **18 de 20 filas**
/ 9 pozos · Acerca de 2 de 8 filas / 1 pozo.

**Aplazado por Charly, no olvidado:** faltan chips en 6 filas de Acerca de, 2 de
Avanzado, y **las cabeceras de panel fuera de General siguen sin su chip de
grupo** (solo se cablearon las dos de General).

### 11.4 Punto 3 — completado y verificado

**La letra "T" del overlay ya no existe.** El diseño es explícito: _Sin letra
adentro: la corona es la marca._ La corona (`.scrown`) **ya estaba montada**
desde antes; lo único que faltaba era quitar la letra.

**El contorno de la píldora es ahora el visualizador.** Geometría pura en
`src/overlay/borderWave.ts` con **7 tests escritos primero**, que garantizan las
dos reglas del diseño: la onda va **siempre hacia adentro**, y la amplitud decae
con la distancia angular a la corona.

- Decisión de Charly: **onda hacia adentro** y **las barras internas ceden**
  (quedan a opacidad 0,42 como textura, sin competir).
- **Indicador de progreso de transcripción** (que vivía en el trazo diagonal de
  la "T"): durante `phase === "working"` el borde deja de ondular y un arco
  orbita por `stroke-dashoffset`. Cero elementos nuevos, cero Rust.
- **Nunca corre en reposo**: el `requestAnimationFrame` solo existe con el
  overlay visible. Verificado: oculto, el path viene vacío.
- `prefers-reduced-motion`: borde estático, más grueso, sin órbita.

⚠️ **Sin validar por un humano:** nadie ha visto el borde ondular con voz real.
**El desplazamiento máximo son 6 px hacia adentro** (parámetro `maximo` de
`deformarHaciaAdentro`) y es el número más probable de tener que calibrar.

**Dato que contradice al documento del diseño:** el documento avisa de que "la
ventana del overlay es del tamaño de la píldora" y que una onda hacia afuera se
recortaría. **No es exacto**: la ventana mide 256x64 (`OVERLAY_WIDTH` /
`OVERLAY_HEIGHT` en `overlay.rs:50-51`) y la píldora 184 de ancho, así que hay
**36 px de holgura a cada lado** y ~11 px abajo. Hacia afuera en horizontal
cabría sin tocar Rust; en vertical no.

### 11.5 Trampas de entorno descubiertas

1. **`gh` resuelve por defecto al repo padre del fork.** El primer intento de
   disparar la release fue contra `cjpais/handy` y falló con 403. **Usar siempre
   `--repo JuanIA-sketch/trazo`.**
2. **`release.yml` no puede funcionar en este fork**: exige firma y no hay
   secretos. macOS muere importando un `APPLE_CERTIFICATE` vacío; Windows
   compila entero y muere en `trusted-signing-cli`. **Los instaladores salen de
   `cross-platform-check.yml`**, que deja `sign-binaries` en `false`.
3. **La instancia instalada de Trazo bloquea el binario de desarrollo** por
   instancia única. Cerrarla antes de levantar el de dev.
4. **Subir artefactos grandes a una release se corta por tiempo**: los tres de
   Linux (70-150 MB) hay que subirlos por separado con `gh release upload`.
5. **Capturar la app**: `PrintWindow` devuelve negro (WebView2 compone por
   DirectComposition) y capturar por pantalla fotografía lo que haya delante. La
   vía buena es **CDP**, relanzando con
   `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222`.

### 11.6 El WIP de wakeword de Charly — intacto

**37 archivos sin commitear**: 35 modificados más 2 directorios sin trackear
(`src-tauri/src/wakeword/` y `src-tauri/resources/models/wakeword/`).

Sobrevivió a la fusión: se guardó en `git stash` con respaldo adicional en
parche, y volvió **sin un solo conflicto**. Verificado que conviven los dos
lados (su `transcribe_to_english` y las claves nuevas del diseño en el mismo
`translation.json`) y que sus añadidos a `ModelSettingsCard.tsx` siguen ahí.

El diff actual difiere del respaldo previo solo en hashes de blob y en los
desplazamientos de línea de dos archivos (`ModelSettingsCard.tsx` y
`bindings.ts`), porque la fusión cambió su base — que es exactamente lo que
debía pasar. **0 stashes pendientes.**

### 11.7 Qué queda, por orden

1. **Punto 2 — BLOQUEADO hasta el pagefile (11.1).** Dos cosas, ambas con TDD y
   verificando que cada build pase antes de seguir:
   - **Ventana 1100x880 + maximizable**: tres valores en `lib.rs:840`
     (`inner_size`, `min_inner_size`, `maximizable`). El diseño asume el ancho
     grande; a 680 px queda apretado por definición.
   - **Selector de tema de tres segmentos** (claro / oscuro / automático en
     vivo). **El CSS ya está listo**: los valores oscuros son conmutables por
     `data-theme`, con `themeSwitch.test.ts` vigilando que las dos copias
     (forzada y automática) no se desincronicen. Falta el control y el ajuste
     persistido, que es lo que toca Rust.
     ⚠️ **Contradicción sin resolver**: `05-DETALLES-UX.md` dice que va en
     Ajustes → General; el tablero `Sidebar.dc.html` lo dibuja **en el pie del
     sidebar**, entre HeyTrazo y la píldora del modelo. Hay que decidir.
2. **Fondos a WebP — NO empezado.** Son ~70 MB en 4 PNG del ZIP
   (`bg-onboarding` 19,7 · `bg-acerca` 19,6 · `bg-error` 15,5 ·
   `bg-empty-historial` 14,9) más `corona.png` (1,45 MB para un elemento de
   38 px). No es bloqueante para la entrega.
3. **Sidebar colapsable**: borde arrastrable + botón chevron. El DSL ya trae la
   propiedad `colapsado` y los estados compactos de cada pieza.
4. **Huecos menores del punto 1** (11.3).

### 11.8 Dónde está el material de diseño

El ZIP **APP TRAZO REBRAND OFICIAL.zip** (169 MB, 81 archivos) está en
`~/Downloads`. Contiene los componentes del DSL (`Pantalla.dc.html`,
`Shell.dc.html`, `Sidebar.dc.html`, `HeyTrazo.dc.html`, `Tablero.dc.html`), los
seis tableros de presentación, los assets, y **dos documentos de especificación
que no aparecen en la guía**: `uploads/05-DETALLES-UX.md` (selector de tema) y
`uploads/06-OVERLAY-BORDE-REACTIVO.md` (el borde reactivo).

Los `.dc.html` **no renderizan solos**: `support.js` es el runtime del DSL y
espera `window.React` y `window.ReactDOM` del anfitrión. Para verlos hay que
inyectar los builds UMD de React antes de `support.js`.

---

## 12. Sesión 2026-08-01

Punto 2 (selector de tema) y fondos a WebP. Todo el frontend en verde; **nada
commiteado, a propósito**. El WIP de wakeword sigue intacto.

### 12.1 ⚠️ EL PAGEFILE SIGUE SIN SUBIR — verificado, no supuesto

Se comprobó al arrancar la sesión y **no se aplicó el cambio de §11.1**:

```
InitialSize 2048 / MaximumSize 20480    ← idéntico a §11.1
Último arranque: 31/07/2026 23:41       ← no hubo reinicio
```

Durante la sesión el **commit libre llegó a bajar a 0,73 GB** (Chrome solo:
47 procesos / 8,3 GB; más 44 procesos de node). Es _peor_ que el intento 1 de
§11.1, que ya murió con 1,6 GB. No es solo Rust: **hasta Chromium headless
falló** — Playwright lanzó el proceso (pid 20464) y se colgó 180 s sin
completar el handshake, intentando capturar el control. Los huérfanos se
cerraron; no quedó nada corriendo.

**Sigue vigente el comando de §11.1 (PowerShell como administrador + reinicio).**

### 12.2 Selector de tema — decisión tomada y frontend completo

**La contradicción de §11.7 se resolvió: va en el PIE DEL SIDEBAR**, como lo
dibuja `Sidebar.dc.html`, no en Ajustes → General como dice
`05-DETALLES-UX.md` §1. Decisión de Charly. Razón: es visible desde cualquier
pantalla, no engorda General (que ya carga 20 controles, §5 del mismo
documento) y sale siempre en el video de demo. Queda entre `HeyTrazo` y
`ModelSelector`.

Confirmado que la contradicción **era real**: el tablero dibuja de verdad una
píldora de 3 segmentos (sol / auto / luna) con `title`, no era el prop `tema`
de previsualización.

**Lo que se construyó (TDD, test en rojo visto fallar primero):**

- `src/lib/utils/theme.ts` — lógica pura, **11 tests** en
  `theme.test.ts`. La sutileza que justifica los tests: **"automático" no es
  un valor de `data-theme`, es su AUSENCIA**, porque el CSS escribe la media
  query como `:root:not([data-theme="light"]):not([data-theme="dark"])`.
  Escribir `data-theme="auto"` dejaría al usuario clavado en claro y
  _parecería_ correcto al inspeccionar el DOM. Hay un test dedicado a que
  volver a automático BORRE el atributo.
- `src/components/ThemeToggle.{tsx,css}` — `role="radiogroup"` + 3 `radio`.
  Glifos calcados del tablero (`ic-sun`/`ic-auto`/`ic-moon`).
- `src/hooks/useTheme.ts` — persistencia.
- Tokens `--tgs-tx/-bg/-sh` (segmento elegido) añadidos a los **tres** bloques
  de `material.css`. Los `--tg-*` del carril **ya existían** del merge de Benja.
- Arranque en `main.tsx`: el tema se aplica **antes** del primer render y las
  transiciones se habilitan recién tras el primer pintado (doble `rAF`), que es
  lo que evita el flash. Hay test del orden.
- Claves `theme.*` en las **21 locales** (`check:translations` 20/20).

**Bug colateral encontrado y arreglado:** `App.css` ajustaba la opacidad del
grano solo por `@media (prefers-color-scheme: dark)`. Forzar el tema claro con
el sistema en oscuro habría dejado el grano de oscuro (0.038) sobre fondo
claro — justo el artefacto que ese valor existe para evitar. Ahora va por
duplicado, forzado + automático, como los tokens.

⚠️ **La persistencia vive hoy en `localStorage`, no en `settings.rs`.** Es
deliberado y temporal: `settings.rs` tiene el WIP de wakeword encima (+103
líneas) y la máquina no compila Rust. El comportamiento visible ya es el
definitivo. **Al migrar solo cambian las dos líneas de lectura/escritura de
`useTheme.ts`**; la lógica pura y el control no se enteran.

⚠️ **Sin validar por un humano.** El intento de captura headless murió por
memoria (§12.1). Nadie ha visto el control renderizado.

### 12.3 Fondos a WebP — hechos

**68,08 MB → 566 KB.** Los 4 PNG del ZIP eran de 5504x3072 y 4096x4096, o sea
que el grueso del ahorro es el reescalado, no el formato.

| archivo                   | destino | tamaño | SSIM   |
| ------------------------- | ------- | ------ | ------ |
| `bg-onboarding.webp`      | 2560 px | 81 KB  | 0,9921 |
| `bg-acerca.webp`          | 2560 px | 465 KB | 0,9885 |
| `bg-error.webp`           | 1024 px | 10 KB  | 0,9953 |
| `bg-empty-historial.webp` | 1024 px | 11 KB  | 0,9956 |

Calidad **90**, elegida con datos: se midió SSIM contra el original reescalado
a q82/q90/q95/sin-pérdida. De q90 a sin-pérdida el SSIM sube ~0,003 y el peso
casi se triplica. `bg-acerca` es el caso caro y el de peor SSIM porque **no es
un degradado suave sino un campo denso de líneas finas de cian** — se
inspeccionó un recorte al 100 % y q90 es indistinguible del original.

Herramienta: `ffmpeg` con `libwebp` (no hay `cwebp` ni `magick` en la máquina).

⚠️ **Están en `src/assets/` pero NO los referencia nadie todavía** — no
aparecen en el `dist` del build. Cablearlos a las pantallas de vacío/error es
el trabajo de "estados que hoy no existen" (`05-DETALLES-UX.md` §2), que no se
tocó. `corona.png` **no hacía falta**: el repo ya tiene una de 25,6 KB, no la
de 1,45 MB que decía §11.7.

### 12.4 Ventana 1100x880 — editada pero SIN COMPILAR

`lib.rs`: `inner_size` 680x570 → **1100x880** y `maximizable` false → **true**.

**`min_inner_size` se dejó en 680x570 a propósito**, contra lo que sugería
§11.7 ("tres valores"): 880 px de alto **no entran en un portátil de
1366x768**, y un mínimo que no entra en la pantalla deja la ventana sin poder
encogerse. El tamaño de arranque es una recomendación; el mínimo es un límite
duro.

⚠️ **No se compiló** (§12.1). Son tres literales dentro de una cadena de
métodos, pero nadie lo verificó. Es lo primero que hay que probar tras el
reinicio. El cambio está dentro de `lib.rs`, que también tiene WIP de
wakeword; el diff propio son solo esas dos líneas más comentarios.

### 12.5 Verificación

`bun test src/` → **86 pass / 0 fail** (75 previos + 11 nuevos) ·
`bunx eslint src` → exit 0 · `bun run build` → ✓ ·
`check:translations` → 20/20.

`prettier` se corrió **solo sobre los archivos que se tocaron**, nunca sobre el
repo (§9.11). Ojo: `App.css` y `material.css` **ya estaban sin formatear en
HEAD** — se comprobó contra la versión commiteada antes de concluirlo, y se
dejaron como estaban para no generar ruido.

### 12.6 ⚠️ HALLAZGO GORDO: hay un SEGUNDO worktree y es el que corre

**`C:\trazo-material` es un worktree de este mismo repo**, en la rama
`feat/rebrand-material` (`f56515e`, que `main` ya contiene por el merge
`daef7e1`). No aparece mencionado en ningún sitio de este documento hasta hoy.

```
git worktree list
C:/Handy          56e0ed6 [main]
C:/trazo-material f56515e [feat/rebrand-material]
```

**Tiene 52 archivos sin commitear** (49 modificados + 3 sin trackear), y entre
ellos está **todo el trabajo de §11.4 que este documento daba por hecho**:

```
?? src/overlay/borderWave.ts        ?? src/overlay/borderWave.test.ts
?? src/overlay/ReactiveBorder.tsx    M src/overlay/RecordingOverlay.{tsx,css}
```

Fechados el 1/08 entre 01:08 y 01:15. **En `C:\Handy` no existe ninguno de esos
archivos** y `git log --all` no los conoce: el borde reactivo **nunca se
commiteó ni se trajo a `main`**. §11.4 lo describe como terminado y verificado;
lo que hay en `main` es el overlay viejo, con la letra "T" todavía en el markup
(`RecordingOverlay.tsx:187`), que es justo lo que §11.4 dice haber quitado.

**Y es el worktree el que sirve la app.** El Vite del puerto 1420 es
`node C:\trazo-material\node_modules\vite\bin\vite.js`, así que
`C:\h\debug\handy.exe` viene cargando **el frontend del worktree, no el del
repo**. Por eso una corrección hecha en `C:\Handy` no se ve en la app corriendo:
se comprobó pidiendo el CSS a Vite y venía la versión vieja.

**Trampa nueva, y explica cosas raras:** cualquier verificación visual contra la
app de dev está mirando `C:\trazo-material`. Antes de creerse un "no se ve el
cambio", comprobar quién escucha en 1420:

```powershell
Get-CimInstance Win32_Process -Filter "ProcessId = $((Get-NetTCPConnection -LocalPort 1420 -State Listen).OwningProcess)" | Select-Object CommandLine
```

✅ **RESUELTO el mismo día: los 52 archivos ya están commiteados.** Charly dio
permiso sobre el directorio y se commitearon en su propia rama,
`feat/rebrand-material`:

```
980aca6 chore(wip): respalda el diseno de material que vivia solo en el disco
        49 modificados + 3 nuevos · árbol de trabajo limpio
```

Se commiteó **tal cual estaba**, sin revisar ni tocar nada: el objetivo era
sacarlo de un directorio de trabajo, no juzgarlo. Se comprobó antes que los 49
modificados tenían contenido distinto de verdad (`git diff --numstat` = 49, sin
fantasmas de CRLF) y que los 3 sin trackear eran fuente legítima. Se stageó por
ruta explícita, **nunca `git add -A`**.

⚠️ **No está pusheado** (nadie lo pidió): el respaldo es local. Si la máquina se
pierde, se pierde. `git -C C:\trazo-material push -u origin feat/rebrand-material`
cuando se quiera respaldo fuera del disco.

**Sigue pendiente y es decisión de Charly:** revisar ese commit e integrarlo a
`main`. Se dejó a propósito para mañana.

### 12.7 Fallo visual del overlay — causa raíz y arreglo

Charly reportó un fallo visual sin poder describirlo. Se reprodujo en vivo:
CDP contra la ventana del overlay + `--toggle-transcription` para grabar de
verdad, y captura a 4x.

**Lo que se veía: la píldora cortada en seco por abajo.** El halo sobrevivía a
izquierda y derecha pero desaparecía debajo, y el borde inferior quedaba
recto contra el canto de la ventana.

**Causa raíz, medida (no deducida):**

| dato            | valor                                                       |
| --------------- | ----------------------------------------------------------- |
| ventana         | 256x64 (`OVERLAY_HEIGHT`, constante de Rust)                |
| tarjeta         | top 22.4 · bottom **64.0**                                  |
| hueco debajo    | **0 px**                                                    |
| hueco encima    | 22.4 px (de sobra)                                          |
| halo `--t-glow` | `offsetY 3px, blur 26px, spread -9px` → se derrama **7 px** |

`.ov-stage` usa `align-items: flex-end`, que pega la tarjeta al borde inferior.
La variante `.ov-stage.top` **sí** tenía `padding-top: var(--ov-crown-up)` para
que la corona no se saliera; **a la de abajo nunca le pusieron el equivalente
para el halo**. Todo el sobrante vertical estaba arriba y no hacía falta ahí.

**El presupuesto no daba**: corona (13) + tarjeta (40) + halo (7) = 60 px de
contenido para 64 px de ventana, sin aire para el resplandor de la corona. Se
probaron cuatro variantes en vivo inyectando CSS por CDP y capturando cada una;
mover solo el hueco dejaba la corona cortada por arriba. La que funciona
reparte el ajuste en tres:

- `.ov-stage { padding-bottom: 5px }` — el espejo del `padding-top` de `.top`.
- `--t-glow` con `offsetY: 3px → 0` — el halo es partido izquierda/derecha, el
  desplazamiento hacia abajo no aportaba al efecto y costaba 3 px.
- `--ov-crown-up: 13px → 10px` — los 3 px que le devuelven aire a la corona.

Verificado a 4x: corona entera y píldora con su borde redondeado y su halo.

**Test de regresión**: `src/overlay/overlayFit.test.ts`, escrito primero y
visto fallar con el número exacto del bug (`Expected: >= 7, Received: 0`).
Calcula el derrame del halo desde el propio CSS y exige que `.ov-stage` reserve
al menos eso, más que corona + tarjeta + hueco entren en los 64 px.

✅ **Aplicado en los DOS árboles**, con el mismo cambio y el mismo test, para
que no vuelvan a divergir:

| árbol                                         | estado                                                   |
| --------------------------------------------- | -------------------------------------------------------- |
| `C:\Handy` (main)                             | `RecordingOverlay.css` modificado + `overlayFit.test.ts` |
| `C:\trazo-material` (`feat/rebrand-material`) | ídem                                                     |

**Verificado en vivo sobre el worktree**, que es el que sirve la app de dev
(§12.6). Números después del arreglo, medidos por CDP con una grabación real:

```
huecoAbajo: 0 -> 5      coronaTop: 6.6 -> 4.6 (sin recortar)
cardBottom: 64 -> 59    halo offsetY: 3px -> 0
```

Captura a 4x: píldora con su borde inferior redondeado y su halo completo,
corona entera. Es la primera vez que alguien mira este overlay renderizado
desde que se rediseñó.

⚠️ **El arreglo NO está commiteado en ninguno de los dos árboles.** En
`C:\Handy` es coherente con el resto de la sesión (nada se commitea sin pedirlo);
en el worktree quedó fuera del `980aca6`, que se cortó antes de aplicarlo. No es
trabajo en riesgo —está duplicado en los dos sitios y son cuatro líneas—, pero
conviene no olvidarlo.

### 12.8 ⚠️ ABIERTO: el overlay «no está centrado»

**Charly reportó que el overlay se ve descentrado.** Queda anotado para mirarlo
con calma; no se investigó.

⚠️ **Aviso de honestidad:** esa observación no llegó con detalle en la
conversación de esta sesión (Charly la mencionó al cerrar, remitiéndose a algo
dicho antes). **No hay descripción de en qué sentido está descentrado** —
horizontal, vertical, respecto a la pantalla o respecto a su propia ventana.
Lo primero mañana es preguntárselo, no suponerlo.

Lo que sí hay son **medidas de esta sesión**, que acotan el terreno. Ventana de
256x64, tarjeta de 173,6 px de ancho:

| eje              | medida                | lectura                           |
| ---------------- | --------------------- | --------------------------------- |
| horizontal       | 41,2 px a cada lado   | centrada **dentro de su ventana** |
| vertical (antes) | 22,4 arriba · 0 abajo | pegada al borde inferior          |
| vertical (ahora) | 17,4 arriba · 5 abajo | sigue anclada abajo, con hueco    |

O sea que **dentro de la ventana está centrada en horizontal**, y en vertical
está anclada abajo **a propósito** (`align-items: flex-end`). Dos pistas para
mañana:

1. **La corona rompe la simetría óptica.** Sobresale 9 px por la IZQUIERDA
   (`--ov-crown-left`) y nada por la derecha. La caja está centrada, pero la
   figura que se ve no lo está: pesa más a la izquierda. Es el candidato más
   probable si lo que se ve es «tira hacia la izquierda».
2. **La posición de la VENTANA en pantalla la decide Rust** (`overlay.rs`), no
   el CSS. Si lo descentrado es respecto al monitor, el CSS no tiene nada que
   ver y el arreglo es Rust.

**No confundir con el arreglo de §12.7**, que era otra cosa (recorte del halo).

### 12.9 Cierre de la sesión — estado exacto de la máquina

Sesión cerrada a las 03:30. Lo que quedó corriendo y dónde:

|                                                    | estado                                              |
| -------------------------------------------------- | --------------------------------------------------- |
| Trazo instalado (`%LOCALAPPDATA%\Trazo\Trazo.exe`) | **corriendo**, PID 26664, normal                    |
| Trazo de desarrollo (`C:\h\debug\handy.exe`)       | cerrado                                             |
| Servidor Vite (puerto 1420)                        | parado                                              |
| Autostart                                          | apunta al **instalado**, verificado tras rearranque |

Para volver al entorno de desarrollo mañana: cerrar el Trazo instalado (bloquea
al de dev por instancia única), `bun run dev` **desde `C:\trazo-material`** —
ojo, no desde `C:\Handy`, ver §12.6— y luego `C:\h\debug\handy.exe`.

**Marca de build de desarrollo (nueva).** El de dev ahora se anuncia con una
franja ámbar a rayas en el borde superior: _«BUILD DE DESARROLLO — no es tu
Trazo instalado»_. Vive en `src/main.tsx` del worktree, bajo
`import.meta.env.DEV`, así que en producción no existe. Se hizo en el DOM y no
en el título de la ventana porque **`setTitle` está vetado por los permisos de
Tauri** (`core:window:allow-set-title`) y las capabilities se compilan dentro
del binario: habilitarlo exigiría recompilar Rust.

**Autostart: arreglado, pero NO es duradero.** Apuntaba a
`C:\h\debug\handy.exe`; ahora apunta al instalado (respaldo completo de la clave
en el scratchpad, que se borra al cerrar la sesión — si hace falta, `reg export`
otra vez). La causa de fondo sigue viva: `lib.rs:318-330` llama a
`autostart_manager.enable()` **en cada arranque** si `autostart_enabled` es
`true`, y `enable()` registra **el ejecutable que está corriendo**. O sea que
la entrada apunta a la última build que arrancó, y **levantar el de dev la
vuelve a torcer**. Se autocorrige al abrir el instalado.

→ **Arreglo de raíz para mañana, con Rust ya compilando:** envolver ese bloque
en `#[cfg(not(debug_assertions))]`. Tres líneas y la build de dev deja de
secuestrar el autostart para siempre.

**Push hecho** (autorizado explícitamente): `f56515e..980aca6` a
`origin/feat/rebrand-material`. Local y remoto coinciden. `main` ya estaba
sincronizado y **no se tocó**; no se fusionó nada.

### 12.10 Lo que sigue SIN COMMITEAR (a propósito)

| árbol               | qué                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `C:\Handy`          | selector de tema (5 archivos nuevos), 4 fondos WebP, ventana 1100x880 en `lib.rs`, arreglo de la píldora, este documento |
| `C:\trazo-material` | arreglo de la píldora, `overlayFit.test.ts`, franja de dev en `main.tsx`                                                 |

Más el WIP de wakeword de Charly en `C:\Handy`, **intacto** en toda la sesión
(37 archivos; se verificó que sus 4 líneas de `transcribe_to_english` conviven
con las 6 del bloque `theme` en cada `translation.json`).

### 12.11 Orden sugerido para mañana

1. **Pagefile** (§11.1) — sigue bloqueando todo lo de Rust. Admin + reinicio.
2. Compilar y **probar la ventana 1100x880**, que está escrita sin verificar.
3. **Preguntar a Charly en qué sentido ve el overlay descentrado** (§12.8) antes
   de tocar nada.
4. `#[cfg(not(debug_assertions))]` en el autostart (§12.9).
5. Persistir el tema en `settings.rs` y quitar el `localStorage` de
   `useTheme.ts` (§12.2).
6. Revisar `980aca6` y decidir cómo entra `feat/rebrand-material` en `main`.

### 12.12 Detalle de entorno (sigue vigente)

`CLAUDE.md` dice que `CARGO_TARGET_DIR` va en **`D:\h`**, pero
`.cargo/config.toml` (con `skip-worktree`) apunta a **`C:/h`**, y ahí está el
build vivo (`C:\h\debug\handy.exe`, 83 MB, del 31/07). **No coinciden**: antes
de compilar conviene decidir cuál vale, porque §3.5 avisa de que C: está justo.

---

## 13. Sesión 2026-08-02

### 13.1 RUST VUELVE A COMPILAR (sin haber tocado el pagefile)

**Tres builds seguidos en verde**, de 1m57s a 2m52s. El pagefile **sigue en
`InitialSize 2048`** y no hubo reinicio: lo que cambió fue que Charly cerró
Chrome y todo lo demás, y el commit libre subió de 0,73 GB a ~3-5 GB.

⚠️ **Matiz importante para no sacar la conclusión equivocada:** esto **no
deroga §11.1**. Los builds de hoy fueron incrementales (744/746 unidades ya
compiladas). Un `cargo clean` o un rebuild completo probablemente siga sin
entrar. El pagefile sigue mereciendo arreglarse; lo que se aprendió es que
**con la máquina despejada los builds incrementales pasan**.

**De paso quedó verificado lo que estaba escrito sin compilar:** la ventana
**1100x880 + maximizable compila** (§12.4), y el WIP de wakeword de Charly
también.

### 13.2 ⚠️ La rama estaba 7 commits DETRÁS de main — y eso la rompía

Al hacer `bun run tauri dev` desde `C:\trazo-material`, la app compiló y
**entró en pánico al arrancar**:

```
panicked at src\lib.rs:190:50
Failed to initialize history manager: MigrationDefinition(DatabaseTooFarAhead)
```

|                         | migraciones |
| ----------------------- | ----------- |
| `history.db` real       | **v6**      |
| `feat/rebrand-material` | **4**       |
| `main`                  | **6**       |

`history.rs` difería en **−220 líneas**: la rama no conocía las dos últimas
migraciones y se negaba a abrir la base de datos que ya había migrado el Trazo
instalado. **Los dos árboles comparten `target-dir = C:/h`**, así que compilar
desde el worktree sobrescribió `handy.exe` con una build vieja y dejó el
entorno inservible hasta darse cuenta.

**Resuelto fusionando `main` dentro de la rama** (`b4caae3`, sin conflictos).
La rama pasó a 0 commits de retraso, define 6 migraciones, **arranca sin
pánico** y registra los atajos. Verificado compilando y ejecutando.

### 13.3 El overlay: verificado en vivo, con un arreglo más

Charly pidió comprobarlo de verdad. Resultado:

|                     |                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| Letra "T"           | **eliminada** — no está en el TSX, el DOM da `letraT_presente: false`, y no aparece en la captura |
| Píldora cortada     | **arreglada** — `huecoAbajo` 0 → 5                                                                |
| Capas               | **arreglado hoy** (abajo)                                                                         |
| Encaje de la corona | **se deja como está**, decisión de Charly                                                         |

**Bug nuevo encontrado y arreglado: el contorno partía la corona en dos.**
`.scrown` estaba en `z-index: 1` y `.sborde` en `2`, así que el trazo del borde
reactivo cruzaba por encima del emblema. Contradecía la intención que describe
el propio CSS del arco — _«orbita saliendo de DEBAJO de la corona»_: para salir
de debajo, la corona tiene que ir delante. Ahora `z-index: 3`. Verificado
ampliando a 4x: el arco pasa por detrás y desaparece donde la corona lo tapa.

**Lo del "descentrado" era otra cosa.** Se midió: la caja de la tarjeta está
**perfectamente centrada** (41,2 px por lado) y la figura visible cae 11,2 px a
la izquierda por el vuelo de la corona. Pero al preguntarle, Charly dijo que
**no es el centrado: es la corona misma**. La hipótesis de §12.8 era plausible
y estaba equivocada — preguntar ahorró arreglar lo que no era.

**El encaje NO se arregló, y es geometría, no descuido:**

```
ventana 64 − halo 5 − tarjeta 41,6 = 17,4 px libres arriba
corona = 30,5 px  →  solape mínimo inevitable = 13,1 px (43%)
para bajarlo a ~6 px haría falta una ventana de 71 px (OVERLAY_HEIGHT, Rust)
```

Charly decidió **dejarlo**: el emblema es un provisional y `CLAUDE.md` sigue
dando el logo definitivo (**SVG limpio, sin glow**) por `PENDIENTE`, sin fecha.
Se comprobó que no hay ningún `.svg` en ninguno de los dos árboles. Cuando
llegue el SVG, esto se revisa entero — probablemente con otra proporción.

### 13.4 ⚠️ Wispr Flow impide grabar

A media sesión el overlay dejó de aparecer. No era el CSS:

```
Failed to start recording: Recorder not available
Start for 'transcribe' did not begin recording; staying idle
```

**Wispr Flow estaba corriendo con 11 procesos** y retiene el micrófono. Es
dictado siempre-a-la-escucha, o sea el competidor directo, y **mientras esté
activo Trazo no puede grabar**. Arranca solo: tiene un acceso directo en la
carpeta de Inicio.

Charly pidió **no tocarlo**. Para verificar cosas visuales sin micrófono, se
fuerza la visibilidad del overlay por CDP:

```js
document
  .querySelector(".ov-stage")
  .style.setProperty("opacity", "1", "important");
```

Ojo: **añadir la clase `show` no sirve** — React reconcilia el `className` y la
quita. Hay que ir por estilo inline.

### 13.5 Qué se commiteó y qué NO

**`feat/rebrand-material` — pusheada y YA FUSIONADA en `main`** (§13.7):

```
b4caae3 Merge branch 'main' into feat/rebrand-material
9eec416 chore(dev): franja que identifica la build de desarrollo
74dca13 fix(overlay): la pildora deja de cortarse y la corona de partirse
980aca6 chore(wip): respalda el diseno de material que vivia solo en el disco
```

Fusión a `main` comprobada en seco: **limpia, sin conflictos**. 84 tests en
verde, traducciones 20/20.

**`main` (C:\Handy) — solo lo independiente**, por decisión de Charly. El resto
choca con su WIP:

| queda SIN commitear                                                                  | por qué                                                                                                                                |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Selector de tema (5 archivos + `Sidebar.tsx`, `main.tsx`, `App.css`, `material.css`) | **no funciona sin sus claves i18n**, y los 21 `translation.json` tienen mezcladas las 4 líneas de `transcribe_to_english` del wakeword |
| Ventana 1100x880 (`lib.rs`)                                                          | el mismo archivo lleva su `mod wakeword;`                                                                                              |

**Al retomar el wakeword, esos dos se desbloquean solos.** El trabajo está
hecho y probado (11 tests del tema en verde); solo espera a poder separarse.

### 13.6 Orden sugerido para la próxima

1. **Poner al día `main` local en `C:\Handy`** (§13.7). Hoy está un commit por
   detrás de `origin/main` y no se puede avanzar sin mover el WIP de wakeword.
2. **Pagefile** (§11.1) — sigue pendiente pese a §13.1. Es lo que separa
   "builds incrementales con la máquina despejada" de "builds fiables".
3. Cuando aterrice el wakeword: commitear el selector de tema y la ventana
   1100x880, y persistir el tema en `settings.rs` quitando el `localStorage`.
4. `#[cfg(not(debug_assertions))]` en el autostart (§12.9).
5. Cuando llegue el SVG del logo: rehacer el encaje de la corona (§13.3).

### 13.7 La fusión a `main` — hecha, y por qué `main` local va por detrás

Charly autorizó la fusión el 2026-08-02. **`origin/main` = `8d83fcc`.**

**El ensayo en seco que decía «sin conflictos» se había quedado viejo:** se hizo
cuando `main` estaba en `56e0ed6`, y después entraron tres commits más. Al
repetirlo aparecieron dos problemas:

1. **Conflicto** en `src/overlay/RecordingOverlay.css` — `main` llevaba el
   arreglo del recorte sobre el overlay VIEJO y la rama sobre el NUEVO.
2. **El árbol de `C:\Handy` estaba sucio en dos archivos que la fusión toca**:
   `src/main.tsx` (el arranque del tema, sin commitear) y
   `src/components/settings/general/ModelSettingsCard.tsx` (**WIP de wakeword**).
   `git merge` habría abortado, y forzarlo se habría llevado por delante ese WIP.

**Solución: fusionar en un worktree aparte** creado desde `main`, y empujar el
resultado a `origin/main` sin tocar nunca el árbol de `C:\Handy`. El worktree
temporal ya se borró.

El conflicto se resolvió **a favor de la rama**: su `RecordingOverlay.css` es el
overlay rediseñado, que sustituye al viejo. Verificado sobre el resultado —
cero `.tmark-letter`, 11 apariciones de `.sborde`, el arreglo de la píldora una
sola vez y `z-index: 3` intacto. Después: 84 tests, traducciones 20/20, build ✓.

⚠️ **Consecuencia viva: `main` local (`C:\Handy`) está en `eafbf8d`, un commit
por detrás de `origin/main`.** No es un error, es la única forma de no tocar el
WIP. Para ponerlo al día hay que resolver antes qué se hace con
`src/main.tsx` y `ModelSettingsCard.tsx`; hasta entonces, **no hacer `git pull`
a ciegas en `C:\Handy`**.

---

## 14. Estado al cerrar — 2026-08-02

Sección de cierre. Consolida el estado real; el historial de cómo se llegó
sigue en las secciones anteriores.

### 14.1 ~~«Lentitud en la transcripción»: NO HAY DIAGNÓSTICO~~ — SUPERADA por §15.1

Al cerrar, se pidió dejar «el diagnóstico de la lentitud en la transcripción,
causa raíz o estado exacto donde quedó», descrito como el pendiente más urgente.

**No existe tal diagnóstico. No se investigó en esta sesión ni en la anterior.**
No hay causa raíz, no hay trabajo a medias, no hay datos. Queda escrito así de
explícito para que nadie lo busque creyendo que se perdió.

La sesión del 1-2 de agosto fue: pagefile, selector de tema, fondos a WebP,
overlay (recorte de la píldora y capas de la corona), el descubrimiento del
segundo worktree, y la fusión a `main`. En ningún momento se midió velocidad de
transcripción.

**Puede que la petición se refiera a investigaciones que SÍ existen y están
CERRADAS**, todas sobre coste de decodificación:

| dónde | qué se midió                          | veredicto                                                                                |
| ----- | ------------------------------------- | ---------------------------------------------------------------------------------------- |
| §2.3  | entero vs troceado siempre            | trocear siempre era regresión; se decodifica entero y solo se reintenta si sale truncado |
| §2.6  | ventanas de segmento más grandes      | rechazado: ahorró 1 decode en todo el corpus y perdió 13 palabras                        |
| §4.1  | `run_batch` vs bucle                  | rechazado: **0,94× (más lento)** y además cambiaba el texto                              |
| §5    | acortar la ventana de 30 s de Whisper | descartado: la capacidad existe pero no es configurable sin parchear la crate            |

Coste actual medido, para tener referencia: **71 s de audio en 6,7 s (10,6×
tiempo real)** por el camino normal. Solo el reintento troceado cuesta 2-2,6×.

⚠️ **Trampa que falsea cualquier medición en esta máquina:** con `--backend
vulkan` sin `--gpu 1`, el device 0 es la iGPU Intel y el mismo audio tarda
**64 s en vez de 2,7 s (24×)**. Si alguien reporta lentitud, esto es lo primero
que hay que descartar. Ver §4.1.

**Si la lentitud es real y nueva, hay que empezar por un caso reproducible**:
qué audio, cuánto tardó, y `handy.log` con
`RUST_LOG=handy_app_lib::managers::transcription=warn`.

### 14.2 ⚠️ El mapa de actividad diaria SÍ ESTÁ CONSTRUIDO

Al cerrar se describió como «sin construir (esquema SQL ya diseñado)». **Es
falso, y escribirlo así haría que alguien rehiciera una función que ya existe.**

Está hecho, commiteado y en `origin/main` desde el 31/07:

```
125e9cf feat: mapa de actividad diaria, congelado al escribir el dictado
```

Archivos vivos en `origin/main`: `src-tauri/src/managers/insights.rs`,
`src/components/settings/history/ActivityMap.tsx`, `activityGrid.ts` y
`activityGrid.test.ts`. Detalle de diseño en §10.1.

No es solo un esquema SQL: hay backend, componente y tests.

### 14.3 ~~Git — estado exacto~~ — EQUIVOCADA, ver §15.2

| ref                            | commit        | nota                                  |
| ------------------------------ | ------------- | ------------------------------------- |
| `origin/main`                  | **`2120f03`** | incluye la fusión `8d83fcc`           |
| `main` local (`C:\Handy`)      | **`eafbf8d`** | **2 commits por detrás, a propósito** |
| `origin/feat/rebrand-material` | **`b4caae3`** | ya fusionada en main                  |

**Todo lo commiteado está pusheado.** No hay commits locales sin subir en
ninguna de las dos ramas.

⚠️ **`main` local va por detrás y NO se puede adelantar sin decidir algo antes.**
Ponerlo al día toca `src/main.tsx` y
`src/components/settings/general/ModelSettingsCard.tsx`, que están sucios: el
primero por el arranque del selector de tema, el segundo por el WIP de wakeword.
**No hacer `git pull` a ciegas en `C:\Handy`.** Detalle en §13.7.

### 14.4 ~~Sin commitear (deliberado)~~ — DESACTUALIZADA, ver §15.3

**WIP de wakeword de Charly — intacto, 4 entradas:**

```
 M src-tauri/src/settings.rs
 M src/components/settings/general/ModelSettingsCard.tsx
?? src-tauri/resources/models/wakeword/
?? src-tauri/src/wakeword/
```

**Trabajo hecho y probado que espera a que aterrice ese WIP:**

| qué                                                                                  | estado                         | por qué no entra                                                                                    |
| ------------------------------------------------------------------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------------- |
| Selector de tema (5 archivos + `Sidebar.tsx`, `main.tsx`, `App.css`, `material.css`) | 11 tests en verde              | no funciona sin sus claves i18n, y los 21 `translation.json` llevan mezcladas 4 líneas del wakeword |
| Ventana 1100x880 + maximizable (`lib.rs`)                                            | **compila** (verificado 02/08) | el mismo archivo lleva `mod wakeword;`                                                              |

Ninguno de los dos está en riesgo: están en el árbol de trabajo y documentados.

### 14.5 Pendientes, por orden

1. **Si la lentitud de transcripción es real, conseguir un caso reproducible**
   (§14.1). Hoy no hay nada que retomar: se empieza de cero.
2. **Decidir qué se hace con `main.tsx` y `ModelSettingsCard.tsx`** para poder
   poner al día `main` local (§14.3). Bloquea también los dos puntos siguientes.
3. **Commitear el selector de tema y la ventana 1100x880** (§14.4), y persistir
   el tema en `settings.rs` quitando el `localStorage` de `useTheme.ts`.
4. **Pagefile** (§11.1) — sigue sin subir. Los builds del 02/08 pasaron solo por
   ser incrementales y con la máquina despejada; uno completo probablemente siga
   sin entrar.
5. **Bug de reconocimiento en inglés** — sin resolver. Falta una muestra de más
   de 6-7 s; detalle y herramientas en §10.2.
6. **Encaje de la corona**: 43 % de solape, es geometría (haría falta una ventana
   de 71 px). Se revisa entero cuando llegue el **SVG definitivo del logo**, que
   `CLAUDE.md` sigue dando por `PENDIENTE` **sin fecha** (§13.3).
7. `#[cfg(not(debug_assertions))]` en el autostart, para que la build de dev deje
   de secuestrarlo (§12.9).

### 14.6 Entorno al cerrar

|                            |                                                             |
| -------------------------- | ----------------------------------------------------------- |
| Trazo instalado            | **corriendo** (reiniciado durante la sesión; el PID cambia) |
| Trazo de desarrollo + Vite | cerrados                                                    |
| Autostart                  | apunta al **instalado**, verificado                         |
| **Wispr Flow**             | **corriendo, ~10 procesos, RETIENE EL MICRÓFONO**           |

⚠️ **Mientras Wispr Flow esté activo, Trazo no puede grabar** —
`Recorder not available` en el log. Arranca solo desde la carpeta de Inicio.
Charly pidió no tocarlo. Para verificar cosas visuales sin micrófono, forzar el
overlay por CDP (§13.4); añadir la clase `show` **no sirve**, React la quita.

---

## 15. Sesión 2026-08-17 (noche)

Sesión corta y con un solo hallazgo grande. **§14 se había quedado vieja en casi
todo lo que decía sobre git y sobre el árbol de trabajo**; las correcciones están
en §15.4 y son la razón por la que esta sección existe.

### 15.1 La lentitud: causa raíz encontrada, MEDIDA y arreglada

§14.1 decía que no había diagnóstico. Era cierto **cuando se escribió**, pero
entre medias hubo una sesión (hoy mismo, 17:33–18:45 hora local) que sí lo hizo y
dejó el arreglo **sin commitear ni verificar**. Esta sesión lo verificó, lo midió
y lo commiteó.

**Causa raíz, confirmada con el log — no deducida:**

La GTX 1650 se cayó del bus PCI (error 43 de Windows,
`CM_PROB_FAILED_POST_START`). El rastro en
`%LOCALAPPDATA%\com.trazo.app\logs\handy.log` es inequívoco (horas en UTC):

```
[03:28:31] ggml_vulkan: Found 2 Vulkan devices:   0 = Intel UHD · 1 = GTX 1650
[03:45:31] ggml_vulkan: Found 1 Vulkan devices:   0 = Intel UHD
[03:48:13] WARN Stored transcribe GPU device index 1 is no longer available; using auto
[03:48:13] whisper: using vulkan backend: Vulkan0
```

Y el efecto, en el mismo log:

| cuándo          | dispositivo      | rendimiento                               |
| --------------- | ---------------- | ----------------------------------------- |
| hasta 03:28 UTC | `Vulkan1` (GTX)  | 10,2x · 13,4x · 14,3x · 12,0x tiempo real |
| desde 03:48 UTC | `Vulkan0` (iGPU) | 0,72x · 0,62x · 0,63x · 0,46x · 0,43x     |

**18 horas así, y el único rastro fue ese `warn!`.** Charly dictó toda la tarde
con esperas de 30-110 s por dictado (el peor: 111,12 s para 68,79 s de audio).

**La medición A/B, hecha hoy con el hardware ya recuperado** — mismo clip de
1,68 s, mismo modelo (`whisper-large-v3-turbo-Q8_0`), vía
`handy.exe --transcribe-file <wav> --device-index N --repeat 2`:

| dispositivo                        | mejor decode | contra la GPU     |
| ---------------------------------- | ------------ | ----------------- |
| **GTX 1650** (`--device-index 1`)  | **1,46 s**   | —                 |
| CPU i5-10300H (`--device-index 2`) | 24,3 s       | 17x más lento     |
| **Intel UHD** (`--device-index 0`) | **96,5 s**   | **66x más lento** |

⚠️ **El repliegue aterrizaba en el PEOR de los tres.** La iGPU es 4x más lenta
que la CPU pura en esta máquina. Se decidió (Charly, esta sesión) **no cambiar el
repliegue**: en una APU de AMD la iGPU sí le gana a la CPU, y generalizar desde
una sola medición sería apostar. Queda anotado por si algún día hay más datos.

**Estado del hardware:** recuperada. A las 01:25 UTC del 18 (20:25 local del 17)
el log vuelve a enumerar 2 dispositivos Vulkan y liga `Vulkan1`;
`Get-PnpDevice -Class Display` da `Status: OK` para las dos. **No se hizo nada
para recuperarla** — se recuperó sola, probablemente en un reinicio. Puede
repetirse.

**El arreglo — `e93ed62`, ya en `origin/main`:**

Replegar está bien: un índice caducado jamás debe hacer fallar la carga.
Replegar **en silencio** no. `decide_gpu_device` (`managers/transcription.rs`,
función pura) distingue ahora tres casos:

- `Auto` — nadie eligió GPU (centinela `-1`/`0`, o acelerador CPU). **Silencio**:
  un equipo sin GPU dedicada corre en la integrada desde el primer día y avisarlo
  sería ruido permanente.
- `Honored(i)` — el índice guardado sigue nombrando una GPU registrada.
- `Stale { requested }` — **la GPU elegida desapareció**. Carga en `0` igual, pero
  emite `compute-degraded` y rellena `ActiveComputeInfo.lost_gpu_device`.

En la interfaz: `ComputeHealthBanner` arriba del contenido (no dentro de
Ajustes — la información ya estaba en Ajustes → Avanzado, que es justo donde
nadie mira cuando lo único que nota es «hoy esto va lento»), y
`AccelerationSelector` deja de depender de `is_cpu_fallback`, que **nunca se
disparaba en este caso** porque caer de GPU dedicada a integrada liga a otra GPU,
no a la CPU. La regla de producto vive en `src/lib/utils/computeHealth.ts`, pura y
con 7 tests; la de Rust, 5 tests.

⚠️ **Lo único que NO está validado: el banner nunca se ha visto en pantalla.**
Ambas capas de lógica están cubiertas por tests, pero el aviso pintado no. Para
verlo en vivo hace falta forzar un índice caducado (`transcribe_gpu_device` a un
número inexistente en `settings_store.json` — **sin BOM**, ver `CLAUDE.md`) y
arrancar la app. No se hizo para no tocar la configuración de Charly.

### 15.2 El estado de git era el INVERSO del que decía §14

§14.3 decía que `main` local iba **2 commits por detrás** de `origin/main` y que
no se podía adelantar sin decidir antes qué hacer con dos archivos sucios.

**Falso al retomar.** `main` local iba **2 commits por DELANTE**, y los dos
commits eran justo el trabajo que §14.4 daba por pendiente:

```
0045ec8 feat(window): la ventana arranca en 1100x880 y se puede maximizar
7febb30 feat(ui): selector de tema claro/oscuro/automatico
```

No había nada que traer (`git rev-list --left-right --count origin/main...HEAD`
→ `0  2`). **Lo que faltaba era subirlos**, y se subieron con autorización de
Charly. `origin/main` = **`e93ed62`** e incluye los tres commits.

Moraleja operativa: **medir antes de decidir**. Un `git fetch` y un
`rev-list --left-right --count` habrían ahorrado la mitad de la confusión.

### 15.3 El árbol de trabajo: TRES grupos, no dos

§14.4 describía el WIP como «wakeword, 4 entradas». En realidad hay tres bloques
independientes, y uno de ellos ni siquiera es wakeword:

| grupo                                | qué                                                                                                                                                                                                                                                                  | estado                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **A — aviso de GPU perdida**         | `transcription.rs` (parte), `bindings.ts`, `App.tsx`, `AccelerationSelector.tsx`, `ComputeHealthBanner.tsx`, `computeHealth.{ts,test.ts}`, 21 locales                                                                                                                | ✅ **commiteado y pusheado** (`e93ed62`) |
| **B — atajo dictar-en-inglés (F10)** | `actions.rs`, `settings.rs` (esquema **v9** + `TRANSLATE_BINDING_ID`), `transcription.rs` (`translate_override`), `transcription_coordinator.rs`, `commands/history.rs`, `lib.rs`, `shortcut/*.rs`, `examples/es_model_eval.rs`, `ModelSettingsCard.tsx`, 21 locales | **terminado y en verde, sin commitear**  |
| **C — wakeword**                     | `Cargo.{toml,lock}` (`ort`, `ndarray`), `lib.rs` (`mod wakeword;`), `src/wakeword/` (5 archivos, 15 tests), `resources/models/wakeword/` (3 ONNX), `recorder.rs`, `managers/audio.rs`                                                                                | **no distribuible tal cual**             |

Correcciones concretas a §14.4:

- `ModelSettingsCard.tsx` **no** tiene WIP de wakeword: tiene el `ShortcutInput`
  del grupo B.
- `settings.rs` **no** tiene WIP de wakeword: tiene la migración v9 del grupo B.
- Los 21 `translation.json` llevaban mezcladas las claves de **A y B**, no de
  wakeword.

⚠️ **C no es distribuible**: `wakeword/mod.rs` tiene `FORCE_ALWAYS_ON = true`, que
**abre el micrófono permanentemente ignorando el ajuste** `always_on_microphone`.
El propio código lo dice y es de una línea revertirlo, pero antes de commitear
esto tiene que existir su toggle.

**Cómo se separó A del resto** (por si hay que repetirlo): `transcription.rs` y
las 21 locales tenían hunks de A y de B mezclados. Se filtraron los hunks por
marcador y se llevaron al índice con **`git apply --cached`**, que **no toca el
árbol de trabajo**. Después: `git diff --cached` para comprobar que no se coló
nada de B/C, y el commit verificado en un worktree desechable
(`CARGO_TARGET_DIR=C:/h`, **nunca un target dir nuevo**: uno vacío significa
recompilar transcribe-cpp-sys entero y `C:` está al 96 %).

### 15.4 Correcciones a §14 — qué hay que dejar de creer

| §14 dice                                         | realidad al 2026-08-17                            |
| ------------------------------------------------ | ------------------------------------------------- |
| «No existe diagnóstico de la lentitud»           | Existe, está medido y arreglado (§15.1)           |
| «`main` local va 2 commits por detrás»           | Iba 2 **por delante**; ya está pusheado (§15.2)   |
| «Selector de tema y ventana esperan al wakeword» | Ya estaban commiteados (`7febb30`, `0045ec8`)     |
| «WIP de wakeword, 4 entradas»                    | Tres grupos; dos de ellos no son wakeword (§15.3) |

§14.2 (el mapa de actividad diaria **sí** está construido) sigue siendo correcta:
verificado en `HEAD` — `insights.rs`, `ActivityMap.tsx`, `activityGrid.{ts,test.ts}`,
y la tabla `insights_daily` viva en `history.db`.

### 15.5 El bug de inglés: sigue bloqueado por la muestra, y ahora se sabe por qué

§10.2 pedía una muestra en inglés de más de 6-7 s **marcada con la estrella**.
Se consultó `history.db` directamente:

```
20 entradas · 0 marcadas (saved=0) · todas en español
```

**El historial guarda 20 entradas y ninguna está marcada**, así que cualquier
prueba que Charly haga se pierde en 20 dictados. Sin esa muestra no hay nada que
medir: el clip de 4,7 s que hay documentado en §10.2 falla igual en `es`, en `en`
forzado y en Auto, así que no demuestra nada.

**Petición concreta para Charly:** dictar 2-3 frases en inglés de **más de 7
segundos** y **marcarlas con la estrella en el Historial en el momento**.

### 15.6 Lo que falta, por orden

1. **Grupo B (atajo F10)**: terminado y en verde, esperando el visto bueno para
   commitear. Ojo al detalle de §10.3: `whisper-large-v3-turbo` **ignora** la
   tarea `translate`, así que el atajo solo aparece en modelos que de verdad
   traducen (`large-v3`), que es el comportamiento correcto pero conviene
   recordarlo antes de probarlo con el modelo por defecto.
2. **Grupo C (wakeword)**: convertir `FORCE_ALWAYS_ON` en un ajuste con toggle
   antes de commitear nada.
3. **Validar el banner en vivo** (§15.1, último párrafo).
4. **Muestra de inglés** (§15.5) — bloqueado por Charly.
5. **Pagefile** (§11.1) — sigue sin subir. Requiere PowerShell **como
   administrador**; no se puede hacer desde aquí.
6. Persistir el tema en `settings.rs` quitando el `localStorage` de
   `useTheme.ts` (§14.5).
7. `#[cfg(not(debug_assertions))]` en el autostart (§12.9).

### 15.7 Entorno al cerrar

|                              |                                                                |
| ---------------------------- | -------------------------------------------------------------- |
| `origin/main` = `main` local | **`e93ed62`**, sincronizados                                   |
| GTX 1650                     | **recuperada**, `Status: OK`, y la app liga `Vulkan1`          |
| Trazo instalado              | corriendo (`AppData\Local\Trazo\Trazo.exe`)                    |
| Trazo de desarrollo + Vite   | cerrados                                                       |
| Binario de dev               | reconstruido en `C:\h\debug\handy.exe` (grupos A+B+C)          |
| `C:`                         | 96 % lleno, ~20 GB libres                                      |
| Wispr Flow                   | **no estaba corriendo** esta sesión (§14.6 lo daba por activo) |

**Herramienta que conviene recordar**, porque resolvió esta sesión entera:

```bash
C:/h/debug/handy.exe --transcribe-file <wav> --device-index N --repeat 2
```

Mide un dispositivo concreto sin tocar la configuración de la app, e imprime
`load=…ms best=…ms rtf=…x`. Es la forma más rápida de descartar «¿está corriendo
en el dispositivo que creo?» ante cualquier reporte de lentitud.

---

## 16. Sesión 2026-08-18

### 16.1 El bug del VAD de Benja: reproducido sin Benja

No hizo falta esperar su grabación. Se reprodujo el síntoma **con su magnitud
exacta** partiendo de una grabación real de Charly de 14,7 s (casi los 13 s del
caso), simulando un dispositivo de 2 canales y aplicando **la misma mezcla que
hace el código de producción** (`AudioRecorder::build_stream`: media aritmética
de los canales, muestra a muestra).

Medido con `vad_survival`, columna "sobrevive" = audio que llegaría al modelo:

| qué lleva el canal 2                | sobrevive  | voz %   | racha | diagnóstico |
| ----------------------------------- | ---------- | ------- | ----- | ----------- |
| nada (mono, control)                | 96,5 %     | 78 %    | 82    | ok          |
| silencio digital (micrófono muerto) | 94,5 %     | 84 %    | 132   | ok          |
| zumbido de 50 Hz                    | 94,5 %     | 90 %    | 267   | ok          |
| la misma voz retrasada 3 ms (peine) | 94,3 %     | 72 %    | 80    | ok          |
| la misma voz retrasada 10 ms        | 94,5 %     | 91 %    | 270   | ok          |
| ruido de banda ancha a −20 dB       | 92,2 %     | 83 %    | 302   | ok          |
| ruido a −15 dB                      | 91,0 %     | 80 %    | 168   | ok          |
| ruido a −12 dB                      | 85,1 %     | 62 %    | 80    | ok          |
| ruido a −9 dB                       | 37,4 %     | 16 %    | 36    | degrada     |
| **ruido a −6 dB**                   | **16,6 %** | **5 %** | 17    | **SEÑAL**   |
| ruido al nivel de la voz o más      | 0 %        | 0 %     | 0     | SEÑAL       |
| voz invertida (cancelación)         | 0 %        | 0 %     | 0     | SEÑAL       |

**La fila de −6 dB es el caso de Benja con una precisión incómoda:** él reportó
1,05-2,16 s de 13 s = **8-16,6 %**; aquí salen 2,43 s de 14,7 s = **16,6 %**.

Tres cosas que esto fija:

1. **Es la señal, no el suavizador.** En todas las filas que colapsan Silero
   dice "no hay voz" (0-5 % de frames), no titubea.
2. **Descarta cuatro sospechosos**: pérdida de nivel, micrófono muerto, zumbido
   y filtro peine no rompen nada (todos > 92 %). Solo el **ruido de banda
   ancha** lo hace.
3. **El desplome cabe en 6 dB**: de 85 % a 0 % entre −12 y −3 dB. Por eso parece
   todo-o-nada y por eso es tan específico de un dispositivo.

⚠️ Esto es una explicación **suficiente**, no una prueba de que sea lo que tiene
Benja. Su WAV sigue haciendo falta para confirmarlo; el harness lo resuelve en
una corrida (§15.1 y el mensaje que se le pasó).

### 16.2 La hipótesis del titubeo baja de rango — la mía

La sesión anterior propuso que el mecanismo era `VAD_ONSET_FRAMES = 2` exigiendo
dos frames de voz **consecutivos**, con un solo frame malo reiniciando el
contador. **Sigue siendo cierto en el código** —con veredictos alternando sale
el 0 % del audio, medido— **pero no es lo que produce esta familia de fallos**:
en toda la zona de transición las rachas siguen siendo largas (36 frames a
−9 dB, 17 a −6 dB) y el suavizador sí abre.

Queda como defecto latente, no como causa. Y sigue en pie el otro que se
encontró midiendo: **el prefill duplica audio** en cada reentrada en habla
(`frame_buffer` no se limpia al entrar), hasta 480 ms reemitidos por reentrada;
en un caso entrecortado salieron un 48 % más de muestras de las que entraron.

### 16.3 Selector de canal — PROPUESTA, sin desplegar

Si el problema es promediar, la solución es no promediar. La media reparte el
daño dos veces: mete la energía del canal malo **y** baja la voz a la mitad.

**Sin commitear a propósito** (Charly pidió verlo funcionando antes). Vive en
tres archivos del árbol de trabajo:

| archivo                                             | qué                                            |
| --------------------------------------------------- | ---------------------------------------------- |
| `src-tauri/src/audio_toolkit/audio/channel_pick.rs` | el selector, puro, **10 tests**                |
| `src-tauri/src/audio_toolkit/audio/mod.rs`          | 2 líneas que lo exportan                       |
| `src-tauri/examples/channel_pick_demo.rs`           | compara las dos estrategias con la cadena real |

**No elige por volumen, y esa es la decisión de diseño.** El canal malo puede
ser el más fuerte —un micrófono roto que solo mete ruido— y entonces el nivel
elige justo el peor. Elige por **tasa de cruces por cero**, medida sobre
material real de este proyecto: **la voz da 0,079 y el ruido blanco 0,501**, un
factor 6, sin FFT y sin cargar un modelo. La puntuación es
`rms × speechiness(zcr)`, con rampa lineal entre 0,15 y 0,45.

Resultado, sobre WAV estéreo de verdad (ch1 = voz real, ch2 = el sospechoso):

| caso                             | media      | selector   |
| -------------------------------- | ---------- | ---------- |
| ch2 silencio                     | 94,5 %     | **96,5 %** |
| **ch2 ruido −6 dB (caso Benja)** | **16,0 %** | **96,5 %** |
| ch2 ruido a nivel de voz         | 0 %        | **96,5 %** |
| ch2 ruido +12 dB (4× más fuerte) | 0 %        | **96,5 %** |
| ch2 voz invertida                | 0 %        | **96,5 %** |

La fila de +12 dB es la que justifica el ZCR: el canal malo tiene `rms 0,036`
contra `0,009` del bueno —cuatro veces más fuerte— y aun así pierde, porque su
`zcr 0,500` le deja la puntuación en cero.

**Dos honestidades sobre la propuesta:**

- **La voz invertida sale bien por desempate, no por discriminación.** Los dos
  canales puntúan idéntico (0,00908) y gana el índice 0 por la regla de empate.
  Da igual cuál se elija: la voz invertida sola también es voz perfectamente
  inteligible. Pero no es que el selector "lo detecte".
- **El zumbido de red es un punto ciego conocido**: tiene ZCR bajísimo, así que
  para este criterio "parece voz". Hay un test que lo documenta. No se arregla
  porque el zumbido **no rompe el VAD** (94,5 % de supervivencia): arreglarlo
  costaría mirar el espectro para nada.

**Lo que falta para que sea desplegable** (no hecho): decidir CUÁNDO se elige
—una ventana de arranque de ~500 ms y quedarse con esa decisión toda la
grabación, en vez de reevaluar por callback— y conectarlo en `build_stream`,
detrás de un ajuste, con el comportamiento actual como opción.

Para verlo correr:

```bash
cargo run --manifest-path src-tauri/Cargo.toml --example channel_pick_demo -- \
  src-tauri/resources/models/silero_vad_v4.onnx  <estereo.wav>...
```

El material sintético se regenera con los scripts del scratchpad de la sesión
(`make_multichannel.py` y el generador de estéreo), ambos con `random.seed` fijo
para que el experimento se repita igual.

### 16.4 Las muestras en inglés: NO han llegado

Charly indicó que las había mandado en la sesión. **No consta ninguna**, y se
comprobó contra la máquina, no de memoria:

```
history.db: 20 entradas · 0 marcadas (saved=0) · todas en español
```

⚠️ **Y el historial rota mucho más rápido de lo que parece: las 20 entradas que
hay abarcan 1,5 horas.** Cualquier prueba en inglés hecha hoy y no marcada con
la estrella ya se perdió. Para que la próxima sobreviva hay que marcarla **en el
momento**, o subir `history_limit`.

Con el texto (lo pedido vs lo transcrito) basta para empezar a acotar; para
medir de verdad hace falta el WAV.

### 16.5 Estado al cerrar

| ref                          | valor                                                     |
| ---------------------------- | --------------------------------------------------------- |
| `origin/main` = `main` local | `a150684` + el commit de este traspaso                    |
| Sin commitear                | WIP de wakeword (grupo C) + la propuesta del selector     |
| Tests                        | 357 lib + 1 versión + 102 front, 0 fallos                 |
| `code quality` en CI         | debería pasar a verde: el formato se arregló en `eb650f8` |

---

## 17. Sesión 2026-08-18 (noche)

### 17.1 Lo hecho

- **Análisis profundo de los tres puntos pedidos** (selector / bugs latentes /
  WAV de Benja), con veredictos entregados antes de tocar nada.
- **El WAV de Benja NO llegó.** Búsqueda real, no de memoria: Descargas (ningún
  `.wav` desde enero 2026), Escritorio, Documentos, Música, Telegram, fixtures,
  y el zip de Drive del 16/08 (152 MB — trae 4 grabaciones de pantalla `.mp4`,
  ningún WAV). Gmail no se pudo consultar (vetado por el clasificador de
  permisos de la sesión). Charly quedó en preguntarle a Benja directamente.
- **Rama `propuesta/selector-de-canal`** (local, sin push):
  - `de2efc9` — la propuesta preservada TAL CUAL estaba (3 archivos, cero
    contaminación del WIP de wakeword, verificado por `--numstat`).
  - `8ada533` — blindaje contra los tres puntos ciegos que encontró la
    revisión, cada uno con su test visto en rojo: (1) ZCR **por segundo** (por
    muestra dependía del sample rate: el mismo ruido que puntuaba 0 a 16 kHz
    daba speechiness 0,94 a 48 kHz — y el enganche corre a la tasa nativa);
    (2) el ruido grave lo degradaba a selector por volumen (DC de entrada
    muerta ganaba 4,8×, zumbido fuerte 10×, ventilador 7,6× contra la voz real
    a −39,6 dBFS) — ahora: señal sin su media + suelo de cruces + exigencia de
    modulación silábica (máquina estacionaria = 0); (3) `pick_with_evidence`:
    sin ganador claro (suelo + dominancia 2×) NO se decide y el llamante sigue
    con la media — comprometerse en la ventana de silencio inicial del PTT era
    una moneda al aire. El módulo pasó de 10 a **17 tests**; suite en la rama
    370/370. Los puntos ciegos que QUEDAN (loopback con programa hablado,
    golpeteo fuerte no estacionario) están documentados en la cabecera.
- **Bug B — duplicación del prefill: ARREGLADO en `main` (`227e954`)**,
  validado en vivo por Charly (VAD activo, pausas largas, sin palabras
  repetidas). Causa exacta: `frame_buffer` retenía frames ya emitidos y la
  reapertura tras una pausa reemitía hasta 13 frames = 390 ms (el rojo del
  test reprodujo exactamente esos 13). Arreglo = invariante "el buffer solo
  contiene audio no emitido". Entró el **primer arnés de tests de
  `SmoothedVad`** (`ScriptedVad` de veredictos guionizados + frames
  etiquetados) con 3 pins del comportamiento sano. ⚠️ **Los porcentajes de
  `vad_survival` leerán algo más bajos al recalcularse** (antes contaban las
  reemisiones como audio superviviente); el veredicto TITUBEO/SEÑAL no cambia
  (usa veredictos crudos).
- **Bug A (titubeo del onset, `smoothed.rs:92`): EN ESPERA del WAV de Benja**,
  decisión de Charly — no adivinar el umbral sin datos. El arnés `ScriptedVad`
  deja su fix a una sesión de distancia cuando toque.
- **Verificado que YA NO están pendientes** (no rehacer): el F10 de inglés está
  en `main` (`795ae03`), el ejecutable del bundle ya es `Trazo.exe`
  (`37e97dc`), y `Cargo.toml` ya está en 0.9.5 con test (`70b41be`).
- **Balance completo de pendientes entregado a Charly** (deuda no documentada
  incluida: el VAD se inicializa ~167 ms en cada apertura de micrófono aunque
  esté apagado y sus eventos `speech-active` nunca disparan con el default;
  el suelo de −50 dBFS de §9.8; el lease de `unload_model` de §3.7; el tema en
  `localStorage`; la asimetría de `transcript_lands_on_clipboard()` con pegado
  `Direct`; el ejemplo `basic` de handy-keys; los fantasmas CRLF; los tests ES
  contra la API real; la release 22 commits por detrás de `main`).
- **Un fallo intermitente más de la suite, sin capturar cuál** (el `tail` se
  comió la salida); dos pasadas completas verdes después (357/357). Encaja con
  los perfiles ES (§6), pero sigue la regla de §9.9: si reaparece,
  `cargo test --lib > salida.txt 2>&1` ANTES que nada.

### 17.2 PLAN ACORDADO para la próxima sesión (orden de Charly — respetarlo)

1. **Validar el aviso de GPU perdida EN PANTALLA.** Forzarlo a propósito:
   `transcribe_gpu_device` a un índice inexistente en `settings_store.json`
   (app cerrada, **sin BOM**, ver CLAUDE.md), arrancar y confirmar que
   `ComputeHealthBanner` se ve (CDP si hace falta,
   `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222`).
   Revertir el ajuste al terminar. Es la única capa sin validar de §15.1.
2. **Aterrizar el WIP de wakeword.** Regla dura de Charly: **el micrófono NO
   puede quedar siempre abierto por defecto.** Recomendación: sustituir
   `FORCE_ALWAYS_ON` por un ajuste `wake_word_enabled` (default `false`,
   `#[serde(default)]` → sin migración de esquema), TDD, y commitear el grupo
   C completo. Si algo se tuerce, el patrón seguro es el respaldo en rama
   propia (como `980aca6`). Esto además **desbloquea `recorder.rs`** (donde
   irá el enganche del selector) y deja el árbol limpio por primera vez en
   semanas. Los `.onnx` de `resources/models/wakeword/`: **RESUELTO por
   Charly (18/08 noche)** — `hey_jarvis_v0.1.onnx` (CC-BY-NC-SA, no
   distribuible) queda **gitignored** (línea ya añadida a `.gitignore`, sin
   commitear: viaja con el aterrizaje del grupo C); se retoma cuando llegue
   el `hey_trazo.onnx` propio. El backbone (melspectrogram/embedding, Apache
   2.0) sí puede commitearse. El wakeword NO va en la release del punto 4.
3. **Guard del autostart**: `#[cfg(not(debug_assertions))]` en el bloque de
   `lib.rs` que llama `autostart_manager.enable()` en cada arranque (§12.9).
   Verificado el 18/08 noche: **sigue sin guard**. Tres líneas.
4. **Con 1-3 en verde: cortar release nueva.** Motivación: se la va a dar a
   **la novia de Charly** para uso real — Windows, micrófono normal (no
   compuesto), así que **NO hacen falta** ni firma de Mac ni el selector de
   canal para su caso (decisión explícita). Contenido que la justifica: banner
   de GPU (`e93ed62`), fix de idioma en clips cortos (`381b4e5`), fix de
   palabras duplicadas (`227e954`), F10 (`795ae03`), más el wakeword ya
   aterrizado con su toggle en `false`. Mecánica (la de §10.4): bump de
   versión, `cross-platform-check.yml` (NO `release.yml`, que exige firma),
   tag apuntando **al commit del que compiló el matrix**, y `gh` siempre con
   `--repo JuanIA-sketch/trazo`. **Aviso honesto para la instalación:** el
   instalador va sin firma → SmartScreen ("Más información → Ejecutar de
   todas formas", README §7.7); conviene que Charly se lo instale él o se lo
   explique antes.

**EN PAUSA sin prisa, por decisión explícita de Charly (no retomar por
iniciativa propia):** el resto del Grupo 1 del balance (Wispr Flow, pagefile,
test intermitente), TODO el Grupo 2 (bug A hasta el WAV, enganche del selector,
muestra de inglés >7 s con estrella, firma macOS/Windows, `hey_trazo.onnx`,
audio bajo del Mac de Benja), y el frente entero de "compartir con más gente".

### 17.3 Estado al cerrar

| ref                          | valor                                                          |
| ---------------------------- | -------------------------------------------------------------- |
| `main` local                 | = `origin/main` (`227e954` **pusheado** con autorización, 18/08 noche; encima va el commit de este traspaso) |
| `propuesta/selector-de-canal`| `8ada533` (local, sin push)                                    |
| Sin commitear                | WIP de wakeword (grupo C) + la línea nueva de `.gitignore` (viaja con el grupo C) |
| Suite                        | `cargo test --lib` 357/357 + 1 ignored (verificado 2 veces)    |
| Frontend                     | sin tocar esta sesión                                          |
| Benja                        | Charly le preguntó por el WAV; avisará cuando lo tenga         |
