use crate::actions::process_transcription_output;
use crate::managers::{
    history::{HistoryManager, PaginatedHistory},
    insights::{self, DailyActivity},
    transcription::TranscriptionManager,
};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::Arc;
use tauri::{AppHandle, State};

/// El mapa de actividad tal como lo pinta la interfaz: la ventana pedida, las
/// filas con actividad dentro de ella, y la racha en curso.
#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub struct ActivityMap {
    pub from_day: String,
    pub to_day: String,
    pub days: Vec<DailyActivity>,
    pub streak: i64,
}

/// Ventana máxima que se puede pedir de una vez. Un año de celdas ya no cabe en
/// pantalla; pedir más solo sirve para cargar la base de datos sin motivo.
const MAX_ACTIVITY_DAYS: u32 = 366;

#[tauri::command]
#[specta::specta]
pub async fn get_activity_map(
    _app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    days: u32,
) -> Result<ActivityMap, String> {
    // El día local lo decide el backend, igual que al escribir: si lo calculara
    // la interfaz, un cambio de zona horaria movería las celdas ya escritas.
    let today = chrono::Local::now().date_naive();
    let (from_day, to_day) = insights::activity_range(today, days.clamp(1, MAX_ACTIVITY_DAYS));

    let days = history_manager
        .daily_activity(&from_day, &to_day)
        .map_err(|e| e.to_string())?;
    let streak = insights::current_streak(&days, today);

    Ok(ActivityMap {
        from_day,
        to_day,
        days,
        streak,
    })
}

#[tauri::command]
#[specta::specta]
pub async fn get_history_entries(
    _app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    cursor: Option<i64>,
    limit: Option<usize>,
) -> Result<PaginatedHistory, String> {
    history_manager
        .get_history_entries(cursor, limit)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn toggle_history_entry_saved(
    _app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    id: i64,
) -> Result<(), String> {
    history_manager
        .toggle_saved_status(id)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn get_audio_file_path(
    _app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    file_name: String,
) -> Result<String, String> {
    let path = history_manager.get_audio_file_path(&file_name);
    path.to_str()
        .ok_or_else(|| "Invalid file path".to_string())
        .map(|s| s.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn delete_history_entry(
    _app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    id: i64,
) -> Result<(), String> {
    history_manager
        .delete_entry(id)
        .await
        .map_err(|e| e.to_string())
}

/// Traduce el bool persistido en el historial (`post_process_requested`) al
/// modo de post-procesado que debe re-ejecutar un reintento.
///
/// Un reintento nunca puede formalizar: no hay perfil concreto guardado por
/// entrada, solo el hecho de si hubo post-procesado. La única alternativa a
/// `Off` es entonces `Selected` — repetir con el perfil global actual, igual
/// que hacía el bool antes de esta tarea.
fn retry_mode_for_history_entry(post_process_requested: bool) -> crate::formalize::PostProcessMode {
    if post_process_requested {
        crate::formalize::PostProcessMode::Selected
    } else {
        crate::formalize::PostProcessMode::Off
    }
}

#[tauri::command]
#[specta::specta]
pub async fn retry_history_entry_transcription(
    app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    transcription_manager: State<'_, Arc<TranscriptionManager>>,
    id: i64,
) -> Result<(), String> {
    let entry = history_manager
        .get_entry_by_id(id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("History entry {} not found", id))?;

    let audio_path = history_manager.get_audio_file_path(&entry.file_name);
    let samples = crate::audio_toolkit::read_wav_samples(&audio_path)
        .map_err(|e| format!("Failed to load audio: {}", e))?;

    if samples.is_empty() {
        return Err("Recording has no audio samples".to_string());
    }

    transcription_manager.initiate_model_load();

    let tm = Arc::clone(&transcription_manager);
    let transcription =
        tauri::async_runtime::spawn_blocking(move || tm.transcribe_recording(samples, None))
            .await
            .map_err(|e| format!("Transcription task panicked: {}", e))?
            .map_err(|e| e.to_string())?;

    if transcription.is_empty() {
        return Err("Recording contains no speech".to_string());
    }

    let mode = retry_mode_for_history_entry(entry.post_process_requested);
    let processed = process_transcription_output(&app, &transcription, mode).await;
    history_manager
        .update_transcription(
            id,
            transcription,
            processed.post_processed_text,
            processed.post_process_prompt,
        )
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
#[specta::specta]
pub async fn update_history_limit(
    app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    limit: usize,
) -> Result<(), String> {
    let mut settings = crate::settings::get_settings(&app);
    settings.history_limit = limit;
    crate::settings::write_settings(&app, settings);

    history_manager
        .cleanup_old_entries()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
#[specta::specta]
pub async fn update_recording_retention_period(
    app: AppHandle,
    history_manager: State<'_, Arc<HistoryManager>>,
    period: String,
) -> Result<(), String> {
    use crate::settings::RecordingRetentionPeriod;

    let retention_period = match period.as_str() {
        "never" => RecordingRetentionPeriod::Never,
        "preserve_limit" => RecordingRetentionPeriod::PreserveLimit,
        "days3" => RecordingRetentionPeriod::Days3,
        "weeks2" => RecordingRetentionPeriod::Weeks2,
        "months3" => RecordingRetentionPeriod::Months3,
        _ => return Err(format!("Invalid retention period: {}", period)),
    };

    let mut settings = crate::settings::get_settings(&app);
    settings.recording_retention_period = retention_period;
    crate::settings::write_settings(&app, settings);

    history_manager
        .cleanup_old_entries()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::retry_mode_for_history_entry;
    use crate::formalize::PostProcessMode;

    #[test]
    fn a_requested_entry_retries_with_the_global_selection() {
        assert_eq!(
            retry_mode_for_history_entry(true),
            PostProcessMode::Selected
        );
    }

    #[test]
    fn a_non_requested_entry_retries_without_post_processing() {
        assert_eq!(retry_mode_for_history_entry(false), PostProcessMode::Off);
    }
}
