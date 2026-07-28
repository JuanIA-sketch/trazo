//! One-time migration from the pre-rebrand identity (`com.pais.handy` /
//! "Handy") to the current one.
//!
//! Two things are keyed to the app's identity and both break when it changes:
//!
//! 1. **The app-data directory.** Tauri derives it from `identifier`, so
//!    changing the identifier silently points the app at an empty directory —
//!    settings, transcription history, saved recordings and stored API keys all
//!    appear to have vanished.
//! 2. **The autostart registration.** `tauri-plugin-autostart` registers under
//!    the app's name and executable path. After a rename the old entry survives,
//!    pointing at a binary that no longer exists, so the OS tries to launch it
//!    every login and quietly fails.
//!
//! The data is **copied, not moved**: if anything about the new build goes
//! wrong, the previous install is still intact and reinstalling the old version
//! finds its data where it left it.

use std::path::{Path, PathBuf};

/// Previous app-data directory name (Tauri's `identifier` before the rebrand).
pub const LEGACY_IDENTIFIER: &str = "com.pais.handy";

/// Previous `productName`, which is what autostart registered under.
pub const LEGACY_PRODUCT_NAME: &str = "Handy";

/// Presence of this file is what makes a directory "an install with data in
/// it", rather than an empty directory Tauri created on startup.
const SETTINGS_FILE: &str = "settings_store.json";

/// Whether the legacy directory should be copied into the current one.
///
/// Deliberately keyed on the settings file rather than on the directory
/// existing: Tauri creates the app-data directory before this runs, so
/// "the new directory exists" is always true and would block every migration.
pub fn should_migrate(legacy_dir: &Path, current_dir: &Path) -> bool {
    legacy_dir.join(SETTINGS_FILE).is_file() && !current_dir.join(SETTINGS_FILE).is_file()
}

/// Recursively copy `from` into `to`, returning how many files were copied.
pub fn copy_dir_all(from: &Path, to: &Path) -> std::io::Result<usize> {
    std::fs::create_dir_all(to)?;
    let mut copied = 0usize;
    for entry in std::fs::read_dir(from)? {
        let entry = entry?;
        let target = to.join(entry.file_name());
        if entry.file_type()?.is_dir() {
            copied += copy_dir_all(&entry.path(), &target)?;
        } else {
            std::fs::copy(entry.path(), &target)?;
            copied += 1;
        }
    }
    Ok(copied)
}

/// Autostart entries the previous branding may have left behind.
///
/// Generous on purpose: which name `tauri-plugin-autostart` used depends on its
/// version and platform, and deleting a path that was never created is a no-op,
/// while leaving a stale one behind means a failed launch at every login.
pub fn legacy_autostart_files(home: &Path) -> Vec<PathBuf> {
    vec![
        // macOS launch agents, by product name and by bundle identifier —
        // which of the two the plugin used depends on its version.
        home.join("Library/LaunchAgents")
            .join(format!("{LEGACY_PRODUCT_NAME}.plist")),
        home.join("Library/LaunchAgents")
            .join(format!("{LEGACY_IDENTIFIER}.plist")),
        // XDG autostart entries on Linux.
        home.join(".config/autostart")
            .join(format!("{LEGACY_PRODUCT_NAME}.desktop")),
        home.join(".config/autostart")
            .join(format!("{LEGACY_IDENTIFIER}.desktop")),
    ]
}

/// The message to log when applying the autostart setting fails.
///
/// `None` when it succeeded. Exists as a pure function because the failure used
/// to be discarded entirely (`let _ = manager.enable();`), which left the
/// toggle reading "on" in the UI while nothing was registered.
pub fn autostart_failure_message(enabled: bool, error: Option<&str>) -> Option<String> {
    let error = error?;
    let action = if enabled { "enable" } else { "disable" };
    Some(format!(
        "Failed to {action} autostart: {error}. The setting is saved but the OS did not register it, so launch-on-login will not match what Settings shows."
    ))
}

