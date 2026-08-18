# Formalizador de correo — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dictar en tono casual con un atajo propio y obtener un correo formalizado (saludo por hora, cuerpo reestructurado, despedida y firma) con el tratamiento tú/usted que el usuario haya fijado.

**Architecture:** No hay infraestructura nueva. Se añade un módulo con dos funciones puras (`formalize.rs`), tres ajustes con migración de esquema v6→v7, un perfil de prompt sembrado, y un modo nuevo en la acción de transcripción que decide **qué** perfil ejecutar sin tocar la selección global del usuario. El resto lo aporta el post-procesado LLM ya existente.

**Tech Stack:** Rust (Tauri 2.x, serde, chrono 0.4 ya en `Cargo.toml:67`), React + TypeScript, i18next, tauri-specta para los bindings.

**Spec:** `docs/superpowers/specs/2026-07-29-formalizador-correo-design.md`

## Global Constraints

- **TDD obligatorio.** Test en rojo primero, visto fallar por la razón correcta, luego la implementación mínima. Sin excepciones. Es convención del repo (`CLAUDE.md`).
- **Cerrar Trazo antes de cualquier `cargo build`/`check`/`test`.** La app bloquea sus DLLs en `C:\h`. Comprobar con `Get-Process handy*,trazo*` — puede haber huérfanos con otro PID.
- **No hace falta exportar `CARGO_TARGET_DIR`**: `.cargo/config.toml` ya fija `target-dir = "C:/h"` (protegido con `skip-worktree`).
- **Nunca editar fuentes con `Get-Content`/`Set-Content` de PowerShell 5.1**: decodifica como ANSI y corrompe el UTF-8. Usar la herramienta Edit.
- **Nunca `git add -A`**: `git status` marca ~80 fantasmas de CRLF. Usar rutas explícitas y `git diff --numstat` para ver los cambios reales.
- **Nunca commitear ni pushear sin confirmación explícita de Charly.**
- Todos los comandos de cargo se ejecutan desde `src-tauri/`.
- Línea base antes de empezar: `cargo test --lib` → **237 passed, 0 failed, 1 ignored**.
- Todo texto de interfaz pasa por i18next. Las **21 locales** deben quedar completas (`bun run check:translations` en verde).
- El default del atajo **no puede contener Ctrl+Alt**: en teclado español eso es AltGr. `alt_right` está aliaseado a `"altgr"` en `vendor/handy-keys/src/types/modifiers.rs:128`.

---

### Task 1: Funciones puras del formalizador

**Files:**

- Create: `src-tauri/src/formalize.rs`
- Modify: `src-tauri/src/lib.rs` (declarar el módulo)

**Interfaces:**

- Consumes: nada.
- Produces:
  - `pub fn greeting_for_hour(hour: u32) -> &'static str`
  - `pub struct PromptVars { pub greeting: String, pub user_name: String, pub treatment: String }`
  - `pub fn render_prompt_variables(template: &str, vars: &PromptVars) -> String`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `src-tauri/src/formalize.rs` con **solo** el bloque de tests:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn greeting_covers_every_hour_of_the_day() {
        // Los limites son donde se rompen estas funciones, no el medio del rango.
        assert_eq!(greeting_for_hour(5), "Buenos días");
        assert_eq!(greeting_for_hour(11), "Buenos días");
        assert_eq!(greeting_for_hour(12), "Buenas tardes");
        assert_eq!(greeting_for_hour(19), "Buenas tardes");
        assert_eq!(greeting_for_hour(20), "Buenas noches");
        assert_eq!(greeting_for_hour(4), "Buenas noches");
        assert_eq!(greeting_for_hour(0), "Buenas noches");
    }

    #[test]
    fn every_hour_maps_to_some_greeting() {
        // Sin huecos ni panicos en las 24 horas.
        for hour in 0..24 {
            assert!(!greeting_for_hour(hour).is_empty(), "hora {hour} sin saludo");
        }
    }

    #[test]
    fn variables_are_substituted_in_the_template() {
        let vars = PromptVars {
            greeting: "Buenos días".to_string(),
            user_name: "Charly".to_string(),
            treatment: "usted".to_string(),
        };

        let out = render_prompt_variables(
            "Empieza por ${saludo}. Trata de ${tratamiento}. Firma ${nombre_usuario}.",
            &vars,
        );

        assert_eq!(
            out,
            "Empieza por Buenos días. Trata de usted. Firma Charly."
        );
    }

    #[test]
    fn output_placeholder_is_left_untouched() {
        // ${output} lo resuelve actions.rs despues, en sus dos caminos.
        // Si esta funcion lo tocara, el camino estructurado perderia la marca
        // que necesita para borrarlo del prompt de sistema.
        let vars = PromptVars {
            greeting: "Buenas tardes".to_string(),
            user_name: "Charly".to_string(),
            treatment: "tú".to_string(),
        };

        let out = render_prompt_variables("${saludo}\n\nTranscripción:\n${output}", &vars);

        assert!(out.contains("${output}"), "got {out}");
        assert!(out.starts_with("Buenas tardes"), "got {out}");
    }

    #[test]
    fn an_empty_name_leaves_no_dangling_signature() {
        let vars = PromptVars {
            greeting: "Buenos días".to_string(),
            user_name: String::new(),
            treatment: "tú".to_string(),
        };

        let out = render_prompt_variables("Firma: ${nombre_usuario}", &vars);

        assert_eq!(out, "Firma: ", "el nombre vacio se sustituye por nada");
    }
}
```

Declarar el módulo en `src-tauri/src/lib.rs`, junto a los demás `mod` (buscar la lista `mod actions;` / `mod clipboard;` y añadir en orden alfabético):

```rust
mod formalize;
```

- [ ] **Step 2: Ejecutar los tests y verlos fallar**

```bash
cd src-tauri && cargo test --lib formalize
```

Esperado: **error de compilación** — `cannot find function 'greeting_for_hour' in this scope` y `cannot find struct 'PromptVars'`. Ese es el fallo correcto: los tests describen una API que aún no existe.

- [ ] **Step 3: Implementación mínima**

Añadir **encima** del bloque `#[cfg(test)]` en `src-tauri/src/formalize.rs`:

```rust
//! Piezas puras del formalizador de correo.
//!
//! Viven aparte de `actions.rs` a propósito: son las dos decisiones del
//! formalizador que deben ser deterministas y testeables sin red, sin reloj y
//! sin `AppSettings`. Todo lo demás (llamada al LLM, inserción) lo aporta el
//! post-procesado que ya existía.

/// Saludo en español según la hora local de quien dicta.
///
/// Recibe la hora como parámetro en vez de leer el reloj para que sea testeable
/// sin mockear el tiempo; el llamante pasa `chrono::Local::now().hour()`.
///
/// **Límite conocido:** es la hora de quien dicta, no la del destinatario.
/// Conocer la del otro exigiría pedírsela a mano y no lo vale.
pub fn greeting_for_hour(hour: u32) -> &'static str {
    match hour {
        5..=11 => "Buenos días",
        12..=19 => "Buenas tardes",
        _ => "Buenas noches",
    }
}

/// Valores que el formalizador inyecta en la plantilla del prompt.
pub struct PromptVars {
    /// Salida de [`greeting_for_hour`].
    pub greeting: String,
    /// `user_full_name` tal cual; puede venir vacío.
    pub user_name: String,
    /// Literalmente `"tú"` o `"usted"`.
    pub treatment: String,
}

/// Sustituye las variables del formalizador en la plantilla del prompt.
///
/// **No toca `${output}`**: de eso se encargan después los dos caminos de
/// `actions.rs` (el estructurado lo borra del prompt de sistema, el legacy lo
/// reemplaza por la transcripción). Sustituir aquí rompería el estructurado.
pub fn render_prompt_variables(template: &str, vars: &PromptVars) -> String {
    template
        .replace("${saludo}", &vars.greeting)
        .replace("${nombre_usuario}", &vars.user_name)
        .replace("${tratamiento}", &vars.treatment)
}
```

- [ ] **Step 4: Ejecutar los tests y verlos pasar**

```bash
cd src-tauri && cargo test --lib formalize
```

Esperado: **5 passed**.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/formalize.rs src-tauri/src/lib.rs
git commit -m "feat: funciones puras del formalizador de correo"
```

---

### Task 2: Ajustes nuevos y migración de esquema v7

**Files:**

- Modify: `src-tauri/src/settings.rs` (enum nuevo, 3 campos, prompt sembrado, constante de versión en la línea 479, bloque de migración tras el de `< 6` en la línea 1202)
- Test: `src-tauri/src/settings.rs` (módulo `#[cfg(test)]` existente al final)

**Interfaces:**

- Consumes: nada de la Task 1.
- Produces:
  - `pub enum FormalityTreatment { Tu, Usted }` con `Default` = `Tu`
  - `AppSettings.user_full_name: String`
  - `AppSettings.formality_treatment: FormalityTreatment`
  - `AppSettings.formalize_prompt_id: Option<String>`
  - `pub const DEFAULT_EMAIL_PROMPT_ID: &str = "default_es_email"`
  - `CURRENT_SETTINGS_SCHEMA_VERSION` pasa a `7`

- [ ] **Step 1: Escribir los tests que fallan**

Añadir al módulo de tests de `src-tauri/src/settings.rs`:

```rust
    #[test]
    fn the_email_profile_ships_with_a_fresh_install() {
        let settings = get_default_settings();

        let email = settings
            .post_process_prompts
            .iter()
            .find(|p| p.id == DEFAULT_EMAIL_PROMPT_ID)
            .expect("el perfil de correo debe venir sembrado");

        // El formalizador es inutil sin sus tres variables.
        assert!(email.prompt.contains("${saludo}"), "falta ${{saludo}}");
        assert!(
            email.prompt.contains("${nombre_usuario}"),
            "falta ${{nombre_usuario}}"
        );
        assert!(
            email.prompt.contains("${tratamiento}"),
            "falta ${{tratamiento}}"
        );
        // Y sin ${output} el post-procesado no recibe la transcripcion.
        assert!(email.prompt.contains("${output}"), "falta ${{output}}");
    }

    #[test]
    fn formalize_defaults_point_at_the_seeded_profile() {
        let settings = get_default_settings();

        assert_eq!(
            settings.formalize_prompt_id.as_deref(),
            Some(DEFAULT_EMAIL_PROMPT_ID)
        );
        assert_eq!(settings.formality_treatment, FormalityTreatment::Tu);
        assert_eq!(settings.user_full_name, "");
    }

    #[test]
    fn v7_migration_seeds_the_email_profile_into_an_existing_store() {
        let mut settings = get_default_settings();
        settings.settings_schema_version = 6;
        settings.post_process_prompts.retain(|p| p.id != DEFAULT_EMAIL_PROMPT_ID);
        settings.formalize_prompt_id = None;

        let raw = serde_json::json!({
            "settings_schema_version": 6,
            "onboarding_completed": true,
            "whats_new_last_seen_version": default_whats_new_last_seen_version(),
            "overlay_style": "live",
        });

        assert!(apply_settings_migrations(&mut settings, &raw));
        assert!(
            settings
                .post_process_prompts
                .iter()
                .any(|p| p.id == DEFAULT_EMAIL_PROMPT_ID),
            "la migracion debe sembrar el perfil de correo"
        );
        assert_eq!(
            settings.formalize_prompt_id.as_deref(),
            Some(DEFAULT_EMAIL_PROMPT_ID)
        );
        assert_eq!(
            settings.settings_schema_version,
            CURRENT_SETTINGS_SCHEMA_VERSION
        );
    }

    #[test]
    fn v7_migration_never_clobbers_an_edited_email_profile() {
        let mut settings = get_default_settings();
        settings.settings_schema_version = 6;
        for prompt in settings.post_process_prompts.iter_mut() {
            if prompt.id == DEFAULT_EMAIL_PROMPT_ID {
                prompt.prompt = "MI VERSION EDITADA ${output}".to_string();
            }
        }

        let raw = serde_json::json!({
            "settings_schema_version": 6,
            "onboarding_completed": true,
            "whats_new_last_seen_version": default_whats_new_last_seen_version(),
            "overlay_style": "live",
        });

        apply_settings_migrations(&mut settings, &raw);

        let email = settings
            .post_process_prompts
            .iter()
            .find(|p| p.id == DEFAULT_EMAIL_PROMPT_ID)
            .expect("sigue existiendo");
        assert_eq!(
            email.prompt, "MI VERSION EDITADA ${output}",
            "un prompt editado por el usuario nunca se pisa"
        );
    }

    #[test]
    fn v7_migration_leaves_the_global_selection_alone() {
        // El atajo de formalizar tiene su propio ajuste; la seleccion global
        // del usuario (su perfil del dia a dia) no se toca.
        let mut settings = get_default_settings();
        settings.settings_schema_version = 6;
        settings.post_process_selected_prompt_id = Some("default_es_casual".to_string());

        let raw = serde_json::json!({
            "settings_schema_version": 6,
            "onboarding_completed": true,
            "whats_new_last_seen_version": default_whats_new_last_seen_version(),
            "overlay_style": "live",
        });

        apply_settings_migrations(&mut settings, &raw);

        assert_eq!(
            settings.post_process_selected_prompt_id.as_deref(),
            Some("default_es_casual")
        );
    }
```

