# Trazo — traspaso de sesión

**Última actualización:** 2026-07-27 · **Rama:** `main` · **HEAD:** `a24974b`
**Entrega del hackathon:** 31 de julio de 2026

Documento de continuidad entre sesiones de Claude Code. Léelo antes de tocar
nada. Complementa a `CLAUDE.md` (convenciones del fork) y a
`docs/superpowers/specs/` (diseños detallados); aquí está el _estado_ y el
_porqué_, no las convenciones.

> **⚠️ DOS COSAS DISTINTAS SIN SINCRONIZAR (auditado 2026-07-27):**
>
> 1. **11 commits locales sin pushear** a `origin/main`. `origin/main` no tiene
>    nada que `main` no tenga (0 detrás), así que un `push` sería fast-forward.
> 2. **El trabajo del 2026-07-26 sigue sin commitear** — `HEAD` sigue en
>    `a24974b`. Vive solo en el árbol de trabajo (§1.2).
>
> Consecuencia práctica: **quien clone `origin/main` hoy NO recibe el doble-tap,
> el overlay rediseñado, la onda sensible al susurro, ni nada del 26/07.**

---

## 1. Estado actual

`main` está **25 commits por delante y 58 por detrás** de `upstream/main`
(cjpais/handy), y **11 commits por delante de `origin/main`** (JuanIA-sketch/trazo).

Los 11 sin pushear, del más nuevo al más viejo: `a24974b`, `c4f85e3`,
`bb48136`, `5f4552e`, `c2b04b6`, `b152e2f`, `15c7c43`, `5a2f371`, `7472764`,
`95337a9`, `cb5dee7`.

### 1.1 Commits clave (orden cronológico inverso)

| Commit    | Qué es                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| `a24974b` | Handoff de sesión (este archivo)                                                                             |
| `c4f85e3` | Reglas de reemplazo del diccionario (abreviatura → texto) + importación CSV                                  |
| `bb48136` | Toggle de limpieza con IA visible en Ajustes                                                                 |
| `5f4552e` | Fix: no copiar al portapapeles en paralelo a una inserción exitosa                                            |
| `c2b04b6` | Identidad azul de Trazo (paleta, emblema corona, iconos)                                                      |
| `b152e2f` | **Punto de restauración** del stack de dictado validado + default por hardware + auto-descarga en onboarding |
| `15c7c43` | Watchdog `StreamHealth` + coalescer                                                                          |
| `5a2f371` | Fijar idioma en modelos con códigos regionales (`es` → `es-ES`)                                              |
| `7472764` | Rediseño del overlay como objeto de marca                                                                    |
| `95337a9` | Doble-tap de PTT → grabación continua (badge ∞)                                                              |
| `cb5dee7` | Onda sensible a susurros + pulso por VAD real                                                                 |
| `8477b61` | Fix del secuestro de teclado (crate `handy-keys` vendorizada)                                                 |
| `13b039c` | Red de seguridad del portapapeles                                                                             |
| `e836a0b` | Perfiles de dictado en español                                                                                |

### 1.2 Sin commitear — trabajo real de hoy

Esta vez **sí hay cambios reales** (ayer todo era ruido CRLF). Archivos nuevos
sin trackear más once modificados:

> **Ojo con `git status` en esta máquina.** Marca ~80 archivos como modificados,
> pero **solo 12 tienen contenido distinto**. Los otros ~68 (casi todo
> `src/components/settings/*.tsx`) son fantasmas de CRLF: `git status` los
> marca, `git diff` no produce ni una línea. Lista real:
>
> ```bash
> git diff --numstat   # solo salen los que de verdad cambiaron
> ```
>
> No los añadas al commit: meterían un reencoding de línea completo en el diff
> y harían ilegible cualquier review.

