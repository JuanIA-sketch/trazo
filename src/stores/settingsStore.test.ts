import { describe, expect, test } from "bun:test";
import { settingUpdaters } from "./settingsStore";

/**
 * Regression coverage for the formalizador de correo final review, hallazgo 1:
 * three new settings (user_full_name, formality_treatment,
 * formalize_prompt_id) had no entry in `settingUpdaters`. `updateSetting()`
 * updates the zustand state optimistically regardless, so the UI looked like
 * it worked, but with no updater the change silently never reached the Rust
 * backend (it fell through to the `console.warn` branch in
 * settingsStore.ts) and was lost on the next refresh or restart. Every email
 * came out using the stale backend defaults (tuteo, sin firma).
 */
describe("settingUpdaters", () => {
  test("wires up the three formalize-email settings", () => {
    expect(settingUpdaters.user_full_name).toBeDefined();
    expect(settingUpdaters.formality_treatment).toBeDefined();
    expect(settingUpdaters.formalize_prompt_id).toBeDefined();
  });
});
