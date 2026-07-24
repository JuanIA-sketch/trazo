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
                        } => {
                            // Debounce rapid-fire press events (key repeat).
                            // Releases always pass through for push-to-talk.
                            if is_pressed {
                                let now = Instant::now();
                                if last_press.is_some_and(|t| now.duration_since(t) < DEBOUNCE) {
                                    debug!("Debounced press for '{binding_id}'");
                                    continue;
                                }
                                last_press = Some(now);
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

                                let now = Instant::now();
                                let g = if is_pressed {
                                    gesture.on_press(now)
                                } else {
                                    gesture.on_release(now)
                                };
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
    pub fn send_input(
        &self,
        binding_id: &str,
        hotkey_string: &str,
        is_pressed: bool,
        push_to_talk: bool,
    ) {
        if self
            .tx
            .send(Command::Input {
                binding_id: binding_id.to_string(),
                hotkey_string: hotkey_string.to_string(),
                is_pressed,
                push_to_talk,
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
