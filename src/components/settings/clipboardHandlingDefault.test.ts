import { describe, expect, it } from "bun:test";
import {
  CLIPBOARD_HANDLING_DEFAULT,
  resolveClipboardHandling,
} from "./clipboardHandlingDefault";

describe("resolveClipboardHandling", () => {
  // El fallo real: mientras los ajustes no han cargado, `getSetting` devuelve
  // undefined y el desplegable pintaba "dont_modify" como seleccionado aunque
  // en disco pusiera "copy_to_clipboard". Como el Dropdown dispara onSelect
  // incluso al pulsar la opción YA seleccionada, bastaba con abrirlo y pulsar
  // lo que se veía para escribir en disco un valor que el usuario nunca eligió
  // — y ese valor es justo el que pierde dictados si el pegado falla en
  // silencio.
  it("con el ajuste sin cargar cae en el default del backend, no en dont_modify", () => {
    expect(resolveClipboardHandling(undefined)).toBe("copy_to_clipboard");
    expect(resolveClipboardHandling(null)).toBe("copy_to_clipboard");
  });

  it("respeta el valor guardado cuando existe", () => {
    expect(resolveClipboardHandling("dont_modify")).toBe("dont_modify");
    expect(resolveClipboardHandling("copy_to_clipboard")).toBe(
      "copy_to_clipboard",
    );
  });

  // Este es el invariante que hay que proteger a largo plazo: el fallback de la
  // interfaz y el default del backend tienen que ser el mismo valor. Cuando se
  // separaron, la interfaz pasó a mentir sobre lo que había en disco.
  it("el default expuesto coincide con el del backend (settings.rs)", () => {
    expect(CLIPBOARD_HANDLING_DEFAULT).toBe("copy_to_clipboard");
  });
});
