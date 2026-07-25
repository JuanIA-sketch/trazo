# Trazo — traspaso de sesión

**Última actualización:** 2026-07-25 · **Rama:** `main` · **HEAD:** `c4f85e3`
**Entrega del hackathon:** 31 de julio de 2026

Documento de continuidad entre sesiones de Claude Code. Léelo antes de tocar
nada. Complementa a `CLAUDE.md` (convenciones del fork) y a
`docs/superpowers/specs/` (diseños detallados); aquí está el _estado_ y el
_porqué_, no las convenciones.

---

## 1. Estado actual

`main` está **24 commits por delante y 58 por detrás** de `upstream/main`
(cjpais/handy). El árbol de trabajo está funcionalmente limpio.

### Commits clave (orden cronológico inverso)

| Commit    | Qué es                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------ |
| `c4f85e3` | Reglas de reemplazo del diccionario (abreviatura → texto) + importación CSV                                  |
| `bb48136` | Toggle de limpieza con IA visible en Ajustes (sale del gate experimental)                                    |
| `5f4552e` | Fix: no copiar al portapapeles en paralelo a una inserción exitosa                                           |
| `c2b04b6` | Identidad azul de Trazo (paleta, emblema corona, iconos)                                                     |
| `b152e2f` | **Punto de restauración** del stack de dictado validado + default por hardware + auto-descarga en onboarding |
| `15c7c43` | Watchdog `StreamHealth` + coalescer: nunca perder un dictado si el streaming no sigue el ritmo               |
| `5a2f371` | Fijar idioma en modelos que anuncian códigos regionales (`es` → `es-ES`)                                     |
| `7472764` | Rediseño del overlay como objeto de marca                                                                    |
| `95337a9` | Doble-tap de PTT → grabación continua (badge ∞)                                                              |
| `cb5dee7` | Onda sensible a susurros + pulso por VAD real                                                                |
| `8477b61` | Fix del secuestro de teclado (crate `handy-keys` vendorizada)                                                |
| `13b039c` | Red de seguridad del portapapeles                                                                            |
| `e836a0b` | Perfiles de dictado en español (glosario + autocorrecciones habladas)                                        |

`b152e2f` es el punto de retorno seguro si el rebrand azul se quiere revertir:
`git reset --hard b152e2f` deja todo lo validado y quita lo visual.

### Sin commitear

**Nada real.** `git status` muestra ~70 archivos tocados, pero **todos son ruido
de fin de línea** (CRLF/LF) que dejó un `prettier --write` masivo: `git diff
--numstat` da `0 0` en todos. Se dejaron fuera a propósito para no ensuciar el
historial. Comprobación rápida:

```powershell
foreach ($f in (git diff --name-only)) { $n=(git diff --numstat -- $f); if ($n) { $p=$n -split "\s+"; if ($p[0] -ne "0" -or $p[1] -ne "0") { echo "REAL: $f" } } }
```

Si eso no imprime nada, no hay cambios pendientes de verdad.

### Ramas

- `revision-benja` → `origin/feat/rebrand-azul-app` (trabajo de Benjamin, solo
  para consulta; su diseño ya se extrajo a mano, ver §2).
- `origin/feat/landing-trazo` → landing page de Benjamin, **no integrada**, sin
  worktree montado todavía.

### Configuración local de Charly (su máquina, no son defaults del producto)

| Ajuste                 | Valor            | Nota                                                         |
| ---------------------- | ---------------- | ------------------------------------------------------------ |
| `selected_model`       | Whisper Turbo Q8 | Su GTX 1650 lo corre mucho mejor que Nemotron                |
| `selected_language`    | `es`             | Fijado a propósito, no `auto` (ver §2)                       |
| `clipboard_handling`   | `dont_modify`    | **Solo su máquina**, el default sigue en `copy_to_clipboard` |
| `paste_method`         | `ctrl_v`         | Relevante para el bug de Alt (§3)                            |
| `post_process_enabled` | `true`           | Con OpenAI + gpt-4o-mini, perfil `default_es_casual`         |
| `onboarding_completed` | `true`           | Ya probó el flujo nuevo                                      |

---

## 2. Decisiones importantes y su porqué

Cosas que **no** se deducen leyendo el código.

### El rebrand de Benjamin se extrajo, no se fusionó