| Archivo                                          | Δ         | Qué                                                       |
| ------------------------------------------------ | --------- | --------------------------------------------------------- |
| `src-tauri/src/audio_toolkit/audio/silence_gate.rs` | **nuevo** | Puerta de silencio + segmentación + detección de truncado |
| `src-tauri/src/transcription_coordinator.rs`     | +104 −9   | Fix del reloj del gesto PTT (§2.1)                        |
| `src-tauri/src/clipboard.rs`                     | +106 −1   | Espacio separador entre dictados (§2.4)                   |
| `src-tauri/src/settings.rs`                      | +86 −2    | `history_limit` 5→20 + migración v5 (§2.5)                |
| `src-tauri/src/managers/transcription.rs`        | +84 −0    | `transcribe_recording` (§2.3)                             |
| `src-tauri/src/shortcut/handler.rs`              | +14 −1    | Sella el timestamp del evento de teclado                  |
| `src-tauri/src/commands/history.rs`              | +5 −4     | Usa `transcribe_recording`                                |
| `src-tauri/src/audio_toolkit/mod.rs`             | +2 −1     | Reexporta las funciones nuevas                            |
| `src-tauri/src/audio_toolkit/audio/mod.rs`       | +2 −0     | Idem                                                       |
| `src-tauri/src/signal_handle.rs`                 | +3 −1     | Firma de `send_input` con timestamp                        |
| `src-tauri/src/actions.rs`                       | +1 −1     | Usa `transcribe_recording`                                |
| `src-tauri/examples/batch_vs_loop.rs`            | **nuevo** | Harness del experimento **rechazado** de §4.1             |
| `SESSION_HANDOFF.md`                             | +…        | Este archivo                                              |

**Estado de verificación (2026-07-27, revalidado):** `cargo test --lib` →
**212 passed, 0 failed, 1 ignored**. `bun test src/` → **38 passed, 0 failed**.
`bun run check:translations` → **20 idiomas completos**. `cargo clippy
--lib --tests` → 0 advertencias en el código nuevo (26/07). `cargo fmt --check`
→ limpio (26/07).

### 1.2.1 Los cambios se separan en tres grupos

Importa para decidir qué se commitea y qué no:

| Grupo | Qué                                                    | Archivos                                                                                                              |
| ----- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **a** | Probado y en verde, listo para commitear               | `silence_gate.rs`, `managers/transcription.rs`, `audio_toolkit/{mod,audio/mod}.rs`, `actions.rs`, `lib.rs`, `commands/history.rs`, `settings.rs` |
| **b** | Pendiente de validación en vivo de Charly — NO commitear | `transcription_coordinator.rs`, `shortcut/handler.rs`, `signal_handle.rs` (reloj del gesto, §2.1); `clipboard.rs` (espacio separador, §2.4)      |
| **c** | Experimental y descartado — NO commitear como feature  | `examples/batch_vs_loop.rs` (§4.1)                                                                                    |

Los grupos **a** y **b** son disjuntos a nivel de compilación (verificado):
el cambio de firma de `send_input` solo lo tocan `handler.rs` y
`signal_handle.rs`, ambos del grupo b; y `transcribe_recording` solo lo llaman
`actions.rs`, `lib.rs` y `commands/history.rs`, los tres del grupo a. Se puede
commitear **a** sin **b** y el árbol sigue compilando.

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

| Archivos                                   | Estado `main` vs su rama            |
| ------------------------------------------ | ----------------------------------- |
| 50 PNG/ICO/ICNS de iconos                  | ✅ **idénticos** — cero conflicto    |
| `src/overlay/corona.png`                   | ✅ **idéntico**                      |
| `src/styles/theme.css`                     | ✅ **idéntico** (mismo blob `f64ef68`) |
| `src/overlay/RecordingOverlay.tsx`         | ❌ difiere                           |
| `src/overlay/RecordingOverlay.css`         | ❌ difiere                           |
| `src-tauri/src/overlay.rs`                 | ❌ difiere                           |

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
**base vieja**. Yendo de `main` a su rama se *borran*, entre otras cosas:

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

