use anyhow::Result;

pub const VAD_PREFILL_FRAMES: usize = 15;
pub const VAD_OFFLINE_HANGOVER_FRAMES: usize = 15;
pub const VAD_STREAMING_HANGOVER_FRAMES: usize = 55;
pub const VAD_ONSET_FRAMES: usize = 2;

pub enum VadFrame<'a> {
    /// Speech – may aggregate several frames (prefill + current + hangover)
    Speech(&'a [f32]),
    /// Non-speech (silence, noise). Down-stream code can ignore it.
    Noise,
}

impl<'a> VadFrame<'a> {
    #[inline]
    pub fn is_speech(&self) -> bool {
        matches!(self, VadFrame::Speech(_))
    }
}

pub trait VoiceActivityDetector: Send + Sync {
    /// Primary streaming API: feed one 30-ms frame, get keep/drop decision.
    fn push_frame<'a>(&'a mut self, frame: &'a [f32]) -> Result<VadFrame<'a>>;

    fn is_voice(&mut self, frame: &[f32]) -> Result<bool> {
        Ok(self.push_frame(frame)?.is_speech())
    }

    /// Set the post-speech hangover tail (in 30 ms frames) applied to
    /// subsequent frames. Detectors without a smoothing tail can ignore this.
    fn set_hangover_frames(&mut self, _frames: usize) {}

    fn reset(&mut self) {}
}

/// Reduces the per-frame VAD verdict to voice↔no-voice transitions, so
/// consumers (e.g. the overlay's "speech detected" pulse) get one event per
/// change instead of one per 30 ms frame.
pub struct SpeechStateTracker {
    last: Option<bool>,
}

impl SpeechStateTracker {
    pub fn new() -> Self {
        Self { last: None }
    }

    /// Feed the current frame's verdict; returns Some(state) only when the
    /// state differs from the previously reported one (the first call always
    /// reports).
    pub fn update(&mut self, is_speech: bool) -> Option<bool> {
        if self.last == Some(is_speech) {
            return None;
        }
        self.last = Some(is_speech);
        Some(is_speech)
    }
}

impl Default for SpeechStateTracker {
    fn default() -> Self {
        Self::new()
    }
}

/// Recuento crudo de veredictos del VAD interno, ANTES del suavizado.
///
/// Existe para responder una pregunta concreta que la supervivencia agregada no
/// puede: cuando una grabación sobrevive mal, ¿es que el detector dice "no voz"
/// casi siempre, o es que titubea y [`SmoothedVad`] nunca junta los
/// [`VAD_ONSET_FRAMES`] consecutivos que necesita para abrir?
///
/// Los dos casos se ven idénticos si solo se mide cuánto audio sale, y llevan a
/// arreglos opuestos: el primero está en la captura (la señal no parece voz),
/// el segundo en el suavizador (el contador de arranque se reinicia con un solo
/// frame malo).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct VoicingStats {
    pub total_frames: usize,
    pub voiced_frames: usize,
    /// Racha más larga de frames de voz consecutivos.
    pub longest_voiced_run: usize,
    /// Cuántas rachas alcanzan `onset_frames`, es decir cuántas veces el
    /// suavizador habría podido entrar en habla.
    pub runs_reaching_onset: usize,
}

impl VoicingStats {
    pub fn from_verdicts(verdicts: &[bool], onset_frames: usize) -> Self {
        let mut stats = VoicingStats {
            total_frames: verdicts.len(),
            ..Default::default()
        };
        let mut run = 0usize;
        let mut counted_this_run = false;

        for &voiced in verdicts {
            if voiced {
                stats.voiced_frames += 1;
                run += 1;
                stats.longest_voiced_run = stats.longest_voiced_run.max(run);
                // Una racha cuenta UNA vez, por larga que sea: mide
                // oportunidades de arranque, no frames.
                if !counted_this_run && run >= onset_frames.max(1) {
                    stats.runs_reaching_onset += 1;
                    counted_this_run = true;
                }
            } else {
                run = 0;
                counted_this_run = false;
            }
        }
        stats
    }

    pub fn voiced_ratio(&self) -> f32 {
        if self.total_frames == 0 {
            return 0.0;
        }
        self.voiced_frames as f32 / self.total_frames as f32
    }
}

mod silero;
mod smoothed;

pub use silero::SileroVad;
pub use smoothed::SmoothedVad;

#[cfg(test)]
mod speech_state_tracker_tests {
    use super::SpeechStateTracker;

    #[test]
    fn first_verdict_is_always_reported() {
        let mut t = SpeechStateTracker::new();
        assert_eq!(t.update(false), Some(false));
    }

    #[test]
    fn repeated_verdicts_report_nothing() {
        let mut t = SpeechStateTracker::new();
        assert_eq!(t.update(true), Some(true));
        assert_eq!(t.update(true), None);
        assert_eq!(t.update(true), None);
    }

    #[test]
    fn transitions_report_the_new_state() {
        let mut t = SpeechStateTracker::new();
        assert_eq!(t.update(false), Some(false));
        assert_eq!(t.update(true), Some(true));
        assert_eq!(t.update(false), Some(false));
    }
}
#[cfg(test)]
mod voicing_stats_tests {
    use super::VoicingStats;

    #[test]
    fn an_empty_recording_has_no_stats_and_does_not_divide_by_zero() {
        let s = VoicingStats::from_verdicts(&[], 2);
        assert_eq!(s, VoicingStats::default());
        assert_eq!(s.voiced_ratio(), 0.0);
    }

    #[test]
    fn continuous_speech_is_one_run_as_long_as_the_recording() {
        let s = VoicingStats::from_verdicts(&[true; 10], 2);
        assert_eq!(s.voiced_frames, 10);
        assert_eq!(s.longest_voiced_run, 10);
        assert_eq!(
            s.runs_reaching_onset, 1,
            "una racha larga es UNA oportunidad de arranque, no ocho"
        );
        assert_eq!(s.voiced_ratio(), 1.0);
    }

    /// El caso que motiva todo esto. La mitad de los frames son voz --- una
    /// proporción sanísima --- y aun así el suavizador no puede abrir ni una
    /// vez, porque nunca hay dos seguidos. Medir solo el porcentaje de voz
    /// haría pensar que la señal está bien; medir solo la supervivencia haría
    /// pensar que el detector la rechaza. Hace falta la racha.
    #[test]
    fn flapping_has_plenty_of_voice_and_still_never_reaches_onset() {
        let verdicts: Vec<bool> = (0..20).map(|i| i % 2 == 0).collect();
        let s = VoicingStats::from_verdicts(&verdicts, 2);

        assert_eq!(s.voiced_ratio(), 0.5);
        assert_eq!(s.longest_voiced_run, 1);
        assert_eq!(s.runs_reaching_onset, 0);
    }

    #[test]
    fn each_separate_run_that_reaches_onset_counts_once() {
        //            racha 1        hueco      racha 2   corta
        let v = [true, true, true, false, false, true, true, false, true];
        let s = VoicingStats::from_verdicts(&v, 2);

        assert_eq!(s.longest_voiced_run, 3);
        assert_eq!(
            s.runs_reaching_onset, 2,
            "la racha final de 1 frame no llega a onset"
        );
    }

    /// Un onset de 0 o 1 no puede hacer que una racha cuente dos veces ni que
    /// una racha vacía cuente.
    #[test]
    fn an_onset_below_one_is_treated_as_one() {
        let s = VoicingStats::from_verdicts(&[true, false, true], 0);
        assert_eq!(s.runs_reaching_onset, 2);
    }
}
