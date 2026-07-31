//! Removes sustained silence from a captured recording before it is handed to
//! the transcription model.
//!
//! ## Why this exists
//!
//! Whisper terminates a transcript when it runs into a long silence and
//! discards everything after it. Measured on a real 29.4 s dictation
//! (2026-07-25, Charly's mic at a healthy level after raising the Windows
//! input volume):
//!
//! | input                          | result    |
//! | ------------------------------ | --------- |
//! | as captured (29.4 s)           | 9 words   |
//! | 1.8 s of sustained silence cut | 68 words  |
//!
//! Cutting under two seconds recovered seven times the content. The VAD does
//! not prevent this: Silero reports `prob > 0.3` on quiet room noise, so
//! [`SmoothedVad`](crate::audio_toolkit::vad::SmoothedVad) never leaves the
//! speech state and its hangover never expires.
//!
//! ## Why it is not part of the VAD chain
//!
//! Folding this into the VAD was tried and measured: `SmoothedVad`'s 450 ms
//! prefill re-inserts the silence it just dropped, so the same recording only
//! shrank to 29.2 s and recovered 26 of the 68 words. The prefill and hangover
//! exist to protect word onsets and must stay generous, so the gate runs
//! afterwards, over the finished buffer, with much tighter 150 ms edges.
//!
//! Only the audio sent to the model is gated — the history recording keeps the
//! full capture, so a dictation can always be replayed as it was spoken.

/// Analysis frame length. Matches the VAD's frame size so both reason about
/// audio at the same granularity.
const FRAME_MS: usize = 30;

/// How far above the tracked noise floor a frame must sit to count as speech.
const MARGIN_DB: f32 = 12.0;

/// A frame quieter than this is silence no matter what the noise floor says.
/// Guards rooms so quiet that the floor estimate becomes meaningless.
const ABSOLUTE_FLOOR_DB: f32 = -50.0;

/// The floor drops quickly toward a quieter reading and creeps up slowly, so a
/// brief lull cannot convince the gate that the room got loud.
const ADAPT_DOWN: f32 = 0.35;
const ADAPT_UP: f32 = 0.005;

/// Keeps the floor estimate inside a sane range. Digital silence would
/// otherwise drag it toward negative infinity and freeze the adaptation.
const FLOOR_MIN_DB: f32 = -75.0;
const FLOOR_MAX_DB: f32 = -20.0;

/// Only silence at least this long is removed. Shorter gaps are the natural
/// rhythm of speech and are left untouched.
const MIN_SILENCE_MS: usize = 400;

/// How much silence is preserved on each side of a removed stretch, so words
/// never lose their onset or their tail.
const EDGE_KEEP_MS: usize = 150;

/// RMS level of one frame in dBFS. Silent frames report [`FLOOR_MIN_DB`]
/// rather than negative infinity.
pub fn frame_level_db(frame: &[f32]) -> f32 {
    if frame.is_empty() {
        return FLOOR_MIN_DB;
    }
    let sum_sq: f32 = frame.iter().map(|s| s * s).sum();
    let rms = (sum_sq / frame.len() as f32).sqrt();
    if rms <= 0.0 {
        return FLOOR_MIN_DB;
    }
    (20.0 * rms.log10()).max(FLOOR_MIN_DB)
}

/// Level below which `fraction` of the frames sit. Used to read the room's
/// noise floor and its speech level off a finished recording.
fn percentile_db(levels: &[f32], fraction: f32) -> f32 {
    if levels.is_empty() {
        return FLOOR_MIN_DB;
    }
    let mut sorted = levels.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
    let idx = ((sorted.len() as f32 * fraction) as usize).min(sorted.len() - 1);
    sorted[idx]
}

/// Tracks the room's noise floor and classifies frames as silence or not.
///
/// Adaptive rather than a fixed threshold because the two failure modes pull
/// in opposite directions: a noisy room needs a high cutoff, while someone
/// speaking quietly needs a low one. A single constant cannot serve both.
pub struct SilenceDetector {
    noise_floor_db: Option<f32>,
}

