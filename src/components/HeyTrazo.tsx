import React from "react";
import { useTranslation } from "react-i18next";
import trazito from "../assets/trazito.png";
import "./HeyTrazo.css";

interface HeyTrazoProps {
  /** Rail colapsado: solo el personaje, sin tarjeta ni texto. */
  compact?: boolean;
}

/**
 * Bloque de la palabra de activación por voz, al pie del sidebar.
 *
 * ESTADO ACTUAL: anuncio, no control. La detección de la frase no está
 * terminada, así que el bloque muestra "Próximamente" en vez de un
 * interruptor. Se deja visible a propósito —la función sigue en plan— pero sin
 * nada que pulsar: un interruptor que arma el micrófono sin que nadie escuche
 * la frase consumiría batería sin dar nada a cambio, y encima parecería roto.
 *
 * Cuando el backend emita el evento de detección, esto vuelve a ser un control
 * enchufado a `always_on_microphone` (settings.rs) y recupera sus tres estados:
 * apagado, escuchando y detectado.
 */
export const HeyTrazo: React.FC<HeyTrazoProps> = ({ compact = false }) => {
  const { t } = useTranslation();

  return (
    <div
      className={`trz-hey is-soon ${compact ? "is-compact" : ""}`}
      title={
        compact ? `${t("heyTrazo.name")} · ${t("heyTrazo.soon")}` : undefined
      }
    >
      <img src={trazito} alt="" aria-hidden="true" className="trz-hey-pet" />
      {!compact && (
        <>
          <p className="trz-hey-title">{t("heyTrazo.name")}</p>
          <p className="trz-hey-soon">{t("heyTrazo.soon")}</p>
        </>
      )}
    </div>
  );
};
