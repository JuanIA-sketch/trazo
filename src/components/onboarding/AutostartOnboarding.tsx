import { useTranslation } from "react-i18next";
import HandyTextLogo from "../icons/HandyTextLogo";
import { AutostartToggle } from "../settings/AutostartToggle";
import { StartHidden } from "../settings/StartHidden";

interface AutostartOnboardingProps {
  onComplete: () => void;
}

/**
 * Onboarding step asking whether Trazo should launch on login. Both settings
 * default to off and apply immediately through the same toggles used in
 * Settings → Advanced; continuing without touching them is the "no" answer,
 * so there is no separate skip button.
 */
const AutostartOnboarding: React.FC<AutostartOnboardingProps> = ({
  onComplete,
}) => {
  const { t } = useTranslation();

  return (
    <div className="h-screen w-screen flex flex-col p-6 gap-6 items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <HandyTextLogo width={200} />
      </div>

      <div className="max-w-md w-full flex flex-col items-center gap-4">
        <div className="text-center mb-2">
          <h2 className="text-xl font-semibold text-text mb-2">
            {t("onboarding.autostart.title")}
          </h2>
          <p className="text-text/70">{t("onboarding.autostart.subtitle")}</p>
        </div>

        <div className="w-full p-4 rounded-lg bg-white/5 border border-mid-gray/20 flex flex-col gap-2">
          <AutostartToggle descriptionMode="inline" grouped={true} />
          <StartHidden descriptionMode="inline" grouped={true} />
        </div>

        <button
          onClick={onComplete}
          className="px-4 py-2 rounded-lg bg-logo-primary hover:bg-logo-primary/90 text-white text-sm font-medium transition-colors"
        >
          {t("onboarding.autostart.continue")}
        </button>
      </div>
    </div>
  );
};

export default AutostartOnboarding;
