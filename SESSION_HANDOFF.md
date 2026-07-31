# Trazo — traspaso de sesión

**Última actualización:** 2026-07-31 · **Rama:** `main` ·
`main` y `origin/main` **sincronizados**
**Entrega del hackathon:** 31 de julio de 2026

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

### 1.2 Sin commitear (al cerrar el 2026-07-28)

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

### Frentes NUEVOS, sin empezar (anotados el 2026-07-31)

Los pidió Charly al cerrar la sesión. **No hay diseño, ni spec, ni
investigación previa: solo el enunciado.** Hablarlos antes de tocar código.

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
+ `CLAUDE.md` son públicos — incluida la §1.3.1 sobre la rama de Benjamin.
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

| Jobs       | Error literal                                                                                      | Estado                     |
| ---------- | -------------------------------------------------------------------------------------------------- | -------------------------- |
| Linux ×3   | ~~`incorrect updater private key password: Wrong password for that key`~~                          | **VERDE** desde §9.4       |
| macOS ×2   | `security: SecKeychainItemImport: One or more parameters passed to a function were not valid`        | rojo — falta Apple (§7.5)  |
| Windows ×2 | `failed to bundle project 'failed to run trusted-signing-cli'` (variables AZURE vacías)             | rojo — falta Azure (§7.5)  |

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

| Prueba                                             | Resultado                          |
| -------------------------------------------------- | ---------------------------------- |
| Clave con contraseña real, firmar con ella (control) | ✅ firma generada                  |
| Clave con `-p ""`, firmar con `-p ""`               | ❌ `Wrong password for that key`   |
| Clave con `-p ""`, firmar con la env vacía          | ❌ `Wrong password for that key`   |
| Clave con `-p ""`, sin contraseña ninguna           | ⏳ se cuelga pidiéndola por teclado |

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
*Voice Processing* de macOS (control automático de ganancia), que cpal no
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

| Medida                    | Valor      |
| ------------------------- | ---------- |
| Duración real             | 27,15 s    |
| Habla según el gate       | **6,90 s** |
| 26 palabras sobre habla   | 3,77 p/s → "sano", no dispara |
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

| Qué                                                        | Tests |
| ---------------------------------------------------------- | ----- |
| `dictionary.rs` → `rule_impact`                             | 7     |
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
