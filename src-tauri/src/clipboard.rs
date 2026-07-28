use crate::input::{self, EnigoState};
#[cfg(target_os = "linux")]
use crate::settings::TypingTool;
use crate::settings::{get_settings, AutoSubmitKey, ClipboardHandling, PasteMethod};
use enigo::{Direction, Enigo, Key, Keyboard};
use log::info;
use std::process::Command;
use std::time::Duration;
use tauri::{AppHandle, Manager};
use tauri_plugin_clipboard_manager::ClipboardExt;

#[cfg(target_os = "linux")]
use crate::utils::{is_kde_wayland, is_wayland};

/// Drives the clipboard paste sequence against injectable clipboard and
/// keystroke primitives so the transcript-safety behavior is unit-testable.
///
/// Safety-net guarantees:
/// - If the paste keystroke fails, the transcript is left on the clipboard
///   (never restored away) so the user can still paste it manually.
/// - With `keep_text_on_clipboard` (ClipboardHandling::CopyToClipboard) the
///   transcript also stays on the clipboard after an apparently successful
///   keystroke, covering silent paste failures (no focused window, read-only
///   field) that cannot be detected.
fn run_clipboard_paste_sequence<R, W, K>(
    read_clipboard: R,
    mut write_clipboard: W,
    send_keys: K,
    text: &str,
    paste_delay_ms: u64,
    keep_text_on_clipboard: bool,
) -> Result<(), String>
where
    R: FnOnce() -> String,
    W: FnMut(&str) -> Result<(), String>,
    K: FnOnce() -> Result<(), String>,
{
    let original = read_clipboard();

    write_clipboard(text)?;

    std::thread::sleep(Duration::from_millis(paste_delay_ms));

    // On keystroke failure this early-returns WITHOUT restoring the original
    // clipboard: the transcript stays available for a manual paste, so the
    // dictation is never lost.
    send_keys()?;

    std::thread::sleep(Duration::from_millis(50));

    if !keep_text_on_clipboard {
        let _ = write_clipboard(&original);
    }

    Ok(())
}

/// Pastes text using the clipboard: saves current content, writes text, sends
/// paste keystroke, then restores the clipboard — unless
/// `keep_text_on_clipboard` (ClipboardHandling::CopyToClipboard) or the
/// keystroke failed, in which case the transcript stays on the clipboard.
fn paste_via_clipboard(
    enigo: &mut Enigo,
    text: &str,
    app_handle: &AppHandle,
    paste_method: &PasteMethod,
    paste_delay_ms: u64,
    keep_text_on_clipboard: bool,
) -> Result<(), String> {
    let clipboard = app_handle.clipboard();

    // On Wayland, prefer wl-copy for better compatibility (especially with umlauts)
    #[cfg(target_os = "linux")]
    let write_clipboard = |t: &str| {
        if is_wayland() && is_wl_copy_available() {
            info!("Using wl-copy for clipboard write on Wayland");
            write_clipboard_via_wl_copy(t)
        } else {
            clipboard
                .write_text(t)
                .map_err(|e| format!("Failed to write to clipboard: {}", e))
        }
    };

    #[cfg(not(target_os = "linux"))]
    let write_clipboard = |t: &str| {
        clipboard
            .write_text(t)
            .map_err(|e| format!("Failed to write to clipboard: {}", e))
    };

    let send_keys = || {
        // Linux-native tools first; fall back to enigo if none handled it
        #[cfg(target_os = "linux")]
        if try_send_key_combo_linux(paste_method)? {
            return Ok(());
        }

        match paste_method {
            PasteMethod::CtrlV => input::send_paste_ctrl_v(enigo),
            PasteMethod::CtrlShiftV => input::send_paste_ctrl_shift_v(enigo),
            PasteMethod::ShiftInsert => input::send_paste_shift_insert(enigo),
            _ => Err("Invalid paste method for clipboard paste".into()),
        }
    };

    run_clipboard_paste_sequence(
        || clipboard.read_text().unwrap_or_default(),
        write_clipboard,
        send_keys,
        text,
        paste_delay_ms,
        keep_text_on_clipboard,
    )
}

