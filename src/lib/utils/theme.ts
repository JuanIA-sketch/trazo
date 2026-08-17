/**
 * Tema claro / oscuro / automático (05-DETALLES-UX.md §1).
 *
 * "Automático" NO es un valor del atributo `data-theme`: es su ausencia. El
 * CSS de `theme.css` y `material.css` escribe la media query como
 * `:root:not([data-theme="light"]):not([data-theme="dark"])`, así que en cuanto
 * el atributo existe con cualquier valor, el modo automático deja de aplicar.
 * Ver `theme.test.ts`.
 */

export type ThemeChoice = "light" | "dark" | "auto";

/** Lo mínimo que necesita `applyTheme`. `document.documentElement` lo cumple. */
export interface ThemeTarget {
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
}

const ATTR = "data-theme";
const CHOICES: readonly ThemeChoice[] = ["light", "dark", "auto"];

/** Clave de persistencia. Compartida por el arranque y el control. */
export const THEME_STORAGE_KEY = "trazo.theme";

/** El valor de `data-theme` que corresponde a una elección, o `null` si ninguno. */
export function themeAttribute(choice: ThemeChoice): string | null {
  return choice === "auto" ? null : choice;
}

/** Aplica la elección al elemento raíz, borrando el atributo en automático. */
export function applyTheme(root: ThemeTarget, choice: ThemeChoice): void {
  const value = themeAttribute(choice);
  if (value === null) {
    root.removeAttribute(ATTR);
  } else {
    root.setAttribute(ATTR, value);
  }
}

/** Normaliza un valor persistido; cualquier cosa que no reconozca cae en automático. */
export function readThemeChoice(raw: unknown): ThemeChoice {
  return CHOICES.includes(raw as ThemeChoice) ? (raw as ThemeChoice) : "auto";
}

export interface ThemeBootDeps {
  root: ThemeTarget;
  /** Valor persistido crudo: hoy `localStorage`, mañana los ajustes de Rust. */
  readPersisted: () => unknown;
  /** Habilita la transición de ~200 ms de color. */
  enableTransitions: () => void;
  /** Programa trabajo para después del primer pintado. */
  afterFirstPaint: (cb: () => void) => void;
}

/**
 * Arranque del tema. El orden es el contrato: primero se pinta el tema
 * guardado y solo después se habilitan las transiciones, porque si estuvieran
 * activas desde el principio el propio arranque se vería como una animación
 * — el flash que el diseño prohíbe.
 */
export function initTheme(deps: ThemeBootDeps): ThemeChoice {
  const choice = readThemeChoice(deps.readPersisted());
  applyTheme(deps.root, choice);
  deps.afterFirstPaint(() => deps.enableTransitions());
  return choice;
}

/** Qué tema se ve de hecho — sirve para marcar el segmento activo del control. */
export function effectiveTheme(
  choice: ThemeChoice,
  systemPrefersDark: boolean,
): "light" | "dark" {
  if (choice === "auto") return systemPrefersDark ? "dark" : "light";
  return choice;
}
