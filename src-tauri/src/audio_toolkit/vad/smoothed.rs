use super::{VadFrame, VoiceActivityDetector};
use anyhow::Result;
use std::collections::VecDeque;

pub struct SmoothedVad {
    inner_vad: Box<dyn VoiceActivityDetector>,
    prefill_frames: usize,
    hangover_frames: usize,
    onset_frames: usize,

    frame_buffer: VecDeque<Vec<f32>>,
    hangover_counter: usize,
    onset_counter: usize,
    in_speech: bool,

    temp_out: Vec<f32>,
}

impl SmoothedVad {
    pub fn new(
        inner_vad: Box<dyn VoiceActivityDetector>,
        prefill_frames: usize,
        hangover_frames: usize,
        onset_frames: usize,
    ) -> Self {
        Self {
            inner_vad,
            prefill_frames,
            hangover_frames,
            onset_frames,
            frame_buffer: VecDeque::new(),
            hangover_counter: 0,
            onset_counter: 0,
            in_speech: false,
            temp_out: Vec::new(),
        }
    }
}

impl VoiceActivityDetector for SmoothedVad {
    fn push_frame<'a>(&'a mut self, frame: &'a [f32]) -> Result<VadFrame<'a>> {
        // 1. Buffer every incoming frame for possible pre-roll.
        //
        // Invariante (2026-08-18): el buffer contiene SOLO frames aún no
        // emitidos. Cada brazo que emite lo vacía; sin eso, la reapertura tras
        // una pausa reemitía como prefill hasta 13 frames (390 ms) que el
        // hangover ya había entregado — audio duplicado, y en SNR marginal,
        // palabras repetidas (medido: 48 % más muestras de las que entraron).
        self.frame_buffer.push_back(frame.to_vec());
        while self.frame_buffer.len() > self.prefill_frames + 1 {
            self.frame_buffer.pop_front();
        }

        // 2. Delegate to the wrapped boolean VAD
        let is_voice = self.inner_vad.is_voice(frame)?;

        match (self.in_speech, is_voice) {
            // Potential start of speech - need to accumulate onset frames
            (false, true) => {
                self.onset_counter += 1;
                if self.onset_counter >= self.onset_frames {
                    // We have enough consecutive voice frames to trigger speech
                    self.in_speech = true;
                    self.hangover_counter = self.hangover_frames;
                    self.onset_counter = 0; // Reset for next time

                    // Collect prefill + current frame, and hand it over: once
                    // emitted, it must never re-enter a future prefill.
                    self.temp_out.clear();
                    for buf in &self.frame_buffer {
                        self.temp_out.extend(buf);
                    }
                    self.frame_buffer.clear();
                    Ok(VadFrame::Speech(&self.temp_out))
                } else {
                    // Not enough frames yet, still silence
                    Ok(VadFrame::Noise)
                }
            }

            // Ongoing Speech
            (true, true) => {
                self.hangover_counter = self.hangover_frames;
                // Emitted directly: keeping it buffered would re-emit it as
                // prefill on the next re-entry.
                self.frame_buffer.clear();
                Ok(VadFrame::Speech(frame))
            }

            // End of Speech or interruption during onset phase
            (true, false) => {
                if self.hangover_counter > 0 {
                    self.hangover_counter -= 1;
                    self.frame_buffer.clear();
                    Ok(VadFrame::Speech(frame))
                } else {
                    // Este frame NO se emite: se queda en el buffer y volverá
                    // como prefill si el habla se reanuda.
                    self.in_speech = false;
                    Ok(VadFrame::Noise)
                }
            }

            // Silence or broken onset sequence
            (false, false) => {
                self.onset_counter = 0; // Reset onset counter on silence
                Ok(VadFrame::Noise)
            }
        }
    }

    fn set_hangover_frames(&mut self, frames: usize) {
        self.hangover_frames = frames;
    }