- [ ] **Step 2: Ejecutar los tests y verlos fallar**

```bash
cd src-tauri && cargo test --lib settings::tests
```

Esperado: **error de compilación** — `cannot find value 'DEFAULT_EMAIL_PROMPT_ID'`, `no field 'formalize_prompt_id' on type 'AppSettings'`, `cannot find type 'FormalityTreatment'`.

- [ ] **Step 3: Implementación mínima**

**3a.** Junto a `ClipboardHandling` (alrededor de `settings.rs:167`), añadir el enum:

```rust
/// Tratamiento gramatical que usa el formalizador de correo.
///
/// Es un ajuste fijo y no algo que el LLM infiera: en español tú/usted cambia
/// cada verbo del mensaje, así que inferirlo haría que el mismo dictado saliera
/// distinto en dos intentos y no se pudiera cubrir con tests.
#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq, Type, Default)]
#[serde(rename_all = "snake_case")]
pub enum FormalityTreatment {
    #[default]
    Tu,
    Usted,
}

impl FormalityTreatment {
    /// La palabra que se inyecta en `${tratamiento}`.
    pub fn as_prompt_word(self) -> &'static str {
        match self {
            FormalityTreatment::Tu => "tú",
            FormalityTreatment::Usted => "usted",
        }
    }
}
```

**3b.** Junto a `DEFAULT_SELECTED_PROMPT_ID`, añadir:

```rust
/// Id del perfil de correo sembrado, al que apunta `formalize_prompt_id`.
pub const DEFAULT_EMAIL_PROMPT_ID: &str = "default_es_email";
```

**3c.** En `struct AppSettings`, junto a los campos de post-proceso:

```rust
    /// Nombre con el que firma el formalizador. Vacío = sin firma.
    #[serde(default)]
    pub user_full_name: String,
    /// Tú o usted en los correos formalizados.
    #[serde(default)]
    pub formality_treatment: FormalityTreatment,
    /// Perfil que ejecuta el atajo de formalizar. Independiente de
    /// `post_process_selected_prompt_id` para no obligar a pasar por Ajustes.
    #[serde(default)]
    pub formalize_prompt_id: Option<String>,
```

**3d.** En `get_default_settings()`, junto a `post_process_selected_prompt_id` (alrededor de la línea 965):

```rust
        user_full_name: String::new(),
        formality_treatment: FormalityTreatment::Tu,
        formalize_prompt_id: Some(DEFAULT_EMAIL_PROMPT_ID.to_string()),
```

**3e.** En `default_post_process_prompts()`, añadir al final del vector:

```rust
        LLMPrompt {
            id: DEFAULT_EMAIL_PROMPT_ID.to_string(),
            name: "Correo formal (ES)".to_string(),
            prompt: r#"Eres el post-procesador de un dictado por voz en español. Recibirás la transcripción cruda de un dictado y debes convertirla en un CORREO listo para enviar. Devuelve ÚNICAMENTE el texto final, sin comentarios, sin comillas envolventes y sin explicaciones.

TRATAMIENTO: dirígete al destinatario de ${tratamiento}. Conjuga TODOS los verbos y pronombres en consecuencia, sin mezclar los dos tratamientos.

ESTRUCTURA, en este orden:

1. SALUDO: empieza exactamente por "${saludo}". Si el dictado dice a quién va dirigido el mensaje, añade su nombre: "${saludo}, María:". Si no menciona destinatario, deja "${saludo}:" a secas. NUNCA inventes un nombre, y no confundas a quién va dirigido con quién se menciona de pasada.
2. CUERPO: reescribe el dictado en 1-3 párrafos cortos, en registro profesional pero natural. Corrige puntuación, mayúsculas y ortografía; elimina muletillas; convierte números hablados a cifras (veinticinco → 25). Si el hablante se corrige a sí mismo, conserva SOLO la versión final ("el martes... no, mejor el jueves" → "el jueves").
3. DESPEDIDA: una línea breve, elegida según el contenido ("Un saludo," o "Quedo atento,").
4. FIRMA: "${nombre_usuario}" en su propia línea. Si viene vacío, omite la firma Y la coma de la despedida, para no dejarla colgando.

REGLAS:
- No añadas información que no esté en el dictado. No inventes asuntos, fechas ni compromisos.
- Conserva el significado exacto. Sí puedes reorganizar el contenido para darle forma de correo.
- Los términos técnicos en inglés se mantienen tal cual: commit, pull request, merge, deploy, rollback, webhook, endpoint, workflow, prompt, API, token, backend, frontend, repo, branch, pipeline.

Transcripción:
${output}"#
                .to_string(),
        },
```

