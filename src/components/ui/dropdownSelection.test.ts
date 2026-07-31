import { describe, expect, it } from "bun:test";
import { shouldEmitSelection } from "./dropdownSelection";

describe("shouldEmitSelection", () => {
  // El Dropdown avisaba al padre aunque se pulsara la opción ya marcada. Por sí
  // solo eso no rompe nada —se reescribe el mismo valor—, pero convierte
  // cualquier desajuste entre lo que la interfaz muestra y lo que hay en disco
  // en una escritura real: basta con que el usuario pulse lo que ve. Fue el
  // segundo eslabon del bug de clipboard_handling.
  it("no avisa cuando se pulsa la opcion ya seleccionada", () => {
    expect(shouldEmitSelection("copy_to_clipboard", "copy_to_clipboard")).toBe(
      false,
    );
  });

  it("avisa cuando el valor cambia de verdad", () => {
    expect(shouldEmitSelection("copy_to_clipboard", "dont_modify")).toBe(true);
  });

  // Sin nada seleccionado todavia (placeholder, lista aun cargando) cualquier
  // eleccion es un cambio real y tiene que llegar al padre.
  it("avisa cuando no habia nada seleccionado", () => {
    expect(shouldEmitSelection(undefined, "dont_modify")).toBe(true);
    expect(shouldEmitSelection("", "dont_modify")).toBe(true);
    // `selectedValue` del Dropdown es `string | null`, no `undefined`.
    expect(shouldEmitSelection(null, "dont_modify")).toBe(true);
  });
});
