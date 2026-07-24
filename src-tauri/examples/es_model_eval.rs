//! Eval harness: run a transcribe-cpp GGUF model over real dictation WAVs and
//! print timing + detected language + transcript, for side-by-side model
//! comparisons (e.g. Whisper Turbo vs Nemotron Streaming on Spanish speech).
//!
//! Usage:
//!   cargo run --example es_model_eval -- <model.gguf> [--lang es] <wav> [<wav>...]
//!
//! WAVs must be 16 kHz mono (the app's recording format). `--lang` pins the
//! language the way production does for models that list it; omit it to let
//! the model auto-detect.

use std::time::Instant;

use transcribe_cpp::{Backend, Model, ModelOptions, RunOptions, StreamOptions, Task};

fn read_wav_16k_mono(path: &str) -> Vec<f32> {
    let reader = hound::WavReader::open(path).unwrap_or_else(|e| panic!("open {path}: {e}"));
    let spec = reader.spec();
    assert_eq!(spec.sample_rate, 16_000, "{path}: expected 16 kHz");
    assert_eq!(spec.channels, 1, "{path}: expected mono");
    match spec.sample_format {
        hound::SampleFormat::Int => reader
            .into_samples::<i16>()
            .map(|s| s.expect("pcm sample") as f32 / 32768.0)
            .collect(),
        hound::SampleFormat::Float => reader
            .into_samples::<f32>()
            .map(|s| s.expect("pcm sample"))
            .collect(),
    }
}

fn main() {
    let mut args = std::env::args().skip(1);
    let model_path = args
        .next()
        .expect("usage: es_model_eval <model.gguf> [--lang es] <wav>...");
    let mut language: Option<String> = None;
    let mut wavs: Vec<String> = Vec::new();
    let mut stream_chunk_ms: Option<usize> = None;
    let mut backend = Backend::Cpu;
    let mut gpu_device: i32 = 0;
    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--lang" => language = Some(args.next().expect("--lang needs a value")),
            "--stream" => {
                stream_chunk_ms = Some(
                    args.next()
                        .expect("--stream needs a chunk size in ms")
                        .parse()
                        .expect("chunk ms must be a number"),
                )
            }
            "--backend" => {
                backend = match args.next().expect("--backend needs a value").as_str() {
                    "cpu" => Backend::Cpu,
                    "vulkan" => Backend::Vulkan,
                    "auto" => Backend::Auto,
                    other => panic!("unknown backend '{other}'"),
                }
            }
            "--gpu" => {
                gpu_device = args
                    .next()
                    .expect("--gpu needs a device index")
                    .parse()
                    .expect("gpu index must be a number")
            }
            _ => wavs.push(arg),
        }
    }
    assert!(!wavs.is_empty(), "no WAV files given");

    // Backend DLLs are staged at the target profile root; the example binary
    // runs one level deeper, in examples/.
    let exe = std::env::current_exe().expect("exe path");
    let scan_dir = exe.parent().and_then(|p| p.parent()).expect("target dir");
    let _ = transcribe_cpp::init_backends(scan_dir);

    let t0 = Instant::now();
    let model = Model::load_with(
        std::path::Path::new(&model_path),
        &ModelOptions {
            backend,
            gpu_device,
        },
    )
    .expect("load model");
    let mut session = model.session().expect("create session");
    let caps = model.capabilities();
    println!(
        "caps: streaming={} translate={} language_detect={} languages={:?}",
        caps.supports_streaming,
        caps.supports_translate,
        caps.supports_language_detect,
        caps.languages
    );
    println!(
        "model: {model_path}\narch: {} | backend: {} | load: {:.1}s | lang pin: {:?}\n",
        model.arch(),
        model.backend(),
        t0.elapsed().as_secs_f32(),
        language
    );

    for wav in &wavs {
        let audio = read_wav_16k_mono(wav);
        let secs = audio.len() as f32 / 16_000.0;
        let options = RunOptions {
            task: Task::Transcribe,
            language: language.clone(),
            ..Default::default()
        };

        // Streaming mode: mimic the app's live-preview worker, feeding fixed
        // chunks (the mic callback size) and finalizing at the end. Compute
        // time vs audio duration is the real-time factor that decides whether
        // the live path can keep up.
        if let Some(chunk_ms) = stream_chunk_ms {
            let chunk = 16 * chunk_ms; // samples per chunk at 16 kHz
            let t = Instant::now();
            let mut stream = session
                .stream(&options, &StreamOptions::default())
                .expect("begin stream");
            let mut feeds = 0usize;
            for pcm in audio.chunks(chunk.max(1)) {
                stream.feed(pcm).expect("stream feed");
                feeds += 1;
            }
            stream.finalize().expect("stream finalize");
            let text = stream.text().display();
            let compute = t.elapsed().as_secs_f32();
            println!(
                "== {wav} [stream {chunk_ms}ms]\n   audio {secs:.1}s | compute {compute:.1}s ({:.2}x RT) | {feeds} feeds\n   {}\n",
                secs / compute,
                text.trim()
            );
            continue;
        }

        let t = Instant::now();
        match session.run(&audio, &options) {
            Ok(out) => println!(
                "== {wav}\n   audio {secs:.1}s | run {:.1}s | detected {:?}\n   {}\n",
                t.elapsed().as_secs_f32(),
                out.language,
                out.text.trim()
            ),
            Err(e) => println!("== {wav}\n   audio {secs:.1}s | ERROR: {e}\n"),
        }
    }
}