**3f.** `settings.rs:479` — subir la constante:

```rust
const CURRENT_SETTINGS_SCHEMA_VERSION: u32 = 7;
```

**3g.** En `apply_settings_migrations` (línea 1097), **después** del bloque `if stored_schema_version < 6`, añadir:

```rust
    if stored_schema_version < 7 {
        // Siembra el perfil de correo del formalizador. Mismo patrón que la v2
        // con los perfiles ES: añadir solo lo ausente, para no pisar un prompt
        // que el usuario haya editado. La selección global NO se toca: el atajo
        // de formalizar tiene su propio `formalize_prompt_id`.
        for prompt in default_post_process_prompts() {
            if !settings
                .post_process_prompts
                .iter()
                .any(|p| p.id == prompt.id)
            {
                settings.post_process_prompts.push(prompt);
            }
        }
        if settings.formalize_prompt_id.is_none() {
            settings.formalize_prompt_id = Some(DEFAULT_EMAIL_PROMPT_ID.to_string());
        }
        settings.settings_schema_version = CURRENT_SETTINGS_SCHEMA_VERSION;
        updated = true;
    }
```

- [ ] **Step 4: Ejecutar los tests y verlos pasar**

```bash
cd src-tauri && cargo test --lib settings::tests
```

Esperado: **PASS**, incluidos los 5 nuevos. Si falla `every_seeded_prompt_has_the_output_placeholder` (el test preexistente de `settings.rs:1748`), es que el prompt nuevo perdió `${output}`.

- [ ] **Step 5: Regenerar los bindings de TypeScript**

`FormalityTreatment` deriva `Type`, así que `src/bindings.ts` queda obsoleto. Regenerar **desde `src-tauri/`** (desde la raíz escribe en `C:\src\bindings.ts`):

```bash
cd src-tauri && cargo run -- --list-models
```

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/settings.rs src/bindings.ts
git commit -m "feat: ajustes del formalizador y migracion de esquema v7"
```

---

### Task 3: Enrutado del post-procesado al perfil correcto

**Files:**

- Modify: `src-tauri/src/formalize.rs` (añadir el modo y el resolutor)
- Modify: `src-tauri/src/actions.rs:50-52` (struct), `:77` (firma), `:105-112` (resolución del prompt), `:410-420` (call site y metadato del historial), `:622` (lectura del campo)
- Test: `src-tauri/src/formalize.rs`

**Interfaces:**

- Consumes: `PromptVars` y `render_prompt_variables` de la Task 1; `FormalityTreatment`, `DEFAULT_EMAIL_PROMPT_ID` de la Task 2.
- Produces:
  - `pub enum PostProcessMode { Off, Selected, Formalize }`
  - `pub fn prompt_id_for_mode(mode: PostProcessMode, selected: Option<&str>, formalize: Option<&str>) -> Option<String>`

- [ ] **Step 1: Escribir los tests que fallan**

Añadir al módulo de tests de `src-tauri/src/formalize.rs`:

```rust
    #[test]
    fn off_mode_never_resolves_a_prompt() {
        assert_eq!(
            prompt_id_for_mode(PostProcessMode::Off, Some("a"), Some("b")),
            None
        );
    }

    #[test]
    fn selected_mode_uses_the_global_selection() {
        assert_eq!(
            prompt_id_for_mode(PostProcessMode::Selected, Some("default_es_casual"), Some("default_es_email")),
            Some("default_es_casual".to_string())
        );
    }

    #[test]
    fn formalize_mode_ignores_the_global_selection() {
        // El punto entero de la feature: formalizar no depende de que el
        // usuario haya cambiado su perfil del dia a dia en Ajustes.
        assert_eq!(
            prompt_id_for_mode(PostProcessMode::Formalize, Some("default_es_casual"), Some("default_es_email")),
            Some("default_es_email".to_string())
        );
    }

    #[test]
    fn the_rendered_prompt_survives_the_structured_path() {
        // El camino estructurado BORRA ${output} del prompt de sistema
        // (actions.rs:65). Si las variables se sustituyeran despues de eso, el
        // prompt de sistema llegaria sin saludo ni firma. Este test fija el
        // orden: primero variables, despues ${output}.
        let vars = PromptVars {
            greeting: "Buenos días".to_string(),
            user_name: "Charly".to_string(),
            treatment: "usted".to_string(),
        };
        let rendered = render_prompt_variables(
            "Saluda con ${saludo}, trata de ${tratamiento}, firma ${nombre_usuario}.\n\n${output}",
            &vars,
        );

        let system = crate::actions::build_system_prompt_for_test(&rendered);

        assert!(system.contains("Buenos días"), "got {system}");
        assert!(system.contains("usted"), "got {system}");
        assert!(system.contains("Charly"), "got {system}");
        assert!(!system.contains("${output}"), "got {system}");
    }

    #[test]
    fn formalize_mode_without_a_configured_profile_resolves_nothing() {
        // Devolver None hace que el post-procesado se salte y se inserte el
        // texto crudo, que es la politica del resto del sistema: un fallo de
        // configuracion nunca cuesta un dictado.
        assert_eq!(
            prompt_id_for_mode(PostProcessMode::Formalize, Some("default_es_casual"), None),
            None
        );
    }
