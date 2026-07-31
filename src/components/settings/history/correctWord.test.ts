import { describe, expect, it } from "bun:test";
import { validateRule } from "./correctWord";
import type { ReplacementRule } from "../replacementCsv";

const reglas = (pares: [string, string][]): ReplacementRule[] =>
  pares.map(([from, to]) => ({ from, to }));

describe("validateRule", () => {
  it("acepta una corrección normal", () => {
    expect(validateRule("cloud", "Claude", [])).toEqual({ ok: true });
  });

  // Sin `from` la regla emparejaría en todas partes; el motor ya las descarta
  // (`apply_custom_replacements` filtra los patrones en blanco), así que
  // guardarla solo crearía una entrada muerta en Ajustes.
  it("rechaza un origen vacío o en blanco", () => {
    expect(validateRule("", "Claude", [])).toEqual({
      ok: false,
      reason: "empty",
    });
    expect(validateRule("   ", "Claude", [])).toEqual({
      ok: false,
      reason: "empty",
    });
  });

  it("rechaza un destino vacío", () => {
    expect(validateRule("cloud", "", [])).toEqual({
      ok: false,
      reason: "empty",
    });
  });

  // Una regla que no cambia nada no es una corrección.
  it("rechaza una regla que deja el texto igual", () => {
    expect(validateRule("cloud", "cloud", [])).toEqual({
      ok: false,
      reason: "unchanged",
    });
  });

  // El motor empareja sin distinguir mayúsculas, así que "Cloud"→"cloud"
  // tampoco cambiaría nada de forma observable en el emparejado.
  it("rechaza una regla que solo cambia mayúsculas del propio origen", () => {
    expect(validateRule("Cloud", "cloud", [])).toEqual({
      ok: false,
      reason: "unchanged",
    });
  });

  // Duplicar el origen es peor que inútil: el motor ordena por longitud y la
  // que gane sería impredecible para el usuario.
  it("rechaza un origen que ya tiene regla", () => {
    expect(
      validateRule("cloud", "Claude", reglas([["cloud", "Cloud9"]])),
    ).toEqual({
      ok: false,
      reason: "duplicate",
    });
  });

  it("detecta el duplicado sin distinguir mayúsculas ni espacios", () => {
    expect(
      validateRule("  CLOUD ", "Claude", reglas([["cloud", "X"]])),
    ).toEqual({
      ok: false,
      reason: "duplicate",
    });
  });

  // Contrapeso: reglas distintas conviven sin problema.
  it("acepta una regla nueva cuando ya hay otras", () => {
    expect(
      validateRule("landi", "landing", reglas([["cloud", "Claude"]])),
    ).toEqual({ ok: true });
  });
});
