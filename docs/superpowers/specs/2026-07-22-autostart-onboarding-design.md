# Paso de autostart en el onboarding — diseño

**Fecha:** 2026-07-22 · **Estado:** aprobado por Charly (diseño verbal, esta spec lo documenta)

## Objetivo

Que el onboarding pregunte explícitamente "¿Quieres que Trazo arranque contigo
al prender el computador?" con los dos toggles ya existentes (autostart y
start hidden) visibles ahí, en vez de que el usuario tenga que descubrirlos en
Ajustes → Avanzado. Los defaults **no cambian**: ambos siguen en `false`
(opt-in, coherente con el posicionamiento de privacidad de Trazo frente a
Wispr Flow).

## Flujo

`OnboardingStep` pasa de `"accessibility" | "model" | "done"` a incluir
`"autostart"`:

- **Usuario nuevo:** `accessibility → autostart → model → done`.
- **Usuario que regresa** (re-concesión de permisos, `isReturningUser`):
  `accessibility → done`, sin ver el paso nuevo — ya completó su onboarding;
  los toggles siguen disponibles en Ajustes → Avanzado.

Racional de la posición (decidido con Charly): `onboarding_completed` se marca
en el backend al terminar la selección de modelo
(`commands/models.rs::select_model`). Con el paso ANTES del modelo, si la app
se cierra a mitad de onboarding, el flujo completo (incluida esta pregunta) se
repite en el siguiente arranque; después del modelo existiría un hueco en el
que la pregunta no se mostraría nunca.

## Componentes

### `src/components/onboarding/onboardingFlow.ts` (nuevo, lógica pura)

```ts
export type OnboardingStep = "accessibility" | "autostart" | "model" | "done";
export function nextOnboardingStep(
  after: Exclude<OnboardingStep, "done">,
  isReturningUser: boolean,
): OnboardingStep;
```

Semántica: un usuario que regresa salta directo a `"done"` desde cualquier
paso (solo re-concede permisos). Usuario nuevo: `accessibility → autostart`,
`autostart → model`, `model → done`. Testeable con `bun test src/` (mismo
precedente que `showOverlayHandler.ts`). `App.tsx` importa el tipo y la
función; los handlers inline dejan de codificar la secuencia a mano.

### `src/components/onboarding/AutostartOnboarding.tsx` (nuevo, glue fino)

Mismo lenguaje visual que `AccessibilityOnboarding` (pantalla completa,
`HandyTextLogo` width 200, título `text-xl font-semibold`, card
`bg-white/5 border border-mid-gray/20`):

- Título: `t("onboarding.autostart.title")` — la pregunta.
- Subtítulo: `t("onboarding.autostart.subtitle")` — opcional y cambiable
  luego en Ajustes → Avanzado.
- Card con los dos componentes existentes reutilizados tal cual:
  `<AutostartToggle descriptionMode="inline" grouped />` y
  `<StartHidden descriptionMode="inline" grouped />`. Cero lógica de settings
  duplicada; al tocarlos aplican de inmediato (registro HKCU incluido), igual
  que en Ajustes.
- Botón "Continuar" (`t("onboarding.autostart.continue")`), siempre
  habilitado, estilo del botón primario del paso de permisos
  (`bg-logo-primary …`). Continuar sin tocar nada = quedarse con los defaults
  `false`. Sin botón "Saltar" separado (sería redundante).
- Prop única: `onComplete: () => void`.
- Se exporta desde `src/components/onboarding/index.ts`.

### `src/App.tsx` (modificado)

- El tipo `OnboardingStep` local se elimina; se importa de `onboardingFlow`.
- Los handlers usan `nextOnboardingStep(...)` con `isReturningUser`.
- Rama de render nueva: `onboardingStep === "autostart"` →
  `<AutostartOnboarding onComplete={handleAutostartComplete} />`.

## i18n

Claves nuevas `onboarding.autostart.{title,subtitle,continue}` en las **21
locales** (`en` fuente, `es` referencia Trazo, +19 restantes traducidas).
`bun run check:translations` debe pasar. Los labels/descripciones de los
toggles ya existen (`settings.advanced.autostart.*` / equivalente de
start hidden) y llegan gratis con los componentes reutilizados.

## Backend

**Cero cambios.** Settings, comandos y defaults (`default_autostart_enabled`,
`default_start_hidden` → `false`) intactos. `onboarding_completed` se sigue
marcando solo al seleccionar modelo.

## Tests y verificación

- **TDD** sobre `nextOnboardingStep`: tests en rojo primero
  (`onboardingFlow.test.ts`, `bun test src/`), luego implementación mínima.
- El componente y el cableado de App.tsx son glue fino sin tests unitarios,
  como los pasos existentes.
- Verificación manual e2e: poner `onboarding_completed=false` en el store del
  usuario (con python, sin BOM — nunca `Out-File`), `bun run tauri dev`,
  recorrer permisos → autostart → modelo y confirmar que los toggles aplican
  (entrada en `HKCU\...\Run` al activar autostart) y que "Continuar" sin tocar
  nada deja ambos en `false`.
- Suites completas: `bun test src/`, `bunx tsc --noEmit`, `bun run lint`,
  `bun run check:translations`.

## Fuera de alcance

- Cambiar defaults a `true` (descartado: opt-in deliberado).
- Toggle de autostart condicionado al de start hidden o viceversa (ambos
  visibles e independientes, decisión explícita de Charly).
- Cualquier cambio en Rust.