impl SilenceDetector {
    pub fn new() -> Self {
        Self {
            noise_floor_db: None,
        }
    }

    /// Start from a known floor instead of learning it from the first frame.
    ///
    /// Seeding matters: a recording that opens mid-sentence would otherwise
    /// anchor the floor at speech level and classify the whole utterance as
    /// silence. Callers measure the floor over the finished buffer, which they
    /// can afford because this runs after capture, not during it.
    pub fn seeded(initial_floor_db: f32) -> Self {
        Self {
            noise_floor_db: Some(initial_floor_db.clamp(FLOOR_MIN_DB, FLOOR_MAX_DB)),
        }
    }

    /// Feed one frame's level; returns `true` when the frame is silence.
    pub fn is_silence(&mut self, level_db: f32) -> bool {
        let floor = match self.noise_floor_db {
            Some(f) => f,
            None => {
                self.noise_floor_db = Some(level_db.clamp(FLOOR_MIN_DB, FLOOR_MAX_DB));
                level_db.clamp(FLOOR_MIN_DB, FLOOR_MAX_DB)
            }
        };

        let updated = if level_db < floor {
            floor + (level_db - floor) * ADAPT_DOWN
        } else if level_db < floor + MARGIN_DB {
            // Near the floor: plausibly noise, let it pull the estimate up.
            floor + (level_db - floor) * ADAPT_UP
        } else {
            // Clearly speech — it must not raise the noise estimate, or a long
            // dictation would slowly gate its own speaker out.
            floor
        };
        let updated = updated.clamp(FLOOR_MIN_DB, FLOOR_MAX_DB);
        self.noise_floor_db = Some(updated);

        level_db <= (updated + MARGIN_DB).max(ABSOLUTE_FLOOR_DB)
    }
}

impl Default for SilenceDetector {
    fn default() -> Self {
        Self::new()
    }
}

/// Given a per-frame silence mask, decide which frames to keep: everything
/// except the interior of silent runs of at least [`MIN_SILENCE_MS`].
pub fn keep_mask(silence: &[bool], frame_ms: usize) -> Vec<bool> {
    let min_run = MIN_SILENCE_MS / frame_ms;
    let edge = EDGE_KEEP_MS / frame_ms;
    let mut keep = vec![true; silence.len()];

    let mut i = 0;
    while i < silence.len() {
        if !silence[i] {
            i += 1;
            continue;
        }
        let start = i;
        while i < silence.len() && silence[i] {
            i += 1;
        }
        let run = i - start;
        if run >= min_run {
            for slot in keep.iter_mut().take(i - edge).skip(start + edge) {
                *slot = false;
            }
        }
    }
    keep
}

/// A segment must carry at least this much non-silent audio to be worth
/// transcribing on its own. Whisper invents text ("¡Suscríbete al canal!") when
/// handed a fragment too short to contain a word.
const MIN_SEGMENT_SPEECH_MS: usize = 300;

/// A run shorter than this is merged into its neighbour instead of being
/// decoded on its own: Whisper invents filler ("Gracias.", "¡Suscríbete al
/// canal!") when a decode is too short to carry context.
///
/// Raising this to 2500 (with `MAX_SEGMENT_MS` at 12000) was tried on
/// 2026-07-26 to spend fewer decodes, since Whisper pads every decode to a
/// fixed 30 s window and short runs waste most of it. Measured on a
/// five-dictation corpus it did not pay: across all five it saved a single
/// decode (9 -> 8), and on one recording the merge produced a 10.0 s run that
/// truncated internally and lost 13 words ("Y lo de las capturas, bueno pues
/// dime que prueba corremos..." disappeared). Reproduced twice, identical.
///
/// The retry does not catch that case, because it only compares against the
/// plain decode (19 words beat 16) and never sees the 32 words the smaller
/// windows produced. Do not raise these without re-running the corpus.
const MIN_SEGMENT_MS: usize = 1500;

