import { describe, expect, test } from "bun:test";
import {
  applyTheme,
  effectiveTheme,
  initTheme,
  readThemeChoice,
  themeAttribute,
  type ThemeTarget,
} from "./theme";

/**
 * El contrato del tema de tres estados (05-DETALLES-UX.md §1).
 *
 * La sutileza que justifica estos tests: el CSS de `theme.css` / `material.css`
 * hace que el modo automático dependa de que NO exista el atributo
 * `data-theme` — la media query está escrita como
 * `:root:not([data-theme="light"]):not([data-theme="dark"])`. O sea que "auto"
 * no es un valor del atributo: es su ausencia. Escribir `data-theme="auto"`
 * dejaría al usuario clavado en claro para siempre, y sería un bug silencioso
 * porque el atributo *parecería* correcto al inspeccionar el DOM.
 */

/** Doble del elemento raíz: `document.documentElement` lo satisface. */
function makeTarget(inicial?: string): ThemeTarget & { attr: string | null } {
  return {
    attr: inicial ?? null,
    setAttribute(name: string, value: string) {
      if (name === "data-theme") this.attr = value;
    },
    removeAttribute(name: string) {
      if (name === "data-theme") this.attr = null;
    },
  };
}

describe("themeAttribute", () => {
  test("automático no tiene atributo: la media query depende de su ausencia", () => {
    expect(themeAttribute("auto")).toBeNull();
  });

  test("claro y oscuro se fuerzan por atributo", () => {
    expect(themeAttribute("light")).toBe("light");
    expect(themeAttribute("dark")).toBe("dark");
  });
});

describe("applyTheme", () => {
  test("forzar oscuro escribe el atributo", () => {
    const raiz = makeTarget();
    applyTheme(raiz, "dark");
    expect(raiz.attr).toBe("dark");
  });

  test("volver a automático BORRA el atributo que había", () => {
    // La regresión que de verdad importa: si al pasar de forzado a automático
    // se dejara el atributo puesto, la app quedaría clavada en ese tema y
    // dejaría de seguir al sistema — sin que nada falle a la vista.
    const raiz = makeTarget("dark");
    applyTheme(raiz, "auto");
    expect(raiz.attr).toBeNull();
  });
});

describe("readThemeChoice", () => {
  test("un valor persistido corrupto cae en automático", () => {
    expect(readThemeChoice("morado")).toBe("auto");
    expect(readThemeChoice(null)).toBe("auto");
    expect(readThemeChoice(undefined)).toBe("auto");
  });

  test("los tres valores válidos sobreviven al viaje de ida y vuelta", () => {
    expect(readThemeChoice("light")).toBe("light");
    expect(readThemeChoice("dark")).toBe("dark");
    expect(readThemeChoice("auto")).toBe("auto");
  });
});

describe("initTheme", () => {
  /** Registra el orden en que ocurren las cosas durante el arranque. */
  function makeBoot(persistido: unknown) {
    const orden: string[] = [];
    let pendiente: (() => void) | null = null;
    const raiz: ThemeTarget = {
      setAttribute: (n) => {
        if (n === "data-theme") orden.push("aplica-tema");
      },
      removeAttribute: (n) => {
        if (n === "data-theme") orden.push("aplica-tema");
      },
    };
    return {
      orden,
      /** Simula el primer pintado del navegador. */
      pintar: () => pendiente?.(),
      deps: {
        root: raiz,
        readPersisted: () => persistido,
        enableTransitions: () => orden.push("habilita-transiciones"),
        afterFirstPaint: (cb: () => void) => {
          pendiente = cb;
        },
      },
    };
  }

  test("aplica el tema persistido al arrancar", () => {
    const boot = makeBoot("dark");
    expect(initTheme(boot.deps)).toBe("dark");
    expect(boot.orden).toContain("aplica-tema");
  });

  test("el arranque no habilita transiciones de forma síncrona", () => {
    // Si se habilitaran antes del primer pintado, pintar el tema guardado
    // sería en sí mismo una animación: el flash blanco que el diseño prohíbe.
    const boot = makeBoot("dark");
    initTheme(boot.deps);
    expect(boot.orden).toEqual(["aplica-tema"]);
  });

  test("las transiciones se habilitan DESPUÉS de aplicar el tema", () => {
    const boot = makeBoot("light");
    initTheme(boot.deps);
    boot.pintar();
    expect(boot.orden).toEqual(["aplica-tema", "habilita-transiciones"]);
  });
});

describe("effectiveTheme", () => {
  test("en automático sigue al sistema", () => {
    expect(effectiveTheme("auto", true)).toBe("dark");
    expect(effectiveTheme("auto", false)).toBe("light");
  });

  test("forzado ignora al sistema", () => {
    expect(effectiveTheme("light", true)).toBe("light");
    expect(effectiveTheme("dark", false)).toBe("dark");
  });
});
