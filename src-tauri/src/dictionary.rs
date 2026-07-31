//! Piezas puras del diccionario de reemplazos.
//!
//! Viven aparte de la interfaz y de los comandos a propósito: son las
//! decisiones que deben ser deterministas y testeables sin app, sin base de
//! datos y sin `AppSettings`.

use crate::audio_toolkit::apply_custom_replacements;
use serde::{Deserialize, Serialize};
use specta::Type;

/// Un dictado que la regla cambiaría, con el antes y el después.
#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct ImpactExcerpt {
    pub before: String,
    pub after: String,
}

/// Cuántos dictados del historial cambiaría una regla, con algunos ejemplos.
///
/// `total` cuenta **dictados afectados**, no apariciones: un dictado que
/// contiene la palabra tres veces sigue siendo uno. Es la cifra con la que el
/// usuario decide si guardar la regla, y contar apariciones la inflaría.
#[derive(Serialize, Deserialize, Debug, Clone, Type)]
pub struct ImpactReport {
    pub total: usize,
    pub excerpts: Vec<ImpactExcerpt>,
}

/// Qué pasaría si se guardara esta regla, mirando los dictados que ya existen.
///
/// `max_excerpts` acota lo que se muestra, no lo que se cuenta: `total` incluye
/// todos los afectados aunque solo se devuelvan unos pocos ejemplos.
pub fn build_impact_report(
    rule: &(String, String),
    transcripts: &[String],
    max_excerpts: usize,
) -> ImpactReport {
    let afectados = rule_impact(rule, transcripts);
    let rules = std::slice::from_ref(rule);
    let excerpts = afectados
        .iter()
        .take(max_excerpts)
        .map(|&i| ImpactExcerpt {
            before: transcripts[i].clone(),
            after: apply_custom_replacements(&transcripts[i], rules),
        })
        .collect();
    ImpactReport {
        total: afectados.len(),
        excerpts,
    }
}