Benjamin ramificó en `37814bc`, **antes** de los tres commits del overlay
(`cb5dee7` pulso VAD, `95337a9` doble-tap, `7472764` identidad del pill), y
rediseñó los mismos archivos (`RecordingOverlay.tsx/.css`) desde esa base
antigua. Un merge habría resuelto esos conflictos contra comportamiento ya
validado en vivo, con riesgo real de borrar el badge ∞ o el pulso por VAD.

Por eso `c2b04b6` copia de su rama solo lo que no tiene lógica (`theme.css`,
`corona.png`, iconos) y **porta el diseño a mano** sobre nuestro overlay.
**Si Benjamin sube más diseño, repetir este patrón: extraer, no fusionar.**

Detalle no obvio: la corona vive en un wrapper `.sholder` **fuera** de
`.scard` porque la tarjeta es `overflow:hidden` para el morph del texto y
recortaría el voladizo. La animación de entrada se movió al holder para que
corona y pastilla entren como una pieza.

Contexto de marca: el `brand.json` de Benjamin **prohíbe explícitamente los
morados** (`#8B5CF6`, `#A855F7` — este último era nuestro logo en modo oscuro),
con un gate documentado de matiz HSL. Su azul es una decisión sistemática, no
un descuido. Charly la adoptó.

### El portapapeles quedó en `DontModify` solo en la máquina de Charly

Charly reportó que quedaba dictado viejo en el portapapeles y se repegaba por
accidente. Dos cosas distintas salieron de ahí:

1. **Un bug real** (`5f4552e`): tras un pegado exitoso se copiaba al
   portapapeles con _cualquier_ método, incluidos `Direct` y `ExternalScript`,
   que ya habían insertado el texto. Corregido: ahora solo copia
   `PasteMethod::None`.
2. **Su síntoma concreto no lo causaba ese bug.** Él usa `Ctrl+V`, y ahí **el
   portapapeles es el transporte**: para pegar, el texto tiene que estar en el
   portapapeles. No hay copia "en paralelo" que eliminar. Tampoco existe
   detección de "campo editable enfocado", ni forma fiable de añadirla
   multiplataforma — el propio código documenta que los fallos silenciosos
   (foco perdido, campo de solo lectura) **no son detectables**.

Lo que sí resuelve su síntoma es `ClipboardHandling::DontModify`, que restaura
el portapapeles original tras un pegado exitoso. Se aplicó **solo a su store**.

**El default que se distribuye sigue siendo `CopyToClipboard`**, porque fue una
decisión deliberada suya (migración v3): ante un fallo _silencioso_ de pegado,
`DontModify` pierde el dictado sin rastro. Charly aceptó ese riesgo para su
máquina; no se le impone al resto de usuarios. **No cambiar el default sin
pedírselo otra vez.**

### El default de modelo es consciente del hardware — y la conclusión inicial era errónea

La primera evaluación (Nemotron 4–30× más rápido que Whisper Turbo) se midió
**en CPU** y era un artefacto: Whisper paga una ventana fija de 30 s por clip.
Al medir en la GPU real de Charly la conclusión **se invierte**:

| Config (clip de 9 s, GTX 1650 / Vulkan) | Tiempo                                   |
| --------------------------------------- | ---------------------------------------- |
| Whisper Turbo, batch                    | **2,5 s**                                |
| Nemotron Q8, batch                      | 10,5 s                                   |
| Nemotron F16, batch                     | 7,5 s                                    |
| Nemotron, streaming                     | 0,24–0,9× tiempo real (nunca alcanza 1×) |

El decode RNNT de Nemotron es _latency-bound_ en GPU. Por eso el default lo
decide `has_dedicated_gpu` (solo cuenta `DeviceType::Gpu`; las **iGPU no
cuentan**, verificado: Intel UHD → `Igpu`, GTX 1650 → `Gpu`): GPU dedicada →
Turbo, solo CPU → Nemotron. Ambos siguen elegibles a mano.

El harness que produjo esos números está commiteado en
`src-tauri/examples/es_model_eval.rs` (flags `--stream`, `--backend`, `--gpu`).

### El watchdog de streaming existe por Nemotron

Nemotron anuncia `streaming=true`, y eso activa el camino de "live preview" del
upstream que Turbo nunca tocaba. En un backend más lento que el tiempo real, la
cola de frames de ~30 ms crecía sin límite y `Finalize` esperaba detrás de todo
el backlog → timeout de 30 s → **cero texto** en dictados largos. `15c7c43`
añade dos guardas: el coalescer (drena la cola y alimenta un buffer
concatenado) y `StreamHealth` (si tras 5 s el cómputo supera 1,15× el audio,
abandona el streaming y cae al batch). **Se aplica a cualquier modelo streaming
futuro, no solo a Nemotron.**

