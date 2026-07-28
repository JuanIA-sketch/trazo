# Trazo — traspaso de sesión

**Última actualización:** 2026-07-28 · **Rama:** `main` · **HEAD:** `019207e`+
**Entrega del hackathon:** 31 de julio de 2026

Documento de continuidad entre sesiones de Claude Code. Léelo antes de tocar
nada. Complementa a `CLAUDE.md` (convenciones del fork) y a
`docs/superpowers/specs/` (diseños detallados); aquí está el _estado_ y el
_porqué_, no las convenciones.

> **⚠️ ESTADO AL CERRAR LA SESIÓN DEL 2026-07-28**
>
> 1. **El grupo (b) sigue sin commitear**, igual que desde el 26/07: espera la
>    validación en vivo de Charly (§1.2.1, §4.2).
> 2. **El rebrand quedó commiteado en `019207e`** y pusheado, con la migración
>    de datos y los fixes de autostart (§7.1). Charly respaldó su carpeta de
>    datos antes; falta confirmar en vivo que la migración funcionó.
> 3. **`batch_vs_loop.rs` sigue sin trackear** a propósito: experimento
>    rechazado (§4.1).
>
> Todo lo demás de la sesión está commiteado y pusheado.

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

### 4.0 Inmediatos (orden sugerido al retomar)

1. **Validar en vivo la migración del rebrand** (§7.1). Es lo primero porque
   toca los datos de Charly: al primer arranque verificar que aparecen en
   `%APPDATA%\com.trazo.app` y que la clave de OpenAI sigue ahí. Si algo
   falla, el respaldo de `com.pais.handy` está intacto — la migración copia,
   no mueve.
2. **Revisar el matrix relanzado** con el nombre nuevo: los instaladores deben
   llamarse `Trazo_0.9.0_*`. Si quedó en rojo, empezar por ahí.
3. **Esperar el resultado de Benja con `vad_survival.rs`** (§7.2). Decide entre
   dos causas incompatibles y no se puede avanzar sin su hardware. Preguntarle
   también con qué prueba concreta descartó el downmix.
4. **Decidir sobre la contraseña del updater** (§7.6): recuperarla o generar
   keypair nueva. Bloquea cualquier release firmado.
5. **Validar en vivo el grupo b** (§4.2) y commitearlo.

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
_texto_ es sólido (reproducible + control limpio). El de _velocidad_ no se
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

### 7.6 Secrets del updater — clave arreglada, contraseña perdida

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
