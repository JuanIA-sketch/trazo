export type OnboardingStep = "accessibility" | "autostart" | "model" | "done";

/**
 * Next step after `after` completes. Returning users only re-grant
 * permissions, so their next step is always "done"; new users walk
 * accessibility → autostart → model → done. The autostart question sits
 * BEFORE model selection because onboarding_completed persists on model
 * select — a later step would be silently skipped if the app closed
 * mid-onboarding.
 */
export function nextOnboardingStep(
  after: Exclude<OnboardingStep, "done">,
  isReturningUser: boolean,
): OnboardingStep {
  if (isReturningUser) {
    return "done";
  }
  switch (after) {
    case "accessibility":
      return "autostart";
    case "autostart":
      return "model";
    case "model":
      return "done";
  }
}
