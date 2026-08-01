import React from "react";
import { useTranslation } from "react-i18next";
import { ToggleSwitch } from "../ui/ToggleSwitch";
import { Slider } from "../ui/Slider";
import { useSettings } from "../../hooks/useSettings";
import { Volume2 } from "lucide-react";

const DEFAULT_DUCK_LEVEL = 0.2;

interface RecordingVolumeProps {
  descriptionMode?: "inline" | "tooltip";
  grouped?: boolean;
}

/**
 * Windows-only replacement for the binary mute toggle: while recording, the
 * system output volume is held at the chosen level (0% = mute) and restored
 * afterwards. Backed by the `recording_volume` setting (`null` = off).
 */
export const RecordingVolume: React.FC<RecordingVolumeProps> = React.memo(
  ({ descriptionMode = "tooltip", grouped = false }) => {
    const { t } = useTranslation();
    const { getSetting, updateSetting, isUpdating } = useSettings();

    const recordingVolume = (getSetting("recording_volume") ?? null) as
      | number
      | null;
    const enabled = recordingVolume !== null;

    return (
      <>
        <ToggleSwitch
        icon={Volume2}
          checked={enabled}
          onChange={(on) =>
            updateSetting("recording_volume", on ? DEFAULT_DUCK_LEVEL : null)
          }
          isUpdating={isUpdating("recording_volume")}
          label={t("settings.recordingVolume.label")}
          description={t("settings.recordingVolume.description")}
          descriptionMode={descriptionMode}
          grouped={grouped}
        />
        {enabled && (
          <Slider
            value={recordingVolume}
            onChange={(value: number) =>
              updateSetting("recording_volume", value)
            }
            min={0}
            max={0.9}
            label={t("settings.recordingVolume.levelLabel")}
            description={t("settings.recordingVolume.levelDescription")}
            descriptionMode={descriptionMode}
            grouped={grouped}
            formatValue={(value) =>
              value === 0
                ? t("settings.recordingVolume.muteValue")
                : `${Math.round(value * 100)}%`
            }
          />
        )}
      </>
    );
  },
);
