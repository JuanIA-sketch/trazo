import type { SidebarSection } from "./sections";

/** Claves i18n de la cabecera de una pantalla.
 *
 * El diseño (`Pantalla.dc.html`) abre cada pantalla con un título grande y una
 * línea que resume qué se hace ahí. El título reutiliza la etiqueta que ya
 * existe para el sidebar —no hay motivo para tener dos textos para lo mismo—;
 * el subtítulo es propio de la pantalla.
 */
export interface ScreenHeader {
  titleKey: string;
  subtitleKey: string;
}

export const screenHeaderKeys = (section: SidebarSection): ScreenHeader => ({
  titleKey: `sidebar.${section}`,
  subtitleKey: `screen.${section}.sub`,
});
