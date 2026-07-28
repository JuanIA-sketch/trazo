use crate::actions::ACTION_MAP;
use crate::managers::audio::AudioRecordingManager;
use crate::shortcut::tap_gesture::{Gesture, TapGestureDetector};
use log::{debug, error, warn};
use std::sync::mpsc::{self, Sender};
use std::sync::Arc;
use std::thread;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Manager};

const DEBOUNCE: Duration = Duration::from_millis(30);

/// Commands processed sequentially by the coordinator thread.
enum Command {
    Input {
        binding_id: String,
        hotkey_string: String,
        is_pressed: bool,
        push_to_talk: bool,
        /// When the key event actually happened, captured in the shortcut
        /// layer. Carried through the channel because this thread can be
        /// blocked inside `start()` when the event is finally dequeued.
        at: Instant,
    },
    Cancel {
        recording_was_active: bool,
    },
    ProcessingFinished,
}

/// Pipeline lifecycle, owned exclusively by the coordinator thread.
enum Stage {
    Idle,
    Recording(String), // binding_id
    Processing,
}

/// Serialises all transcription lifecycle events through a single thread
/// to eliminate race conditions between keyboard shortcuts, signals, and
/// the async transcribe-paste pipeline.
pub struct TranscriptionCoordinator {
    tx: Sender<Command>,
}

pub fn is_transcribe_binding(id: &str) -> bool {
    id == "transcribe" || id == "transcribe_with_post_process"
}

