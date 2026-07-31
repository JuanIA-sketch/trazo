# Diccionario de reemplazos — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que corregir una palabra mal transcrita sea un gesto de dos clics desde el Historial, con el radio de impacto a la vista antes de guardar, y que arranque con una siembra mínima de reglas inequívocas.

**Architecture:** No hay motor nuevo. `apply_custom_replacements` ya existe y ya corre en el pipeline (`transcription.rs:1849`). Se añade un módulo de funciones puras (`dictionary.rs`), dos comandos que leen el historial que ya está en SQLite, una migración de esquema v8→v9 que siembra reglas, y UI en el Historial. Todo lo demás ya está construido.

**Tech Stack:** Rust (Tauri 2.x, serde, rusqlite), React + TypeScript, i18next, tauri-specta para los bindings.

**Spec:** `docs/superpowers/specs/2026-07-30-diccionario-reemplazos-design.md` (aprobado 2026-07-30).

## Global Constraints

- **TDD obligatorio.** Test en rojo primero, visto fallar **por la razón correcta**, luego la implementación mínima. Convención del repo (`CLAUDE.md`).
- **Cerrar Trazo antes de cualquier `cargo build`/`check`/`test`** que re-enlace. Comprobar con `Get-Process handy`. Cerrarla con `Stop-Process -Id <pid> -Force` — `taskkill` desde bash **no la mata** (§9.2).
- **No exportar `CARGO_TARGET_DIR`**: ya lo fija `.cargo/config.toml`. Escribirlo mal (`C:h`) crea artefactos en `src-tauri/h` sin avisar (§9.2).
- **Nunca editar fuentes con `Get-Content`/`Set-Content` de PowerShell 5.1**: corrompe el UTF-8. Usar la herramienta Edit.
- **Nunca `git add -A`**: `git status` marca fantasmas de CRLF (`Cargo.toml`, `bindings.ts`). Rutas explícitas siempre.
- **Nunca commitear ni pushear sin confirmación explícita de Charly.**
- Comandos de cargo desde `src-tauri/`.
- **Línea base antes de empezar: `cargo test --lib` → 281 passed, 0 failed, 1 ignored.** Frontend: `bun test src/` → 48 passed.
- Todo texto de interfaz pasa por i18next, **21 locales** (`bun run check:translations` en verde).
- `src/bindings.ts` es **generado**: no editarlo a mano, se regenera al arrancar la app en debug.

## Orden y línea de corte

Las tareas están ordenadas por valor entregado, no por comodidad. **Si hay que
parar, las Tareas 1-3 ya son una feature completa y útil** (corregir desde el
Historial con impacto a la vista). Las Tareas 4-5 son la siembra y las
propuestas automáticas, que aportan menos y pueden esperar.

> ⚠️ **La entrega del hackathon es el 31 de julio.** Este plan no cabe entero en
> un día junto con lo demás. Decidir con Charly hasta dónde llegar **antes** de
> empezar, no a mitad.

---

### Task 1: Funciones puras del diccionario

**Files:**

- `src-tauri/src/dictionary.rs` (nuevo)
- `src-tauri/src/lib.rs` (declarar `mod dictionary;`)