/// Run every one-time rebrand fix-up. Safe to call on each start: each step
/// checks whether it has anything to do.
pub fn run(app: &tauri::AppHandle) {
    migrate_app_data(app);
    cleanup_legacy_autostart();
}

/// Copy the previous install's data into the current app-data directory, once.
fn migrate_app_data(app: &tauri::AppHandle) {
    let Ok(current) = crate::portable::app_data_dir(app) else {
        return;
    };
    // Portable installs keep their data next to the executable, so they never
    // had an identifier-derived directory to migrate from.
    if crate::portable::data_dir().is_some() {
        return;
    }
    let Some(parent) = current.parent() else {
        return;
    };
    let legacy = parent.join(LEGACY_IDENTIFIER);
    if !should_migrate(&legacy, &current) {
        return;
    }

    log::info!(
        "Rebrand: copying data from {} into {}",
        legacy.display(),
        current.display()
    );
    match copy_dir_all(&legacy, &current) {
        Ok(n) => {
            log::info!("Rebrand: migrated {n} file(s); the previous directory was left in place")
        }
        // Non-fatal on purpose: a failed copy means starting fresh, which is
        // recoverable by hand, whereas refusing to start is not.
        Err(e) => log::warn!("Rebrand: could not migrate previous data: {e}"),
    }
}

/// Remove autostart entries left by the previous branding. They point at an
/// executable that no longer exists, so the OS retries a doomed launch at every
/// login while the current registration lives under the new name.
fn cleanup_legacy_autostart() {
    if let Some(home) = home_dir() {
        for path in legacy_autostart_files(&home) {
            if path.is_file() {
                match std::fs::remove_file(&path) {
                    Ok(()) => {
                        log::info!("Rebrand: removed stale autostart entry {}", path.display())
                    }
                    Err(e) => log::warn!("Rebrand: could not remove {}: {e}", path.display()),
                }
            }
        }
    }

    #[cfg(windows)]
    {
        use winreg::enums::{HKEY_CURRENT_USER, KEY_ALL_ACCESS};
        use winreg::RegKey;

        let run = RegKey::predef(HKEY_CURRENT_USER).open_subkey_with_flags(
            r"Software\Microsoft\Windows\CurrentVersion\Run",
            KEY_ALL_ACCESS,
        );
        if let Ok(run) = run {
            for name in [LEGACY_PRODUCT_NAME, LEGACY_IDENTIFIER] {
                if run.get_value::<String, _>(name).is_ok() {
                    match run.delete_value(name) {
                        Ok(()) => log::info!("Rebrand: removed stale Run entry '{name}'"),
                        Err(e) => log::warn!("Rebrand: could not remove Run entry '{name}': {e}"),
                    }
                }
            }
        }
    }
}