impl TranscriptionCoordinator {
    pub fn new(app: AppHandle) -> Self {
        let (tx, rx) = mpsc::channel();

        thread::spawn(move || {
            let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                let mut stage = Stage::Idle;
                let mut last_press: Option<Instant> = None;
                // Tap-gesture state for push-to-talk (double-tap latches
                // continuous capture). Tracks only the binding that started
                // the capture; other bindings keep the old busy semantics.
                let mut gesture = TapGestureDetector::new();
                let mut gesture_binding: Option<(String, String)> = None;

                loop {
                    // While a tap is pending its double-tap window, wake up at
                    // the deadline even if no input arrives.
                    let cmd = match gesture.deadline() {
                        Some(deadline) => {
                            let timeout = deadline.saturating_duration_since(Instant::now());
                            match rx.recv_timeout(timeout) {
                                Ok(cmd) => Some(cmd),
                                Err(mpsc::RecvTimeoutError::Timeout) => None,
                                Err(mpsc::RecvTimeoutError::Disconnected) => break,
                            }
                        }
                        None => match rx.recv() {
                            Ok(cmd) => Some(cmd),
                            Err(_) => break,
                        },
                    };

                    let Some(cmd) = cmd else {
                        // The pending tap never became a double-tap: perform
                        // the deferred PTT stop.
                        if gesture.on_deadline(Instant::now()) == Some(Gesture::PendingExpired) {
                            if let Some((binding_id, hotkey_string)) = gesture_binding.take() {
                                if matches!(&stage, Stage::Recording(id) if id == &binding_id) {
                                    stop(&app, &mut stage, &binding_id, &hotkey_string);
                                }
                            }
                        }
                        continue;
                    };

                    match cmd {
                        Command::Input {
                            binding_id,
                            hotkey_string,
                            is_pressed,
                            push_to_talk,
                            at,
                        } => {
                            // Debounce rapid-fire press events (key repeat).
                            // Releases always pass through for push-to-talk.
                            if is_pressed {
                                // Same reason as `classify_input`: compare the
                                // instants the presses happened at, not the
                                // instants this thread got to them. Two presses
                                // that queued up during a blocking `start()`
                                // are dequeued back-to-back, and would
                                // otherwise be debounced away as key repeat.
                                if last_press
                                    .is_some_and(|t| at.saturating_duration_since(t) < DEBOUNCE)
                                {
                                    debug!("Debounced press for '{binding_id}'");
                                    continue;
                                }
                                last_press = Some(at);
                            }

                            if push_to_talk {
                                // Only the binding that owns the current
                                // gesture may feed the detector; a second
                                // binding while busy is ignored, as before.
                                let owns_gesture = gesture_binding
                                    .as_ref()
                                    .is_none_or(|(id, _)| *id == binding_id);
                                if !owns_gesture {
                                    debug!(
                                        "Ignoring '{binding_id}': another binding owns the capture"
                                    );
                                    continue;
                                }

                                let g = classify_input(&mut gesture, is_pressed, at);
                                match g {
                                    Gesture::HoldStart => {
                                        if matches!(stage, Stage::Idle) {
                                            start(&app, &mut stage, &binding_id, &hotkey_string);
                                        }
                                        if matches!(stage, Stage::Recording(_)) {
                                            gesture_binding =
                                                Some((binding_id.clone(), hotkey_string.clone()));
                                        } else {
                                            // Busy or failed start: the press
                                            // must not leave a hold armed.
                                            gesture.reset();
                                        }
                                    }
                                    Gesture::HoldEnd | Gesture::LatchedPress => {
                                        gesture_binding = None;
                                        if matches!(&stage, Stage::Recording(id) if id == &binding_id)
                                        {
                                            stop(&app, &mut stage, &binding_id, &hotkey_string);
                                        }
                                    }
                                    Gesture::DoubleTap => {
                                        // Latched: capture continues with no key
                                        // held — the overlay must say so.
                                        if matches!(&stage, Stage::Recording(id) if id == &binding_id)
                                        {
                                            crate::overlay::show_continuous_overlay(&app);
                                        }
                                    }
                                    Gesture::TapPending => {
                                        // Keep recording; deadline armed above.
                                    }
                                    Gesture::PendingExpired | Gesture::Ignored => {}
                                }
                            } else if is_pressed {
                                match &stage {
                                    Stage::Idle => {
                                        start(&app, &mut stage, &binding_id, &hotkey_string);
                                    }
                                    Stage::Recording(id) if id == &binding_id => {
                                        stop(&app, &mut stage, &binding_id, &hotkey_string);
                                    }
                                    _ => {
                                        debug!("Ignoring press for '{binding_id}': pipeline busy")
                                    }
                                }
                            }
                        }
                        Command::Cancel {
                            recording_was_active,
                        } => {
                            // Don't reset during processing — wait for the pipeline to finish.
                            if !matches!(stage, Stage::Processing)
                                && (recording_was_active || matches!(stage, Stage::Recording(_)))
                            {
                                stage = Stage::Idle;
                            }
                            gesture.reset();
                            gesture_binding = None;
                        }
                        Command::ProcessingFinished => {
                            stage = Stage::Idle;
                            gesture.reset();
                            gesture_binding = None;
                        }
                    }
                }
                debug!("Transcription coordinator exited");
            }));
            if let Err(e) = result {
                error!("Transcription coordinator panicked: {e:?}");
            }
        });

        Self { tx }
    }

    /// Send a keyboard/signal input event for a transcribe binding.
    /// For signal-based toggles, use `is_pressed: true` and `push_to_talk: false`.
    ///
    /// `at` must be captured as close to the real key event as possible — the
    /// coordinator thread may be busy starting a capture when this lands, and
    /// re-reading the clock there would misjudge the gesture's timing.
    pub fn send_input(
        &self,
        binding_id: &str,
        hotkey_string: &str,
        is_pressed: bool,
        push_to_talk: bool,
        at: Instant,
    ) {
        if self
            .tx
            .send(Command::Input {
                binding_id: binding_id.to_string(),
                hotkey_string: hotkey_string.to_string(),
                is_pressed,
                push_to_talk,
                at,
            })
            .is_err()
        {
            warn!("Transcription coordinator channel closed");
        }
    }

    pub fn notify_cancel(&self, recording_was_active: bool) {
        if self
            .tx
            .send(Command::Cancel {
                recording_was_active,
            })
            .is_err()
        {
            warn!("Transcription coordinator channel closed");
        }
    }

    pub fn notify_processing_finished(&self) {
        if self.tx.send(Command::ProcessingFinished).is_err() {
            warn!("Transcription coordinator channel closed");
        }
    }
}

