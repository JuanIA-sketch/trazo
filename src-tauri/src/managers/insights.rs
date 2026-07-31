//! Mapa de actividad diaria: un contador por día que se escribe en el momento
//! del dictado.
//!
//! **Por qué no se calcula sobre `transcription_history`:** el historial se poda
//! en cada dictado (`cleanup_old_entries`, 20 entradas por defecto), así que
//! contar a posteriori daría un mapa de dos días. Los contadores se congelan al
//! escribir y sobreviven a la poda.

use anyhow::Result;
use chrono::{Days, Local, NaiveDate};
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use specta::Type;
use std::collections::BTreeMap;

/// Esquema del mapa. Vive aquí (y no inline en la migración) para que los tests
/// corran contra exactamente la tabla que se crea en producción.
pub const CREATE_INSIGHTS_DAILY: &str = "CREATE TABLE IF NOT EXISTS insights_daily (
    day            TEXT PRIMARY KEY,
    dictations     INTEGER NOT NULL DEFAULT 0,
    failed         INTEGER NOT NULL DEFAULT 0,
    words          INTEGER NOT NULL DEFAULT 0,
    words_added    INTEGER NOT NULL DEFAULT 0,
    post_processed INTEGER NOT NULL DEFAULT 0,
    max_words      INTEGER NOT NULL DEFAULT 0,
    profile_hist   TEXT   NOT NULL DEFAULT '{}'
);";

/// Lo que un dictado aporta al día en curso.
#[derive(Clone, Debug, Default, PartialEq)]
pub struct DictationOutcome {
    /// Palabras de `transcription_text`. Cero significa dictado fallido.
    pub words: i64,
    /// Delta (con signo) que introdujo el post-procesado.
    pub words_added: i64,
    pub post_processed: bool,
    /// Id del perfil que corrió de verdad, no la selección global.
    pub prompt_id: Option<String>,
}

/// Una fila del mapa, tal como la consume la interfaz.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize, Type)]
pub struct DailyActivity {
    pub day: String,
    pub dictations: i64,
    pub failed: i64,
    pub words: i64,
    pub words_added: i64,
    pub post_processed: i64,
    pub max_words: i64,
    pub profile_hist: BTreeMap<String, i64>,
}

/// Palabras separadas por espacios en blanco. Es la misma cuenta que ve el
/// usuario cuando mira un dictado.
pub fn count_words(text: &str) -> i64 {
    text.split_whitespace().count() as i64
}

/// El día local, congelado en el momento de escribir.
pub fn today_local() -> String {
    Local::now().format("%Y-%m-%d").to_string()
}

impl DictationOutcome {
    /// Deriva los contadores de los textos que ya maneja el historial.
    pub fn from_texts(
        transcription: &str,
        post_processed_text: Option<&str>,
        prompt_id: Option<String>,
    ) -> Self {
        let words = count_words(transcription);
        Self {
            words,
            words_added: post_processed_text
                .map(|text| count_words(text) - words)
                .unwrap_or(0),
            post_processed: post_processed_text.is_some(),
            prompt_id,
        }
    }
}

/// Suma un dictado al día indicado, creando la fila si no existía.
pub fn record_dictation(conn: &Connection, day: &str, outcome: &DictationOutcome) -> Result<()> {
    // Lectura + escritura del histograma en una transacción: el JSON no se puede
    // incrementar en SQL puro sin depender de la extensión JSON1.
    let tx = conn.unchecked_transaction()?;

    let stored: Option<String> = tx
        .query_row(
            "SELECT profile_hist FROM insights_daily WHERE day = ?1",
            params![day],
            |row| row.get(0),
        )
        .optional()?;

    let mut profile_hist: BTreeMap<String, i64> = match stored.as_deref() {
        Some(json) => serde_json::from_str(json)?,
        None => BTreeMap::new(),
    };
    if let Some(prompt_id) = outcome.prompt_id.as_deref() {
        *profile_hist.entry(prompt_id.to_string()).or_insert(0) += 1;
    }

    // Un dictado sin palabras es un fallo, no un dictado. Contarlo mantendría
    // viva la racha con una celda vacía.
    let succeeded = outcome.words > 0;

    tx.execute(
        "INSERT INTO insights_daily (
            day, dictations, failed, words, words_added, post_processed, max_words, profile_hist
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(day) DO UPDATE SET
            dictations     = dictations + excluded.dictations,
            failed         = failed + excluded.failed,
            words          = words + excluded.words,
            words_added    = words_added + excluded.words_added,
            post_processed = post_processed + excluded.post_processed,
            max_words      = MAX(max_words, excluded.max_words),
            profile_hist   = excluded.profile_hist",
        params![
            day,
            i64::from(succeeded),
            i64::from(!succeeded),
            outcome.words,
            outcome.words_added,
            i64::from(outcome.post_processed),
            outcome.words,
            serde_json::to_string(&profile_hist)?,
        ],
    )?;

    tx.commit()?;
    Ok(())
}

