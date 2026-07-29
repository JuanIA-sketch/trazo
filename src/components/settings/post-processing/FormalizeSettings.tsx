import React from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../../hooks/useSettings";

export const FormalizeSettings: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettings();

  if (!settings) return null;

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">
          {t("settings.postProcessing.formalize.nameLabel")}
        </span>
        <p className="text-xs text-text/60">
          {t("settings.postProcessing.formalize.nameDescription")}
        </p>
        <input
          type="text"
          className="mt-1 w-full rounded-md border border-text/20 bg-transparent px-2 py-1"
          value={settings.user_full_name}
          placeholder={t("settings.postProcessing.formalize.namePlaceholder")}
          onChange={(e) => updateSetting("user_full_name", e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">
          {t("settings.postProcessing.formalize.treatmentLabel")}
        </span>
        <p className="text-xs text-text/60">
          {t("settings.postProcessing.formalize.treatmentDescription")}
        </p>
        <select
          className="mt-1 w-full rounded-md border border-text/20 bg-transparent px-2 py-1"
          value={settings.formality_treatment}
          onChange={(e) =>
            updateSetting(
              "formality_treatment",
              e.target.value as "tu" | "usted",
            )
          }
        >
          <option value="tu">
            {t("settings.postProcessing.formalize.treatmentTu")}
          </option>
          <option value="usted">
            {t("settings.postProcessing.formalize.treatmentUsted")}
          </option>
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium">
          {t("settings.postProcessing.formalize.profileLabel")}
        </span>
        <p className="text-xs text-text/60">
          {t("settings.postProcessing.formalize.profileDescription")}
        </p>
        <select
          className="mt-1 w-full rounded-md border border-text/20 bg-transparent px-2 py-1"
          value={settings.formalize_prompt_id ?? ""}
          onChange={(e) => updateSetting("formalize_prompt_id", e.target.value)}
        >
          {(settings.post_process_prompts ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
