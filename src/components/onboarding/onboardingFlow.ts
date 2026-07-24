export type OnboardingStep = "accessibility" | "autostart" | "model" | "done";

/**
 * Hardware-dependent onboarding defaults (2026-07-24 eval on real Spanish
 * dictation). On a dedicated GPU, Whisper Turbo batch-decodes a 9s clip in
 * ~2.5s while Nemotron's RNNT decode is latency-bound (~10s, and its
 * streaming path falls below real time). On CPU-only machines it reverses:
 * Whisper pays a fixed 30s window per clip, Nemotron scales with audio
 * length. Both stay available in the manual selector — this only decides
 * the preselection.
 */
export const ONBOARDING_GPU_DEFAULT_MODEL_ID =
  "handy-computer/whisper-large-v3-turbo-gguf/whisper-large-v3-turbo-Q8_0.gguf";
export const ONBOARDING_CPU_DEFAULT_MODEL_ID =
  "handy-computer/nemotron-3.5-asr-streaming-0.6b-gguf/nemotron-3.5-asr-streaming-0.6b-Q8_0.gguf";

export type ModelStepPlan =
  | { kind: "select"; modelId: string }
  | { kind: "download"; modelId: string }
  | { kind: "manual" };

/**
 * Decide what the onboarding model step does: auto-download the default the
 * hardware calls for, select it directly when already on disk, or fall back
 * to the manual chooser when the catalog doesn't offer it.
 */
export function planModelStep(
  models: ReadonlyArray<{ id: string; is_downloaded: boolean }>,
  hasDedicatedGpu: boolean,
): ModelStepPlan {
  const preferredId = hasDedicatedGpu
    ? ONBOARDING_GPU_DEFAULT_MODEL_ID
    : ONBOARDING_CPU_DEFAULT_MODEL_ID;
  const defaultModel = models.find((m) => m.id === preferredId);
  if (!defaultModel) {
    return { kind: "manual" };
  }
  return defaultModel.is_downloaded
    ? { kind: "select", modelId: defaultModel.id }
    : { kind: "download", modelId: defaultModel.id };
}

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