/// Devuelve las filas del rango `[from_day, to_day]`, ambas inclusive, en orden
/// cronológico. Los días sin actividad simplemente no están.
pub fn daily_activity(
    conn: &Connection,
    from_day: &str,
    to_day: &str,
) -> Result<Vec<DailyActivity>> {
    let mut stmt = conn.prepare(
        "SELECT day, dictations, failed, words, words_added, post_processed, max_words, profile_hist
         FROM insights_daily
         WHERE day >= ?1 AND day <= ?2
         ORDER BY day ASC",
    )?;

    let rows = stmt.query_map(params![from_day, to_day], |row| {
        let profile_hist: String = row.get("profile_hist")?;
        Ok(DailyActivity {
            day: row.get("day")?,
            dictations: row.get("dictations")?,
            failed: row.get("failed")?,
            words: row.get("words")?,
            words_added: row.get("words_added")?,
            post_processed: row.get("post_processed")?,
            max_words: row.get("max_words")?,
            profile_hist: serde_json::from_str(&profile_hist).unwrap_or_default(),
        })
    })?;

    Ok(rows.collect::<rusqlite::Result<Vec<_>>>()?)
}

/// Ventana `[desde, hasta]` de `days` días que termina en `today`, inclusive.
pub fn activity_range(today: NaiveDate, days: u32) -> (String, String) {
    let span = u64::from(days.saturating_sub(1));
    let from = today.checked_sub_days(Days::new(span)).unwrap_or(today);
    (format_day(from), format_day(today))
}

fn format_day(date: NaiveDate) -> String {
    date.format("%Y-%m-%d").to_string()
}

/// Días consecutivos con al menos un dictado con texto, contando hacia atrás.
///
/// Un día sin dictar todavía **no** rompe la racha si ese día es hoy: a las 9 de
/// la mañana nadie ha dictado aún y enseñar un cero sería castigar al usuario
/// por madrugar.
pub fn current_streak(rows: &[DailyActivity], today: NaiveDate) -> i64 {
    let active: std::collections::HashSet<&str> = rows
        .iter()
        .filter(|row| row.dictations > 0)
        .map(|row| row.day.as_str())
        .collect();

    let mut cursor = today;
    // Hoy sin dictar aún no rompe la racha; cualquier otro hueco sí.
    if !active.contains(format_day(cursor).as_str()) {
        cursor = match cursor.checked_sub_days(Days::new(1)) {
            Some(yesterday) => yesterday,
            None => return 0,
        };
    }

    let mut streak = 0;
    while active.contains(format_day(cursor).as_str()) {
        streak += 1;
        cursor = match cursor.checked_sub_days(Days::new(1)) {
            Some(previous) => previous,
            None => break,
        };
    }
    streak
}

#[cfg(test)]
mod tests {
    use super::*;

    fn date(text: &str) -> NaiveDate {
        text.parse().expect("parse date")
    }

    fn active_day(day: &str, dictations: i64) -> DailyActivity {
        DailyActivity {
            day: day.to_string(),
            dictations,
            failed: 0,
            words: dictations * 10,
            words_added: 0,
            post_processed: 0,
            max_words: 10,
            profile_hist: BTreeMap::new(),
        }
    }

    #[test]
    fn activity_range_ends_today_and_includes_it() {
        let (from, to) = activity_range(date("2026-07-31"), 7);

        assert_eq!(to, "2026-07-31");
        assert_eq!(from, "2026-07-25");
    }

