import { describe, expect, test } from "bun:test";
import { runAutoModelDownload } from "./autoDownloadFlow";

/**
 * Sequencing contract for the onboarding auto-download: download the default
 * model, then select it — but only if it is still what the user wants. The
 * user can walk into the manual chooser (or straight into the app) while the
 * download runs in the background, so selection must re-check intent and
 * never fire after a failure.
 */
describe("runAutoModelDownload", () => {
  const MODEL = "handy-computer/nemotron-3.5-asr-streaming-0.6b-gguf";

  function deps(overrides: {
    download?: boolean;
    select?: boolean;
    stillWanted?: boolean;
  }) {
    const calls = { download: 0, select: 0 };
    return {
      calls,
      deps: {
        download: async (_id: string) => {
          calls.download++;
          return overrides.download ?? true;
        },
        select: async (_id: string) => {
          calls.select++;
          return overrides.select ?? true;
        },
        stillWanted: (_id: string) => overrides.stillWanted ?? true,
      },
    };
  }

  test("successful download still wanted: selects the model exactly once", async () => {
    const { calls, deps: d } = deps({});
    expect(await runAutoModelDownload(MODEL, d)).toBe("selected");
    expect(calls.download).toBe(1);
    expect(calls.select).toBe(1);
  });

  test("failed download: never selects", async () => {
    const { calls, deps: d } = deps({ download: false });
    expect(await runAutoModelDownload(MODEL, d)).toBe("failed");
    expect(calls.select).toBe(0);
  });

  test("user picked another model meanwhile: download completes but does not steal the selection", async () => {
    const { calls, deps: d } = deps({ stillWanted: false });
    expect(await runAutoModelDownload(MODEL, d)).toBe("superseded");
    expect(calls.select).toBe(0);
  });

  test("selection failure is reported as failed", async () => {
    const { deps: d } = deps({ select: false });
    expect(await runAutoModelDownload(MODEL, d)).toBe("failed");
  });
});
