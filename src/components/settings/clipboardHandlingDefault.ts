import type { ClipboardHandling } from "@/bindings";

/**
 * El mismo default que aplica el backend en `get_default_settings()`
 * (`settings.rs`), donde está fijado por un test y explicado así: un fallo
 * silencioso de pegado no se puede detectar, así que la única forma de
 * garantizar que un dictado no se pierda es dejarlo en el portapapeles.
 *
 * Vive aquí, y no escrito a mano en el componente, porque cuando el fallback de
 * la interfaz se separó del default del backend la interfaz empezó a mentir
 * sobre lo que había en disco. Si algún día cambia el default en `settings.rs`,
 * este valor tiene que cambiar con él.
 */
export const CLIPBOARD_HANDLING_DEFAULT: ClipboardHandling =
  "copy_to_clipboard";

/**
 * Qué opción mostrar como seleccionada a partir de lo que hay en los ajustes.
 *
 * Mientras el store no ha cargado el valor llega vacío. Pintar en ese hueco un
 * valor distinto del default del backend no es cosmético: el desplegable
 * dispara `onSelect` incluso al pulsar la opción ya marcada, así que lo que se
 * muestre puede acabar escrito en disco sin que el usuario haya elegido nada.
 */
export function resolveClipboardHandling(
  stored: ClipboardHandling | null | undefined,
): ClipboardHandling {
  return stored ?? CLIPBOARD_HANDLING_DEFAULT;
}
