/**
 * Si una pulsación en el desplegable debe llegar al padre como cambio.
 *
 * Pulsar la opción que ya estaba marcada no es un cambio y no tiene por qué
 * provocar una escritura. Avisar igualmente parece inofensivo —se reescribe el
 * mismo valor— pero convierte cualquier desajuste entre lo que la interfaz
 * pinta y lo que hay guardado en una escritura real: el usuario pulsa lo que
 * ve, y lo que ve puede no ser lo que hay. Fue el segundo eslabón del bug que
 * dejaba `clipboard_handling` en `dont_modify` sin que nadie lo eligiera.
 */
export function shouldEmitSelection(
  current: string | null | undefined,
  next: string,
): boolean {
  return current !== next;
}