    fn reset(&mut self) {
        self.inner_vad.reset();
        self.frame_buffer.clear();
        self.hangover_counter = 0;
        self.onset_counter = 0;
        self.in_speech = false;
        self.temp_out.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::{SmoothedVad, VadFrame, VoiceActivityDetector};
    use crate::audio_toolkit::vad::{
        VAD_OFFLINE_HANGOVER_FRAMES, VAD_ONSET_FRAMES, VAD_PREFILL_FRAMES,
    };

    /// VAD de guion: devuelve una secuencia fija de veredictos. Permite
    /// reproducir en un test exactamente la secuencia que Silero produjo en un
    /// caso real, sin cargar el modelo.
    struct ScriptedVad {
        verdicts: Vec<bool>,
        next: usize,
    }

    impl ScriptedVad {
        fn new(verdicts: &[bool]) -> Self {
            Self {
                verdicts: verdicts.to_vec(),
                next: 0,
            }
        }
    }

    impl VoiceActivityDetector for ScriptedVad {
        fn push_frame<'a>(&'a mut self, frame: &'a [f32]) -> anyhow::Result<VadFrame<'a>> {
            let is_voice = *self
                .verdicts
                .get(self.next)
                .expect("guion agotado: el test empujo mas frames que veredictos");
            self.next += 1;
            Ok(if is_voice {
                VadFrame::Speech(frame)
            } else {
                VadFrame::Noise
            })
        }
    }

    const FRAME_LEN: usize = 4;

    /// El frame k lleva todas sus muestras al valor k+1, para poder decodificar
    /// de la salida qué frames se emitieron y cuántas veces cada uno.
    fn tagged_frame(k: usize) -> Vec<f32> {
        vec![(k + 1) as f32; FRAME_LEN]
    }

    /// Corre un guion de veredictos por el suavizador y devuelve, por frame de
    /// entrada, cuántas VECES salió emitido.
    fn emission_counts(
        verdicts: &[bool],
        prefill: usize,
        hangover: usize,
        onset: usize,
    ) -> Vec<usize> {
        let mut vad = SmoothedVad::new(
            Box::new(ScriptedVad::new(verdicts)),
            prefill,
            hangover,
            onset,
        );

        let mut emitted: Vec<f32> = Vec::new();
        for k in 0..verdicts.len() {
            let frame = tagged_frame(k);
            match vad.push_frame(&frame).expect("el guion nunca falla") {
                VadFrame::Speech(buf) => emitted.extend_from_slice(buf),
                VadFrame::Noise => {}
            }
        }

        let mut counts = vec![0usize; verdicts.len()];
        for chunk in emitted.chunks(FRAME_LEN) {
            assert_eq!(chunk.len(), FRAME_LEN, "la emision no es multiplo de frame");
            assert!(
                chunk.iter().all(|s| *s == chunk[0]),
                "un frame emitido salio mezclado: {chunk:?}"
            );
            counts[chunk[0] as usize - 1] += 1;
        }
        counts
    }

    /// El bug medido el 2026-08-18: `frame_buffer` retiene los últimos frames
    /// aunque YA se hayan emitido (el hangover los emite como Speech), y la
    /// reapertura los reemite como prefill — hasta 13 frames = 390 ms por
    /// reentrada con las constantes de producción. En un dictado entrecortado
    /// salieron un 48 % más de muestras de las que entraron, y en SNR marginal
    /// esos frames llevan habla de verdad: son las "palabras repetidas".
    #[test]
    fn a_pause_and_resume_never_reemits_audio_already_delivered() {
        // Abre (2 T), habla, pausa que agota el hangover (15 F emitidos + 1 F
        // que cierra), y la voz vuelve enseguida (2 T + habla).
        let mut script = vec![true, true];
        script.extend([true; 4]);
        script.extend([false; 16]);
        script.extend([true, true]);
        script.extend([true; 3]);

        let counts = emission_counts(
            &script,
            VAD_PREFILL_FRAMES,
            VAD_OFFLINE_HANGOVER_FRAMES,
            VAD_ONSET_FRAMES,
        );

        let duplicated: Vec<usize> = counts
            .iter()
            .enumerate()
            .filter(|(_, &c)| c > 1)
            .map(|(k, _)| k)
            .collect();
        assert!(
            duplicated.is_empty(),
            "frames emitidos mas de una vez: {duplicated:?} (conteos {counts:?})"
        );
    }

    /// La razón de ser del prefill, pineada: la apertura recupera los frames
    /// del arranque (que el onset retuvo) y el silencio inmediatamente
    /// anterior — exactamente una vez. Los silencios que ya salieron de la
    /// ventana del prefill se pierden, por diseño.
    #[test]
    fn the_first_onset_recovers_the_lead_in_exactly_once() {
        let script = [false, false, false, false, false, true, true];
        let counts = emission_counts(&script, 3, 2, 2);
        assert_eq!(counts, vec![0, 0, 0, 1, 1, 1, 1]);
    }

    /// El hangover sigue haciendo su trabajo: una pausa corta se emite entera
    /// (protege la cola de la palabra) y la reanudación no reabre.
    #[test]
    fn a_short_dip_rides_the_hangover_without_reopening() {
        let script = [true, true, false, false, true];
        let counts = emission_counts(&script, 3, 3, 2);
        assert_eq!(counts, vec![1, 1, 1, 1, 1]);
    }

    /// Tras una pausa completa, el prefill de la reapertura cubre el hueco NO
    /// emitido — incluido el frame que cerró el habla, que nunca salió — y
    /// nada más. Guarda al arreglo de pasarse de la raya: limpiar de más
    /// dejaría huecos de audio.
    #[test]
    fn the_prefill_after_a_pause_covers_the_unemitted_gap_exactly_once() {
        // t0,t1 abren · t2 habla · f3 hangover (emitido) · f4 cierra (NO
        // emitido) · f5 hueco · t6,t7 reabren.
        let script = [true, true, true, false, false, false, true, true];
        let counts = emission_counts(&script, 3, 1, 2);
        assert_eq!(counts, vec![1, 1, 1, 1, 1, 1, 1, 1]);
    }
}
