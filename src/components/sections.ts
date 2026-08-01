/** Las secciones del sidebar, como dato puro.
 *
 * Vive aparte de `Sidebar.tsx` a propósito: ese módulo importa el árbol de
 * componentes entero (y con él `import.meta.glob`, que solo existe dentro de
 * Vite), así que no se puede tocar desde un test. Acá no hay más que la lista.
 */
export const SECTION_IDS = [
  "general",
  "models",
  "advanced",
  "history",
  "postprocessing",
  "debug",
  "about",
] as const;

export type SidebarSection = (typeof SECTION_IDS)[number];