    #[test]
    fn activity_range_of_one_day_is_today_alone() {
        let (from, to) = activity_range(date("2026-07-31"), 1);

        assert_eq!(from, "2026-07-31");
        assert_eq!(to, "2026-07-31");
    }

    #[test]
    fn the_streak_counts_consecutive_days_back_from_today() {
        let rows = vec![
            active_day("2026-07-29", 2),
            active_day("2026-07-30", 1),
            active_day("2026-07-31", 4),
        ];

        assert_eq!(current_streak(&rows, date("2026-07-31")), 3);
    }

    #[test]
    fn a_gap_breaks_the_streak() {
        let rows = vec![
            active_day("2026-07-27", 5),
            active_day("2026-07-28", 5),
            active_day("2026-07-30", 1),
            active_day("2026-07-31", 4),
        ];

        assert_eq!(current_streak(&rows, date("2026-07-31")), 2);
    }

    #[test]
    fn today_without_dictations_yet_does_not_break_the_streak() {
        let rows = vec![active_day("2026-07-29", 2), active_day("2026-07-30", 1)];

        assert_eq!(current_streak(&rows, date("2026-07-31")), 2);
    }

    /// La regla que motiva separar `dictations` de `failed`: un día de puros
    /// fallos no mantiene la racha viva con una celda vacía.
    #[test]
    fn a_day_of_only_failures_does_not_keep_the_streak_alive() {
        let mut failures_only = active_day("2026-07-30", 0);
        failures_only.failed = 3;
        let rows = vec![active_day("2026-07-29", 2), failures_only];

        assert_eq!(current_streak(&rows, date("2026-07-31")), 0);
    }

    #[test]
    fn an_empty_map_has_no_streak() {
        assert_eq!(current_streak(&[], date("2026-07-31")), 0);
    }

    fn setup() -> Connection {
        let conn = Connection::open_in_memory().expect("open in-memory db");
        conn.execute_batch(CREATE_INSIGHTS_DAILY)
            .expect("create insights_daily");
        conn
    }

    fn day_row(conn: &Connection, day: &str) -> DailyActivity {
        daily_activity(conn, day, day)
            .expect("query daily activity")
            .into_iter()
            .next()
            .unwrap_or_else(|| panic!("no row for {}", day))
    }

    fn spoken(words: i64) -> DictationOutcome {
        DictationOutcome {
            words,
            ..Default::default()
        }
    }

    #[test]
    fn a_dictation_with_words_counts_as_a_dictation() {
        let conn = setup();

        record_dictation(&conn, "2026-07-31", &spoken(5)).expect("record");

        let row = day_row(&conn, "2026-07-31");
        assert_eq!(row.dictations, 1);
        assert_eq!(row.failed, 0);
        assert_eq!(row.words, 5);
    }

    /// La regla que mantiene honesta la racha: una transcripción fallida se
    /// guarda con texto vacío, y si contara como dictado el mapa pintaría un día
    /// activo con una celda sin palabras.
    #[test]
    fn a_dictation_without_words_is_a_failure_not_a_dictation() {
        let conn = setup();

        record_dictation(&conn, "2026-07-31", &spoken(0)).expect("record");

        let row = day_row(&conn, "2026-07-31");
        assert_eq!(row.dictations, 0);
        assert_eq!(row.failed, 1);
        assert_eq!(row.words, 0);
    }

    #[test]
    fn dictations_of_the_same_day_accumulate() {
        let conn = setup();

        record_dictation(&conn, "2026-07-31", &spoken(5)).expect("record");
        record_dictation(&conn, "2026-07-31", &spoken(7)).expect("record");
        record_dictation(&conn, "2026-07-31", &spoken(0)).expect("record");

        let row = day_row(&conn, "2026-07-31");
        assert_eq!(row.dictations, 2);
        assert_eq!(row.failed, 1);
        assert_eq!(row.words, 12);
    }

    #[test]
    fn each_day_keeps_its_own_row() {
        let conn = setup();

        record_dictation(&conn, "2026-07-30", &spoken(3)).expect("record");
        record_dictation(&conn, "2026-07-31", &spoken(9)).expect("record");

        assert_eq!(day_row(&conn, "2026-07-30").words, 3);
        assert_eq!(day_row(&conn, "2026-07-31").words, 9);
    }

