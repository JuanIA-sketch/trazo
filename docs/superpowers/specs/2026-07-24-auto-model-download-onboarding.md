# Auto-selección de modelo default con descarga en background — diseño

**Fecha:** 2026-07-24 · **Estado:** aprobado por Charly; **enmendado el mismo
día** tras la prueba en vivo (ver "Default por hardware"); pendiente su
prueba en vivo de la UX de descarga

## Objetivo

Que un usuario nuevo no tenga que elegir modelo ni esperar la descarga para
terminar el onboarding. Al llegar al paso de modelo, Trazo elige el default
**según el hardware**, arranca la descarga en background y deja continuar de
inmediato. Ambos modelos siguen en el selector manual; esto solo decide la
preselección. La pantalla manual de siempre queda como fallback.

## Default por hardware (enmienda 2026-07-24, aprobada por Charly)

La prueba en vivo invirtió la conclusión de la eval inicial (que comparó en
CPU): en GPU dedicada (GTX 1650/Vulkan) Turbo batch va 3,6x RT mientras el
decode RNNT de Nemotron es latency-bound (<1x incluso en batch y en F16). En
solo-CPU se invierte (ventana fija de 30s de Whisper vs escalado lineal de
Nemotron). Decisión:

- `has_dedicated_gpu` (comando nuevo; puro `any_dedicated_gpu` sobre
  `transcribe_cpp::devices()`, `DeviceType::Gpu` — las iGPU NO cuentan,
  verificado en la máquina de referencia: Intel UHD→Igpu, GTX 1650→Gpu).
- GPU dedicada → **Whisper Turbo Q8_0**; si no → **Nemotron Streaming 3.5
  Q8_0**. `planModelStep(models, hasDedicatedGpu)` con ambos ids
  cross-checkeados contra `catalog.json`. Fallback del probe: `false`
  (Nemotron corre en cualquier máquina; Turbo sin GPU es inutilizable).

Relacionado: el fix de robustez del streaming (coalescer + watchdog
`StreamHealth`, commits 5a2f371/15c7c43) garantiza que un modelo streaming
sobre un backend lento nunca pierda el dictado (cae a batch).

## Decisiones previas que esto asume

- Mapeo `es → es-ES/es-US` en `transcribe_cpp_run_plan` (hecho, con tests):
  sin él, Nemotron correría en auto-detección y reabriría el bug de idioma.
- El perfil ES de post-procesamiento ya repara los "¿" (tests de regresión
  añadidos); el dictado normal sin LLM los omite y se acepta.

## Flujo

La secuencia de pasos NO cambia (`accessibility → autostart → model → done`).
Cambia el comportamiento interno del paso `model`, que ahora tiene tres modos
decididos por lógica pura:

```ts
// onboardingFlow.ts
export const ONBOARDING_DEFAULT_MODEL_ID =
  "handy-computer/nemotron-3.5-asr-streaming-0.6b-gguf";
export type ModelStepPlan =
  | { kind: "select"; modelId: string } // default ya en disco → selección directa
  | { kind: "download"; modelId: string } // default descargable → auto-descarga
  | { kind: "manual" }; // default ausente del catálogo → chooser
export function planModelStep(models: ModelInfo[]): ModelStepPlan;
```

- **`download`** (caso normal): pantalla compacta con nombre del modelo,
  barra de progreso/velocidad (estado ya existente en `modelStore`) y dos
  acciones: **Continuar** (termina el onboarding ya; la descarga sigue) y
  **Elegir otro modelo** (→ modo manual). Si el usuario se queda, al terminar
  la descarga se selecciona y avanza solo (comportamiento actual conservado).
- **`select`**: el default ya está en disco (reinstalación) → se selecciona y
  avanza sin pantalla.
- **`manual`**: la pantalla actual completa, intacta.

## Desacople de `onboarding_completed`

Hoy solo lo fija `select_model` (models.rs), es decir: sin descarga terminada
no hay onboarding completo. Se añade el comando backend **`complete_onboarding`**
(escribe `onboarding_completed = true`, nada más; glue fino sin lógica) y el
botón "Continuar" lo invoca. `select_model` sigue fijándolo también — es
idempotente y cubre el camino manual.

Consecuencia aceptada: si la app se cierra con la descarga a medias, el
siguiente arranque entra directo a la app principal sin modelo; el usuario
elige/redescarga en Ajustes → Modelos (ese es el fallback manual persistente).
La reanudación automática al arrancar queda fuera de alcance de esta pasada.

## Secuenciación descarga → selección (lógica pura, TDD)

`src/components/onboarding/autoDownloadFlow.ts`:

```ts
export type AutoDownloadOutcome = "selected" | "failed" | "superseded";
export async function runAutoModelDownload(
  modelId: string,
  deps: {
    download: (id: string) => Promise<boolean>;
    select: (id: string) => Promise<boolean>;
    stillWanted: (id: string) => boolean; // guarda anti-carrera
  },
): Promise<AutoDownloadOutcome>;
```

Reglas (cada una un test):

1. Descarga OK y aún deseada → `select` una sola vez → `"selected"`.
2. Descarga falla → NO se llama `select` → `"failed"`.
3. `stillWanted` falso al terminar (el usuario eligió otro modelo en el modo
   manual mientras bajaba) → NO se llama `select` → `"superseded"`.
4. `select` falla → `"failed"`.

La cadena vive en una acción de `modelStore` (`startAutoDownload`) para
sobrevivir al desmontaje del componente si el usuario continúa antes de que
termine; `stillWanted` compara contra el target guardado en el store, que la
selección manual limpia.

## UI (`Onboarding.tsx`)

Estado local `mode: "auto" | "manual"` inicializado desde `planModelStep`
cuando llega la lista de modelos. El modo `auto` renderiza la pantalla
compacta (mismo lenguaje visual del onboarding: logo, título, card, botón
primario); `manual` renderiza el markup actual sin tocar. La transición a
"done" reutiliza `onModelSelected`.

## Backend

- `commands/models.rs`: `complete_onboarding` (nuevo, registrado en specta →
  regenerar `src/bindings.ts` arrancando la app en debug headless).
- Sin más cambios Rust.

## i18n

Claves nuevas `onboarding.autoDownload.{title,description,continue,chooseAnother}`
en las **21 locales** (`en` fuente, `es` referencia). `bun run
check:translations` debe pasar.

## Tests y verificación

- TDD en `onboardingFlow.test.ts` (planModelStep) y
  `autoDownloadFlow.test.ts` (las 4 reglas) — `bun test src/`.
- Suites: `bun test src/`, `cargo test --lib`, `bunx tsc --noEmit`,
  `bun run lint`, `bun run check:translations`.
- Validación en vivo de Charly (pendiente): UX de la descarga + sensación de
  uso real de Nemotron.

## Fuera de alcance

- Reanudar la auto-descarga en arranques posteriores.
- Cancelación de la descarga en curso desde la pantalla compacta.
- Elegir default distinto por idioma de la app (Nemotron es multilingüe, 28
  idiomas; sirve para las 21 locales).