/// Attempts to send a key combination using Linux-native tools.
/// Returns `Ok(true)` if a native tool handled it, `Ok(false)` to fall back to enigo.
#[cfg(target_os = "linux")]
fn try_send_key_combo_linux(paste_method: &PasteMethod) -> Result<bool, String> {
    if is_wayland() {
        // Wayland: prefer wtype (but not on KDE), then dotool, then ydotool
        // Note: wtype doesn't work on KDE (no zwp_virtual_keyboard_manager_v1 support)
        if !is_kde_wayland() && is_wtype_available() {
            info!("Using wtype for key combo");
            send_key_combo_via_wtype(paste_method)?;
            return Ok(true);
        }
        if is_dotool_available() {
            info!("Using dotool for key combo");
            send_key_combo_via_dotool(paste_method)?;
            return Ok(true);
        }
        if is_ydotool_available() {
            info!("Using ydotool for key combo");
            send_key_combo_via_ydotool(paste_method)?;
            return Ok(true);
        }
    } else {
        // X11: prefer xdotool, then ydotool
        if is_xdotool_available() {
            info!("Using xdotool for key combo");
            send_key_combo_via_xdotool(paste_method)?;
            return Ok(true);
        }
        if is_ydotool_available() {
            info!("Using ydotool for key combo");
            send_key_combo_via_ydotool(paste_method)?;
            return Ok(true);
        }
    }

    Ok(false)
}

/// Attempts to type text directly using Linux-native tools.
/// Returns `Ok(true)` if a native tool handled it, `Ok(false)` to fall back to enigo.
#[cfg(target_os = "linux")]
fn try_direct_typing_linux(text: &str, preferred_tool: TypingTool) -> Result<bool, String> {
    // If user specified a tool, try only that one
    if preferred_tool != TypingTool::Auto {
        return match preferred_tool {
            TypingTool::Wtype if is_wtype_available() => {
                info!("Using user-specified wtype");
                type_text_via_wtype(text)?;
                Ok(true)
            }
            TypingTool::Kwtype if is_kwtype_available() => {
                info!("Using user-specified kwtype");
                type_text_via_kwtype(text)?;
                Ok(true)
            }
            TypingTool::Dotool if is_dotool_available() => {
                info!("Using user-specified dotool");
                type_text_via_dotool(text)?;
                Ok(true)
            }
            TypingTool::Ydotool if is_ydotool_available() => {
                info!("Using user-specified ydotool");
                type_text_via_ydotool(text)?;
                Ok(true)
            }
            TypingTool::Xdotool if is_xdotool_available() => {
                info!("Using user-specified xdotool");
                type_text_via_xdotool(text)?;
                Ok(true)
            }
            _ => Err(format!(
                "Typing tool {:?} is not available on this system",
                preferred_tool
            )),
        };
    }

    // Auto mode - existing fallback chain
    if is_wayland() {
        // KDE Wayland: prefer kwtype (uses KDE Fake Input protocol, supports umlauts)
        if is_kde_wayland() && is_kwtype_available() {
            info!("Using kwtype for direct text input on KDE Wayland");
            type_text_via_kwtype(text)?;
            return Ok(true);
        }
        // Wayland: prefer wtype, then dotool, then ydotool
        // Note: wtype doesn't work on KDE (no zwp_virtual_keyboard_manager_v1 support)
        if !is_kde_wayland() && is_wtype_available() {
            info!("Using wtype for direct text input");
            type_text_via_wtype(text)?;
            return Ok(true);
        }
        if is_dotool_available() {
            info!("Using dotool for direct text input");
            type_text_via_dotool(text)?;
            return Ok(true);
        }
        if is_ydotool_available() {
            info!("Using ydotool for direct text input");
            type_text_via_ydotool(text)?;
            return Ok(true);
        }
    } else {
        // X11: prefer xdotool, then ydotool
        if is_xdotool_available() {
            info!("Using xdotool for direct text input");
            type_text_via_xdotool(text)?;
            return Ok(true);
        }
        if is_ydotool_available() {
            info!("Using ydotool for direct text input");
            type_text_via_ydotool(text)?;
            return Ok(true);
        }
    }

    Ok(false)
}

