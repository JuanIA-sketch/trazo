import { describe, expect, test } from "bun:test";
import { nextOnboardingStep } from "./onboardingFlow";

/**
 * Onboarding sequence contract. New users walk the full flow
 * (accessibility → autostart → model → done); returning users only re-grant
 * permissions and must never see the autostart or model steps again — their
 * next step is always "done". The autostart step sits BEFORE model selection
 * on purpose: onboarding_completed is persisted when a model is selected, so
 * a step placed after it would be silently skipped if the app closed
 * mid-onboarding.
 */
describe("nextOnboardingStep", () => {
  test("new user: accessibility leads to the autostart question", () => {
    expect(nextOnboardingStep("accessibility", false)).toBe("autostart");
  });

  test("new user: autostart leads to model selection", () => {
    expect(nextOnboardingStep("autostart", false)).toBe("model");
  });

  test("new user: model selection finishes onboarding", () => {
    expect(nextOnboardingStep("model", false)).toBe("done");
  });

  test("returning user: accessibility skips straight to done", () => {
    expect(nextOnboardingStep("accessibility", true)).toBe("done");
  });

  test("returning user: any step skips straight to done", () => {
    expect(nextOnboardingStep("autostart", true)).toBe("done");
    expect(nextOnboardingStep("model", true)).toBe("done");
  });
});
