//! Tap-gesture classification for hotkey inputs, with injected timestamps so
//! the timing rules are unit-testable. Deliberately self-contained: a future
//! Command Mode that needs hotkey gestures should extend this detector
//! instead of adding timing logic to the coordinator.

use std::time::{Duration, Instant};

/// A hold shorter than this is a "tap" (a real push-to-talk dictation always
/// holds longer); a release after a tap waits for a possible second tap.
/// 600 ms (2nd live pass, 2026-07-24): the real shortcut is a CHORD
/// (Ctrl+Space) — pressing and releasing two keys cleanly runs ~500-550 ms,
/// which the earlier 450 ms still classified as a hold. Even a one-word
/// dictation (press, speak, release) holds well past 600 ms, and a
/// misclassified ultra-short dictation only pays the pending window as extra
/// latency, never loses audio.
pub const TAP_MS: Duration = Duration::from_millis(600);
/// How long after a tap's release a second press still counts as a double-tap.
/// 800 ms (2nd live pass): re-pressing a two-key chord gaps ~600-700 ms;
/// 550 ms still took several attempts. The only cost of a wider window is a
/// slightly later stop after an accidental single tap.
pub const DOUBLE_TAP_WINDOW: Duration = Duration::from_millis(800);

#[derive(Debug, PartialEq, Eq, Clone, Copy)]
pub enum Gesture {
    /// Press from idle: begin capturing (normal PTT start).
    HoldStart,
    /// Release after a long hold: normal PTT stop.
    HoldEnd,
    /// Release after a short hold: keep capturing, await a second tap until
    /// `deadline()`.
    TapPending,
    /// Second press within the window: latch continuous capture.
    DoubleTap,
    /// The pending-tap window expired with no second press: stop now.
    PendingExpired,
    /// Press while latched: end continuous capture.
    LatchedPress,
    /// Input that means nothing in the current state (e.g. releases while
    /// latched).
    Ignored,
}

enum State {
    Idle,
    Holding { pressed_at: Instant },
    TapPending { deadline: Instant },
    Latched,
}

pub struct TapGestureDetector {
    state: State,
}

impl TapGestureDetector {
    pub fn new() -> Self {
        Self { state: State::Idle }
    }

    pub fn on_press(&mut self, now: Instant) -> Gesture {
        match self.state {
            State::Idle => {
                self.state = State::Holding { pressed_at: now };
                Gesture::HoldStart
            }
            State::TapPending { deadline } if now <= deadline => {
                self.state = State::Latched;
                Gesture::DoubleTap
            }
            // A press after the window expired but before the caller polled
            // the deadline behaves like the expiry was handled: treat it as
            // noise; the caller's next on_deadline will stop the capture.
            State::TapPending { .. } => Gesture::Ignored,
            State::Holding { .. } => Gesture::Ignored,
            State::Latched => {
                self.state = State::Idle;
                Gesture::LatchedPress
            }
        }
    }

    pub fn on_release(&mut self, now: Instant) -> Gesture {
        match self.state {
            State::Holding { pressed_at } => {
                if now.duration_since(pressed_at) < TAP_MS {
                    self.state = State::TapPending {
                        deadline: now + DOUBLE_TAP_WINDOW,
                    };
                    Gesture::TapPending
                } else {
                    self.state = State::Idle;
                    Gesture::HoldEnd
                }
            }
            _ => Gesture::Ignored,
        }
    }

    /// When Some, the caller must invoke `on_deadline` at (or after) this
    /// instant even if no input arrives.
    pub fn deadline(&self) -> Option<Instant> {
        match self.state {
            State::TapPending { deadline } => Some(deadline),
            _ => None,
        }
    }

    /// Returns Some(PendingExpired) when the pending-tap window is over.
    pub fn on_deadline(&mut self, now: Instant) -> Option<Gesture> {
        match self.state {
            State::TapPending { deadline } if now >= deadline => {
                self.state = State::Idle;
                Some(Gesture::PendingExpired)
            }
            _ => None,
        }
    }

    /// Back to idle (cancel, processing finished).
    pub fn reset(&mut self) {
        self.state = State::Idle;
    }
}

impl Default for TapGestureDetector {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn t0() -> Instant {
        Instant::now()
    }
    fn ms(base: Instant, offset: u64) -> Instant {
        base + Duration::from_millis(offset)
    }

    #[test]
    fn press_from_idle_starts_a_hold() {
        let mut d = TapGestureDetector::new();
        assert_eq!(d.on_press(t0()), Gesture::HoldStart);
    }