/// Merging stops here. Bounds both the latency of a single decode and the risk
/// that a long segment hits an internal pause and terminates early — the very
/// failure this split exists to prevent.
///
/// Kept at 8000: see the note on [`MIN_SEGMENT_MS`] for the measured reason
/// raising this pair backfired.
const MAX_SEGMENT_MS: usize = 8000;

/// Runs further apart than this are never merged, however short they are.
/// Measured between padded segments, so it corresponds to roughly twice as
/// much real silence. Without it, folding short runs together would happily
/// rebuild the long-silence decode this module exists to break up.
const MERGE_MAX_GAP_MS: usize = 400;

/// Below this many words per second of actual speech, a transcript is not a
/// slow speaker — it is a decode that gave up early.
///
/// Calibrated on a real corpus (2026-07-26, five varied dictations, measured
/// against the plain whole-file decode): the three recordings that came back
/// visibly cut ran 1.31, 1.86 and 2.08 words per speech-second, while the two
/// that came back whole ran 3.48 and 4.09. The threshold goes in that gap.
///
/// Being generous here is cheap: a false positive only spends the extra
/// decodes, because the retry is discarded unless it actually recovers words.
const MIN_WORDS_PER_SPEECH_SECOND: f32 = 2.7;

/// Too little speech to judge a rate from. Short clips are noisy: one word in
/// two seconds is perfectly normal.
const MIN_JUDGEABLE_SPEECH_S: f32 = 3.0;

/// Second net, measured against the WHOLE clip instead of the speech the gate
/// found. Deliberately far below [`MIN_WORDS_PER_SPEECH_SECOND`]: this is not a
/// stricter version of the same test, it only has to catch decodes that gave up
/// so early that no amount of silence would explain the rate.
///
/// Why a second net exists at all (2026-07-30): [`speech_seconds`] shrinks with
/// recording level, because [`ABSOLUTE_FLOOR_DB`] is an absolute threshold and a
/// quiet voice sits close to it. Measured across 25 real recordings, the gate
/// saw 13% of the clip as speech at −47 dBFS and 53% at −14 dBFS. Dividing by
/// that shrinking number inflates the words-per-second rate, so the quieter the
/// recording, the healthier a truncated transcript looks — and quiet recordings
/// are exactly the ones that truncate. The failure and the blind spot of its
/// remedy had the same cause.
///
/// Calibrated on the same 20-dictation corpus: the ones that came back cut ran
/// 0.64-0.96 words per clip-second, the ones that came back whole ran 1.11 and
/// up. The threshold goes in that gap, nearer the failures.
const MIN_WORDS_PER_TOTAL_SECOND: f32 = 1.0;

/// Below this the clip is too short to judge by total duration. A quick "sí,
/// dale" is a complete dictation, not a failed decode.
const MIN_JUDGEABLE_TOTAL_S: f32 = 10.0;

/// Seconds of non-silent audio in `samples`.
pub fn speech_seconds(samples: &[f32], sample_rate: u32) -> f32 {
    let frame_len = (sample_rate as usize * FRAME_MS) / 1000;
    if frame_len == 0 || samples.len() < frame_len {
        return samples.len() as f32 / sample_rate as f32;
    }
    match silence_mask(samples, frame_len) {
        // No usable dynamic range: treat it all as speech rather than invent a
        // split that the audio does not support.
        None => samples.len() as f32 / sample_rate as f32,
        Some(silence) => {
            let speaking = silence.iter().filter(|s| !**s).count();
            speaking as f32 * FRAME_MS as f32 / 1000.0
        }
    }
}

/// Whether a transcript covers far less speech than the audio contains.
///
/// Used to decide whether a recording is worth re-decoding segment by segment.
/// Segmenting costs accuracy — it splits words at the boundaries and strips the
/// context around each run — so it is only worth doing when the plain decode
/// clearly failed, not as the default path.
pub fn looks_truncated(word_count: usize, speech_seconds: f32) -> bool {
    if speech_seconds < MIN_JUDGEABLE_SPEECH_S {
        return false;
    }
    (word_count as f32 / speech_seconds) < MIN_WORDS_PER_SPEECH_SECOND
}

