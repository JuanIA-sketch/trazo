//! Shared state for platform-specific keyboard listeners

use std::collections::HashSet;
use std::sync::mpsc::Sender;
use std::sync::{Arc, Mutex};

use crate::types::{Hotkey, Key, KeyEvent, Modifiers};

/// Hotkeys that should be blocked when triggered
pub type BlockingHotkeys = Arc<Mutex<HashSet<Hotkey>>>;

/// Internal state shared with platform-specific event callbacks
pub struct ListenerState {
    pub event_sender: Sender<KeyEvent>,
    /// Track which modifiers are currently held
    pub current_modifiers: Modifiers,
    /// Hotkeys to block (if any)
    pub blocking_hotkeys: Option<BlockingHotkeys>,
}

impl ListenerState {
    pub fn new(event_sender: Sender<KeyEvent>, blocking_hotkeys: Option<BlockingHotkeys>) -> Self {
        Self {
            event_sender,
            current_modifiers: Modifiers::empty(),
            blocking_hotkeys,
        }
    }

    /// Check if an event matches a blocking hotkey
    pub fn should_block(&self, modifiers: Modifiers, key: Option<Key>) -> bool {
        if let Some(ref hotkeys) = self.blocking_hotkeys {
            if let Ok(set) = hotkeys.lock() {
                return set
                    .iter()
                    .any(|h| h.modifiers.matches(modifiers) && h.key == key);
            }
        }
        false
    }
}

/// Decide whether a *modifier* key transition should be blocked from reaching
/// other applications, for modifier-only blocking hotkeys.
///
/// `new_modifiers` is the modifier state *after* applying the transition.
///
/// Safety invariant: a modifier **release** must never be blocked. Swallowing
/// a release leaves the OS believing that modifier is held forever — every
/// subsequent keystroke system-wide turns into `Modifier+key` (keyboard
/// hijack). Concretely: with a bare `ctrl_left` hotkey registered, pressing
/// Ctrl+Shift and releasing Shift first makes the post-release state match
/// the hotkey again; blocking that Shift-up sticks Shift down at the OS level.
pub(crate) fn should_block_modifier_event(
    blocking_hotkeys: &Option<BlockingHotkeys>,
    new_modifiers: Modifiers,
    is_key_down: bool,
) -> bool {
    // Never swallow releases (see invariant above). Only a press that lands
    // exactly on a registered modifier-only hotkey is blocked — including
    // autorepeat presses of the held modifier, so the OS never sees the
    // hotkey's modifier go down mid-hold.
    if !is_key_down {
        return false;
    }
    if let Some(ref hotkeys) = blocking_hotkeys {
        if let Ok(set) = hotkeys.lock() {
            return set
                .iter()
                .any(|h| h.modifiers.matches(new_modifiers) && h.key.is_none());
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    fn blocking_with(hotkey: Hotkey) -> Option<BlockingHotkeys> {
        let mut set = HashSet::new();
        set.insert(hotkey);
        Some(Arc::new(Mutex::new(set)))
    }

    fn bare_ctrl_left() -> Option<BlockingHotkeys> {
        blocking_with(Hotkey::new(Modifiers::CTRL_LEFT, None).unwrap())
    }

    #[test]
    fn blocks_modifier_press_that_completes_a_modifier_only_hotkey() {
        // Pressing LCtrl with a bare ctrl_left hotkey registered: block, so
        // push-to-talk does not leak a Ctrl press into the focused app.
        assert!(should_block_modifier_event(
            &bare_ctrl_left(),
            Modifiers::CTRL_LEFT,
            true,
        ));
    }

    #[test]
    fn passes_partial_and_superset_chords_through() {
        // Ctrl+Shift does not match a bare ctrl_left hotkey: let it through.
        assert!(!should_block_modifier_event(
            &bare_ctrl_left(),
            Modifiers::CTRL_LEFT | Modifiers::SHIFT_LEFT,
            true,
        ));
    }

    #[test]
    fn never_blocks_a_modifier_release_even_when_state_matches_hotkey() {
        // REGRESSION (keyboard hijack): user holds Ctrl+Shift, releases Shift
        // first. The post-release state (CTRL_LEFT) matches the bare ctrl_left
        // hotkey — but this is a RELEASE. Blocking it would swallow the
        // Shift-up system-wide, leaving Shift (or Alt/Win in the analogous
        // cases) stuck down at the OS level: every later keystroke becomes
        // Modifier+key until the process dies.
        assert!(!should_block_modifier_event(
            &bare_ctrl_left(),
            Modifiers::CTRL_LEFT,
            false,
        ));
    }

    #[test]
    fn never_blocks_the_hotkey_modifiers_own_release() {
        // Releasing LCtrl itself (state returns to empty): nothing matches,
        // and it is a release anyway — must pass through.
        assert!(!should_block_modifier_event(
            &bare_ctrl_left(),
            Modifiers::empty(),
            false,
        ));
    }

    #[test]
    fn key_hotkeys_do_not_block_modifier_transitions() {
        // A normal key hotkey (Escape) must never swallow modifier events.
        let blocking = blocking_with(Hotkey::new(Modifiers::empty(), Key::Escape).unwrap());
        assert!(!should_block_modifier_event(
            &blocking,
            Modifiers::empty(),
            true,
        ));
    }
}