    #[test]
    fn max_words_keeps_the_longest_dictation_of_the_day() {
        let conn = setup();

        record_dictation(&conn, "2026-07-31", &spoken(40)).expect("record");
        record_dictation(&conn, "2026-07-31", &spoken(12)).expect("record");

        assert_eq!(day_row(&conn, "2026-07-31").max_words, 40);
    }

    #[test]
    fn post_processing_counts_dictations_and_the_words_it_added() {
        let conn = setup();

        record_dictation(
            &conn,
            "2026-07-31",
            &DictationOutcome {
                words: 10,
                words_added: 4,
                post_processed: true,
                prompt_id: Some("default_es_casual".to_string()),
            },
        )
        .expect("record");
        record_dictation(&conn, "2026-07-31", &spoken(6)).expect("record");

        let row = day_row(&conn, "2026-07-31");
        assert_eq!(row.post_processed, 1);
        assert_eq!(row.words_added, 4);
    }

    #[test]
    fn profile_hist_counts_each_profile_that_ran() {
        let conn = setup();

        let with_profile = |id: &str| DictationOutcome {
            words: 10,
            words_added: 0,
            post_processed: true,
            prompt_id: Some(id.to_string()),
        };

        record_dictation(&conn, "2026-07-31", &with_profile("default_es_casual")).expect("record");
        record_dictation(&conn, "2026-07-31", &with_profile("default_es_email")).expect("record");
        record_dictation(&conn, "2026-07-31", &with_profile("default_es_casual")).expect("record");
        record_dictation(&conn, "2026-07-31", &spoken(4)).expect("record");

        let row = day_row(&conn, "2026-07-31");
        assert_eq!(row.profile_hist.get("default_es_casual"), Some(&2));
        assert_eq!(row.profile_hist.get("default_es_email"), Some(&1));
        assert_eq!(row.profile_hist.len(), 2);
    }

    #[test]
    fn daily_activity_returns_only_the_requested_range_in_order() {
        let conn = setup();

        for day in ["2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31"] {
            record_dictation(&conn, day, &spoken(1)).expect("record");
        }

        let rows = daily_activity(&conn, "2026-07-29", "2026-07-30").expect("query");

        let days: Vec<&str> = rows.iter().map(|row| row.day.as_str()).collect();
        assert_eq!(days, vec!["2026-07-29", "2026-07-30"]);
    }

    #[test]
    fn daily_activity_is_empty_when_nothing_was_dictated() {
        let conn = setup();

        let rows = daily_activity(&conn, "2026-07-01", "2026-07-31").expect("query");

        assert!(rows.is_empty());
    }

    #[test]
    fn count_words_splits_on_whitespace_and_ignores_padding() {
        assert_eq!(count_words("hola mundo"), 2);
        assert_eq!(count_words("  hola   mundo \n otra "), 3);
        assert_eq!(count_words(""), 0);
        assert_eq!(count_words("   "), 0);
    }

    #[test]
    fn from_texts_measures_the_delta_the_post_processing_introduced() {
        let outcome = DictationOutcome::from_texts(
            "uno dos tres",
            Some("uno dos tres cuatro cinco"),
            Some("default_es_casual".to_string()),
        );

        assert_eq!(outcome.words, 3);
        assert_eq!(outcome.words_added, 2);
        assert!(outcome.post_processed);
        assert_eq!(outcome.prompt_id.as_deref(), Some("default_es_casual"));
    }

    /// El post-procesado también recorta (muletillas). Guardar el delta con
    /// signo es lo honesto: un cero significaría "no cambió nada".
    #[test]
    fn from_texts_keeps_a_negative_delta_when_the_llm_trims() {
        let outcome = DictationOutcome::from_texts("uno dos tres cuatro", Some("uno dos"), None);

        assert_eq!(outcome.words_added, -2);
    }

    #[test]
    fn from_texts_without_post_processing_reports_no_delta() {
        let outcome = DictationOutcome::from_texts("uno dos tres", None, None);

        assert_eq!(outcome.words, 3);
        assert_eq!(outcome.words_added, 0);
        assert!(!outcome.post_processed);
    }
}
