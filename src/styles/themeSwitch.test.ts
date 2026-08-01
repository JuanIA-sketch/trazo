import { describe, expect, it } from "bun:test";
import fs from "fs";
import path from "path";

/**
 * El tema tiene que poder forzarse, no solo seguir al sistema.
 *
 * CSS no deja compartir declaraciones entre un selector normal y una media
 * query, así que los valores oscuros viven por duplicado: una vez para el tema
 * forzado y otra para el automático. Estos tests son lo que impide que esas
 * dos copias se desincronicen con el tiempo.
 */

const leer = (archivo: string) =>
  fs.readFileSync(path.join(import.meta.dir, archivo), "utf8");

/** Devuelve las declaraciones `--token: valor` de un bloque, normalizadas. */
const declaraciones = (bloque: string): Map<string, string> => {
  const mapa = new Map<string, string>();
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(bloque)) !== null) {
    mapa.set(m[1], m[2].replace(/\s+/g, " ").trim());
  }
  return mapa;
};

/** Extrae el cuerpo del bloque que empieza en `desde`, contando llaves. */
const cuerpoDesde = (css: string, desde: number): string => {
  const abre = css.indexOf("{", desde);
  let nivel = 0;
  for (let i = abre; i < css.length; i++) {
    if (css[i] === "{") nivel++;
    else if (css[i] === "}") {
      nivel--;
      if (nivel === 0) return css.slice(abre + 1, i);
    }
  }
  throw new Error("bloque sin cerrar");
};

const ARCHIVOS = ["material.css", "theme.css"];

describe.each(ARCHIVOS)("%s: tema conmutable", (archivo) => {
  const css = leer(archivo);

  it("tiene un bloque de tema oscuro forzado por atributo", () => {
    expect(css).toContain('[data-theme="dark"]');
  });

  it("el automático no pisa un tema claro forzado", () => {
    const iMedia = css.indexOf("@media (prefers-color-scheme: dark)");
    expect(iMedia).toBeGreaterThan(-1);
    const selector = css.slice(iMedia, css.indexOf("{", css.indexOf("{", iMedia) + 1));
    expect(selector).toContain(':not([data-theme="light"])');
  });

  it("las dos copias de los valores oscuros son idénticas", () => {
    const iForzado = css.indexOf(':root[data-theme="dark"]');
    const iMedia = css.indexOf("@media (prefers-color-scheme: dark)");
    expect(iForzado).toBeGreaterThan(-1);
    expect(iMedia).toBeGreaterThan(-1);

    const forzado = declaraciones(cuerpoDesde(css, iForzado));
    const automatico = declaraciones(cuerpoDesde(css, iMedia));

    expect(forzado.size).toBeGreaterThan(0);
    expect([...forzado.keys()].sort()).toEqual([...automatico.keys()].sort());
    for (const [token, valor] of forzado) {
      expect(automatico.get(token)).toBe(valor);
    }
  });
});