/// Returns the list of available typing tools on this system.
/// Always includes "auto" as the first entry.
#[cfg(target_os = "linux")]
pub fn get_available_typing_tools() -> Vec<String> {
    let mut tools = vec!["auto".to_string()];
    if is_wtype_available() {
        tools.push("wtype".to_string());
    }
    if is_kwtype_available() {
        tools.push("kwtype".to_string());
    }
    if is_dotool_available() {
        tools.push("dotool".to_string());
    }
    if is_ydotool_available() {
        tools.push("ydotool".to_string());
    }
    if is_xdotool_available() {
        tools.push("xdotool".to_string());
    }
    tools
}

/// Check if wtype is available (Wayland text input tool)
#[cfg(target_os = "linux")]
fn is_wtype_available() -> bool {
    Command::new("which")
        .arg("wtype")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

/// Check if dotool is available (another Wayland text input tool)
#[cfg(target_os = "linux")]
fn is_dotool_available() -> bool {
    Command::new("which")
        .arg("dotool")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

/// Check if ydotool is available (uinput-based, works on both Wayland and X11)
#[cfg(target_os = "linux")]
fn is_ydotool_available() -> bool {
    Command::new("which")
        .arg("ydotool")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

#[cfg(target_os = "linux")]
fn is_xdotool_available() -> bool {
    Command::new("which")
        .arg("xdotool")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

/// Check if kwtype is available (KDE Wayland virtual keyboard input tool)
#[cfg(target_os = "linux")]
fn is_kwtype_available() -> bool {
    Command::new("which")
        .arg("kwtype")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

/// Check if wl-copy is available (Wayland clipboard tool)
#[cfg(target_os = "linux")]
fn is_wl_copy_available() -> bool {
    Command::new("which")
        .arg("wl-copy")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

/// Type text directly via wtype on Wayland.
#[cfg(target_os = "linux")]
fn type_text_via_wtype(text: &str) -> Result<(), String> {
    let output = Command::new("wtype")
        .arg("--") // Protect against text starting with -
        .arg(text)
        .output()
        .map_err(|e| format!("Failed to execute wtype: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("wtype failed: {}", stderr));
    }

    Ok(())
}

/// Type text directly via xdotool on X11.
#[cfg(target_os = "linux")]
fn type_text_via_xdotool(text: &str) -> Result<(), String> {
    let output = Command::new("xdotool")
        .arg("type")
        .arg("--clearmodifiers")
        .arg("--")
        .arg(text)
        .output()
        .map_err(|e| format!("Failed to execute xdotool: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("xdotool failed: {}", stderr));
    }

    Ok(())
}

/// Type text directly via dotool (works on both Wayland and X11 via uinput).
#[cfg(target_os = "linux")]
fn type_text_via_dotool(text: &str) -> Result<(), String> {
    use std::io::Write;
    use std::process::Stdio;

    let mut child = Command::new("dotool")
        .stdin(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn dotool: {}", e))?;

    if let Some(mut stdin) = child.stdin.take() {
        // dotool uses "type <text>" command
        writeln!(stdin, "type {}", text)
            .map_err(|e| format!("Failed to write to dotool stdin: {}", e))?;
    }

    let output = child
        .wait_with_output()
        .map_err(|e| format!("Failed to wait for dotool: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("dotool failed: {}", stderr));
    }

    Ok(())
}

/// Type text directly via ydotool (uinput-based, requires ydotoold daemon).
#[cfg(target_os = "linux")]
fn type_text_via_ydotool(text: &str) -> Result<(), String> {
    let output = Command::new("ydotool")
        .arg("type")
        .arg("--")
        .arg(text)
        .output()
        .map_err(|e| format!("Failed to execute ydotool: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ydotool failed: {}", stderr));
    }

    Ok(())
}

/// Type text directly via kwtype (KDE Wayland virtual keyboard, uses KDE Fake Input protocol).
#[cfg(target_os = "linux")]
fn type_text_via_kwtype(text: &str) -> Result<(), String> {
    let output = Command::new("kwtype")
        .arg("--")
        .arg(text)
        .output()
        .map_err(|e| format!("Failed to execute kwtype: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("kwtype failed: {}", stderr));
    }

    Ok(())
}

/// Write text to clipboard via wl-copy (Wayland clipboard tool).
/// Uses Stdio::null() to avoid blocking on repeated calls — wl-copy forks a
/// daemon that inherits piped fds, causing read_to_end to hang indefinitely.
#[cfg(target_os = "linux")]
fn write_clipboard_via_wl_copy(text: &str) -> Result<(), String> {
    use std::process::Stdio;
    let status = Command::new("wl-copy")
        .arg("--")
        .arg(text)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map_err(|e| format!("Failed to execute wl-copy: {}", e))?;

    if !status.success() {
        return Err("wl-copy failed".into());
    }

    Ok(())
}

/// Send a key combination (e.g., Ctrl+V) via wtype on Wayland.
#[cfg(target_os = "linux")]
fn send_key_combo_via_wtype(paste_method: &PasteMethod) -> Result<(), String> {
    let args: Vec<&str> = match paste_method {
        PasteMethod::CtrlV => vec!["-M", "ctrl", "-k", "v"],
        PasteMethod::ShiftInsert => vec!["-M", "shift", "-k", "Insert"],
        PasteMethod::CtrlShiftV => vec!["-M", "ctrl", "-M", "shift", "-k", "v"],
        _ => return Err("Unsupported paste method".into()),
    };

    let output = Command::new("wtype")
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute wtype: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("wtype failed: {}", stderr));
    }

    Ok(())
}

/// Send a key combination (e.g., Ctrl+V) via dotool.
#[cfg(target_os = "linux")]
fn send_key_combo_via_dotool(paste_method: &PasteMethod) -> Result<(), String> {
    let command;
    match paste_method {
        PasteMethod::CtrlV => command = "echo key ctrl+v | dotool",
        PasteMethod::ShiftInsert => command = "echo key shift+insert | dotool",
        PasteMethod::CtrlShiftV => command = "echo key ctrl+shift+v | dotool",
        _ => return Err("Unsupported paste method".into()),
    }
    use std::process::Stdio;
    let status = Command::new("sh")
        .arg("-c")
        .arg(command)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map_err(|e| format!("Failed to execute dotool: {}", e))?;
    if !status.success() {
        return Err("dotool failed".into());
    }

    Ok(())
}

/// Send a key combination (e.g., Ctrl+V) via ydotool (requires ydotoold daemon).
#[cfg(target_os = "linux")]
fn send_key_combo_via_ydotool(paste_method: &PasteMethod) -> Result<(), String> {
    // ydotool uses Linux input event keycodes with format <keycode>:<pressed>
    // where pressed is 1 for down, 0 for up. Keycodes: ctrl=29, shift=42, v=47, insert=110
    let args: Vec<&str> = match paste_method {
        PasteMethod::CtrlV => vec!["key", "29:1", "47:1", "47:0", "29:0"],
        PasteMethod::ShiftInsert => vec!["key", "42:1", "110:1", "110:0", "42:0"],
        PasteMethod::CtrlShiftV => vec!["key", "29:1", "42:1", "47:1", "47:0", "42:0", "29:0"],
        _ => return Err("Unsupported paste method".into()),
    };

    let output = Command::new("ydotool")
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute ydotool: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("ydotool failed: {}", stderr));
    }

    Ok(())
}

/// Send a key combination (e.g., Ctrl+V) via xdotool on X11.
#[cfg(target_os = "linux")]
fn send_key_combo_via_xdotool(paste_method: &PasteMethod) -> Result<(), String> {
    let key_combo = match paste_method {
        PasteMethod::CtrlV => "ctrl+v",
        PasteMethod::CtrlShiftV => "ctrl+shift+v",
        PasteMethod::ShiftInsert => "shift+Insert",
        _ => return Err("Unsupported paste method".into()),
    };

    let output = Command::new("xdotool")
        .arg("key")
        .arg("--clearmodifiers")
        .arg(key_combo)
        .output()
        .map_err(|e| format!("Failed to execute xdotool: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("xdotool failed: {}", stderr));
    }

    Ok(())
}

/// Pastes text by invoking an external script.
/// The script receives the text to paste as a single argument.
fn paste_via_external_script(text: &str, script_path: &str) -> Result<(), String> {
    info!("Pasting via external script: {}", script_path);

    let output = Command::new(script_path)
        .arg(text)
        .output()
        .map_err(|e| format!("Failed to execute external script '{}': {}", script_path, e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        return Err(format!(
            "External script '{}' failed with exit code {:?}. stderr: {}, stdout: {}",
            script_path,
            output.status.code(),
            stderr.trim(),
            stdout.trim()
        ));
    }

    Ok(())
}

/// Types text directly by simulating individual key presses.
fn paste_direct(
    enigo: &mut Enigo,
    text: &str,
    #[cfg(target_os = "linux")] typing_tool: TypingTool,
) -> Result<(), String> {
    #[cfg(target_os = "linux")]
    {
        if try_direct_typing_linux(text, typing_tool)? {
            return Ok(());
        }
        info!("Falling back to enigo for direct text input");
    }

    input::paste_text_direct(enigo, text)
}

fn send_return_key(enigo: &mut Enigo, key_type: AutoSubmitKey) -> Result<(), String> {
    match key_type {
        AutoSubmitKey::Enter => {
            enigo
                .key(Key::Return, Direction::Press)
                .map_err(|e| format!("Failed to press Return key: {}", e))?;
            enigo
                .key(Key::Return, Direction::Release)
                .map_err(|e| format!("Failed to release Return key: {}", e))?;
        }
        AutoSubmitKey::CtrlEnter => {
            enigo
                .key(Key::Control, Direction::Press)
                .map_err(|e| format!("Failed to press Control key: {}", e))?;
            enigo
                .key(Key::Return, Direction::Press)
                .map_err(|e| format!("Failed to press Return key: {}", e))?;
            enigo
                .key(Key::Return, Direction::Release)
                .map_err(|e| format!("Failed to release Return key: {}", e))?;
            enigo
                .key(Key::Control, Direction::Release)
                .map_err(|e| format!("Failed to release Control key: {}", e))?;
        }
        AutoSubmitKey::CmdEnter => {
            enigo
                .key(Key::Meta, Direction::Press)
                .map_err(|e| format!("Failed to press Meta/Cmd key: {}", e))?;
            enigo
                .key(Key::Return, Direction::Press)
                .map_err(|e| format!("Failed to press Return key: {}", e))?;
            enigo
                .key(Key::Return, Direction::Release)
                .map_err(|e| format!("Failed to release Return key: {}", e))?;
            enigo
                .key(Key::Meta, Direction::Release)
                .map_err(|e| format!("Failed to release Meta/Cmd key: {}", e))?;
        }
    }

    Ok(())
}

fn should_send_auto_submit(auto_submit: bool, paste_method: PasteMethod) -> bool {
    auto_submit && paste_method != PasteMethod::None
}

/// Whether the post-paste step should write the transcript to the clipboard
/// after the paste itself SUCCEEDED.
///
/// The rule: never copy in parallel to a successful insertion. Methods that
/// deliver the text themselves (Direct types it, ExternalScript hands it to a
/// script) leave the clipboard alone, so a dictation can no longer be
/// re-pasted by accident in another window later. Clipboard-transport methods
/// (Ctrl+V and friends) are already handled inside `paste_via_clipboard`,
/// which keeps or restores the transcript per `ClipboardHandling` — a second
/// write here would only duplicate that decision.
///
/// `PasteMethod::None` is the one case that still copies: nothing was
/// inserted anywhere, so the clipboard is the only delivery channel.
/// Failures never reach this function; they hit the safety net in `paste`,
/// which always re-copies the transcript.
fn should_copy_after_successful_paste(
    handling: ClipboardHandling,
    paste_method: PasteMethod,
) -> bool {
    handling == ClipboardHandling::CopyToClipboard && paste_method == PasteMethod::None
}

/// Whether the transcript is guaranteed to be on the clipboard after a paste
/// attempt — drives the post-dictation "copied" notice. Always true with
/// `CopyToClipboard`; with `DontModify` only a FAILED paste leaves the text
/// behind (the error safety net re-copies it), a successful one restores the
/// user's original clipboard.
pub fn transcript_lands_on_clipboard(handling: ClipboardHandling, paste_succeeded: bool) -> bool {
    match handling {
        ClipboardHandling::CopyToClipboard => true,
        ClipboardHandling::DontModify => !paste_succeeded,
    }
}

/// The text most recently inserted into another application, so the next
/// dictation can tell whether it is continuing where the last one stopped.
///
/// Only set after an insertion actually succeeded. `PasteMethod::None` never
/// records anything: it inserts nowhere, it only leaves the transcript on the
/// clipboard for the user to place by hand.
static LAST_INSERTION: std::sync::Mutex<Option<String>> = std::sync::Mutex::new(None);

/// Whether a separating space is needed before inserting `next`.
///
/// Dictating twice into the same field used to run the two transcripts
/// together ("hola" + "mundo" = "holamundo"), because each insertion is
/// independent and nothing carried over from the previous one.
///
/// What the previous dictation ended with is knowable; what the *field*
/// contains is not — no cross-platform way exists to read the character before
/// the cursor. So the decision is made from our own last insertion, which is
/// exactly the "after a previous dictation" case that goes wrong.
///
/// This also composes with `append_trailing_space`: when that setting is on the
/// previous text already ends in a space, so no second one is added.
pub fn needs_separating_space(previous: Option<&str>, next: &str) -> bool {
    let Some(previous) = previous else {
        return false;
    };
    if previous.is_empty() || next.is_empty() {
        return false;
    }
    !previous.ends_with(char::is_whitespace) && !next.starts_with(char::is_whitespace)
}

pub fn paste(text: String, app_handle: AppHandle) -> Result<(), String> {
    let settings = get_settings(&app_handle);
    let paste_method = settings.paste_method;
    let paste_delay_ms = settings.paste_delay_ms;

    // Append trailing space if setting is enabled
    let text = if settings.append_trailing_space {
        format!("{} ", text)
    } else {
        text
    };

    // Separate this dictation from the previous one so two in a row don't run
    // together. `PasteMethod::None` inserts nowhere, so it neither reads nor
    // writes the insertion history.
    let inserts_text = paste_method != PasteMethod::None;
    let text = if inserts_text {
        let previous = LAST_INSERTION.lock().ok().and_then(|p| p.clone());
        if needs_separating_space(previous.as_deref(), &text) {
            format!(" {}", text)
        } else {
            text
        }
    } else {
        text
    };

    info!(
        "Using paste method: {:?}, delay: {}ms",
        paste_method, paste_delay_ms
    );

    // Get the managed Enigo instance
    let enigo_state = app_handle
        .try_state::<EnigoState>()
        .ok_or("Enigo state not initialized")?;
    let mut enigo = enigo_state
        .0
        .lock()
        .map_err(|e| format!("Failed to lock Enigo: {}", e))?;

    // Perform the paste operation
    let paste_result: Result<(), String> = match paste_method {
        PasteMethod::None => {
            info!("PasteMethod::None selected - skipping paste action");
            Ok(())
        }
        PasteMethod::Direct => paste_direct(
            &mut enigo,
            &text,
            #[cfg(target_os = "linux")]
            settings.typing_tool,
        ),
        PasteMethod::CtrlV | PasteMethod::CtrlShiftV | PasteMethod::ShiftInsert => {
            paste_via_clipboard(
                &mut enigo,
                &text,
                &app_handle,
                &paste_method,
                paste_delay_ms,
                settings.clipboard_handling == ClipboardHandling::CopyToClipboard,
            )
        }
        PasteMethod::ExternalScript => settings
            .external_script_path
            .as_ref()
            .filter(|p| !p.is_empty())
            .ok_or_else(|| "External script path is not configured".to_string())
            .and_then(|script_path| paste_via_external_script(&text, script_path)),
    };

    if let Err(e) = paste_result {
        // Safety net: whatever failed, make sure the dictation survives on the
        // clipboard before surfacing the error (the paste-error toast tells the
        // user it is there).
        let _ = app_handle.clipboard().write_text(&text);
        // Nothing landed in the target application, so the next dictation has
        // nothing to separate itself from.
        if let Ok(mut last) = LAST_INSERTION.lock() {
            *last = None;
        }
        return Err(e);
    }

    // Auto-submit sends the field off, so the next dictation starts in a fresh
    // one and must not be separated from what was just submitted.
    let submitted = should_send_auto_submit(settings.auto_submit, paste_method);
    if let Ok(mut last) = LAST_INSERTION.lock() {
        *last = if inserts_text && !submitted {
            Some(text.clone())
        } else {
            None
        };
    }

    if submitted {
        std::thread::sleep(Duration::from_millis(50));
        send_return_key(&mut enigo, settings.auto_submit_key)?;
    }

    // The paste succeeded. Only copy when the method itself delivered nothing
    // (PasteMethod::None) — never in parallel to a successful insertion, which
    // would leave a stale dictation on the clipboard.
    if should_copy_after_successful_paste(settings.clipboard_handling, paste_method) {
        let clipboard = app_handle.clipboard();
        clipboard
            .write_text(&text)
            .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Reported 2026-07-26: dictating twice into the same field ran the two
    /// transcripts together with no space between them.
    #[test]
    fn consecutive_dictations_get_a_separating_space() {
        assert!(needs_separating_space(Some("hola"), "mundo"));
    }

    #[test]
    fn the_first_dictation_gets_no_leading_space() {
        assert!(
            !needs_separating_space(None, "hola"),
            "nothing was inserted before, so there is nothing to separate from"
        );
    }

    #[test]
    fn a_previous_dictation_ending_in_space_adds_no_second_one() {
        // This is also what makes it compose with `append_trailing_space`.
        assert!(!needs_separating_space(Some("hola "), "mundo"));
        assert!(!needs_separating_space(Some("hola\n"), "mundo"));
    }

    #[test]
    fn text_that_already_starts_with_space_is_left_alone() {
        assert!(!needs_separating_space(Some("hola"), " mundo"));
    }

    #[test]
    fn empty_text_on_either_side_needs_no_separator() {
        assert!(!needs_separating_space(Some(""), "mundo"));
        assert!(!needs_separating_space(Some("hola"), ""));
    }

    #[test]
    fn punctuation_still_gets_a_space_after_it() {
        // A sentence ending in "." is exactly where the next dictation must not
        // be glued on: "...funcionando.Ahora bien".
        assert!(needs_separating_space(
            Some("ya está funcionando."),
            "Ahora"
        ));
    }

    #[test]
    fn auto_submit_requires_setting_enabled() {
        assert!(!should_send_auto_submit(false, PasteMethod::CtrlV));
        assert!(!should_send_auto_submit(false, PasteMethod::Direct));
    }

    #[test]
    fn auto_submit_skips_none_paste_method() {
        assert!(!should_send_auto_submit(true, PasteMethod::None));
    }

    /// Regression 2026-07-24 (reported by Charly): after a successful paste the
    /// transcript was written to the clipboard for EVERY method, including the
    /// ones that had already inserted the text into the focused field. That
    /// left a stale dictation on the clipboard which got re-pasted by accident
    /// in another window later.
    mod copy_after_paste {
        use super::*;

        #[test]
        fn direct_typing_never_copies_in_parallel() {
            // Direct types into the focused field; the clipboard is untouched
            // by the paste, and must stay that way.
            assert!(!should_copy_after_successful_paste(
                ClipboardHandling::CopyToClipboard,
                PasteMethod::Direct
            ));
        }

        #[test]
        fn external_script_never_copies_in_parallel() {
            assert!(!should_copy_after_successful_paste(
                ClipboardHandling::CopyToClipboard,
                PasteMethod::ExternalScript
            ));
        }

        #[test]
        fn clipboard_methods_do_not_write_twice() {
            // paste_via_clipboard already applied ClipboardHandling (it keeps
            // the transcript under CopyToClipboard); repeating it here would
            // duplicate that decision.
            for method in [
                PasteMethod::CtrlV,
                PasteMethod::CtrlShiftV,
                PasteMethod::ShiftInsert,
            ] {
                assert!(
                    !should_copy_after_successful_paste(ClipboardHandling::CopyToClipboard, method),
                    "{method:?} must not double-write the clipboard"
                );
            }
        }

        #[test]
        fn no_paste_method_still_delivers_through_the_clipboard() {
            // Nothing was inserted anywhere, so the clipboard is the only way
            // the user gets their dictation.
            assert!(should_copy_after_successful_paste(
                ClipboardHandling::CopyToClipboard,
                PasteMethod::None
            ));
        }

        #[test]
        fn dont_modify_never_leaves_the_transcript_behind() {
            for method in [
                PasteMethod::Direct,
                PasteMethod::CtrlV,
                PasteMethod::None,
                PasteMethod::ExternalScript,
            ] {
                assert!(
                    !should_copy_after_successful_paste(ClipboardHandling::DontModify, method),
                    "{method:?} must respect DontModify"
                );
            }
        }
    }

    #[test]
    fn auto_submit_runs_for_active_paste_methods() {
        assert!(should_send_auto_submit(true, PasteMethod::CtrlV));
        assert!(should_send_auto_submit(true, PasteMethod::Direct));
        assert!(should_send_auto_submit(true, PasteMethod::CtrlShiftV));
        assert!(should_send_auto_submit(true, PasteMethod::ShiftInsert));
    }

    mod copied_notice {
        use super::super::transcript_lands_on_clipboard;
        use crate::settings::ClipboardHandling;

        #[test]
        fn copy_to_clipboard_always_leaves_the_transcript() {
            assert!(transcript_lands_on_clipboard(
                ClipboardHandling::CopyToClipboard,
                true
            ));
            assert!(transcript_lands_on_clipboard(
                ClipboardHandling::CopyToClipboard,
                false
            ));
        }

        #[test]
        fn dont_modify_only_leaves_it_when_paste_failed() {
            // Successful paste restores the user's original clipboard: claiming
            // "copied" would lie.
            assert!(!transcript_lands_on_clipboard(
                ClipboardHandling::DontModify,
                true
            ));
            // Failed paste: the safety net re-copied the transcript.
            assert!(transcript_lands_on_clipboard(
                ClipboardHandling::DontModify,
                false
            ));
        }
    }

    mod paste_sequence {
        use super::super::run_clipboard_paste_sequence;
        use std::cell::RefCell;

        fn writer(clip: &RefCell<String>) -> impl FnMut(&str) -> Result<(), String> + '_ {
            move |t| {
                *clip.borrow_mut() = t.to_string();
                Ok(())
            }
        }

        #[test]
        fn failed_keystroke_leaves_transcript_on_clipboard() {
            let clip = RefCell::new("contenido previo".to_string());
            let result = run_clipboard_paste_sequence(
                || clip.borrow().clone(),
                writer(&clip),
                || Err("keyboard simulation failed".to_string()),
                "texto dictado",
                0,
                false,
            );
            assert!(result.is_err(), "keystroke failure must propagate");
            assert_eq!(
                *clip.borrow(),
                "texto dictado",
                "transcript must stay on the clipboard when the paste keystroke fails"
            );
        }

        #[test]
        fn silent_paste_failure_keeps_transcript_when_copy_to_clipboard() {
            let clip = RefCell::new("contenido previo".to_string());
            // Keystroke reports success but may have pasted nowhere (no focus,
            // read-only field). With keep_text_on_clipboard the transcript must
            // remain on the clipboard instead of being restored away.
            let result = run_clipboard_paste_sequence(
                || clip.borrow().clone(),
                writer(&clip),
                || Ok(()),
                "texto dictado",
                0,
                true,
            );
            assert!(result.is_ok());
            assert_eq!(*clip.borrow(), "texto dictado");
        }

        #[test]
        fn successful_paste_restores_original_clipboard_when_dont_modify() {
            let clip = RefCell::new("contenido previo".to_string());
            let result = run_clipboard_paste_sequence(
                || clip.borrow().clone(),
                writer(&clip),
                || Ok(()),
                "texto dictado",
                0,
                false,
            );
            assert!(result.is_ok());
            assert_eq!(
                *clip.borrow(),
                "contenido previo",
                "without CopyToClipboard the original clipboard must be restored"
            );
        }
    }
}
