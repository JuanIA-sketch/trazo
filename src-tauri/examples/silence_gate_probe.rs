//! Diagnóstico: por qué un dictado sale truncado y el rescate no se dispara.
//!
//! La estrategia de §2.3 es "decodifica entero, y si el texto parece truncado
//! reintenta troceando por los silencios". Esa decisión la toma
//! [`looks_truncated`], que compara las palabras obtenidas contra los
//! **segundos de habla** que mide el gate — no contra la duración del clip.
//!
//! Motivación (2026-07-30): un dictado de 27,1 s devolvió 26 palabras y **el
//! rescate no saltó**. Sobre la duración total eso es 0,96 palabras/s, muy por
//! debajo del umbral de 2,7; pero la cuenta que decide usa los segundos de
//! habla, y si el gate mide de menos, la razón sube y el dictado truncado pasa
//! por bueno.
//!
//! Esta herramienta imprime exactamente lo que ve el gate, para poder comparar
//! su medida con la realidad del audio.
//!
//! ```bash
//! cargo run --example silence_gate_probe -- <wav> [palabras_obtenidas]
//! ```

use handy_app_lib::audio_toolkit::{
    looks_truncated, looks_truncated_by_duration, read_wav_samples, speech_seconds, speech_segments,
};

const SAMPLE_RATE: u32 = 16_000;

fn main() {
    let mut args = std::env::args().skip(1);
    let path = match args.next() {
        Some(p) => p,
        None => {
            eprintln!("uso: cargo run --example silence_gate_probe -- <wav> [palabras]");
            std::process::exit(2);
        }
    };
    let words: usize = args.next().and_then(|w| w.parse().ok()).unwrap_or(0);

    let samples = match read_wav_samples(&path) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("no se pudo leer {path}: {e}");
            std::process::exit(1);
        }
    };

    let total_s = samples.len() as f32 / SAMPLE_RATE as f32;
    let speech = speech_seconds(&samples, SAMPLE_RATE);
    let segments = speech_segments(&samples, SAMPLE_RATE);

    println!("archivo            : {path}");
    println!("duración total     : {total_s:.2} s");
    println!(
        "habla según el gate: {speech:.2} s  ({:.0}% del clip)",
        speech / total_s * 100.0
    );
    println!("silencio implícito : {:.2} s", total_s - speech);
    println!();

    println!(
        "tramos de habla que usaría el reintento: {}",
        segments.len()
    );
    for (i, r) in segments.iter().enumerate() {
        let ini = r.start as f32 / SAMPLE_RATE as f32;
        let fin = r.end as f32 / SAMPLE_RATE as f32;
        println!(
            "  {:>2}. {:>6.2}s → {:>6.2}s   ({:.2}s)",
            i + 1,
            ini,
            fin,
            fin - ini
        );
    }
    println!();

    if words > 0 {
        // Las dos redes que combina `transcribe_recording`, por separado, para
        // ver cuál de ellas salva el clip (o si ninguna lo hace).
        let por_habla = looks_truncated(words, speech);
        let por_duracion = looks_truncated_by_duration(words, total_s);

        println!("palabras obtenidas : {words}");
        println!(
            "  sobre habla      : {:.2} palabras/s  (umbral 2.70)  -> {}",
            words as f32 / speech,
            if por_habla { "DISPARA" } else { "no dispara" }
        );
        println!(
            "  sobre duración   : {:.2} palabras/s  (umbral 1.00)  -> {}",
            words as f32 / total_s,
            if por_duracion {
                "DISPARA"
            } else {
                "no dispara"
            }
        );
        println!();
        println!(
            "veredicto          : {}",
            if por_habla || por_duracion {
                "el rescate se dispara"
            } else {
                "el rescate NO se dispara: el dictado truncado se entrega tal cual"
            }
        );
    }
}
