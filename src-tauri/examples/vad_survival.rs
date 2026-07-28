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
//! Usage:
//!   cargo run --example vad_survival -- <silero_vad_v4.onnx> <wav> [<wav>...]

use handy_app_lib::audio_toolkit::vad::{
    SileroVad, SmoothedVad, VoiceActivityDetector, VAD_OFFLINE_HANGOVER_FRAMES, VAD_ONSET_FRAMES,
    VAD_PREFILL_FRAMES,
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

fn main() {
    let mut args = std::env::args().skip(1);
    let vad_path = args
        .next()
        .expect("usage: vad_survival <silero_vad_v4.onnx> <wav>...");
    let wavs: Vec<String> = args.collect();
    assert!(!wavs.is_empty(), "no WAV files given");

    println!(
        "{:<26} {:>7} {:>9} {:>9} {:>9} {:>7}",
        "file / attenuation", "secs", "level dB", "kept s", "kept %", "verdict"
    );

    for wav in &wavs {
        let audio = read_wav(wav);
        let secs = audio.len() as f32 / SAMPLE_RATE as f32;
        println!("{wav}  ({secs:.1}s)");

        // 0 dB is the recording as captured; the rest simulate the level loss a
        // two-microphone downmix can inflict.
        for atten_db in [0.0f32, -3.0, -6.0, -9.0, -12.0, -18.0, -24.0] {
            let factor = 10f32.powf(atten_db / 20.0);
            let scaled: Vec<f32> = audio.iter().map(|s| s * factor).collect();
            let kept = surviving_seconds(&vad_path, &scaled);
            let pct = 100.0 * kept / secs;
            let verdict = if pct < 25.0 {
                "COLAPSA"
            } else if pct < 70.0 {
                "degrada"
            } else {
                "ok"
            };
            println!(
                "  {:<24} {:>7.1} {:>9.1} {:>9.2} {:>8.1}% {:>7}",
                format!("{atten_db:+.0} dB"),
                secs,
                rms_dbfs(&scaled),
                kept,
                pct,
                verdict
            );
        }
    }
}
