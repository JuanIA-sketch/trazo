import type { ReplacementRule } from "../replacementCsv";

export type RuleValidation =
  | { ok: true }
  | { ok: false; reason: "empty" | "unchanged" | "duplicate" };

/**
 * Si una corrección escrita desde el Historial se puede guardar.
 *
 * Las tres razones de rechazo existen por cómo funciona el motor
 * (`apply_custom_replacements`), no por gusto:
 *
 * - `empty`: un patrón en blanco lo descarta el propio motor, así que guardarlo
 *   dejaría una entrada muerta en Ajustes que el usuario cree activa.
 * - `unchanged`: el emparejado ignora mayúsculas, de modo que "Cloud"→"cloud"
 *   tampoco cambia nada observable. No es una corrección.
 * - `duplicate`: con dos reglas para el mismo origen, el motor ordena por
 *   longitud y cuál gana deja de ser predecible para quien las escribió.
 */
export function validateRule(
  from: string,
  to: string,
  existing: ReplacementRule[],
): RuleValidation {
  const origen = from.trim();
  const destino = to.trim();

  if (!origen || !destino) return { ok: false, reason: "empty" };
  if (origen.toLowerCase() === destino.toLowerCase()) {
    return { ok: false, reason: "unchanged" };
  }
  if (
    existing.some((r) => r.from.trim().toLowerCase() === origen.toLowerCase())
  ) {
    return { ok: false, reason: "duplicate" };
  }
  return { ok: true };
}