**Step 1: Escribir los tests en rojo**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    // El caso real que motivó la feature: en los 20 dictados de Charly "cloud"
    // aparece 2 veces y en ambas quiso decir Claude.
    #[test]
    fn rule_impact_finds_the_two_real_occurrences() {
        let transcripts = vec![
            "él también tiene cloud y puede ir a leerlo con cloud".to_string(),
            "no tiene nada que ver".to_string(),
        ];
        let hits = rule_impact(&("cloud".into(), "Claude".into()), &transcripts);
        assert_eq!(hits, vec![0]);
    }

    // El motor existente empareja palabra COMPLETA. La previsualización tiene
    // que contar igual que él, o mentiría sobre el impacto.
    #[test]
    fn rule_impact_matches_whole_words_only() {
        let transcripts = vec!["la cloudflare no cuenta".to_string()];
        assert!(rule_impact(&("cloud".into(), "Claude".into()), &transcripts).is_empty());
    }

    #[test]
    fn rule_impact_is_case_insensitive_like_the_engine() {
        let transcripts = vec!["subilo a CLOUD".to_string()];
        assert_eq!(rule_impact(&("cloud".into(), "Claude".into()), &transcripts), vec![0]);
    }

    // Una regla vacía emparejaría en todas partes; el motor ya las filtra y la
    // previsualización no puede prometer algo distinto.
    #[test]
    fn an_empty_rule_impacts_nothing() {
        let transcripts = vec!["cualquier cosa".to_string()];
        assert!(rule_impact(&("".into(), "X".into()), &transcripts).is_empty());
        assert!(rule_impact(&("   ".into(), "X".into()), &transcripts).is_empty());
    }

    // Contrapeso: una regla que no aparece no debe inventar impacto.
    #[test]
    fn a_rule_that_matches_nothing_reports_nothing() {
        let transcripts = vec!["texto sin el término".to_string()];
        assert!(rule_impact(&("midjourney".into(), "Midjourney".into()), &transcripts).is_empty());
    }
}
```

- [ ] Escribir los tests
- [ ] Ejecutar `cargo test --lib dictionary` y **ver el rojo por la razón correcta** (función inexistente, `E0425`)

**Step 2: Implementar**

`rule_impact(rule, transcripts) -> Vec<usize>`: índices de los dictados que la
regla cambiaría. **Debe delegar en `apply_custom_replacements`** y comparar
entrada contra salida, no reimplementar el emparejado — si divergen, la
previsualización mentiría sobre lo que va a pasar de verdad.

```rust
pub fn rule_impact(rule: &(String, String), transcripts: &[String]) -> Vec<usize> {
    let rules = std::slice::from_ref(rule);
    transcripts
        .iter()
        .enumerate()
        .filter(|(_, t)| crate::audio_toolkit::apply_custom_replacements(t, rules) != **t)
        .map(|(i, _)| i)
        .collect()
}
```

- [ ] Implementar
- [ ] `cargo test --lib dictionary` en verde
- [ ] `cargo test --lib` completo: **285 passed** (281 + 4… ajustar al número real)

---

### Task 2: Comando de previsualización de impacto

**Files:**

- `src-tauri/src/commands/dictionary.rs` (nuevo)
- `src-tauri/src/commands/mod.rs` (registrar)
- `src-tauri/src/lib.rs` (añadir al `invoke_handler` y al builder de specta)

**Step 1: Test en rojo**

El comando toca `AppHandle`, así que **la lógica testeable va en una función
pura aparte** y el comando solo la cablea:

```rust
#[test]
fn impact_report_carries_the_matching_excerpts() {
    let transcripts = vec![
        "tiene cloud y usa cloud".to_string(),
        "nada".to_string(),
        "abrí cloud ayer".to_string(),
    ];
    let r = build_impact_report(&("cloud".into(), "Claude".into()), &transcripts, 5);
    assert_eq!(r.total, 2, "dos dictados afectados, no tres");
    assert_eq!(r.excerpts.len(), 2);
}

