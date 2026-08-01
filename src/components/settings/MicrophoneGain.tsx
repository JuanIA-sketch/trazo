import { SlidersHorizontal } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { Slider } from "../ui/Slider";
import { useSettings } from "../../hooks/useSettings";

/**
 * Software gain applied to the captured microphone signal, so a user with a
 * quiet mic can raise their level without leaving Trazo for the OS sound panel.
 *
 * Deliberately NOT presented as a fix for dictations that come back cut short:
 * gain raises speech and room noise by the same factor, so the VAD sees an
 * identical signal (measured 2026-07-26). The copy says "level", not
 * "sensitivity", to avoid implying otherwise.
 */
export const MicrophoneGain: React.FC<{
  descriptionMode?: "tooltip" | "inline";
  grouped?: boolean;
  disabled?: boolean;
}> = ({ descriptionMode = "tooltip", grouped = false, disabled = false }) => {
  const { t } = useTranslation();
  const { getSetting, updateSetting } = useSettings();
  const gain = getSetting("microphone_gain") ?? 1.0;

  return (
    <Slider
        icon={SlidersHorizontal}
      value={gain}
      onChange={(value: number) => updateSetting("microphone_gain", value)}
      min={0.5}
      max={4}
      step={0.1}
      label={t("settings.sound.microphoneGain.title")}
      description={t("settings.sound.microphoneGain.description")}
      descriptionMode={descriptionMode}
      grouped={grouped}
      formatValue={(value) => `${value.toFixed(1)}×`}
      disabled={disabled}
    />
  );
};
