import React from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../hooks/useSettings";
import trazito from "../assets/trazito.png";
import "./HeyTrazo.css";

interface HeyTrazoProps {
  /** Rail colapsado: solo el personaje, sin tarjeta ni texto. */
  compact?: boolean;
}

/**
 * Bloque de la palabra de activación por voz, al pie del sidebar.
 *
 * El control no inicia el dictado: ARMA la escucha. Quien lo inicia es la voz
 * del usuario al decir la frase. Por eso el texto cambia entre los dos estados
 * en vez de quedarse fijo: apagado es una instrucción que todavía no sirve
 * ("activar"), encendido es un estado ("decí la frase"). Si dijera «Di "Hey
 * Trazo"» estando apagado, sería mentira justo donde no funciona.
 *
 * Se enchufa a `always_on_microphone`, que es literalmente lo que la función
 * necesita: el micrófono abierto esperando. La detección de la frase vive en el
 * backend y lee esa misma bandera.
 */
export const HeyTrazo: React.FC<HeyTrazoProps> = ({ compact = false }) => {
  const { t } = useTranslation();
  const { getSetting, updateSetting, isUpdating } = useSettings();

  const listening = getSetting("always_on_microphone") ?? false;
  const busy = isUpdating("always_on_microphone");

  const toggle = () => {
    if (busy) return;
    updateSetting("always_on_microphone", !listening);
  };

  const label = listening ? t("heyTrazo.listening") : t("heyTrazo.idle");

  return (
    <div
      role="switch"
      aria-checked={listening}
      aria-label={t("heyTrazo.idle")}
      tabIndex={0}
      className={`trz-hey ${listening ? "is-on" : ""} ${
        compact ? "is-compact" : ""
      }`}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
      title={compact ? label : undefined}
    >
      <img src={trazito} alt="" aria-hidden="true" className="trz-hey-pet" />
      {!compact && (
        <>
          <p className="trz-hey-title">{label}</p>
          {listening && (
            <p className="trz-hey-privacy">{t("heyTrazo.privacy")}</p>
          )}
        </>
      )}
    </div>
  );
};