/// Feed one push-to-talk input into the tap detector.
///
/// `at` is when the key event actually happened, captured in the shortcut
/// layer. It must NOT be re-read from the clock here: [`start`] runs
/// `TranscribeAction::start` synchronously on the coordinator thread and can
/// block it for hundreds of milliseconds (measured 298-774 ms), during which
/// further key events queue up. Timing a gesture against the dequeue instant
/// inflates every hold by that delay, which turns a tap into a `HoldEnd` and
/// stops the capture the user just started.
fn classify_input(gesture: &mut TapGestureDetector, is_pressed: bool, at: Instant) -> Gesture {
    if is_pressed {
        gesture.on_press(at)
    } else {
        gesture.on_release(at)
    }
}

fn start(app: &AppHandle, stage: &mut Stage, binding_id: &str, hotkey_string: &str) {
    let Some(action) = ACTION_MAP.get(binding_id) else {
        warn!("No action in ACTION_MAP for '{binding_id}'");
        return;
    };
    action.start(app, binding_id, hotkey_string);
    if app
        .try_state::<Arc<AudioRecordingManager>>()
        .is_some_and(|a| a.is_recording())
    {
        *stage = Stage::Recording(binding_id.to_string());
    } else {
        debug!("Start for '{binding_id}' did not begin recording; staying idle");
    }
}

fn stop(app: &AppHandle, stage: &mut Stage, binding_id: &str, hotkey_string: &str) {
    let Some(action) = ACTION_MAP.get(binding_id) else {
        warn!("No action in ACTION_MAP for '{binding_id}'");
        return;
    };
    action.stop(app, binding_id, hotkey_string);
    *stage = Stage::Processing;
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Regresión 2026-07-25 — bug "la tecla Alt corta el dictado" (§3.1 del
    /// handoff). `start()` ejecuta `TranscribeAction::start` de forma SÍNCRONA
    /// sobre el hilo del coordinador: abre el micrófono, cambia el icono del
    /// tray y muestra el overlay. Medido en `handy.log`, eso tarda 298–774 ms,
    /// y mientras tanto los eventos de teclado se acumulan en el canal.
    ///
    /// El 2026-07-25 a las 14:36:33 el arranque bloqueó 774,57 ms con el
    /// doble-tap de Charly ya encolado. Al desencolar el release, medir el
    /// hold contra el reloj de ESE instante convertía un tap de ~150 ms en un
    /// hold de 774 ms → `HoldEnd` → parada inmediata → `sample count: 0`,
    /// dictado entero perdido. Fue el único arranque del día que superó
    /// `TAP_MS` (600 ms) y el único dictado que murió: 4 de 4.
    ///
    /// El `sleep` reproduce ese bloqueo. Es la única forma de exponer el
    /// sesgo, porque el fallo es exactamente "el reloj avanzó entre el evento
    /// y su procesamiento".
    #[test]
    fn a_tap_dequeued_after_a_blocking_start_is_still_a_tap() {
        let mut gesture = TapGestureDetector::new();
        let pressed_at = Instant::now();
        let released_at = pressed_at + Duration::from_millis(150);

        assert_eq!(
            classify_input(&mut gesture, true, pressed_at),
            Gesture::HoldStart
        );

        // El coordinador queda atrapado dentro de `start()` mientras el
        // release espera su turno en el canal.
        thread::sleep(Duration::from_millis(700));

        assert_eq!(
            classify_input(&mut gesture, false, released_at),
            Gesture::TapPending,
            "un tap de 150 ms debe seguir siendo un tap aunque se desencole \
             700 ms tarde; medirlo contra el reloj de desencolado lo vuelve \
             HoldEnd y mata el dictado"
        );
    }

    /// La otra mitad del contrato: el arreglo no puede lograrse ignorando el
    /// tiempo. Un hold REAL de 800 ms procesado sin demora debe seguir siendo
    /// `HoldEnd`, o el PTT por mantener dejaría de parar al soltar.
    #[test]
    fn a_real_long_hold_is_still_a_hold_when_dequeued_immediately() {
        let mut gesture = TapGestureDetector::new();
        let pressed_at = Instant::now();

        assert_eq!(
            classify_input(&mut gesture, true, pressed_at),
            Gesture::HoldStart
        );
        assert_eq!(
            classify_input(&mut gesture, false, pressed_at + Duration::from_millis(800)),
            Gesture::HoldEnd,
            "el hold debe leerse del timestamp del evento, no del reloj del \
             coordinador"
        );
    }
}
