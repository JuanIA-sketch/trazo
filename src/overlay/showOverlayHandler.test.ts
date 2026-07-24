import { describe, expect, test } from "bun:test";
import { handleShowOverlay, type ShowOverlayDeps } from "./showOverlayHandler";

/**
 * The show-overlay handler must NEVER gate visibility on IPC. The 2026-07-08
 * invisible-overlay incident: the native window was shown by Rust, but the
 * webview stayed blank because setIsVisible(true) sat behind two awaited IPC
 * round-trips (language sync + settings read). If either hangs or rejects,
 * the user records into a ghost window. These tests pin the contract:
 * visibility is synchronous; settings work happens in the background and is
 * strictly best-effort.
 */

const never = () => new Promise<never>(() => {});

interface Recorded {
  visible: boolean | null;
  state: string | null;
  position: string | null;
  streamTextCleared: boolean;
  streamingSessionStarted: boolean;
}

function makeDeps(overrides: Partial<ShowOverlayDeps> = {}) {
  const recorded: Recorded = {
    visible: null,
    state: null,
    position: null,
    streamTextCleared: false,
    streamingSessionStarted: false,
  };
  const deps: ShowOverlayDeps = {
    syncLanguage: () => Promise.resolve(),
    getOverlayPosition: () => Promise.resolve("bottom"),
    setPosition: (p) => {
      recorded.position = p;
    },
    setState: (s) => {
      recorded.state = s;
    },
    resetStreamText: () => {
      recorded.streamTextCleared = true;
    },
    startStreamingSession: () => {
      recorded.streamingSessionStarted = true;
    },
    setVisible: (v) => {
      recorded.visible = v;
    },
    ...overrides,
  };
  return { deps, recorded };
}

/** Let queued microtasks (settled promises) run. */
const flush = () => new Promise((r) => setTimeout(r, 0));

describe("handleShowOverlay", () => {
  test("shows the overlay synchronously even if settings IPC never resolves", () => {
    const { deps, recorded } = makeDeps({
      syncLanguage: never,
      getOverlayPosition: never,
    });

    handleShowOverlay("recording", deps);

    // No await: visibility and state must already be set when the call returns.
    expect(recorded.visible).toBe(true);
    expect(recorded.state).toBe("recording");
  });

  test("still shows the overlay when language sync rejects", async () => {
    const { deps, recorded } = makeDeps({
      syncLanguage: () => Promise.reject(new Error("ipc down")),
    });

    handleShowOverlay("recording", deps);
    await flush();

    expect(recorded.visible).toBe(true);
  });

  test("still shows the overlay when the position read rejects, keeping the previous position", async () => {
    const { deps, recorded } = makeDeps({
      getOverlayPosition: () => Promise.reject(new Error("ipc down")),
    });

    handleShowOverlay("recording", deps);
    await flush();

    expect(recorded.visible).toBe(true);
    expect(recorded.position).toBe(null);
  });

  test("background rejections never surface as unhandled rejections", async () => {
    const { deps } = makeDeps({
      syncLanguage: () => Promise.reject(new Error("lang ipc down")),
      getOverlayPosition: () => Promise.reject(new Error("settings ipc down")),
    });

    const unhandled: unknown[] = [];
    const onUnhandled = (err: unknown) => unhandled.push(err);
    process.on("unhandledRejection", onUnhandled);
    try {
      handleShowOverlay("recording", deps);
      await flush();
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }

    expect(unhandled).toEqual([]);
  });

  test("applies the overlay position once settings resolve", async () => {
    const { deps, recorded } = makeDeps({
      getOverlayPosition: () => Promise.resolve("top"),
    });

    handleShowOverlay("recording", deps);
    await flush();

    expect(recorded.position).toBe("top");
  });

  test("clears live text for a new recording", () => {
    const { deps, recorded } = makeDeps();

    handleShowOverlay("recording", deps);

    expect(recorded.streamTextCleared).toBe(true);
    expect(recorded.streamingSessionStarted).toBe(false);
  });

  test("clears live text and starts a fresh session for streaming", () => {
    const { deps, recorded } = makeDeps();

    handleShowOverlay("streaming", deps);

    expect(recorded.streamTextCleared).toBe(true);
    expect(recorded.streamingSessionStarted).toBe(true);
  });

  test("continuous latch keeps text and session: it continues the same capture", () => {
    const { deps, recorded } = makeDeps();

    handleShowOverlay("continuous", deps);

    expect(recorded.visible).toBe(true);
    expect(recorded.state).toBe("continuous");
    expect(recorded.streamTextCleared).toBe(false);
    expect(recorded.streamingSessionStarted).toBe(false);
  });

  test("keeps live text for non-capture states like transcribing", () => {
    const { deps, recorded } = makeDeps();

    handleShowOverlay("transcribing", deps);

    expect(recorded.state).toBe("transcribing");
    expect(recorded.streamTextCleared).toBe(false);
    expect(recorded.streamingSessionStarted).toBe(false);
  });
});
