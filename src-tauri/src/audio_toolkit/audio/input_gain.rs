//! Software gain applied to captured microphone samples.
//!
//! ## What this is for, and what it is not for
//!
//! This exists so a user with a quiet microphone can raise their level from
//! inside Trazo instead of hunting through the OS sound control panel. That is
//! the whole goal: convenience.
//!
//! **It does not fix the long-dictation truncation** documented in
//! [`silence_gate`](super::silence_gate). Multiplying the signal raises speech
//! and room noise by exactly the same factor, so the speech-to-noise ratio is
//! unchanged and the VAD behaves identically. This was measured on 2026-07-26:
//! +14.7 dB applied to a truncating recording did not change the transcript by
//! a single word, and raising the Windows input level ~20 dB (p90 went from
//! -36 to -15 dBFS) left the truncation exactly as it was.
//!
//! Gain is applied once, in the capture callback, before anything downstream
//! sees the audio — so the waveform, the VAD and the transcript all agree about
//! how loud the user is.

/// Neutral gain: the signal passes through untouched.
pub const UNITY_GAIN: f32 = 1.0;

/// Quietest setting offered, roughly -6 dB, for a microphone that clips.
pub const MIN_GAIN: f32 = 0.5;

/// Loudest setting offered, roughly +12 dB. Higher factors are not offered
/// because past this point a quiet microphone mostly amplifies its own noise
/// floor, and clipping starts eating the loud parts of speech.
pub const MAX_GAIN: f32 = 4.0;

/// Scale `samples` in place by `gain`, clamping to the valid sample range.
///
/// Clamping rather than wrapping: a sample outside [-1.0, 1.0] is not just
/// distorted, it is invalid input for the resampler and the model. Clipping a
/// peak costs a moment of harshness; letting it through costs the frame.
pub fn apply_input_gain(samples: &mut [f32], gain: f32) {
    // A gain that is not a usable number must never silence the microphone:
    // zero would look exactly like a dead device, and this value is reachable
    // by hand-editing the settings store.
    if !gain.is_finite() || gain <= 0.0 || gain == UNITY_GAIN {
        return;
    }

    for sample in samples.iter_mut() {
        *sample = (*sample * gain).clamp(-1.0, 1.0);
    }
}

/// A gain value shared between the settings layer and the running capture
/// callback.
///
/// The capture callback owns its closure for the lifetime of the stream, so a
/// plain `f32` would freeze whatever value was set when recording started.
/// Moving the slider has to reach a dictation already in progress, which means
/// the value has to be readable from the audio thread without locking.
#[derive(Clone, Debug)]
pub struct SharedGain(std::sync::Arc<std::sync::atomic::AtomicU32>);

impl SharedGain {
    pub fn new(gain: f32) -> Self {
        Self(std::sync::Arc::new(std::sync::atomic::AtomicU32::new(
            gain.to_bits(),
        )))
    }

    /// Ignores a value that is not a usable gain, leaving the previous one in
    /// place — the audio thread must never read a NaN out of this.
    pub fn set(&self, gain: f32) {
        if !gain.is_finite() || gain <= 0.0 {
            return;
        }
        self.0
            .store(gain.to_bits(), std::sync::atomic::Ordering::Relaxed);
    }

    pub fn get(&self) -> f32 {
        f32::from_bits(self.0.load(std::sync::atomic::Ordering::Relaxed))
    }
}

impl Default for SharedGain {
    fn default() -> Self {
        Self::new(UNITY_GAIN)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_shared_gain_starts_at_the_value_it_was_built_with() {
        assert_eq!(SharedGain::new(2.0).get(), 2.0);
    }

    #[test]
    fn a_clone_sees_a_change_made_through_the_original() {
        // This is the whole point of the type: the capture callback holds a
        // clone for the life of the stream, so moving the slider mid-dictation
        // has to reach it.
        let original = SharedGain::new(UNITY_GAIN);
        let held_by_capture_thread = original.clone();

        original.set(3.0);

        assert_eq!(
            held_by_capture_thread.get(),
            3.0,
            "a running capture must observe a gain change, not the value it started with"
        );
    }

    #[test]
    fn a_nonsense_gain_leaves_the_previous_value_in_place() {
        let gain = SharedGain::new(2.0);
        gain.set(f32::NAN);
        assert_eq!(gain.get(), 2.0, "a bad write must not disturb a good value");
    }

    #[test]
    fn unity_gain_leaves_every_sample_untouched() {
        let original = vec![-0.5, -0.1, 0.0, 0.25, 0.75];
        let mut samples = original.clone();

        apply_input_gain(&mut samples, UNITY_GAIN);

        assert_eq!(
            samples, original,
            "unity gain must be a true no-op, not a rounding pass"
        );
    }

    #[test]
    fn gain_above_one_raises_a_quiet_signal() {
        let mut samples = vec![0.1, -0.2];

        apply_input_gain(&mut samples, 2.0);

        assert!((samples[0] - 0.2).abs() < 1e-6, "got {}", samples[0]);
        assert!((samples[1] + 0.4).abs() < 1e-6, "got {}", samples[1]);
    }

    #[test]
    fn gain_below_one_attenuates_a_hot_signal() {
        let mut samples = vec![0.8, -0.8];

        apply_input_gain(&mut samples, 0.5);

        assert!((samples[0] - 0.4).abs() < 1e-6, "got {}", samples[0]);
        assert!((samples[1] + 0.4).abs() < 1e-6, "got {}", samples[1]);
    }

    #[test]
    fn boosting_past_full_scale_clips_instead_of_leaving_the_valid_range() {
        // A sample above 1.0 is not merely loud, it is invalid input for the
        // resampler and the model.
        let mut samples = vec![0.9, -0.9];

        apply_input_gain(&mut samples, 4.0);

        assert_eq!(samples[0], 1.0);
        assert_eq!(samples[1], -1.0);
    }

    #[test]
    fn a_nonsense_gain_never_silences_the_microphone() {
        // Reachable by hand-editing the settings store. Losing the dictation
        // is a far worse outcome than ignoring a bad number.
        for bad in [0.0, -1.0, f32::NAN, f32::INFINITY] {
            let mut samples = vec![0.3, -0.3];

            apply_input_gain(&mut samples, bad);

            assert_eq!(
                samples,
                vec![0.3, -0.3],
                "gain {bad} must be ignored, not applied"
            );
        }
    }

    #[test]
    fn an_empty_buffer_is_handled_without_panicking() {
        let mut samples: Vec<f32> = Vec::new();
        apply_input_gain(&mut samples, 2.0);
        assert!(samples.is_empty());
    }
}
