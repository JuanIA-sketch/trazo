use crate::dictionary::{build_impact_report, ImpactReport};
use crate::managers::history::HistoryManager;
use std::sync::Arc;
use tauri::State;

/// Cuántos ejemplos se devuelven al diálogo. El resto se resume en el total:
/// con más, el diálogo deja de leerse de un vistazo.
const MAX_EXCERPTS: usize = 5;

/// Techo de dictados a revisar. `get_history_entries` ya topa en 100 por dentro,
/// y el `history_limit` por defecto es 20, así que en la práctica se revisa el
/// historial entero.
const MAX_TRANSCRIPTS: usize = 100;

/// Qué cambiaría esta regla en los dictados que ya existen.
///
/// Se mide contra `transcription_text` y **no** contra `post_processed_text` a
/// propósito: los reemplazos se aplican a la transcripción
/// (`post_process_transcription_text`), no a la salida del LLM. Medir sobre el
/// texto post-procesado enseñaría un impacto que la regla nunca va a tener.
#[tauri::command]
#[specta::specta]
pub async fn preview_replacement_impact(
    history_manager: State<'_, Arc<HistoryManager>>,
    from: String,
    to: String,
) -> Result<ImpactReport, String> {
    let page = history_manager
        .get_history_entries(None, Some(MAX_TRANSCRIPTS))
        .await
        .map_err(|e| e.to_string())?;

    let transcripts: Vec<String> = page
        .entries
        .into_iter()
        .map(|e| e.transcription_text)
        .collect();

    Ok(build_impact_report(&(from, to), &transcripts, MAX_EXCERPTS))
}
