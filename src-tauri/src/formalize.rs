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
