import type { RecordingRetentionPeriod } from "@/bindings";

/**
 * Defaults que la interfaz muestra mientras los ajustes no han cargado.
 *
 * Tienen que ser LOS MISMOS que aplica `get_default_settings()` en
 * `settings.rs`. Cuando se separan, la interfaz muestra un valor distinto del
 * que hay en disco y el usuario decide sobre información falsa — y si el
 * control escribe lo que muestra, el valor falso acaba guardado. Eso ya pasó
 * con `clipboard_handling` y costó dictados perdidos en silencio.
 *
 * Si cambia un default en `settings.rs`, tiene que cambiar aquí.
 */

/**
 * Apagado desde la migración v6: en algunos equipos el VAD se comía casi el
 * dictado entero, y la pérdida era silenciosa.
 */
export const VAD_ENABLED_DEFAULT = false;

/** Subido de 5 a 20 (§2.5): con 5 se borraban grabaciones antes de revisarlas. */
export const HISTORY_LIMIT_DEFAULT = 20;

/**
 * `preserve_limit`, no `never`: las grabaciones por encima del límite SÍ se
 * borran. Prometer "nunca" mientras se borra es la mentira más cara de las
 * tres.
 */
export const RECORDING_RETENTION_DEFAULT: RecordingRetentionPeriod =
  "preserve_limit";