/// Whether a transcript is too short for the LENGTH OF THE RECORDING, ignoring
/// how much speech the gate managed to find in it.
///
/// Companion to [`looks_truncated`], not a replacement: the two are OR-ed at the
/// call site. This one exists because the speech measure the other divides by is
/// not level-independent, so it goes blind on quiet recordings — see
/// [`MIN_WORDS_PER_TOTAL_SECOND`] for the measurements.
///
/// Kept as its own function rather than a third parameter on [`looks_truncated`]
/// on purpose: that one's tests encode a real corpus (word counts and speech
/// seconds actually measured on five dictations), and nobody recorded those
/// clips' total durations. Adding a parameter would have meant inventing the
/// missing numbers, which would quietly turn measured evidence into fiction.
pub fn looks_truncated_by_duration(word_count: usize, total_seconds: f32) -> bool {
    if total_seconds < MIN_JUDGEABLE_TOTAL_S {
        return false;
    }
    (word_count as f32 / total_seconds) < MIN_WORDS_PER_TOTAL_SECOND
}

/// The whole recording as one range: the answer whenever there is no sustained
/// silence to split on, so the caller takes the single-decode path.
fn single_segment(len: usize) -> Vec<std::ops::Range<usize>> {
    std::iter::once(0..len).collect()
}

/// Split `samples` at sustained silences and return the speech runs to
/// transcribe separately.
///
/// Each run is padded by [`EDGE_KEEP_MS`] into the surrounding silence so no
/// word loses its onset or tail. Transcribing the runs independently is what
/// removes the failure mode outright: a decode that contains no long silence
/// cannot end early and drop the audio after it.
pub fn speech_segments(samples: &[f32], sample_rate: u32) -> Vec<std::ops::Range<usize>> {
    let frame_len = (sample_rate as usize * FRAME_MS) / 1000;
    let whole = single_segment(samples.len());
    if frame_len == 0 || samples.len() < frame_len {
        return whole;
    }

    let Some(silence) = silence_mask(samples, frame_len) else {
        return whole;
    };

    let edge = EDGE_KEEP_MS / FRAME_MS;
    let min_run = MIN_SILENCE_MS / FRAME_MS;
    let min_speech = MIN_SEGMENT_SPEECH_MS / FRAME_MS;
    let frame_count = silence.len();

    // Walk the frames, closing the current segment whenever a silent run long
    // enough to confuse the decoder goes by.
    let mut segments: Vec<std::ops::Range<usize>> = Vec::new();
    let mut seg_start: Option<usize> = None;
    let mut speech_frames = 0usize;
    let mut i = 0;

    let close =
        |segments: &mut Vec<std::ops::Range<usize>>, start: usize, end: usize, speech: usize| {
            if speech >= min_speech {
                let from = start.saturating_sub(edge);
                let to = (end + edge).min(frame_count);
                // A trailing partial frame belongs to the last segment: dropping it
                // would clip up to 30 ms off the end of the dictation.
                let end_sample = if to == frame_count {
                    samples.len()
                } else {
                    to * frame_len
                };
                segments.push((from * frame_len)..end_sample);
            }
        };

    while i < frame_count {
        if silence[i] {
            let run_start = i;
            while i < frame_count && silence[i] {
                i += 1;
            }
            if i - run_start >= min_run {
                if let Some(start) = seg_start.take() {
                    close(&mut segments, start, run_start, speech_frames);
                    speech_frames = 0;
                }
            }
            continue;
        }
        if seg_start.is_none() {
            seg_start = Some(i);
        }
        speech_frames += 1;
        i += 1;
    }
    if let Some(start) = seg_start {
        close(&mut segments, start, frame_count, speech_frames);
    }

    if segments.is_empty() {
        return whole;
    }
    merge_short_segments(segments, sample_rate)
}

