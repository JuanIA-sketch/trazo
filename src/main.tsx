import React from "react";
import ReactDOM from "react-dom/client";
import { platform } from "@tauri-apps/plugin-os";
import App from "./App";
import { initTheme, THEME_STORAGE_KEY } from "./lib/utils/theme";

// Set platform before render so CSS can scope per-platform (e.g. scrollbar styles)
document.documentElement.dataset.platform = platform();

// El tema guardado se aplica ANTES del primer render: si se aplicara después,
// el arranque pintaría un cuadro con el tema equivocado (el flash blanco que
// 05-DETALLES-UX.md §1 prohíbe). Las transiciones se habilitan recién tras el
// primer pintado, por eso ese cuadro inicial no se anima.
initTheme({
  root: document.documentElement,
  readPersisted: () => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      return null;
    }
  },
  enableTransitions: () =>
    document.documentElement.setAttribute("data-theme-ready", ""),
  // Doble rAF: el primero corre antes del pintado, el segundo ya después.
  afterFirstPaint: (cb) =>
    requestAnimationFrame(() => requestAnimationFrame(cb)),
});

/* La build de desarrollo se anuncia con una franja visible.
 *
 * El instalado y el de desarrollo se llaman los dos "Trazo" y se ven iguales,
 * así que mirando la pantalla no hay forma de saber cuál es cuál — y equivocarse
 * cuesta caro: se prueba un cambio contra el binario que no lo tiene y se
 * concluye que el cambio no funciona.
 *
 * Va en el DOM y no en el título de la ventana porque `setTitle` está vetado
 * por los permisos de Tauri (`core:window:allow-set-title`), y las capabilities
 * se compilan dentro del binario: habilitarlo exigiría recompilar Rust.
 *
 * Ámbar a propósito: la marca es azul y cian, así que este color no puede
 * confundirse con interfaz de producto. `import.meta.env.DEV` lo compila fuera
 * en producción, o sea que la ventana instalada nunca puede mostrarlo. */
if (import.meta.env.DEV) {
  const franja = document.createElement("div");
  franja.textContent = "BUILD DE DESARROLLO — no es tu Trazo instalado";
  franja.setAttribute("data-dev-banner", "");
  franja.style.cssText = [
    "position:fixed",
    "top:0",
    "left:0",
    "right:0",
    "z-index:2147483647",
    "pointer-events:none", // nunca robar un clic a la app
    "font:600 10px/1.6 ui-sans-serif,system-ui,sans-serif",
    "letter-spacing:.08em",
    "text-align:center",
    "color:#451a03",
    "background:repeating-linear-gradient(45deg,#f59e0b,#f59e0b 10px,#fbbf24 10px,#fbbf24 20px)",
    "box-shadow:0 1px 6px rgba(0,0,0,.35)",
  ].join(";");
  document.body.appendChild(franja);
}

// Initialize i18n
import "./i18n";

// Initialize model store (loads models and sets up event listeners)
import { useModelStore } from "./stores/modelStore";
useModelStore.getState().initialize();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