fn home_dir() -> Option<PathBuf> {
    #[cfg(windows)]
    let key = "USERPROFILE";
    #[cfg(not(windows))]
    let key = "HOME";
    std::env::var_os(key).map(PathBuf::from)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Unique scratch directory per test, removed on drop.
    struct TempDir(PathBuf);

    impl TempDir {
        fn new(tag: &str) -> Self {
            let mut p = std::env::temp_dir();
            p.push(format!(
                "trazo-rebrand-{tag}-{}-{:?}",
                std::process::id(),
                std::thread::current().id()
            ));
            let _ = std::fs::remove_dir_all(&p);
            std::fs::create_dir_all(&p).expect("create temp dir");
            Self(p)
        }
        fn path(&self) -> &Path {
            &self.0
        }
    }

    impl Drop for TempDir {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    fn write(path: &Path, contents: &str) {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).expect("create parent");
        }
        std::fs::write(path, contents).expect("write file");
    }

    #[test]
    fn an_install_with_data_and_an_empty_new_dir_is_migrated() {
        let tmp = TempDir::new("detect");
        let legacy = tmp.path().join("old");
        let current = tmp.path().join("new");
        write(&legacy.join(SETTINGS_FILE), "{}");
        std::fs::create_dir_all(&current).unwrap();

        assert!(
            should_migrate(&legacy, &current),
            "a fresh identifier with the old data present must migrate"
        );
    }

    #[test]
    fn an_existing_new_install_is_never_overwritten() {
        let tmp = TempDir::new("nooverwrite");
        let legacy = tmp.path().join("old");
        let current = tmp.path().join("new");
        write(&legacy.join(SETTINGS_FILE), "{\"old\":true}");
        write(&current.join(SETTINGS_FILE), "{\"new\":true}");

        assert!(
            !should_migrate(&legacy, &current),
            "settings already written under the new identifier must win"
        );
    }

    #[test]
    fn nothing_to_migrate_when_there_was_no_previous_install() {
        let tmp = TempDir::new("nolegacy");
        let legacy = tmp.path().join("old");
        let current = tmp.path().join("new");
        std::fs::create_dir_all(&current).unwrap();

        assert!(!should_migrate(&legacy, &current));
    }

    #[test]
    fn the_copy_includes_nested_recordings_and_history() {
        let tmp = TempDir::new("copy");
        let legacy = tmp.path().join("old");
        let current = tmp.path().join("new");
        write(&legacy.join(SETTINGS_FILE), "{\"key\":\"secret\"}");
        write(&legacy.join("history.db"), "sqlite");
        write(&legacy.join("recordings").join("handy-1.wav"), "RIFF");

        let copied = copy_dir_all(&legacy, &current).expect("copy");

        assert_eq!(copied, 3, "every file must be copied");
        assert_eq!(
            std::fs::read_to_string(current.join(SETTINGS_FILE)).unwrap(),
            "{\"key\":\"secret\"}",
            "stored API keys must survive the rebrand"
        );
        assert!(
            current.join("recordings").join("handy-1.wav").is_file(),
            "nested directories must be copied, not just top-level files"
        );
    }

    #[test]
    fn the_previous_install_is_left_untouched() {
        // Copy, never move: a bad new build must not take the old data with it.
        let tmp = TempDir::new("nondestructive");
        let legacy = tmp.path().join("old");
        let current = tmp.path().join("new");
        write(&legacy.join(SETTINGS_FILE), "{}");

        copy_dir_all(&legacy, &current).expect("copy");

        assert!(
            legacy.join(SETTINGS_FILE).is_file(),
            "the old install must remain usable if we have to roll back"
        );
    }

    #[test]
    fn legacy_autostart_entries_are_named_after_the_old_identity() {
        let home = Path::new("/home/someone");
        let targets = legacy_autostart_files(home);

        assert!(
            !targets.is_empty(),
            "there must be something to clean up, or a stale login entry survives"
        );
        for t in &targets {
            let s = t.to_string_lossy().to_lowercase();
            assert!(
                s.contains("handy"),
                "only entries from the old identity may be removed, got {t:?}"
            );
            assert!(t.starts_with(home), "must stay inside the user's home");
        }
    }

    #[test]
    fn a_working_autostart_call_logs_nothing() {
        assert_eq!(autostart_failure_message(true, None), None);
        assert_eq!(autostart_failure_message(false, None), None);
    }

    #[test]
    fn a_failed_autostart_call_reports_what_the_user_will_see() {
        // The bug this replaces: `let _ = manager.enable();` left the toggle
        // reading "on" while nothing had been registered.
        let msg = autostart_failure_message(true, Some("access denied"))
            .expect("a failure must produce a message");
        assert!(msg.contains("access denied"), "got {msg}");
        assert!(
            msg.to_lowercase().contains("enable"),
            "the message must say which direction failed, got {msg}"
        );

        let msg = autostart_failure_message(false, Some("no such file"))
            .expect("a failure must produce a message");
        assert!(msg.to_lowercase().contains("disable"), "got {msg}");
    }
}
