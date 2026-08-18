//! Diagnostic: how much of a recording survives the live-capture VAD chain, and
//! how that depends on signal level.
//!
//! Reproduces the exact chain `run_consumer` applies while recording — the same
//! `SmoothedVad` wrapping the same `SileroVad`, fed 30 ms frames — and reports
//! the fraction of audio that would reach the model.
//!
//! Motivation (2026-07-28): on a multi-channel Realtek capture device a 13 s
//! dictation reached disk as 1.05-2.16 s with `vad_enabled = true`. Averaging
//! two microphones that pick up the same voice at slightly different distances
//! attenuates it (comb filtering), and the question this answers is: how much
//! attenuation does it take before Silero stops firing at all?
//!
//! Y, desde el 2026-08-18, la pregunta que de verdad decide dónde va el
//! arreglo: cuando una grabación sobrevive mal, ¿es que Silero dice "no voz"
//! casi siempre, o es que titubea y `SmoothedVad` nunca junta los
//! `VAD_ONSET_FRAMES` consecutivos que necesita para abrir? Medir solo cuánto
//! audio sale no distingue los dos casos, y llevan a arreglos opuestos: el
//! primero está en la captura, el segundo en el suavizador. Por eso se imprime
//! también el veredicto CRUDO de Silero, antes del suavizado.
//!
//! Usage:
//!   cargo run --example vad_survival -- <silero_vad_v4.onnx> <wav> [<wav>...]

use handy_app_lib::audio_toolkit::vad::{
    SileroVad, SmoothedVad, VoiceActivityDetector, VoicingStats, VAD_OFFLINE_HANGOVER_FRAMES,
    VAD_ONSET_FRAMES, VAD_PREFILL_FRAMES,
};

const SAMPLE_RATE: u32 = 16_000;
const FRAME: usize = (SAMPLE_RATE as usize * 30) / 1000; // 480, what Silero demands
const THRESHOLD: f32 = 0.3; // VAD_THRESHOLD in managers/audio.rs

fn read_wav(path: &str) -> Vec<f32> {
    let reader = hound::WavReader::open(path).unwrap_or_else(|e| panic!("open {path}: {e}"));
    let spec = reader.spec();
    assert_eq!(spec.sample_rate, SAMPLE_RATE, "{path}: expected 16 kHz");
    match spec.sample_format {
        hound::SampleFormat::Int => reader
            .into_samples::<i16>()
            .map(|s| s.expect("sample") as f32 / 32768.0)
            .collect(),
        hound::SampleFormat::Float => reader
            .into_samples::<f32>()
            .map(|s| s.expect("sample"))
            .collect(),
    }
}

fn rms_dbfs(samples: &[f32]) -> f32 {
    if samples.is_empty() {
        return f32::NEG_INFINITY;
    }
    let sum: f32 = samples.iter().map(|s| s * s).sum();
    let rms = (sum / samples.len() as f32).sqrt();
    if rms <= 0.0 {
        return f32::NEG_INFINITY;
    }
    20.0 * rms.log10()
}

/// Seconds of audio the VAD would let through, running the production chain.
fn surviving_seconds(vad_path: &str, samples: &[f32]) -> f32 {
    let silero = SileroVad::new(vad_path, THRESHOLD).expect("silero");
    let mut vad = SmoothedVad::new(
        Box::new(silero),
        VAD_PREFILL_FRAMES,
        VAD_OFFLINE_HANGOVER_FRAMES,
        VAD_ONSET_FRAMES,
    );

    let mut kept = 0usize;
    for frame in samples.chunks_exact(FRAME) {
        // Mirrors run_consumer's handle_frame: a VAD error is fail-open.
        match vad.push_frame(frame) {
            Ok(v) => {
                if let handy_app_lib::audio_toolkit::vad::VadFrame::Speech(buf) = v {
                    kept += buf.len();
                }
            }
            Err(_) => kept += frame.len(),
        }
    }
    kept as f32 / SAMPLE_RATE as f32
}

