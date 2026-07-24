import { describe, expect, test } from "bun:test";
import {
  nextOnboardingStep,
  ONBOARDING_CPU_DEFAULT_MODEL_ID,
  ONBOARDING_GPU_DEFAULT_MODEL_ID,
  planModelStep,
} from "./onboardingFlow";

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

/**
 * Model-step plan: the onboarding auto-picks a default model by hardware
 * instead of making a new user choose (2026-07-24 eval on real Spanish
 * dictation): a dedicated GPU runs Whisper Turbo far faster than Nemotron
 * (RNNT decode is latency-bound on GPU), while CPU-only machines are the
 * reverse (Whisper pays a fixed 30s window per clip). The manual chooser
 * only appears when the preferred default is missing from the catalog.
 */
describe("planModelStep", () => {
  test("both hardware defaults exist in the shipped catalog (repo/default-quant-file form)", async () => {
    const catalog = (
      await import("../../../src-tauri/src/catalog/catalog.json")
    ).default as {
      models: Array<{
        id: string;
        default_quant: string;
        files: Array<{ filename: string; quant: string }>;
      }>;
    };
    const ids = catalog.models.flatMap((m) => {
      const file = m.files.find((f) => f.quant === m.default_quant);
      return file ? [`${m.id}/${file.filename}`] : [];
    });
    expect(ids).toContain(ONBOARDING_GPU_DEFAULT_MODEL_ID);
    expect(ids).toContain(ONBOARDING_CPU_DEFAULT_MODEL_ID);
  });

  const catalogEntries = (downloaded: boolean) => [
    { id: ONBOARDING_GPU_DEFAULT_MODEL_ID, is_downloaded: downloaded },
    { id: ONBOARDING_CPU_DEFAULT_MODEL_ID, is_downloaded: downloaded },
  ];

  test("dedicated GPU machine: plan downloads the GPU default (Turbo)", () => {
    expect(planModelStep(catalogEntries(false), true)).toEqual({
      kind: "download",
      modelId: ONBOARDING_GPU_DEFAULT_MODEL_ID,
    });
  });

  test("CPU-only machine: plan downloads the CPU default (Nemotron)", () => {
    expect(planModelStep(catalogEntries(false), false)).toEqual({
      kind: "download",
      modelId: ONBOARDING_CPU_DEFAULT_MODEL_ID,
    });
  });

  test("preferred default already on disk: plan selects it directly", () => {
    expect(planModelStep(catalogEntries(true), false)).toEqual({
      kind: "select",
      modelId: ONBOARDING_CPU_DEFAULT_MODEL_ID,
    });
  });

  test("preferred default absent from the catalog: fall back to the manual chooser", () => {
    const onlyOther = [
      { id: ONBOARDING_CPU_DEFAULT_MODEL_ID, is_downloaded: false },
    ];
    expect(planModelStep(onlyOther, true)).toEqual({ kind: "manual" });
  });

  test("empty model list: fall back to the manual chooser", () => {
    expect(planModelStep([], true)).toEqual({ kind: "manual" });
  });
});