/// Fold runs shorter than [`MIN_SEGMENT_MS`] into the preceding one, as long as
/// the result stays within [`MAX_SEGMENT_MS`].
///
/// The merged range stays contiguous — it swallows the pause between the two
/// runs rather than splicing them — because a decode is only confused by
/// silence long enough to look like an ending, and the pauses that survive here
/// are short by construction.
fn merge_short_segments(
    segments: Vec<std::ops::Range<usize>>,
    sample_rate: u32,
) -> Vec<std::ops::Range<usize>> {
    let min_len = (sample_rate as usize * MIN_SEGMENT_MS) / 1000;
    let max_len = (sample_rate as usize * MAX_SEGMENT_MS) / 1000;
    let max_gap = (sample_rate as usize * MERGE_MAX_GAP_MS) / 1000;

    let mut merged: Vec<std::ops::Range<usize>> = Vec::with_capacity(segments.len());
    for seg in segments {
        if let Some(last) = merged.last_mut() {
            let either_is_short = last.len() < min_len || seg.len() < min_len;
            let gap = seg.start.saturating_sub(last.end);
            let combined = seg.end - last.start;
            if either_is_short && gap <= max_gap && combined <= max_len {
                last.end = seg.end;
                continue;
            }
        }
        merged.push(seg);
    }
    merged
}

/// Per-frame silence mask, or `None` when the recording has too little dynamic
/// range for the distinction to mean anything (see [`trim_sustained_silence`]).
fn silence_mask(samples: &[f32], frame_len: usize) -> Option<Vec<bool>> {
    let levels: Vec<f32> = samples
        .chunks_exact(frame_len)
        .map(frame_level_db)
        .collect();

    let quiet = percentile_db(&levels, 0.10);
    let loud = percentile_db(&levels, 0.90);
    if loud - quiet < MARGIN_DB {
        return None;
    }

    let mut detector = SilenceDetector::seeded(quiet);
    Some(
        levels
            .iter()
            .map(|level| detector.is_silence(*level))
            .collect(),
    )
}

