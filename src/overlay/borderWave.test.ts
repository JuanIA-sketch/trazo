import { describe, expect, it } from "bun:test";
import { contornoPildora, deformarHaciaAdentro, rutaSvg } from "./borderWave";

const ANCHO = 184;
const ALTO = 40;
const RADIO = 20;
const N = 64;

const distanciaAlCentro = (p: { x: number; y: number }) =>
  Math.hypot(p.x - ANCHO / 2, p.y - ALTO / 2);

describe("contornoPildora", () => {
  it("devuelve exactamente las muestras pedidas", () => {
    expect(contornoPildora(ANCHO, ALTO, RADIO, N)).toHaveLength(N);
  });

  it("todos los puntos caen dentro de la caja de la píldora", () => {
    for (const p of contornoPildora(ANCHO, ALTO, RADIO, N)) {
      expect(p.x).toBeGreaterThanOrEqual(-0.01);
      expect(p.x).toBeLessThanOrEqual(ANCHO + 0.01);
      expect(p.y).toBeGreaterThanOrEqual(-0.01);
      expect(p.y).toBeLessThanOrEqual(ALTO + 0.01);
    }
  });
});

describe("deformarHaciaAdentro", () => {
  const base = contornoPildora(ANCHO, ALTO, RADIO, N);

  it("sin amplitud no mueve nada", () => {
    const d = deformarHaciaAdentro(base, { amplitudes: new Array(N).fill(0) });
    d.forEach((p, i) => {
      expect(p.x).toBeCloseTo(base[i].x, 5);
      expect(p.y).toBeCloseTo(base[i].y, 5);
    });
  });

  it("la onda va HACIA ADENTRO: nunca se sale de la píldora", () => {
    const d = deformarHaticaSegura();
    d.forEach((p, i) => {
      expect(distanciaAlCentro(p)).toBeLessThanOrEqual(
        distanciaAlCentro(base[i]) + 0.001,
      );
    });
  });

  function deformarHaticaSegura() {
    return deformarHaciaAdentro(base, { amplitudes: new Array(N).fill(1) });
  }

  it("la amplitud decae con la distancia angular a la corona", () => {
    // La corona vive en la esquina superior izquierda: índice 0 del contorno.
    const d = deformarHaciaAdentro(base, {
      amplitudes: new Array(N).fill(1),
      origen: 0,
    });
    const desplazado = (i: number) =>
      Math.hypot(d[i].x - base[i].x, d[i].y - base[i].y);

    const enCorona = desplazado(0);
    const opuesto = desplazado(Math.floor(N / 2));
    expect(enCorona).toBeGreaterThan(opuesto);
  });
});

describe("rutaSvg", () => {
  it("produce un path cerrado", () => {
    const d = rutaSvg(contornoPildora(ANCHO, ALTO, RADIO, N));
    expect(d.startsWith("M")).toBe(true);
    expect(d.trimEnd().endsWith("Z")).toBe(true);
  });

  it("no emite NaN ni con tamaños degenerados", () => {
    const d = rutaSvg(contornoPildora(0, 0, 0, 8));
    expect(d).not.toContain("NaN");
  });
});