### Post-procesado con LLM: manual por diseño, no por accidente

Hay **dos acciones separadas**: `transcribe` y `transcribe_with_post_process`,
cada una con su atajo. El dictado normal **nunca** llama a una API. `bb48136`
solo movió el toggle fuera del gate experimental para que se encuentre; no
cambió nada de cómo se ejecuta. Esto es parte del posicionamiento de privacidad
del producto: **no convertirlo en automático sin decisión explícita de Charly.**

### Reemplazos personalizados: detalles de diseño

- Un solo barrido de izquierda a derecha ⇒ una expansión **nunca** se
  re-expande por otra regla.
- Patrones más largos primero ⇒ una regla de dos palabras gana a una corta que
  la ensombrecería.
- Corre **después** de la corrección difusa de `custom_words` (para que una
  abreviatura mal oída se normalice antes de expandirse) y **antes** del filtro
  de muletillas.
- El setting nace vacío ⇒ **sin migración** para stores existentes.

### Idioma fijado a `es`, no `auto`

Los clips cortos (<2 s) en `auto` salían en islandés o inglés — fallo clásico
de Whisper. El idioma de Charly está fijado a `es`. Además, `5a2f371` mapea
códigos base a variantes regionales porque Nemotron anuncia `es-ES`/`es-US` y
no `es`; sin eso, el pin se descartaba en silencio y volvía la deriva.

### Timings del doble-tap: 600/800 ms

Calibrados con la mano de Charly, en dos pasadas. La primera (450/550) seguía
costando porque su atajo es un **acorde** (Ctrl+Espacio): bajar y soltar dos
teclas corre ~550 ms de hold, y re-presionar abre huecos de ~700 ms. **No
"optimizar" estos números a la baja sin volver a probarlos con una mano real**
— hay tests que documentan el perfil humano.

---

## 3. Bugs conocidos sin resolver

### 3.1 La tecla Alt corta el final de la transcripción — SIN INVESTIGAR

**Reportado por Charly, no diagnosticado todavía en ninguna sesión.** No hay
reproducción registrada ni causa confirmada; lo de abajo es la hipótesis de
Charly más pistas para arrancar, **no hallazgos**.

- **Síntoma:** al soltar, el final del dictado se pierde.
- **Hipótesis de Charly:** condición de carrera entre el `key-up` y el corte de
  captura.
- **Pistas para empezar** (sin verificar):
  - `actions.rs`, camino de parada: `rm.stop_recording(...)` seguido de
    `tm.finalize_stream()` — comprobar si los últimos frames del micrófono
    llegan después de que se recojan las muestras.
  - `audio_toolkit/audio/recorder.rs` ya tiene un
    `"Timed out waiting for EndOfStream from audio callback"`: si aparece en los
    logs al reproducir el fallo, es el hilo a tirar.
  - **Alt es un modificador**, y este fork ya arregló un bug de releases de
    modificadores tragados por el hook de Windows (`8477b61`, crate
    `handy-keys` vendorizada). Merece descartar que sea una recaída o una
    variante: revisar `src-tauri/vendor/handy-keys` y
    `shortcut/handy_keys.rs`.
  - El coalescer de `15c7c43` cambió cómo se drena la cola de audio: si el bug
    apareció después de ese commit, comparar contra `b152e2f`.
- **Cómo abordarlo:** usar la skill `superpowers:systematic-debugging`. Primero
  reproducir con logs, no proponer arreglos.

### 3.2 Riesgo aceptado: fallo silencioso de pegado pierde el dictado

Consecuencia directa de `DontModify` en la máquina de Charly (§2). Si un pegado
falla **en silencio** (foco perdido a mitad, campo de solo lectura), ese dictado
se pierde sin rastro. Él lo aceptó a sabiendas. Si le muerde, se revierte desde
Ajustes en un clic. **No es un bug, es un trade-off elegido.**

### 3.3 Efecto colateral esperado del mismo cambio

Con `DontModify`, el aviso "Texto copiado" del overlay ya **no** aparece en
pegados exitosos (correcto: no quedó nada en el portapapeles). Sigue saliendo
cuando el pegado falla. Si alguien reporta que "desapareció el aviso", es esto.

### 3.4 Disco C casi lleno

