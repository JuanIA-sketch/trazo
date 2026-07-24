import { describe, expect, test } from "bun:test";
import { BAR_MAX_PX, BAR_MIN_PX, barHeightPx } from "./waveform";

/**
 * The waveform must make quiet speech visible. The old inline curve
 * (3 + v^0.7 * 15) left a whisper (~0.03) at ~4px over a 3px floor —
 * indistinguishable from silence, which made users doubt the mic was live.
 */
describe("barHeightPx", () => {
  test("silence rests at the floor", () => {
    expect(barHeightPx(0)).toBe(BAR_MIN_PX);
  });

  test("full level caps at the max", () => {
    expect(barHeightPx(1)).toBe(BAR_MAX_PX);
    expect(barHeightPx(2)).toBe(BAR_MAX_PX);
  });

  test("a whisper is clearly above the floor", () => {
    // With the widened backend dB range (visualizer DB_MIN -68), a whisper
    // arrives around ~0.3 — it must render visibly tall while full speech
    // still has headroom.
    expect(barHeightPx(0.3)).toBeGreaterThanOrEqual(10);
  });

  test("faint non-speech residue stays subtle", () => {
    // Widening the backend range means room ambience is no longer hard-zero;
    // it must render as a murmur near the floor, not as dancing bars.
    expect(barHeightPx(0.05)).toBeLessThanOrEqual(7);
  });

  test("is monotonic: louder never renders shorter", () => {
    const levels = [0, 0.01, 0.03, 0.1, 0.3, 0.6, 1];
    const heights = levels.map(barHeightPx);
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i]).toBeGreaterThanOrEqual(heights[i - 1]);
    }
  });

  test("never returns NaN or negatives for junk input", () => {
    for (const v of [-1, NaN]) {
      const h = barHeightPx(v);
      expect(Number.isFinite(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(BAR_MIN_PX);
    }
  });
});
