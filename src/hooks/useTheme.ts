import { useCallback, useState } from "react";
import {
  applyTheme,
  readThemeChoice,
  THEME_STORAGE_KEY,
  type ThemeChoice,
} from "../lib/utils/theme";

/**
 * Elección de tema del usuario, persistida entre arranques.
 *
 * ⚠️ La persistencia vive hoy en `localStorage`, no en el store de ajustes de
 * Rust. Es deliberado y temporal: el ajuste debería estar en `settings.rs`
 * junto al resto, pero ese archivo tiene WIP sin commitear encima y la máquina
 * no puede compilar Rust hasta que se suba el pagefile. `localStorage` del
 * webview persiste en el directorio de datos de la app, así que el
 * comportamiento visible ya es el definitivo.
 *
 * Al migrar solo cambian las dos líneas de lectura/escritura de acá: la lógica
 * pura (`lib/utils/theme.ts`) y el control no se enteran.
 */
export function useTheme(): [ThemeChoice, (next: ThemeChoice) => void] {
  const [choice, setChoice] = useState<ThemeChoice>(() =>
    readThemeChoice(readStored()),
  );

  const chooseTheme = useCallback((next: ThemeChoice) => {
    setChoice(next);
    applyTheme(document.documentElement, next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Cuota llena o almacenamiento bloqueado: el tema ya se aplicó y solo se
      // pierde entre sesiones. No vale la pena romper la interacción por esto.
    }
  }, []);

  return [choice, chooseTheme];
}

function readStored(): unknown {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}
