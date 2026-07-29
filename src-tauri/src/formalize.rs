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
            assert!(
                !greeting_for_hour(hour).is_empty(),
                "hora {hour} sin saludo"
            );
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
            prompt_id_for_mode(
                PostProcessMode::Selected,
                Some("default_es_casual"),
                Some("default_es_email")
            ),
            Some("default_es_casual".to_string())
        );
    }

    #[test]
    fn formalize_mode_ignores_the_global_selection() {
        // El punto entero de la feature: formalizar no depende de que el
        // usuario haya cambiado su perfil del dia a dia en Ajustes.
        assert_eq!(
            prompt_id_for_mode(
                PostProcessMode::Formalize,
                Some("default_es_casual"),
                Some("default_es_email")
            ),
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
}