```

- [ ] **Step 2: Ejecutar los tests y verlos fallar**

```bash
cd src-tauri && cargo test --lib formalize
```

Esperado: **error de compilación** — `cannot find type 'PostProcessMode'`.

- [ ] **Step 3: Añadir el modo y el resolutor**

En `src-tauri/src/formalize.rs`, encima del bloque de tests:

```rust
/// Qué perfil de post-procesado ejecuta una acción de transcripción.
///
/// Sustituye al antiguo `post_process: bool` para que "post-procesar" y "con
/// qué perfil" dejen de ser dos preguntas que se responden en sitios distintos.
/// Como enum, el estado imposible ("no post-proceses, pero formaliza") no se
/// puede construir.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub enum PostProcessMode {
    /// Sin paso por el LLM.
    Off,
    /// Perfil elegido por el usuario en Ajustes (`post_process_selected_prompt_id`).
    Selected,
    /// Perfil del formalizador (`formalize_prompt_id`).
    Formalize,
}

/// Id del prompt a ejecutar, o `None` si no hay que post-procesar.
///
/// Pura y sin `AppSettings` a propósito: la regla es una tabla de tres filas y
/// merece probarse como tal.
pub fn prompt_id_for_mode(
    mode: PostProcessMode,
    selected: Option<&str>,
    formalize: Option<&str>,
) -> Option<String> {
    match mode {
        PostProcessMode::Off => None,
        PostProcessMode::Selected => selected.map(str::to_string),
        PostProcessMode::Formalize => formalize.map(str::to_string),
    }
}
```

Y en `actions.rs`, junto a `build_system_prompt` (línea 64), exponerlo para el test — `build_system_prompt` es privado y el test vive en otro módulo:

```rust
/// Expuesto solo para tests: fija el orden "variables primero, `${output}`
/// después", que es lo que hace que el camino estructurado no pierda el saludo.
#[cfg(test)]
pub fn build_system_prompt_for_test(prompt_template: &str) -> String {
    build_system_prompt(prompt_template)
}
```

- [ ] **Step 4: Ejecutar los tests y verlos pasar**

```bash
cd src-tauri && cargo test --lib formalize
```

Esperado: **10 passed** (5 de la Task 1 + 5 nuevos).

- [ ] **Step 5: Cablear el modo en `actions.rs`**

**5a.** `actions.rs:50-52`, cambiar el struct:

```rust
struct TranscribeAction {
    mode: crate::formalize::PostProcessMode,
}
```

**5b.** `actions.rs:622`, sustituir `let post_process = self.post_process;` por:

```rust
        let mode = self.mode;