Quedan ~4,4 GB libres. `C:\h` (target de Rust) ocupa ~25 GB, de los cuales
`debug/deps` son ~19 GB. Solo se libera con `cargo clean` completo (rebuild de
20–30 min); borrar por partes **rompe la caché**. Vigilar antes de builds
grandes.

---

## 4. Próximos pasos acordados

1. **Revisar la landing de Benjamin** (`origin/feat/landing-trazo`, 1 commit,
   47 archivos, todo bajo `landing/`). **Aún sin worktree montado.** Al
   revisarla, montarla en worktree aparte en vez de hacer checkout, para no
   mover el árbol de `main`. No toca código de la app, así que es integrable de
   forma independiente. Incluye un `privacy-visual.png` de **4 MB** — conviene
   optimizarlo antes de integrar.
2. **Post de avances del hackathon**: el inventario completo agrupado por temas
   se entregó en la sesión del 24/07. Ojo al redactar: la landing **no está
   integrada**, mencionarla como "en camino".
3. **Pendientes del rebrand** (esperan decisión/arte): identificador
   `com.pais.handy`, `productName`, y el logo definitivo — los componentes
   `HandyTextLogo`/`HandyHand` conservan nombre y props para que el logo final
   sea drop-in.
4. **Después del 31 de julio**, no antes:
   - Revisar los 58 commits del upstream sin integrar. Nada urgente; apuntados:
     `eb9301e` (reset del resampler, crosstalk de audio), `0470d9a` (Windows no
     apagaba limpio), `fc465b4` (defensa contra prompt injection — revisar si
     nuestros perfiles ES la necesitan), y los bumps de `handy-keys` 0.3.1/0.3.2
     (**verificar si arreglan el secuestro antes de des-vendorizar**).
   - PR al upstream con el fix de `handy-keys`.
   - Diferido explícitamente por Charly: modos automáticos, MCP, snippets.

---

## 5. Contexto de entorno (Windows)

```powershell
# OBLIGATORIO en Windows: con el target dir por defecto, el generador de
# shaders Vulkan revienta el límite MAX_PATH (FTK1011/MSB3491).
$env:CARGO_TARGET_DIR = "C:\h"

bun install
bun run tauri dev
```

- **Cerrar `handy.exe` antes de cualquier `cargo build/check/test` que
  re-enlace** — la app bloquea sus DLLs y el build falla con "Acceso denegado"
  o `os error 32`. Si `cargo run` falla por el lock, buscar procesos `handy`
  huérfanos de sesiones dev anteriores.
- **Regenerar `src/bindings.ts`**: arrancar el binario en debug de forma
  headless, **desde `src-tauri/`** (`cargo run -- --list-models`). Si se lanza
  desde la raíz del repo, el export escribe en `C:\src\bindings.ts` en vez de
  en el sitio correcto.
- **Editar `%APPDATA%\com.pais.handy\settings_store.json` a mano**: sin BOM.
  PowerShell `Out-File utf8` mete BOM y `serde_json` lo rechaza → la app
  resetea la configuración a defaults. Reescribir con python y `utf-8` plano,
  **con la app cerrada** (si no, la sobrescribe al salir).
- **Tests:**
  - `cargo test --lib` → 179 tests (rápidos).
  - `cargo test --lib -- --ignored` → incluye el test que carga el modelo
    Whisper real (~90 s).
  - `bun test src/` → 38 tests. **Acotado a `src/` a propósito**, para no pisar
    los specs de Playwright en `tests/`.
  - `bun run check:translations` → valida las 21 locales.
  - La crate vendorizada tiene suite propia: `cargo test` dentro de
    `src-tauri/vendor/handy-keys`.
- **Los tests de perfiles ES llaman a la API real de OpenAI** (leen la clave del
  store local). Pueden dar un fallo esporádico por red — reintentar antes de
  sospechar una regresión.
- **Convención del repo:** TDD siempre (test en rojo visto fallar primero) y
  **nunca commitear ni pushear sin confirmación explícita de Charly.**

### CSV de ejemplo para el diccionario

El archivo de demo vivía en un scratchpad de sesión (ya no existe). Contenido,
por si hace falta regenerarlo:

```csv
abreviatura,texto
pq,porque
tb,también
xq,por qué
dcto,descuento
tks,"Gracias, un saludo"
vs code,Visual Studio Code
```

Ejercita cabecera, valor entrecomillado con coma y regla de dos palabras.