| Ajuste                 | Valor                       | Nota                                                    |
| ---------------------- | --------------------------- | ------------------------------------------------------- |
| `selected_model`       | Whisper Turbo Q8            | Su GTX 1650 lo corre mejor que Nemotron                  |
| `selected_language`    | `es`                        | Fijado a propósito, no `auto`                           |
| `clipboard_handling`   | `dont_modify`               | **Solo su máquina**; el default sigue `copy_to_clipboard` |
| `paste_method`         | `ctrl_v`                    |                                                         |
| `bindings.transcribe`  | **`alt_left`**              | Modificador desnudo, PTT. Cambió desde Ctrl+Espacio     |
| `push_to_talk`         | `true`                      | Usa doble-tap para latchear, casi nunca mantiene         |
| `history_limit`        | **20** (era 5)              | Migrado por v5, confirmado en el store                   |
| `post_process_enabled` | `true`                      | OpenAI + gpt-4o-mini, perfil `default_es_casual`        |

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
app ajena, así que la decisión se toma sobre *nuestra propia inserción
anterior* — que es exactamente el caso "tras un dictado anterior".

Compone solo con `append_trailing_space` sin caso especial (si esa opción está
activa, el texto previo ya acaba en espacio y la función devuelve `false`).
Se limpia cuando el pegado falla o cuando el auto-submit envía el campo.
`PasteMethod::None` no lee ni escribe el historial (no inserta en ningún sitio).

### 2.5 `history_limit` 5 → 20 + migración de esquema v5

**El default de 5 borró tres corpus de evaluación en un solo día**, uno de
ellos *mientras se copiaban los archivos*. Con
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

### 3.2 Riesgo aceptado: fallo silencioso de pegado pierde el dictado

Consecuencia de `DontModify` en la máquina de Charly. Él lo aceptó a
sabiendas. **No es un bug, es un trade-off elegido.**

### 3.3 Efecto colateral esperado del mismo cambio

Con `DontModify`, el aviso "Texto copiado" ya no aparece en pegados exitosos.
Si alguien reporta que "desapareció el aviso", es esto.

### 3.4 Calidad residual del reintento troceado

El reintento recupera contenido pero no iguala al decode entero cuando este
funciona: pierde contexto entre tramos, así que la puntuación y las mayúsculas
salen menos consistentes. El post-procesado con LLM lo limpia. Casos
observados: "la función de" → "la flor de" en un tramo corto.

### 3.5 Disco C

Vigilar antes de builds grandes. `C:\h` (target de Rust) ocupa ~25 GB. Solo se
libera con `cargo clean` completo; borrar por partes rompe la caché.

---

## 4. Próximos pasos

### 4.1 ~~Experimento pendiente~~ → RECHAZADO con datos (2026-07-27)

`run()` en bucle vs `Session::run_batch()`. Era la última optimización de
velocidad viva tras la investigación de §5. **Medida y descartada.**

Harness: `src-tauri/examples/batch_vs_loop.rs` (sin commitear, grupo c de
§1.2.1). Usa el `speech_segments()` real, así que decodifica exactamente los
tramos que decodificaría el reintento troceado.

```bash
cargo run --example batch_vs_loop -- <model.gguf> --lang es \
    --backend vulkan --gpu 1 [--repeat 3] [--control] <wav>...
```

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
*texto* es sólido (reproducible + control limpio). El de *velocidad* no se
generaliza: con 4-6 tramos batch podría ganar tiempo. Da igual — el criterio
era el texto.

**Trampa de entorno descubierta aquí:** con `--backend vulkan` sin `--gpu`, el
device 0 es la iGPU Intel y el mismo audio tarda **64 s en vez de 2,7 s** (24×).
Es la misma trampa del §4 de `CLAUDE.md`. En cualquier medición sobre esta
máquina, **pasar `--gpu 1` siempre**.

### 4.2 Validaciones en vivo pendientes (Charly)

Esto es exactamente el **grupo b** de §1.2.1: no se commitea hasta que él lo
pruebe a mano.

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

1. **Revisar la landing de Benjamin** (`origin/feat/landing-trazo`). Montarla
   en worktree aparte. Incluye un `privacy-visual.png` de 4 MB.
2. **Pendientes del rebrand**: identificador `com.pais.handy`, `productName`,
   logo definitivo.
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
