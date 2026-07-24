export type AutoDownloadOutcome = "selected" | "failed" | "superseded";

export interface AutoDownloadDeps {
  /** Resolves true when the model finished downloading (verified/extracted). */
  download: (modelId: string) => Promise<boolean>;
  /** Makes the model the active one. Resolves true on success. */
  select: (modelId: string) => Promise<boolean>;
  /**
   * Re-checked AFTER the download resolves: the user may have picked another
   * model (manual chooser) while this one downloaded in the background, and
   * the auto-flow must never steal that selection.
   */
  stillWanted: (modelId: string) => boolean;
}

/**
 * Download the onboarding default model and select it once ready — unless the
 * user moved on in the meantime. Lives outside any component so the chain
 * survives the onboarding screen unmounting when the user continues early.
 */
export async function runAutoModelDownload(
  modelId: string,
  deps: AutoDownloadDeps,
): Promise<AutoDownloadOutcome> {
  const downloaded = await deps.download(modelId);
  if (!downloaded) {
    return "failed";
  }
  if (!deps.stillWanted(modelId)) {
    return "superseded";
  }
  return (await deps.select(modelId)) ? "selected" : "failed";
}