// Sin este tope, un historial de 20 dictados largos llenaría el diálogo.
#[test]
fn impact_report_caps_the_excerpts_it_returns() {
    let transcripts: Vec<String> = (0..10).map(|_| "usa cloud".to_string()).collect();
    let r = build_impact_report(&("cloud".into(), "Claude".into()), &transcripts, 3);
    assert_eq!(r.total, 10, "el total cuenta todos");
    assert_eq!(r.excerpts.len(), 3, "pero solo se muestran los primeros");
}
```

- [ ] Escribir los tests y verlos fallar
- [ ] Implementar `build_impact_report` + el struct `ImpactReport` (con `Type` de specta)
- [ ] Cablear el comando `preview_replacement_impact(from, to)` leyendo el historial vía `HistoryManager`
- [ ] Registrar en `lib.rs` (invoke_handler **y** specta) y arrancar la app en debug para regenerar `src/bindings.ts`

---

### Task 3: UI de corrección desde el Historial

**Files:**

- `src/components/settings/history/CorrectWordDialog.tsx` (nuevo)
- `src/components/settings/history/HistorySettings.tsx` (botón por fila)
- `src/i18n/locales/en/translation.json` + **las otras 20 locales**

**Comportamiento:**

1. Botón "Corregir palabra" por fila.
2. Diálogo: campo `de` (prerrellenado si hay selección) y campo `a`.
3. Al escribir, llamar a `preview_replacement_impact` (con debounce) y mostrar
   **"afectaría a N dictados"** con los extractos.
4. Guardar añade la regla a `custom_replacements` con el comando ya existente.

**Reglas que NO se pueden romper:**

- **No reescribir el dictado guardado.** El Historial es el registro de lo que
  pasó; reescribirlo destruiría la evidencia que hoy permite diagnosticar
  truncados (§9.8 se investigó con esos datos).
- Si la regla ya existe, avisar en vez de duplicarla.

- [ ] Test en rojo de la lógica pura que salga del componente (p. ej. `canSaveRule(from, to, existing)`) en `src/components/settings/history/correctWord.test.ts`
- [ ] Implementar el diálogo
- [ ] Claves de i18n en las 21 locales
- [ ] `bun run check:translations` en verde
- [ ] `bun test src/` y `bunx tsc --noEmit` en verde

---

### Task 4: Siembra de reglas inequívocas (migración v9)

**Files:**

- `src-tauri/src/dictionary.rs` (`seed_rules`)
- `src-tauri/src/settings.rs` (migración, `CURRENT_SETTINGS_SCHEMA_VERSION` 8→9)

**Contenido de la siembra.** Solo lo que **no puede colisionar** con español:
multi-palabra o cadenas que no son palabras.

| from            | to             |
| --------------- | -------------- |
| `chat gpt`      | `ChatGPT`      |
| `mid journey`   | `Midjourney`   |
| `ene ocho ene`  | `n8n`          |
| `pul reques`    | `pull request` |

**Prohibido sembrar** términos de una sola palabra que existan en español o sean
nombres de persona. La medición del spec (§3) mostró que `veo`, `flujo`, `sara`
y `claudia` se destrozan. `cloud → Claude` **no va en la siembra genérica**: solo
entra si los datos del propio usuario lo respaldan (Task 5).

**Step 1: Tests en rojo**

```rust
#[test]
fn seeding_is_idempotent() { /* segunda pasada no añade nada */ }

#[test]
fn seeding_does_not_touch_a_rule_the_user_edited() { /* respeta `to` distinto */ }

#[test]
fn migration_v9_does_not_resurrect_a_deleted_rule() {
    // Mismo criterio que la v7 con el perfil de correo: corre una sola vez.
}

#[test]
fn no_seeded_rule_collides_with_common_spanish() {
    // Guardarraíl permanente: ninguna regla sembrada puede emparejar contra un
    // corpus de palabras y nombres frecuentes. Es el test que impide repetir
    // el error medido en el spec.
    for (from, _) in seed_rules(&[]) {
        for palabra in ["veo", "flujo", "sara", "claudia", "nube", "hago"] {
            assert_ne!(from.to_lowercase(), palabra);
        }
    }
}
```

- [ ] Tests en rojo
- [ ] Implementar `seed_rules` y la migración v9
- [ ] `cargo test --lib` completo en verde

---

### Task 5: Propuestas desde el historial (opcional)

**Solo si hay tiempo.** Aporta menos que las tareas anteriores y es la parte con
más incertidumbre de diseño.

`propose_rules(transcripts, known_terms) -> Vec<Proposal>`: busca en el historial
formas que se parezcan a un término canónico conocido y propone la regla, con
frecuencia y ejemplos. Nunca propone algo que el usuario ya tenga **ni algo que
haya rechazado** (hace falta persistir los rechazos).

- [ ] Decidir con Charly si entra antes de empezarla
- [ ] Tests en rojo, implementación, UI de propuestas descartables

---

## Verificación final

- [ ] `cargo test --lib` — sin fallos, número ≥ 281 + los nuevos
- [ ] `bun test src/` — sin fallos, ≥ 48
- [ ] `bunx tsc --noEmit` limpio
- [ ] `bun run lint` limpio
- [ ] `cargo fmt --check` y `cargo clippy` limpios
- [ ] `bun run check:translations` — 21 locales completas
- [ ] **Validación en vivo (Charly):** corregir una palabra desde el Historial,
      ver el impacto antes de guardar, y comprobar que **el siguiente dictado**
      sale con la corrección aplicada.
- [ ] **Comprobar que el dictado guardado NO cambió** tras crear la regla.
