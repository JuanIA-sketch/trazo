import React from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../hooks/useTheme";
import type { ThemeChoice } from "../lib/utils/theme";
import "./ThemeToggle.css";

/**
 * Selector de tema de tres segmentos, al pie del sidebar
 * (`Sidebar.dc.html`: entre Hey Trazo y la píldora del modelo).
 *
 * Es de tres estados y no un interruptor a propósito: "automático" no es un
 * punto medio entre claro y oscuro, es *ceder la decisión al sistema*, y eso no
 * se puede expresar con un binario. Ver `05-DETALLES-UX.md` §1.
 *
 * Los tres van visibles a la vez (segmentos, no desplegable) porque el control
 * vive en un rail de 160 px donde un desplegable costaría dos clics para algo
 * que se prueba mirando.
 */

const OPCIONES: ReadonlyArray<{ choice: ThemeChoice; labelKey: string }> = [
  { choice: "light", labelKey: "theme.light" },
  { choice: "auto", labelKey: "theme.auto" },
  { choice: "dark", labelKey: "theme.dark" },
];

/** Glifos del tablero de diseño (`ic-sun` / `ic-auto` / `ic-moon`). */
const GLIFOS: Record<ThemeChoice, React.ReactNode> = {
  light: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </>
  ),
  auto: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
    </>
  ),
  dark: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
};

export const ThemeToggle: React.FC = () => {
  const { t } = useTranslation();
  const [choice, chooseTheme] = useTheme();

  return (
    // `radiogroup` y no una lista de botones: son opciones mutuamente
    // excluyentes sobre un mismo ajuste, y así el lector de pantalla anuncia
    // "1 de 3" en vez de tres botones sueltos sin relación.
    <div className="trz-theme" role="radiogroup" aria-label={t("theme.label")}>
      {OPCIONES.map(({ choice: opcion, labelKey }) => {
        const activo = choice === opcion;
        return (
          <button
            key={opcion}
            type="button"
            role="radio"
            aria-checked={activo}
            className={`trz-theme-seg ${activo ? "is-active" : ""}`}
            title={t(labelKey)}
            onClick={() => chooseTheme(opcion)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {GLIFOS[opcion]}
            </svg>
            <span className="sr-only">{t(labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
};
