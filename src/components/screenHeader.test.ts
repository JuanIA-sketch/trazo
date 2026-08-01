import { describe, expect, it } from "bun:test";
import { screenHeaderKeys } from "./screenHeader";
import { SECTION_IDS } from "./sections";

describe("screenHeaderKeys", () => {
  it("reutiliza la etiqueta del sidebar como título, sin inventar una clave nueva", () => {
    expect(screenHeaderKeys("general").titleKey).toBe("sidebar.general");
    expect(screenHeaderKeys("models").titleKey).toBe("sidebar.models");
  });

  it("da a cada sección su propio subtítulo", () => {
    expect(screenHeaderKeys("general").subtitleKey).toBe("screen.general.sub");
    expect(screenHeaderKeys("history").subtitleKey).toBe("screen.history.sub");
  });

  it("cubre TODAS las secciones del sidebar: ninguna se queda sin cabecera", () => {
    for (const id of SECTION_IDS) {
      const header = screenHeaderKeys(id);
      expect(header.titleKey.length).toBeGreaterThan(0);
      expect(header.subtitleKey.length).toBeGreaterThan(0);
    }
  });
});
