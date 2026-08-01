import { Check, Cpu } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { SettingsGroup } from "../../ui/SettingsGroup";
import { LanguageSelector } from "../LanguageSelector";
import { TranslateToEnglish } from "../TranslateToEnglish";
import { useModelStore } from "../../../stores/modelStore";
import type { ModelInfo } from "@/bindings";
import {
  CHINESE_LANGUAGE_CODE,
  getUniqueCapabilityLanguages,
} from "@/lib/constants/languages";

export const ModelSettingsCard: React.FC = () => {
  const { t } = useTranslation();
  const { currentModel, models } = useModelStore();

  const currentModelInfo = models.find((m: ModelInfo) => m.id === currentModel);

  const supportsLanguageSelection =
    currentModelInfo?.supports_language_selection ?? false;
  const capabilityLanguages = getUniqueCapabilityLanguages(
    currentModelInfo?.supported_languages ?? [],
  );
  const supportsChineseOnlyScriptSelection =
    capabilityLanguages.length === 1 &&
    capabilityLanguages[0] === CHINESE_LANGUAGE_CODE;
  const showLanguageSelector =
    supportsLanguageSelection || supportsChineseOnlyScriptSelection;
  const supportsTranslation = currentModelInfo?.supports_translation ?? false;
  const hasAnySettings = showLanguageSelector || supportsTranslation;

  // Don't render anything if no model is selected or no settings available
  if (!currentModel || !currentModelInfo || !hasAnySettings) {
    return null;
  }

  // Los puntajes vienen 0.0–1.0 desde el backend (managers/model.rs).
  const precision = Math.round((currentModelInfo.accuracy_score ?? 0) * 100);
  const velocidad = Math.round((currentModelInfo.speed_score ?? 0) * 100);
  const idiomas = capabilityLanguages.length;

  return (
    <SettingsGroup
      featured
      title={t("settings.modelSettings.title", {
        model: currentModelInfo.name,
      })}
    >
      {/* Cabecera del panel destacado: el modelo activo, su ficha y sus dos
          medidas. Es lo único con borde en degradado en esta pantalla. */}
      <div className="flex items-center gap-3.5 flex-wrap mb-4">
        <span className="trz-chip-grupo" style={{ flexBasis: 40, width: 40, height: 40, borderRadius: 12 }}>
          <Cpu className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-[200px] flex flex-col gap-0.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[16.5px] font-semibold tracking-[-.2px] text-[var(--t1)]">
              {currentModelInfo.name}
            </span>
            <span className="trz-badge-ok">
              <Check className="w-3 h-3" />
              {t("modelSelector.active")}
            </span>
          </div>
          <span className="text-[12.5px] text-[var(--t3)]">
            {idiomas > 0
              ? t("settings.modelSettings.meta", {
                  size: currentModelInfo.size_mb,
                  count: idiomas,
                })
              : t("settings.modelSettings.metaSize", {
                  size: currentModelInfo.size_mb,
                })}
          </span>
        </div>
      </div>
      {(precision > 0 || velocidad > 0) && (
        <div className="flex gap-6 mb-4">
          {[
            [t("onboarding.modelCard.accuracy"), precision],
            [t("onboarding.modelCard.speed"), velocidad],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta as string} className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2.5">
                <span className="trz-metric__label uppercase">{etiqueta}</span>
                <span className="trz-metric">{valor}%</span>
              </div>
              <span className="trz-track">
                <span
                  className="trz-track__fill"
                  style={{ width: `${valor}%` }}
                />
              </span>
            </div>
          ))}
        </div>
      )}
      {showLanguageSelector && (
        <LanguageSelector
          descriptionMode="tooltip"
          grouped={true}
          supportedLanguages={currentModelInfo.supported_languages}
          supportsLanguageDetection={
            currentModelInfo.supports_language_detection
          }
        />
      )}
      {supportsTranslation && (
        <TranslateToEnglish descriptionMode="tooltip" grouped={true} />
      )}
    </SettingsGroup>
  );
};
