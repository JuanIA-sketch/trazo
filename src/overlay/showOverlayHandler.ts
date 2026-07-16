export type OverlayState =
  | "recording"
  | "streaming"
  | "transcribing"
  | "processing"
  | "copied";

export type OverlayPosition = "top" | "bottom";

/**
 * Everything the show-overlay handler touches, injected so the contract is
 * testable without Tauri IPC or React (same pattern as clipboard.rs's
 * testable paste core).
 */
export interface ShowOverlayDeps {
  /** Best-effort i18n sync; may hang or reject — must never block the show. */
  syncLanguage: () => Promise<void>;
  /** Reads overlay_position from settings; may hang or reject. */
  getOverlayPosition: () => Promise<OverlayPosition>;
  setPosition: (position: OverlayPosition) => void;
  setState: (state: OverlayState) => void;
  resetStreamText: () => void;
  startStreamingSession: () => void;
  setVisible: (visible: boolean) => void;
}

/**
 * Applies a show-overlay event. Visibility is set synchronously — a shown
 * native window with an invisible webview is the worst outcome (2026-07-08
 * incident), so no IPC may ever sit between receiving the event and
 * setVisible(true). Language sync and position read run in the background;
 * if they hang or reject the overlay simply keeps its previous language and
 * placement.
 */
export function handleShowOverlay(
  state: OverlayState,
  deps: ShowOverlayDeps,
): void {
  deps.setState(state);
  if (state === "recording" || state === "streaming") {
    deps.resetStreamText();
  }
  if (state === "streaming") {
    deps.startStreamingSession();
  }
  deps.setVisible(true);

  deps.syncLanguage().catch(() => {});
  deps
    .getOverlayPosition()
    .then((position) => deps.setPosition(position))
    .catch(() => {});
}