```

**5c.** `actions.rs:77`, cambiar la firma para recibir el id ya resuelto en vez de leerlo de settings:

```rust
async fn post_process_transcription(
    settings: &AppSettings,
    transcription: &str,
    prompt_id: &str,
) -> Option<String> {
```

**5d.** `actions.rs:105-112`, sustituir el bloque `let selected_prompt_id = match ...` por el uso directo del parámetro:

```rust
    let selected_prompt_id = prompt_id.to_string();
```

**5e.** Justo después de obtener `prompt` (tras el `match` de `actions.rs:113-126`) y **antes** de que se use en cualquiera de los dos caminos, inyectar las variables:

```rust
    // Las tres variables del formalizador se sustituyen aquí, en el único punto
    // por el que pasan los dos caminos (estructurado y legacy), y siempre ANTES
    // de que se toque ${output}: el estructurado borra ese marcador del prompt
    // de sistema, así que sustituir después dejaría el prompt a medias.
    // En un perfil que no las use, esto es un no-op.
    let prompt = {
        use chrono::Timelike;
        let vars = crate::formalize::PromptVars {
            greeting: crate::formalize::greeting_for_hour(chrono::Local::now().hour()).to_string(),
            user_name: settings.user_full_name.clone(),
            treatment: settings.formality_treatment.as_prompt_word().to_string(),
        };
        crate::formalize::render_prompt_variables(&prompt, &vars)
    };
```

**5f.** `actions.rs:410-420`, sustituir el `if post_process { ... }` por:

```rust
    let prompt_id = crate::formalize::prompt_id_for_mode(
        mode,
        settings.post_process_selected_prompt_id.as_deref(),
        settings.formalize_prompt_id.as_deref(),
    );

    if let Some(prompt_id) = prompt_id {
        if let Some(processed_text) =
            post_process_transcription(&settings, &final_text, &prompt_id).await
        {
            post_processed_text = Some(processed_text.clone());
            final_text = processed_text;

            // El metadato del historial debe guardar el prompt que DE VERDAD se
            // ejecutó, no la selección global: si no, un correo formalizado
            // aparecería en el historial atribuido al perfil casual.
            if let Some(prompt) = settings
                .post_process_prompts
                .iter()
                .find(|prompt| prompt.id == prompt_id)
            {
                post_process_prompt = Some(prompt.prompt.clone());
            }
        }
    } else if final_text != transcription {
```

**5g.** `actions.rs:988` — el helper `run_profile` de los tests de perfiles ES llama a `post_process_transcription(&settings, transcript)` con dos argumentos. Al cambiar la firma en 5c **deja de compilar**, y con él los tres tests de perfiles ES existentes. Actualizarlo para pasar el perfil que el propio helper ya seleccionó:

```rust
        let output = tauri::async_runtime::block_on(post_process_transcription(
            &settings,
            transcript,
            profile_id,
        ));
```

**5h.** `ACTION_MAP` (alrededor de `actions.rs:890`), actualizar las dos entradas existentes:

```rust
    map.insert(
        "transcribe".to_string(),
        Arc::new(TranscribeAction {
            mode: crate::formalize::PostProcessMode::Off,
        }) as Arc<dyn ShortcutAction>,
    );
    map.insert(
        "transcribe_with_post_process".to_string(),
        Arc::new(TranscribeAction {
            mode: crate::formalize::PostProcessMode::Selected,
        }) as Arc<dyn ShortcutAction>,
    );
```

- [ ] **Step 6: Compilar y correr la suite entera**

```bash
cd src-tauri && cargo test --lib
```

Esperado: **246 passed, 0 failed** (237 de línea base + 9 nuevos). Si el compilador se queja de `self.post_process` en algún sitio que no sea la línea 622, es un uso que este plan no localizó: cambiarlo también a `self.mode`.

- [ ] **Step 7: Commit**

```bash
git add src-tauri/src/formalize.rs src-tauri/src/actions.rs
git commit -m "feat: enruta el post-procesado al perfil del formalizador"
```

---

### Task 4: Atajo `transcribe_and_formalize`

**Files:**

- Modify: `src-tauri/src/settings.rs` (bindings por defecto, junto al bloque de `settings.rs:894-914`)
- Modify: `src-tauri/src/actions.rs` (entrada en `ACTION_MAP`)
- Modify: `src-tauri/src/shortcut/mod.rs:397`, `src-tauri/src/shortcut/handy_keys.rs:437` (puerta de `post_process_enabled`)
- Test: `src-tauri/src/settings.rs`

**Interfaces:**

- Consumes: `PostProcessMode::Formalize` de la Task 3.
- Produces: binding con id `"transcribe_and_formalize"` en `AppSettings.bindings`.

- [ ] **Step 1: Escribir los tests que fallan**

Añadir al módulo de tests de `src-tauri/src/settings.rs`:

```rust
    #[test]
    fn the_formalize_binding_ships_by_default() {
        let settings = get_default_settings();

        let binding = settings
            .bindings
            .get("transcribe_and_formalize")
            .expect("el atajo de formalizar debe venir de fabrica");

        assert!(!binding.current_binding.is_empty());
        assert_eq!(binding.current_binding, binding.default_binding);
    }

    #[test]
    fn the_formalize_default_is_a_single_key_and_never_ctrl_alt() {
        // En teclado espanol AltGr ES Ctrl+Alt: un default con esa combinacion
        // se dispararia al escribir @, #, € o \. Y nada de acordes de tres
        // teclas sostenidas. Ver el spec y modifiers.rs:128, donde alt_right
        // esta aliaseado a "altgr".
        let settings = get_default_settings();
        let binding = &settings.bindings["transcribe_and_formalize"].default_binding;

        assert!(
            !binding.contains('+'),
            "el default debe ser una sola tecla, es {binding}"
        );
        assert!(
            !binding.contains("alt_right") && !binding.contains("altgr"),
            "AltGr jamas, es {binding}"
        );
        assert!(
            !binding.contains("shift_right"),
            "shift_right se pisa con cada mayuscula, es {binding}"
        );
    }
```

- [ ] **Step 2: Ejecutar los tests y verlos fallar**

```bash
cd src-tauri && cargo test --lib settings::tests::the_formalize
```

Esperado: **FAIL** con `el atajo de formalizar debe venir de fabrica` (panic del `expect`).

- [ ] **Step 3: Implementación mínima**

**3a.** En `get_default_settings()`, después del bloque que inserta `transcribe_with_post_process` (`settings.rs:903-914`):

> **⚠️ EJECUTADO CON OTRO VALOR.** El default final es **`f9` en todas las
> plataformas, sin ramas `#[cfg]`** (`let default_formalize_shortcut = "f9";`).
> La revisión final descubrió dos cosas que este plan no previó: un modificador
> desnudo bloquea la _pulsación_ (pulsar Ctrl derecho para hacer Ctrl+C arrancaba
> una grabación y la app recibía una `c` literal), y bajo la implementación Tauri
> —la de por defecto en Linux— `ctrl_right` pasaba la validación pero fallaba al
> parsear, dejando el atajo muerto en silencio. Charly ratificó el cambio. El
> razonamiento sobre AltGr y `shift_right` del comentario sigue vigente.

```rust
    // Una sola tecla, nunca un acorde: en teclado español AltGr envía
    // literalmente Ctrl+Alt. Los MacBook no tienen Ctrl derecho, de ahí el
    // default distinto en macOS; Command derecho existe en todos y suelto no
    // hace nada. `fn` queda descartado en macOS porque el sistema lo reserva
    // para su propio dictado.
    #[cfg(target_os = "macos")]
    let default_formalize_shortcut = "cmd_right";
    #[cfg(not(target_os = "macos"))]
    let default_formalize_shortcut = "ctrl_right";

    bindings.insert(
        "transcribe_and_formalize".to_string(),
        ShortcutBinding {
            id: "transcribe_and_formalize".to_string(),
            name: "Transcribe and Formalize".to_string(),
            description: "Dictates and rewrites it as a ready-to-send email.".to_string(),
            default_binding: default_formalize_shortcut.to_string(),
            current_binding: default_formalize_shortcut.to_string(),
        },
    );
```

**3b.** En `ACTION_MAP` de `actions.rs`, añadir:

```rust
    map.insert(
        "transcribe_and_formalize".to_string(),
        Arc::new(TranscribeAction {
            mode: crate::formalize::PostProcessMode::Formalize,
        }) as Arc<dyn ShortcutAction>,
    );
```

**3c.** `shortcut/handy_keys.rs:437`, ampliar la puerta a los dos ids:

```rust
        // Ambos atajos de post-proceso quedan sin registrar cuando la función
        // está apagada: registrar una tecla que no hace nada es peor que no
        // tenerla.
        if (id == "transcribe_with_post_process" || id == "transcribe_and_formalize")
            && !user_settings.post_process_enabled
        {
            continue;
        }
```

**3d.** `shortcut/mod.rs:397`, el mismo cambio:

```rust
        if (id == "transcribe_with_post_process" || id == "transcribe_and_formalize")
            && !current_settings.post_process_enabled
        {
```

- [ ] **Step 4: Ejecutar los tests y verlos pasar**

```bash
cd src-tauri && cargo test --lib
```

Esperado: **248 passed, 0 failed**.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/settings.rs src-tauri/src/actions.rs src-tauri/src/shortcut/mod.rs src-tauri/src/shortcut/handy_keys.rs
git commit -m "feat: atajo de una tecla para formalizar (ctrl_right / cmd_right)"
```

---

### Task 5: Interfaz y traducciones

**Files:**

- Modify: `src/components/settings/post-processing/PostProcessingSettings.tsx:427-450`
- Create: `src/components/settings/post-processing/FormalizeSettings.tsx`
- Modify: `src/i18n/locales/en/translation.json` y las otras 20 locales
- Test: `bun run check:translations`, `bun run lint`, `bun run build`

**Interfaces:**

- Consumes: `FormalityTreatment` y los tres ajustes vía `src/bindings.ts` (regenerado en la Task 2); el binding `transcribe_and_formalize` de la Task 4.
- Produces: nada que consuman otras tareas.

- [ ] **Step 1: Añadir las claves en inglés**

En `src/i18n/locales/en/translation.json`, dentro de `settings.general.shortcut.bindings`, junto a `transcribe_with_post_process`:

```json
"transcribe_and_formalize": {
  "name": "Transcribe and Formalize",
  "description": "Dictates and rewrites it as a ready-to-send email."
}
```

Y dentro de `settings.postProcessing`, una sección nueva:

```json
"formalize": {
  "title": "Email formalizer",
  "nameLabel": "Your name",
  "nameDescription": "Used to sign formalized emails. Leave empty for no signature.",
  "namePlaceholder": "e.g. Charly",
  "treatmentLabel": "How to address the recipient",
  "treatmentTu": "Informal (tú)",
  "treatmentUsted": "Formal (usted)",
  "treatmentDescription": "In Spanish this changes every verb in the message.",
  "profileLabel": "Profile to run",
  "profileDescription": "Which prompt the formalize shortcut runs. Independent of the profile selected above."
}
```

- [ ] **Step 2: Verificar que faltan en las otras 20 locales**

```bash
bun run check:translations
```

Esperado: **FAIL**, listando `transcribe_and_formalize` y `formalize.*` como ausentes en las 20 locales restantes. Ese es el rojo de esta tarea.

- [ ] **Step 3: Crear el componente**

Crear `src/components/settings/post-processing/FormalizeSettings.tsx`, siguiendo el patrón de los componentes de ajustes existentes (leer `src/components/settings/ClipboardHandling.tsx` como referencia del patrón de select + `useSettings`):

```tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../../hooks/useSettings";

export const FormalizeSettings: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();

  if (!settings) return null;

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">
          {t("settings.postProcessing.formalize.nameLabel")}
        </span>
        <p className="text-xs text-text/60">
          {t("settings.postProcessing.formalize.nameDescription")}
        </p>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-text/20 bg-transparent px-2 py-1"
          value={settings.user_full_name}
          placeholder={t("settings.postProcessing.formalize.namePlaceholder")}
          onChange={(e) => updateSetting("user_full_name", e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">
          {t("settings.postProcessing.formalize.treatmentLabel")}
        </span>
        <p className="text-xs text-text/60">
          {t("settings.postProcessing.formalize.treatmentDescription")}
        </p>
        <select
          className="mt-1 w-full rounded-md border border-text/20 bg-transparent px-2 py-1"
          value={settings.formality_treatment}
          onChange={(e) =>
            updateSetting(
              "formality_treatment",
              e.target.value as "tu" | "usted",
            )
          }
        >
          <option value="tu">
            {t("settings.postProcessing.formalize.treatmentTu")}
          </option>
          <option value="usted">
            {t("settings.postProcessing.formalize.treatmentUsted")}
          </option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">
          {t("settings.postProcessing.formalize.profileLabel")}
        </span>
        <p className="text-xs text-text/60">
          {t("settings.postProcessing.formalize.profileDescription")}
        </p>
        <select
          className="mt-1 w-full rounded-md border border-text/20 bg-transparent px-2 py-1"
          value={settings.formalize_prompt_id ?? ""}
          onChange={(e) => updateSetting("formalize_prompt_id", e.target.value)}
        >
          {settings.post_process_prompts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
```

- [ ] **Step 4: Enchufarlo en la pantalla**

En `PostProcessingSettings.tsx`, dentro del `return` del componente `PostProcessingSettings` (línea ~430), añadir el atajo y la sección después del `SettingsGroup` del hotkey existente:

```tsx
<SettingsGroup title={t("settings.postProcessing.formalize.title")}>
  <ShortcutInput
    shortcutId="transcribe_and_formalize"
    descriptionMode="tooltip"
    grouped={true}
  />
  <FormalizeSettings />
</SettingsGroup>
```

Y el import correspondiente arriba del archivo:

```tsx
import { FormalizeSettings } from "./FormalizeSettings";
```

- [ ] **Step 5: Traducir a las 20 locales restantes**

Replicar las claves de los pasos 1 en cada `src/i18n/locales/<lang>/translation.json`, traduciendo los textos. La descripción del tratamiento menciona el español; en las demás locales debe traducirse como explicación, no omitirse.

- [ ] **Step 6: Verificar en verde**

```bash
bun run check:translations
bun run lint
bun run build
```

Esperado: 21/21 locales, lint limpio, build ✓.

- [ ] **Step 7: Commit**

```bash
git add src/components/settings/post-processing/FormalizeSettings.tsx src/components/settings/post-processing/PostProcessingSettings.tsx src/i18n/locales
git commit -m "feat: ajustes del formalizador en la interfaz y 21 locales"
```

---

### Task 6: Test de comportamiento del perfil contra la API real

**Files:**

- Modify: `src-tauri/src/actions.rs` (módulo `post_process_profile_tests`, donde ya viven los tres perfiles ES)

**Interfaces:**

- Consumes: el perfil `DEFAULT_EMAIL_PROMPT_ID` de la Task 2 y `render_prompt_variables` de la Task 1.
- Produces: nada.

- [ ] **Step 1: Escribir el test que falla**

El módulo ya tiene el arnés: `user_openai_key()` (`actions.rs:943`), `settings_for_profile(profile_id)` (`:972`) y `run_profile(profile_id, transcript) -> Option<String>` (`:988`), que devuelve `None` para **saltarse** el test cuando no hay clave local. Son tests **síncronos** (`#[test]` con `block_on` dentro), no `#[tokio::test]`.

Las variables del formalizador las sustituye `post_process_transcription` por dentro (Task 3, paso 5e) leyéndolas de `settings`, así que basta con un helper que rellene esos campos. Añadir junto a `settings_for_profile`:

```rust
    /// Como `run_profile`, pero rellenando los ajustes del formalizador que
    /// `post_process_transcription` inyecta en `${nombre_usuario}` y
    /// `${tratamiento}`. El saludo no se parametriza: lo calcula la hora real
    /// del sistema, y afirmar sobre una hora concreta haría el test frágil
    /// según cuándo se ejecute.
    fn run_email_profile(
        transcript: &str,
        user_name: &str,
        treatment: FormalityTreatment,
    ) -> Option<String> {
        let mut settings = settings_for_profile(crate::settings::DEFAULT_EMAIL_PROMPT_ID)?;
        settings.user_full_name = user_name.to_string();
        settings.formality_treatment = treatment;

        let output = tauri::async_runtime::block_on(post_process_transcription(
            &settings,
            transcript,
            crate::settings::DEFAULT_EMAIL_PROMPT_ID,
        ));
        Some(output.expect("el perfil de correo debe devolver texto"))
    }
```

Y los dos tests:

```rust
    #[test]
    fn email_profile_greets_the_recipient_and_signs_with_the_configured_name() {
        let Some(out) = run_email_profile(
            "oye dile a maría que el deploy se retrasa hasta el jueves porque el \
             pipeline está fallando",
            "Charly",
            FormalityTreatment::Usted,
        ) else {
            return;
        };

        assert!(out.contains("María"), "no saluda al destinatario: {out}");
        assert!(out.contains("Charly"), "no firma: {out}");
        assert!(out.contains("jueves"), "pierde el contenido: {out}");
        assert!(
            out.contains("deploy") || out.contains("pipeline"),
            "los terminos tecnicos se conservan: {out}"
        );
        // El saludo depende de la hora real; basta con que este alguno.
        assert!(
            out.contains("Buenos días")
                || out.contains("Buenas tardes")
                || out.contains("Buenas noches"),
            "falta el saludo: {out}"
        );
    }

    #[test]
    fn email_profile_omits_the_signature_when_no_name_is_configured() {
        let Some(out) = run_email_profile(
            "confírmale a juan que el commit ya está en main",
            "",
            FormalityTreatment::Tu,
        ) else {
            return;
        };

        assert!(
            !out.trim_end().ends_with(','),
            "con nombre vacio la despedida no puede quedar colgando: {out}"
        );
        assert!(out.contains("Juan") || out.contains("juan"), "got {out}");
    }
```

- [ ] **Step 2: Ejecutar y ver fallar**

```bash
cd src-tauri && cargo test --lib post_process_profile_tests::email_profile
```

Esperado: **error de compilación** por `run_profile_with_vars` inexistente, y después FAIL real hasta que el perfil produzca la forma esperada.

- [ ] **Step 3: Ajustar el prompt hasta verde**

Si el modelo no saluda al destinatario o firma cuando no debe, **el arreglo va en el prompt sembrado de `settings.rs`**, no en el test. El test describe el comportamiento acordado en el spec.

- [ ] **Step 4: Ejecutar y ver pasar**

```bash
cd src-tauri && cargo test --lib post_process_profile_tests::email_profile
```

Esperado: **2 passed**.

> **Estos tests llaman a la API real de OpenAI** y fallan esporádicamente por red o por no determinismo del LLM. Ha pasado varias veces en este repo y siempre pasaron al reintentar. **Reintentar antes de sospechar una regresión.**

- [ ] **Step 5: Suite completa y commit**

```bash
cd src-tauri && cargo test --lib
cargo fmt
git checkout -- src-tauri/src/audio_toolkit/text.rs  # deriva conocida de formato
git add src-tauri/src/actions.rs src-tauri/src/settings.rs
git commit -m "test: comportamiento del perfil de correo contra la API real"
```

---

## Verificación final

Antes de dar la feature por terminada:

```bash
cd src-tauri && cargo test --lib          # 250 passed, 0 failed, 1 ignored
cd src-tauri && cargo clippy              # nada nuevo en los archivos tocados
cd .. && bun test src/                    # 38 passed
bun run check:translations                # 21/21
bun run lint && bun run build             # limpio y ✓
```

Validación en vivo (Charly, con `bun run tauri dev` desde `C:\Handy`):

1. Ajustes → Post-procesamiento: aparecen el atajo nuevo, el nombre, el tratamiento y el perfil.
2. Con el store existente ya migrado, `settings_schema_version` pasa a **7** y el perfil "Correo formal (ES)" aparece en la lista **sin** que cambie el perfil seleccionado del día a día.
3. Dictar con Ctrl derecho _"dile a María que el deploy se retrasa"_ → sale un correo con saludo por la hora, cuerpo, despedida y firma.
4. Dictar con `alt_left` (el atajo normal) sigue dando texto crudo, sin formalizar.
5. Apagar el post-procesado en Ajustes → el atajo de formalizar deja de responder.
