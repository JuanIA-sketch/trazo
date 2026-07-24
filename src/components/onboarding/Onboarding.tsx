import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { commands, type ModelInfo } from "@/bindings";
import type { ModelCardStatus } from "./ModelCard";
import ModelCard, { isLegacySource } from "./ModelCard";
import HandyTextLogo from "../icons/HandyTextLogo";
import { useModelStore } from "../../stores/modelStore";
import { planModelStep } from "./onboardingFlow";

interface OnboardingProps {
  onModelSelected: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onModelSelected }) => {
  const { t } = useTranslation();
  const {
    models,
    downloadModel,
    selectModel,
    downloadingModels,
    verifyingModels,
    extractingModels,
    downloadProgress,
    downloadStats,
    autoDownload,
    startAutoDownload,
  } = useModelStore();
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const hasStartedSelection = useRef(false);
  // "deciding" until the model list arrives and planModelStep picks a mode.
  const [mode, setMode] = useState<"deciding" | "auto" | "manual">("deciding");
  // null while the hardware probe is in flight; the conservative fallback is
  // false (CPU default) — Nemotron runs everywhere, Turbo crawls without GPU.
  const [hasDedicatedGpu, setHasDedicatedGpu] = useState<boolean | null>(null);
  const hasPlanned = useRef(false);
  const hasFinished = useRef(false);

  const isBusy = selectedModelId !== null;

  useEffect(() => {
    commands
      .hasDedicatedGpu()
      .then((result) =>
        setHasDedicatedGpu(result.status === "ok" ? result.data : false),
      )
      .catch(() => setHasDedicatedGpu(false));
  }, []);

  // Plan the step once the catalog and the hardware probe are available:
  // auto-download the default the hardware calls for, select it directly if
  // already on disk, or fall back to the manual chooser.
  useEffect(() => {
    if (hasPlanned.current || models.length === 0 || hasDedicatedGpu === null)
      return;
    hasPlanned.current = true;

    const plan = planModelStep(models, hasDedicatedGpu);
    if (plan.kind === "download") {
      setMode("auto");
      startAutoDownload(plan.modelId);
    } else {
      setMode("manual");
      if (plan.kind === "select") {
        setSelectedModelId(plan.modelId);
      }
    }
  }, [models, hasDedicatedGpu, startAutoDownload]);

  // React to the background chain: advance when the default model got
  // selected, drop to the manual chooser when the download failed (the store
  // already toasts the error).
  useEffect(() => {
    if (mode !== "auto" || !autoDownload) return;
    if (autoDownload.status === "selected" && !hasFinished.current) {
      hasFinished.current = true;
      onModelSelected();
    } else if (autoDownload.status === "failed") {
      setMode("manual");
    }
  }, [mode, autoDownload, onModelSelected]);

  const handleContinueWhileDownloading = async () => {
    if (hasFinished.current) return;
    // Decoupled from the download on purpose: mark onboarding complete now;
    // the store chain keeps running and selects the model when it lands.
    const result = await commands.completeOnboarding();
    if (result.status === "ok") {
      hasFinished.current = true;
      onModelSelected();
    } else {
      toast.error(t("onboarding.errors.completeOnboarding"));
    }
  };

  // Curate the download list: legacy (.bin/ONNX) downloads are deprecated and
  // never shown here (they still appear in the compatible section if already on
  // disk). The catalog arrives rank-sorted, so the first two recommended models
  // are the featured picks — currently Parakeet Unified (English) and Nemotron
  // Streaming (multilingual). Everything else hides behind "Show all".
  const { downloadable, topPicks, otherRecommended, rest } = useMemo(() => {
    const downloadable = models.filter(
      (m: ModelInfo) => !m.is_downloaded && !isLegacySource(m),
    );
    const recommended = downloadable.filter((m: ModelInfo) => m.is_recommended);
    // `models` arrives in editorial rank order (the backend sorts by rank_of,
    // then accuracy), so keep that order here: ranked-but-not-recommended models
    // surface first, then the unranked tail by accuracy.
    const rest = downloadable.filter((m: ModelInfo) => !m.is_recommended);
    return {
      downloadable,
      topPicks: recommended.slice(0, 2),
      otherRecommended: recommended.slice(2),
      rest,
    };
  }, [models]);

  const hasRecommended = topPicks.length > 0 || otherRecommended.length > 0;
  // When nothing recommended remains to download (e.g. all already on disk),
  // there is no curated subset to collapse, so just show the full list.
  const showRest = showAll || !hasRecommended;

  // Watch for the selected model to finish downloading + verifying + extracting
  useEffect(() => {
    if (!selectedModelId) {
      hasStartedSelection.current = false;
      return;
    }

    const model = models.find((m) => m.id === selectedModelId);
    const stillDownloading = selectedModelId in downloadingModels;
    const stillVerifying = selectedModelId in verifyingModels;
    const stillExtracting = selectedModelId in extractingModels;

    if (
      model?.is_downloaded &&
      !stillDownloading &&
      !stillVerifying &&
      !stillExtracting &&
      !hasStartedSelection.current
    ) {
      hasStartedSelection.current = true;

      // Model is ready — select it and transition
      selectModel(selectedModelId).then((success) => {
        if (success) {
          onModelSelected();
        } else {
          toast.error(t("onboarding.errors.selectModel"));
          hasStartedSelection.current = false;
          setSelectedModelId(null);
        }
      });
    }
  }, [
    selectedModelId,
    models,
    downloadingModels,
    verifyingModels,
    extractingModels,
    selectModel,
    onModelSelected,
    t,
  ]);

  const handleDownloadModel = async (modelId: string) => {
    setSelectedModelId(modelId);

    // Error toast is handled centrally by the model-download-failed event listener
    // in modelStore — no toast here to avoid duplicates.
    const success = await downloadModel(modelId);
    if (!success) {
      setSelectedModelId(null);
    }
  };

  const handleSelectExistingModel = (modelId: string) => {
    setSelectedModelId(modelId);
  };

  const getModelStatus = (modelId: string): ModelCardStatus => {
    if (modelId in extractingModels) return "extracting";
    if (modelId in verifyingModels) return "verifying";
    if (modelId in downloadingModels) return "downloading";
    return "downloadable";
  };

  const getExistingModelStatus = (modelId: string): ModelCardStatus => {
    if (selectedModelId === modelId) return "switching";
    return "available";
  };

  const getModelDownloadProgress = (modelId: string): number | undefined => {
    return downloadProgress[modelId]?.percentage;
  };

  const getModelDownloadSpeed = (modelId: string): number | undefined => {
    return downloadStats[modelId]?.speed;
  };

  if (mode === "auto" && autoDownload) {
    const autoModel = models.find((m) => m.id === autoDownload.modelId);
    const percentage = Math.min(
      100,
      downloadProgress[autoDownload.modelId]?.percentage ?? 0,
    );
    const speed = downloadStats[autoDownload.modelId]?.speed;
    return (
      <div className="h-screen w-screen flex flex-col p-6 gap-6 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <HandyTextLogo width={200} />
        </div>

        <div className="max-w-md w-full flex flex-col items-center gap-4">
          <div className="text-center mb-2">
            <h2 className="text-xl font-semibold text-text mb-2">
              {t("onboarding.autoDownload.title")}
            </h2>
            <p className="text-text/70">
              {t("onboarding.autoDownload.description", {
                model: autoModel?.name ?? "",
              })}
            </p>
          </div>

          <div className="w-full p-4 rounded-lg bg-white/5 border border-mid-gray/20 flex flex-col gap-2">
            <div className="flex justify-between text-sm text-text/70">
              <span>{autoModel?.name}</span>
              <span>
                {t("onboarding.autoDownload.progress", {
                  percentage: Math.round(percentage),
                  speed: speed ? speed.toFixed(1) : "0.0",
                })}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-mid-gray/20 overflow-hidden">
              <div
                className="h-full bg-logo-primary transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <button
            onClick={handleContinueWhileDownloading}
            className="px-4 py-2 rounded-lg bg-logo-primary hover:bg-logo-primary/90 text-white text-sm font-medium transition-colors"
          >
            {t("onboarding.autoDownload.continue")}
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className="py-1 text-sm font-medium text-text/60 hover:text-text transition-colors"
          >
            {t("onboarding.autoDownload.chooseAnother")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col p-6 gap-4 inset-0">
      <div className="flex flex-col items-center gap-2 shrink-0">
        <HandyTextLogo width={200} />
        <p className="text-text/70 max-w-md font-medium mx-auto">
          {t("onboarding.subtitle")}
        </p>
      </div>

      <div className="max-w-[600px] w-full mx-auto text-center flex-1 flex flex-col min-h-0">
        <div className="space-y-6 pb-6">
          {models.some((m: ModelInfo) => m.is_downloaded) && (
            <div className="space-y-3">
              <div className="text-left">
                <h2 className="text-sm font-medium text-text/60">
                  {t("onboarding.existingModelsTitle")}
                </h2>
              </div>
              {models
                .filter((m: ModelInfo) => m.is_downloaded)
                .map((model: ModelInfo) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    status={getExistingModelStatus(model.id)}
                    disabled={isBusy}
                    onSelect={handleSelectExistingModel}
                    showRecommended={false}
                  />
                ))}
            </div>
          )}

          {downloadable.length > 0 && (
            <div className="space-y-3">
              <div className="text-left">
                <h2 className="text-sm font-medium text-text/60">
                  {t("onboarding.downloadModelsTitle")}
                </h2>
              </div>

              {topPicks.map((model: ModelInfo) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  variant="featured"
                  status={getModelStatus(model.id)}
                  disabled={isBusy}
                  onSelect={handleDownloadModel}
                  onDownload={handleDownloadModel}
                  downloadProgress={getModelDownloadProgress(model.id)}
                  downloadSpeed={getModelDownloadSpeed(model.id)}
                  showRecommended={false}
                />
              ))}

              {otherRecommended.map((model: ModelInfo) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  status={getModelStatus(model.id)}
                  disabled={isBusy}
                  onSelect={handleDownloadModel}
                  onDownload={handleDownloadModel}
                  downloadProgress={getModelDownloadProgress(model.id)}
                  downloadSpeed={getModelDownloadSpeed(model.id)}
                  showRecommended={false}
                />
              ))}

              {hasRecommended && rest.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="flex items-center justify-center gap-1.5 mx-auto py-1 text-sm font-medium text-text/60 hover:text-text transition-colors"
                >
                  {showAll
                    ? t("onboarding.showFewerModels")
                    : t("onboarding.showAllModels", {
                        total: downloadable.length,
                      })}
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showAll ? "rotate-180" : ""
                    }`}
                  />
                </button>
              )}

              {showRest &&
                rest.map((model: ModelInfo) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    status={getModelStatus(model.id)}
                    disabled={isBusy}
                    onSelect={handleDownloadModel}
                    onDownload={handleDownloadModel}
                    downloadProgress={getModelDownloadProgress(model.id)}
                    downloadSpeed={getModelDownloadSpeed(model.id)}
                    showRecommended={false}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
