//! System output-volume ducking while recording.
//!
//! Instead of hard-muting the default render endpoint (see
//! `managers::audio::set_mute`), ducking lowers it to a configurable level and
//! restores it afterwards. The decision logic (`plan_duck` / `plan_restore`)
//! and the crash-recovery file are platform-agnostic and unit-tested; only
//! `get_volume` / `set_volume` talk to the OS, and are currently implemented
//! for Windows (WASAPI `IAudioEndpointVolume`). Other platforms keep the
//! existing binary mute.

use log::{debug, info, warn};
use std::path::{Path, PathBuf};

/// Below this difference the volume is considered "already at the target", so
/// ducking is skipped and nothing needs restoring.
const DUCK_EPSILON: f32 = 0.01;

/// How far the current volume may drift from the ducked level and still be
/// treated as "ours" when restoring. If the user moved the volume during the
/// recording, their change wins and we do not restore.
const RESTORE_TOLERANCE: f32 = 0.02;

/// Decide whether ducking should happen. Returns the original volume to save
/// when the current volume is meaningfully above the target; `None` means
/// "do not touch the volume at all" (it is already at or below the target).
pub(crate) fn plan_duck(current: f32, target: f32) -> Option<f32> {
    if current > target + DUCK_EPSILON {
        Some(current)
    } else {
        None
    }
}

/// Decide what volume to restore when recording ends. Returns `Some(original)`
/// only while the current volume still sits at the ducked level (within
/// tolerance); if the user changed the volume mid-recording, returns `None`
/// so their choice is respected.
pub(crate) fn plan_restore(original: f32, ducked_level: f32, current: f32) -> Option<f32> {
    if (current - ducked_level).abs() <= RESTORE_TOLERANCE {
        Some(original)
    } else {
        None
    }
}

/// Where the original volume is persisted so a crash mid-recording can be
/// healed on the next startup.
fn default_recovery_path() -> PathBuf {
    std::env::temp_dir().join("handy_volume_recovery.txt")
}

pub(crate) fn persist_original_volume(path: &Path, volume: f32) {
    if let Err(e) = std::fs::write(path, volume.to_string()) {
        warn!("Could not persist pre-duck volume to {path:?}: {e}");
    }
}

pub(crate) fn load_persisted_volume(path: &Path) -> Option<f32> {
    let contents = std::fs::read_to_string(path).ok()?;
    contents
        .trim()
        .parse::<f32>()
        .ok()
        .map(|v| v.clamp(0.0, 1.0))
}

pub(crate) fn clear_persisted_volume(path: &Path) {
    if path.exists() {
        let _ = std::fs::remove_file(path);
    }
}

/// Apply a persisted pre-duck volume (if any) via `apply`, clearing the file
/// on success. Returns the volume that was restored, `None` when there was
/// nothing to recover or applying failed (the file is kept for a later retry).
pub(crate) fn recover_from_file<F>(path: &Path, apply: F) -> Option<f32>
where
    F: FnOnce(f32) -> Result<(), String>,
{
    let volume = load_persisted_volume(path)?;
    match apply(volume) {
        Ok(()) => {
            clear_persisted_volume(path);
            Some(volume)
        }
        Err(e) => {
            warn!(
                "Could not restore persisted volume {:.0}%: {e}; keeping {path:?} for a later retry",
                volume * 100.0
            );
            None
        }
    }
}

/// Duck the system output volume to `level`, returning the original volume
/// when ducking was applied (callers must keep it to restore later). `None`
/// means nothing was changed — unsupported platform, volume already at or
/// below the target, or the OS call failed.
pub fn duck_to(level: f32) -> Option<f32> {
    let level = level.clamp(0.0, 1.0);
    let current = match get_volume() {
        Ok(v) => v,
        Err(e) => {
            warn!("Ducking skipped: could not read system volume: {e}");
            return None;
        }
    };
    let original = plan_duck(current, level)?;
    persist_original_volume(&default_recovery_path(), original);
    match set_volume(level) {
        Ok(()) => {
            info!(
                "System volume ducked from {:.0}% to {:.0}%",
                original * 100.0,
                level * 100.0
            );
            Some(original)
        }
        Err(e) => {
            warn!("Ducking failed: could not set system volume: {e}");
            clear_persisted_volume(&default_recovery_path());
            None
        }
    }
}

/// Restore the volume saved by [`duck_to`]. Respects a manual volume change
/// made during the recording (see [`plan_restore`]); the recovery file is
/// cleared in every case.
pub fn restore_from_duck(original: f32, ducked_level: f32) {
    match get_volume() {
        Ok(current) => match plan_restore(original, ducked_level, current) {
            Some(volume) => {
                if let Err(e) = set_volume(volume) {
                    warn!(
                        "Could not restore system volume to {:.0}%: {e}",
                        volume * 100.0
                    );
                } else {
                    info!("System volume restored to {:.0}%", volume * 100.0);
                }
            }
            None => {
                debug!("Volume changed during recording; leaving it as the user set it");
            }
        },
        Err(e) => warn!("Could not read system volume during restore: {e}"),
    }
    clear_persisted_volume(&default_recovery_path());
}