/// Remove sustained silence from `samples`, keeping [`EDGE_KEEP_MS`] on each
/// side of every removed stretch. Returns the audio to transcribe.
pub fn trim_sustained_silence(samples: &[f32], sample_rate: u32) -> Vec<f32> {
    let frame_len = (sample_rate as usize * FRAME_MS) / 1000;
    if frame_len == 0 || samples.len() < frame_len {
        return samples.to_vec();
    }

    let frames: Vec<&[f32]> = samples.chunks_exact(frame_len).collect();
    let Some(silence) = silence_mask(samples, frame_len) else {
        return samples.to_vec();
    };

    let keep = keep_mask(&silence, FRAME_MS);

    let mut out = Vec::with_capacity(samples.len());
    for (i, frame) in frames.iter().enumerate() {
        if keep[i] {
            out.extend_from_slice(frame);
        }
    }
    // Whatever did not fill a whole frame trails the last frame; keep it.
    let tail = frames.len() * frame_len;
    out.extend_from_slice(&samples[tail..]);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    const SR: u32 = 16_000;
    const FRAME: usize = (SR as usize * FRAME_MS) / 1000;

    /// Build `ms` of a constant-amplitude signal at the requested dBFS. A
    /// square wave keeps RMS equal to its amplitude, so the level is exact.
    fn tone(ms: usize, dbfs: f32) -> Vec<f32> {
        let amp = 10f32.powf(dbfs / 20.0);
        let n = (SR as usize * ms) / 1000;
        (0..n)
            .map(|i| if i % 2 == 0 { amp } else { -amp })
            .collect()
    }

    fn secs(samples: &[f32]) -> f32 {
        samples.len() as f32 / SR as f32
    }

    #[test]
    fn a_recording_without_long_gaps_survives_untouched() {
        // Speech, a 300 ms breath, more speech: nothing here is a sustained
        // silence, so the gate must not touch a single sample.
        let mut audio = tone(1000, -25.0);
        audio.extend(tone(300, -70.0));
        audio.extend(tone(1000, -25.0));

        let out = trim_sustained_silence(&audio, SR);

        assert_eq!(
            out.len(),
            audio.len(),
            "a 300 ms gap is speech rhythm, not silence to cut"
        );
    }

    #[test]
    fn a_long_silence_between_utterances_is_removed() {
        // The shape that loses Charly's dictation: 2 s of silence mid-recording.
        let mut audio = tone(1000, -25.0);
        audio.extend(tone(2000, -70.0));
        audio.extend(tone(1000, -25.0));

        let out = trim_sustained_silence(&audio, SR);

        // 2 s of silence minus the 150 ms kept on each side = 1.7 s removed.
        let expected = secs(&audio) - 1.7;
        assert!(
            (secs(&out) - expected).abs() < 0.05,
            "expected ~{expected:.2}s after cutting the silence, got {:.2}s",
            secs(&out)
        );
    }

    #[test]
    fn speech_is_never_dropped() {
        let mut audio = tone(500, -20.0);
        audio.extend(tone(3000, -70.0));
        audio.extend(tone(500, -20.0));

        let out = trim_sustained_silence(&audio, SR);

        let loud = out.iter().filter(|s| s.abs() > 0.05).count();
        let loud_in = audio.iter().filter(|s| s.abs() > 0.05).count();
        assert_eq!(loud, loud_in, "every speech sample must survive the gate");
    }

    #[test]
    fn a_noisy_room_is_still_recognised_as_silence() {
        // Room tone at -40 dBFS sits ABOVE the absolute floor, so a fixed
        // threshold would keep it. The adaptive floor has to learn it.
        let mut audio = tone(1000, -12.0);
        audio.extend(tone(2000, -40.0));
        audio.extend(tone(1000, -12.0));

        let out = trim_sustained_silence(&audio, SR);

        assert!(
            secs(&out) < secs(&audio) - 1.0,
            "loud room tone must still be gated as silence; only trimmed {:.2}s",
            secs(&audio) - secs(&out)
        );
    }

    #[test]
    fn a_quiet_talker_over_a_quiet_room_is_kept() {
        // The opposite pull: speech at -42 dBFS in a -72 dBFS room. A fixed
        // cutoff tuned for the noisy case above would erase this speaker.
        let mut audio = tone(1000, -72.0);
        audio.extend(tone(1500, -42.0));
        audio.extend(tone(1000, -72.0));

        let out = trim_sustained_silence(&audio, SR);

        let speech = out.iter().filter(|s| s.abs() > 0.005).count();
        let speech_in = audio.iter().filter(|s| s.abs() > 0.005).count();
        assert_eq!(
            speech, speech_in,
            "quiet speech must not be mistaken for room noise"
        );
    }

    #[test]
    fn edges_of_a_removed_silence_are_preserved() {
        let silence = vec![true; 100];
        let keep = keep_mask(&silence, FRAME_MS);
        let kept = keep.iter().filter(|k| **k).count();
        // 150 ms at each end = 5 frames each.
        assert_eq!(kept, 10, "150 ms must survive on each side of the cut");
    }

    fn loud_samples(audio: &[f32]) -> usize {
        audio.iter().filter(|s| s.abs() > 0.02).count()
    }

    #[test]
    fn a_recording_without_long_silence_is_a_single_segment() {
        let mut audio = tone(1000, -25.0);
        audio.extend(tone(300, -70.0));
        audio.extend(tone(1000, -25.0));

        let segs = speech_segments(&audio, SR);

        assert_eq!(segs.len(), 1, "a 300 ms gap must not split the decode");
        assert_eq!(segs[0], 0..audio.len());
    }

    #[test]
    fn a_long_silence_splits_the_recording_in_two() {
        // The shape that truncates Charly's dictation: Whisper hits the 2 s
        // silence, ends the transcript, and drops the second utterance. Two
        // independent decodes cannot lose it.
        let mut audio = tone(1000, -25.0);
        audio.extend(tone(2000, -70.0));
        audio.extend(tone(1000, -25.0));

        let segs = speech_segments(&audio, SR);

        assert_eq!(segs.len(), 2, "a 2 s silence must split the decode");
        assert!(
            segs[0].end < segs[1].start,
            "segments must not overlap: {segs:?}"
        );
    }

    #[test]
    fn every_speech_sample_lands_in_some_segment() {
        let mut audio = tone(800, -22.0);
        audio.extend(tone(1500, -70.0));
        audio.extend(tone(800, -22.0));
        audio.extend(tone(1500, -70.0));
        audio.extend(tone(800, -22.0));

        let segs = speech_segments(&audio, SR);
        let covered: usize = segs.iter().map(|r| loud_samples(&audio[r.clone()])).sum();

        assert_eq!(
            covered,
            loud_samples(&audio),
            "splitting must not drop a single speech sample"
        );
    }

    #[test]
    fn segments_keep_their_padding_but_not_the_whole_silence() {
        let mut audio = tone(1000, -25.0);
        audio.extend(tone(2000, -70.0));
        audio.extend(tone(1000, -25.0));

        let segs = speech_segments(&audio, SR);
        let first_end = segs[0].end as f32 / SR as f32;

        assert!(
            (1.0..=1.25).contains(&first_end),
            "the first segment should end just past the speech (~1.15s), got {first_end:.2}s"
        );
    }

    #[test]
    fn a_fragment_too_short_to_hold_a_word_is_dropped() {
        // A click between two long silences: transcribing it alone is how
        // Whisper hallucinations get into the output.
        let mut audio = tone(1000, -25.0);
        audio.extend(tone(1500, -70.0));
        audio.extend(tone(60, -25.0));
        audio.extend(tone(1500, -70.0));
        audio.extend(tone(1000, -25.0));

        let segs = speech_segments(&audio, SR);

        assert_eq!(
            segs.len(),
            2,
            "a 60 ms blip must not become its own decode: {segs:?}"
        );
    }

    #[test]
    fn a_short_run_is_merged_into_its_neighbour_rather_than_decoded_alone() {
        // Half a second of speech, a pause, then a long run. Decoding that
        // half second on its own is how "Gracias." and "¡Suscríbete al canal!"
        // get invented into transcripts (observed 2026-07-25 on a 0.8 s run),
        // so it has to ride along with the neighbour instead.
        let mut audio = tone(500, -25.0);
        audio.extend(tone(600, -70.0));
        audio.extend(tone(3000, -25.0));

        let segs = speech_segments(&audio, SR);

        assert_eq!(
            segs.len(),
            1,
            "a run too short to decode alone must merge: {segs:?}"
        );
    }

    #[test]
    fn merging_never_builds_a_segment_longer_than_the_cap() {
        // Six long runs separated by pauses: merging must stop at the cap so
        // one decode never swallows the whole recording again.
        let mut audio = Vec::new();
        for _ in 0..6 {
            audio.extend(tone(3000, -25.0));
            audio.extend(tone(600, -70.0));
        }

        let segs = speech_segments(&audio, SR);

        for seg in &segs {
            let secs = seg.len() as f32 / SR as f32;
            assert!(
                secs <= MAX_SEGMENT_MS as f32 / 1000.0 + 0.5,
                "segment of {secs:.1}s exceeds the cap: {segs:?}"
            );
        }
        assert!(segs.len() > 1, "the cap must force more than one decode");
    }

    #[test]
    fn speech_from_end_to_end_stays_one_segment() {
        let audio = tone(3000, -25.0);
        assert_eq!(speech_segments(&audio, SR), vec![0..audio.len()]);
    }

    /// Real corpus, 2026-07-26 — word counts from the plain whole-file decode,
    /// checked against the audio. These two came back complete, so retrying
    /// them segmented would only cost accuracy and time.
    #[test]
    fn complete_dictations_are_not_flagged_as_truncated() {
        for (words, speech, id) in [(160, 39.1, 407), (40, 11.5, 408)] {
            assert!(
                !looks_truncated(words, speech),
                "id {id} ({words} words over {speech}s of speech) came back \
                 complete and must not trigger a segmented retry"
            );
        }
    }

    /// The other three from the same corpus were cut short mid-sentence; the
    /// segmented retry recovered them (id 404 went from 19 words to 35).
    #[test]
    fn dictations_that_came_back_cut_are_flagged() {
        for (words, speech, id) in [(19, 10.2, 404), (10, 4.8, 405), (11, 8.4, 406)] {
            assert!(
                looks_truncated(words, speech),
                "id {id} ({words} words over {speech}s of speech) was cut short \
                 and must trigger a segmented retry"
            );
        }
    }

    #[test]
    fn a_decode_that_gave_up_early_is_flagged() {
        // The 29.4 s recording that returned 9 words out of 68.
        assert!(looks_truncated(9, 20.0));
    }

    #[test]
    fn an_empty_transcript_over_real_speech_is_flagged() {
        assert!(looks_truncated(0, 15.0));
    }

    #[test]
    fn a_clip_too_short_to_judge_is_never_flagged() {
        // Two words in two seconds is an ordinary short answer, not a failure.
        assert!(!looks_truncated(2, 2.0));
        assert!(!looks_truncated(0, 1.0));
    }

    /// Real case, 2026-07-30. A 27,15 s dictation came back with 26 words and
    /// [`looks_truncated`] said no, because the speech measure it divides by
    /// shrinks with recording level: the gate saw 6,90 s of speech in a clip
    /// whose voice sits at −39,6 dBFS, so 26 words looked like a healthy
    /// 3,77 words per speech-second while the real rate was 0,96 over the clip.
    #[test]
    fn the_quiet_27s_dictation_is_flagged_by_duration() {
        assert!(
            looks_truncated_by_duration(26, 27.15),
            "26 words over 27,15 s is a decode that gave up, whatever the \
             speech measure says"
        );
    }

    /// Same corpus, same day: two more that passed as healthy while visibly cut.
    #[test]
    fn other_quiet_dictations_that_slipped_through_are_flagged() {
        assert!(looks_truncated_by_duration(12, 18.6));
        assert!(looks_truncated_by_duration(21, 22.2));
    }

    /// The counterweight. This one came back whole (43 words over 17,2 s) and
    /// must not pay for a retry: without this, the new rule would just flag
    /// everything long.
    #[test]
    fn a_complete_dictation_is_not_flagged_by_duration() {
        assert!(!looks_truncated_by_duration(43, 17.2));
        assert!(!looks_truncated_by_duration(107, 59.9));
        assert!(!looks_truncated_by_duration(94, 56.2));
    }

    /// Short clips stay out of it. A one-word answer in a 5 s clip is normal,
    /// and judging it by rate would flag every quick "sí, dale".
    #[test]
    fn a_short_clip_is_never_flagged_by_duration() {
        assert!(!looks_truncated_by_duration(7, 5.1));
        assert!(!looks_truncated_by_duration(0, 3.0));
        assert!(!looks_truncated_by_duration(1, 9.9));
    }

    #[test]
    fn speech_seconds_ignores_the_silence() {
        let mut audio = tone(1000, -25.0);
        audio.extend(tone(3000, -70.0));
        audio.extend(tone(1000, -25.0));

        let speech = speech_seconds(&audio, SR);

        assert!(
            (speech - 2.0).abs() < 0.35,
            "expected ~2s of speech in a 5s recording, got {speech:.2}s"
        );
    }

    #[test]
    fn short_audio_is_returned_unchanged() {
        let audio = tone(10, -25.0);
        assert_eq!(trim_sustained_silence(&audio, SR).len(), audio.len());
    }

    #[test]
    fn a_partial_trailing_frame_is_not_lost() {
        let mut audio = tone(1000, -25.0);
        audio.extend(vec![0.3f32; FRAME / 2]);
        let out = trim_sustained_silence(&audio, SR);
        assert_eq!(
            out.len(),
            audio.len(),
            "the partial tail frame must survive"
        );
    }
}