/// Índices de los dictados que una regla cambiaría.
///
/// **Delega en [`apply_custom_replacements`] en vez de reimplementar el
/// emparejado**, y esa es la decisión importante de este módulo: lo que se le
/// enseña al usuario antes de guardar tiene que ser exactamente lo que la regla
/// hará después. Una segunda implementación "equivalente" podría divergir en
/// los bordes (límites de palabra, mayúsculas, reglas que se solapan) y
/// entonces la previsualización mentiría justo en los casos difíciles, que son
/// los únicos en los que el usuario la necesita.
///
/// Compara entrada contra salida, así que una regla que reescribe una palabra a
/// sí misma no cuenta como impacto: el usuario no vería ninguna diferencia.
pub fn rule_impact(rule: &(String, String), transcripts: &[String]) -> Vec<usize> {
    let rules = std::slice::from_ref(rule);
    transcripts
        .iter()
        .enumerate()
        .filter(|(_, t)| apply_custom_replacements(t, rules) != **t)
        .map(|(i, _)| i)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    /// El caso real que motivó la feature: en los 20 dictados de Charly la
    /// palabra "cloud" aparece dos veces y en ambas quiso decir Claude.
    #[test]
    fn rule_impact_finds_the_real_occurrence() {
        let transcripts = vec![
            "él también tiene cloud y puede ir a leerlo con cloud".to_string(),
            "no tiene nada que ver".to_string(),
        ];
        let hits = rule_impact(&("cloud".into(), "Claude".into()), &transcripts);
        assert_eq!(hits, vec![0]);
    }

    /// El motor empareja palabra COMPLETA. La previsualización tiene que contar
    /// igual que él o mentiría sobre el impacto, que es justo lo que la hace
    /// útil.
    #[test]
    fn rule_impact_matches_whole_words_only() {
        let transcripts = vec!["la cloudflare no cuenta".to_string()];
        assert!(rule_impact(&("cloud".into(), "Claude".into()), &transcripts).is_empty());
    }

    #[test]
    fn rule_impact_is_case_insensitive_like_the_engine() {
        let transcripts = vec!["subilo a CLOUD".to_string()];
        assert_eq!(
            rule_impact(&("cloud".into(), "Claude".into()), &transcripts),
            vec![0]
        );
    }

    /// Una regla vacía emparejaría en todas partes; el motor ya las descarta y
    /// la previsualización no puede prometer algo distinto.
    #[test]
    fn an_empty_rule_impacts_nothing() {
        let transcripts = vec!["cualquier cosa".to_string()];
        assert!(rule_impact(&("".into(), "X".into()), &transcripts).is_empty());
        assert!(rule_impact(&("   ".into(), "X".into()), &transcripts).is_empty());
    }

    /// Contrapeso: una regla que no aparece no puede inventarse impacto.
    #[test]
    fn a_rule_that_matches_nothing_reports_nothing() {
        let transcripts = vec!["texto sin el término".to_string()];
        assert!(rule_impact(&("midjourney".into(), "Midjourney".into()), &transcripts).is_empty());
    }

    /// Varios dictados afectados devuelven varios índices, en orden.
    #[test]
    fn rule_impact_reports_every_affected_transcript_in_order() {
        let transcripts = vec![
            "abrí cloud ayer".to_string(),
            "nada que ver".to_string(),
            "cloud otra vez".to_string(),
        ];
        assert_eq!(
            rule_impact(&("cloud".into(), "Claude".into()), &transcripts),
            vec![0, 2]
        );
    }

    /// Una regla que no cambia nada (mismo texto de entrada y salida) no debe
    /// contarse como impacto: el usuario no vería diferencia alguna.
    #[test]
    fn a_rule_that_rewrites_a_word_to_itself_has_no_impact() {
        let transcripts = vec!["esto usa cloud".to_string()];
        assert!(rule_impact(&("cloud".into(), "cloud".into()), &transcripts).is_empty());
    }

    #[test]
    fn impact_report_counts_affected_transcripts_not_occurrences() {
        // El primero contiene "cloud" dos veces, pero es UN dictado afectado.
        // Contar apariciones inflaría la cifra que el usuario usa para decidir.
        let transcripts = vec![
            "tiene cloud y usa cloud".to_string(),
            "nada".to_string(),
            "abrí cloud ayer".to_string(),
        ];
        let r = build_impact_report(&("cloud".into(), "Claude".into()), &transcripts, 5);
        assert_eq!(r.total, 2);
        assert_eq!(r.excerpts.len(), 2);
    }

    /// Sin tope, un historial largo llenaría el diálogo. El total sigue
    /// contando todos: el usuario decide con la cifra completa aunque solo vea
    /// unos pocos ejemplos.
    #[test]
    fn impact_report_caps_the_excerpts_but_not_the_total() {
        let transcripts: Vec<String> = (0..10).map(|_| "usa cloud".to_string()).collect();
        let r = build_impact_report(&("cloud".into(), "Claude".into()), &transcripts, 3);
        assert_eq!(r.total, 10, "el total cuenta todos los afectados");
        assert_eq!(r.excerpts.len(), 3, "pero solo se muestran los primeros");
    }

    /// Cada ejemplo lleva el antes y el después, que es lo que permite juzgar
    /// si la regla hace lo que uno cree.
    #[test]
    fn impact_report_excerpts_show_before_and_after() {
        let transcripts = vec!["abrí cloud ayer".to_string()];
        let r = build_impact_report(&("cloud".into(), "Claude".into()), &transcripts, 5);
        assert_eq!(r.excerpts[0].before, "abrí cloud ayer");
        assert_eq!(r.excerpts[0].after, "abrí Claude ayer");
    }

    #[test]
    fn impact_report_of_a_rule_that_changes_nothing_is_empty() {
        let transcripts = vec!["texto cualquiera".to_string()];
        let r = build_impact_report(&("cloud".into(), "Claude".into()), &transcripts, 5);
        assert_eq!(r.total, 0);
        assert!(r.excerpts.is_empty());
    }
}