/// Veredicto CRUDO de Silero por frame, sin suavizar. Segunda pasada con un
/// detector nuevo: `SmoothedVad` es dueño del suyo y no lo deja mirar. Silero
/// es determinista, así que la secuencia es la misma que vio la primera pasada.
fn raw_verdicts(vad_path: &str, samples: &[f32]) -> Vec<bool> {
    let mut silero = SileroVad::new(vad_path, THRESHOLD).expect("silero");
    samples
        .chunks_exact(FRAME)
        // Un error del detector es fail-open en producción: cuenta como voz.
        .map(|frame| silero.is_voice(frame).unwrap_or(true))
        .collect()
}

/// Traduce las estadísticas crudas a la única frase que hace falta: dónde va el
/// arreglo.
fn diagnose(stats: VoicingStats) -> String {
    let pct = 100.0 * stats.voiced_ratio();

    if stats.total_frames == 0 {
        return "grabación vacía".to_string();
    }
    if stats.runs_reaching_onset == 0 && pct >= 10.0 {
        return format!(
            "TITUBEO. Silero ve voz en el {pct:.0}% de los frames, pero su racha más \n             larga es de {} frame(s) y hacen falta {VAD_ONSET_FRAMES} seguidos: el \n             suavizador no llega a abrir NI UNA VEZ. El arreglo va en SmoothedVad \n             (el contador de arranque se reinicia con un solo frame malo), no en la captura.",
            stats.longest_voiced_run
        );
    }
    if pct < 10.0 {
        return format!(
            "SEÑAL. Silero apenas reconoce voz ({pct:.0}% de los frames): lo que le \n             llega no se parece a habla. El arreglo va en la CAPTURA (canales, \n             downmix, dispositivo), no en el suavizador."
        );
    }
    format!(
        "El suavizador abre {} vez/veces (voz {pct:.0}%, racha máxima {}). El arranque \n         no es el cuello de botella; si aun así se pierde audio, mirar el hangover y \n         el camino en vivo (hilos, resampler, framing).",
        stats.runs_reaching_onset, stats.longest_voiced_run
    )
}

fn main() {
    let mut args = std::env::args().skip(1);
    let vad_path = args
        .next()
        .expect("usage: vad_survival <silero_vad_v4.onnx> <wav>...");
    let wavs: Vec<String> = args.collect();
    assert!(!wavs.is_empty(), "no WAV files given");

    println!(
        "{:<26} {:>9} {:>9} {:>8} {:>7} {:>6} {:>10} {:>8}",
        "file / attenuation",
        "level dB",
        "kept s",
        "kept %",
        "voz %",
        "racha",
        "arranques",
        "verdict"
    );

    for wav in &wavs {
        let audio = read_wav(wav);
        let secs = audio.len() as f32 / SAMPLE_RATE as f32;
        println!("{wav}  ({secs:.1}s)");
        let mut stats_at_0db: Option<VoicingStats> = None;

        // 0 dB is the recording as captured; the rest simulate the level loss a
        // two-microphone downmix can inflict.
        for atten_db in [0.0f32, -3.0, -6.0, -9.0, -12.0, -18.0, -24.0] {
            let factor = 10f32.powf(atten_db / 20.0);
            let scaled: Vec<f32> = audio.iter().map(|s| s * factor).collect();
            let kept = surviving_seconds(&vad_path, &scaled);
            let pct = 100.0 * kept / secs;
            let stats =
                VoicingStats::from_verdicts(&raw_verdicts(&vad_path, &scaled), VAD_ONSET_FRAMES);
            if atten_db == 0.0 {
                stats_at_0db = Some(stats);
            }
            let verdict = if pct < 25.0 {
                "COLAPSA"
            } else if pct < 70.0 {
                "degrada"
            } else {
                "ok"
            };
            println!(
                "  {:<24} {:>9.1} {:>9.2} {:>7.1}% {:>6.0}% {:>6} {:>10} {:>8}",
                format!("{atten_db:+.0} dB"),
                rms_dbfs(&scaled),
                kept,
                pct,
                100.0 * stats.voiced_ratio(),
                stats.longest_voiced_run,
                stats.runs_reaching_onset,
                verdict
            );
        }

        // La conclusión se saca de la grabación TAL CUAL, sin atenuar: las filas
        // atenuadas son una simulación, esta fila es el caso real del usuario.
        if let Some(stats) = stats_at_0db {
            println!("\n  DIAGNOSTICO (grabacion sin atenuar):");
            for line in diagnose(stats).lines() {
                println!("    {}", line.trim());
            }
            println!();
        }
    }
}
