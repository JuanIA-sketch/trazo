export const BAR_MIN_PX = 3;
export const BAR_MAX_PX = 18;

/**
 * Maps a smoothed FFT bucket level (0..1) to a bar height. Sensitivity to
 * quiet speech lives in the BACKEND (visualizer.rs dB range: a whisper
 * arrives here as ~0.3, not ~0.03 — live-validated 2026-07-24); this curve
 * only shapes presentation: sqrt lifts the quiet end so whispers render
 * tall while room ambience (~0.05) stays a murmur near the floor.
 */
export function barHeightPx(level: number): number {
  if (!Number.isFinite(level) || level <= 0) {
    return BAR_MIN_PX;
  }
  const scaled = BAR_MIN_PX + Math.sqrt(level) * (BAR_MAX_PX - BAR_MIN_PX);
  return Math.max(BAR_MIN_PX, Math.min(BAR_MAX_PX, scaled));
}