/// Heal a crash that happened while ducking was active: if a previous session
/// left a persisted original volume behind, restore it. Call once at startup.
pub fn recover_volume_on_startup() {
    if let Some(volume) = recover_from_file(&default_recovery_path(), set_volume) {
        info!(
            "Restored system volume to {:.0}% left ducked by a previous session",
            volume * 100.0
        );
    }
}

#[cfg(target_os = "windows")]
fn get_volume() -> Result<f32, String> {
    windows_impl::get_volume()
}

#[cfg(target_os = "windows")]
fn set_volume(level: f32) -> Result<(), String> {
    windows_impl::set_volume(level)
}

#[cfg(not(target_os = "windows"))]
fn get_volume() -> Result<f32, String> {
    Err("system volume ducking is only implemented on Windows".into())
}

#[cfg(not(target_os = "windows"))]
fn set_volume(_level: f32) -> Result<(), String> {
    Err("system volume ducking is only implemented on Windows".into())
}

/// WASAPI master-volume access on the default render endpoint — the same
/// device and COM pattern `managers::audio::set_mute` already uses.
#[cfg(target_os = "windows")]
mod windows_impl {
    use windows::Win32::{
        Media::Audio::{
            eMultimedia, eRender, Endpoints::IAudioEndpointVolume, IMMDeviceEnumerator,
            MMDeviceEnumerator,
        },
        System::Com::{CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_MULTITHREADED},
    };

    fn volume_interface() -> Result<IAudioEndpointVolume, String> {
        unsafe {
            // No-op when COM is already initialized on this thread (e.g. by Tauri).
            let _ = CoInitializeEx(None, COINIT_MULTITHREADED);
            let enumerator: IMMDeviceEnumerator =
                CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)
                    .map_err(|e| format!("device enumerator: {e}"))?;
            let device = enumerator
                .GetDefaultAudioEndpoint(eRender, eMultimedia)
                .map_err(|e| format!("default audio endpoint: {e}"))?;
            device
                .Activate::<IAudioEndpointVolume>(CLSCTX_ALL, None)
                .map_err(|e| format!("volume interface: {e}"))
        }
    }

    pub fn get_volume() -> Result<f32, String> {
        unsafe {
            volume_interface()?
                .GetMasterVolumeLevelScalar()
                .map_err(|e| format!("get master volume: {e}"))
        }
    }

    pub fn set_volume(level: f32) -> Result<(), String> {
        unsafe {
            volume_interface()?
                .SetMasterVolumeLevelScalar(level, std::ptr::null())
                .map_err(|e| format!("set master volume: {e}"))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn plan_duck_returns_original_when_above_target() {
        assert_eq!(plan_duck(0.8, 0.2), Some(0.8));
    }

    #[test]
    fn plan_duck_skips_when_volume_already_at_or_below_target() {
        // Anti-#1584: never raise the volume by "ducking" upwards, and never
        // record an original that would restore to a louder level.
        assert_eq!(plan_duck(0.15, 0.2), None);
        assert_eq!(plan_duck(0.2, 0.2), None);
        assert_eq!(plan_duck(0.0, 0.0), None);
    }

    #[test]
    fn plan_restore_returns_original_while_still_ducked() {
        assert_eq!(plan_restore(0.8, 0.2, 0.2), Some(0.8));
        // Small driver rounding drift still counts as "ours".
        assert_eq!(plan_restore(0.8, 0.2, 0.21), Some(0.8));
    }

    #[test]
    fn plan_restore_respects_user_change_during_recording() {
        // Anti-#1501: the user turned the volume up (or down) mid-recording;
        // restoring would stomp their choice.
        assert_eq!(plan_restore(0.8, 0.2, 0.5), None);
        assert_eq!(plan_restore(0.8, 0.2, 0.0), None);
    }

    #[test]
    fn recovery_file_roundtrip() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("recovery.txt");
        persist_original_volume(&path, 0.73);
        assert_eq!(load_persisted_volume(&path), Some(0.73));
        clear_persisted_volume(&path);
        assert_eq!(load_persisted_volume(&path), None);
    }

    #[test]
    fn load_persisted_volume_rejects_garbage() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("recovery.txt");
        std::fs::write(&path, "not a number").unwrap();
        assert_eq!(load_persisted_volume(&path), None);
    }

    #[test]
    fn recover_from_file_applies_and_clears() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("recovery.txt");
        persist_original_volume(&path, 0.6);

        let mut applied = None;
        let recovered = recover_from_file(&path, |v| {
            applied = Some(v);
            Ok(())
        });

        assert_eq!(recovered, Some(0.6));
        assert_eq!(applied, Some(0.6));
        assert_eq!(load_persisted_volume(&path), None, "file must be cleared");
    }

    #[test]
    fn recover_from_file_is_noop_without_file() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("recovery.txt");
        let recovered = recover_from_file(&path, |_| panic!("must not be called"));
        assert_eq!(recovered, None);
    }

    #[test]
    fn recover_from_file_keeps_file_when_apply_fails() {
        // If setting the volume fails at startup, keep the file so a later
        // start can retry instead of silently losing the user's volume.
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("recovery.txt");
        persist_original_volume(&path, 0.6);

        let recovered = recover_from_file(&path, |_| Err("audio device busy".into()));

        assert_eq!(recovered, None);
        assert_eq!(load_persisted_volume(&path), Some(0.6));
    }
}