    #[test]
    fn long_hold_release_is_a_normal_ptt_stop() {
        let mut d = TapGestureDetector::new();
        let base = t0();
        d.on_press(base);
        assert_eq!(d.on_release(ms(base, 800)), Gesture::HoldEnd);
        // Back to idle: the next press is a fresh hold.
        assert_eq!(d.on_press(ms(base, 2000)), Gesture::HoldStart);
    }

    #[test]
    fn short_hold_release_pends_and_arms_a_deadline() {
        let mut d = TapGestureDetector::new();
        let base = t0();
        d.on_press(base);
        assert_eq!(d.on_release(ms(base, 100)), Gesture::TapPending);
        assert_eq!(d.deadline(), Some(ms(base, 100) + DOUBLE_TAP_WINDOW));
    }

    #[test]
    fn second_press_within_window_latches_continuous() {
        let mut d = TapGestureDetector::new();
        let base = t0();
        d.on_press(base);
        d.on_release(ms(base, 100));
        assert_eq!(d.on_press(ms(base, 250)), Gesture::DoubleTap);
        // Latched: no deadline pending, its release is noise.
        assert_eq!(d.deadline(), None);
        assert_eq!(d.on_release(ms(base, 300)), Gesture::Ignored);
    }

    #[test]
    fn expired_window_reports_pending_expired_once() {
        let mut d = TapGestureDetector::new();
        let base = t0();
        d.on_press(base);
        d.on_release(ms(base, 100));
        let after = ms(base, 100) + DOUBLE_TAP_WINDOW + Duration::from_millis(1);
        assert_eq!(d.on_deadline(after), Some(Gesture::PendingExpired));
        assert_eq!(d.on_deadline(after), None);
        assert_eq!(d.deadline(), None);
    }

    #[test]
    fn deadline_not_yet_due_reports_nothing() {
        let mut d = TapGestureDetector::new();
        let base = t0();
        d.on_press(base);
        d.on_release(ms(base, 100));
        assert_eq!(d.on_deadline(ms(base, 200)), None);
        // Still armed.
        assert!(d.deadline().is_some());
    }

    #[test]
    fn press_while_latched_ends_continuous_and_returns_to_idle() {
        let mut d = TapGestureDetector::new();
        let base = t0();
        d.on_press(base);
        d.on_release(ms(base, 100));
        d.on_press(ms(base, 250));
        assert_eq!(d.on_press(ms(base, 5000)), Gesture::LatchedPress);
        assert_eq!(d.on_press(ms(base, 6000)), Gesture::HoldStart);
    }

    /// Regresión 2026-07-24 (validación en vivo de Charly): con 250 ms de
    /// hold y 350 ms de ventana, un doble-tap humano realista (~180 ms de
    /// hold, ~400 ms entre taps) casi nunca latcheaba — hacían falta varios
    /// intentos. El gesto debe aceptar timing humano relajado.
    #[test]
    fn relaxed_human_double_tap_latches() {
        let mut d = TapGestureDetector::new();
        let base = t0();
        d.on_press(base);
        assert_eq!(d.on_release(ms(base, 180)), Gesture::TapPending);
        // Second press 400 ms after the release — comfortably human.
        assert_eq!(d.on_press(ms(base, 580)), Gesture::DoubleTap);
    }

    /// Un tap algo torpe (~350 ms de hold) también debe contar como tap, no
    /// como dictado por mantener.
    #[test]
    fn sloppy_short_hold_still_counts_as_a_tap() {
        let mut d = TapGestureDetector::new();
        let base = t0();
        d.on_press(base);
        assert_eq!(d.on_release(ms(base, 350)), Gesture::TapPending);
    }

    /// Regresión 2026-07-24, segunda pasada en vivo: el atajo real es un
    /// ACORDE (Ctrl+Espacio) — bajar y soltar dos teclas alarga el hold
    /// (~550 ms) y re-presionar el acorde abre huecos de ~700 ms entre taps.
    /// Con 450/550 el doble-tap seguía costando varios intentos; el perfil
    /// de acorde relajado debe latchear a la primera.
    #[test]
    fn relaxed_chord_double_tap_latches() {
        let mut d = TapGestureDetector::new();
        let base = t0();
        d.on_press(base);
        assert_eq!(d.on_release(ms(base, 550)), Gesture::TapPending);
        // Segundo acorde 700 ms después de soltar el primero.
        assert_eq!(d.on_press(ms(base, 1250)), Gesture::DoubleTap);
    }

    #[test]
    fn reset_returns_to_idle_from_any_state() {
        let mut d = TapGestureDetector::new();
        let base = t0();
        d.on_press(base);
        d.on_release(ms(base, 100));
        d.on_press(ms(base, 250)); // latched
        d.reset();
        assert_eq!(d.deadline(), None);
        assert_eq!(d.on_press(ms(base, 400)), Gesture::HoldStart);
    }
}
