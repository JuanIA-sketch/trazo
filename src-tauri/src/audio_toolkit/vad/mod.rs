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
