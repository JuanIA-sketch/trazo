import { describe, expect, test } from "bun:test";
import fs from "fs";
import path from "path";

/**
 * La píldora tiene que CABER en la ventana del overlay.
 *
 * La ventana mide 256x64 y es una constante de Rust (`OVERLAY_HEIGHT` en
 * `overlay.rs`), o sea que desde el frontend es un techo que no se negocia.
 * Dentro de esos 64 px hay que meter tres cosas que se solapan mal:
 *
 *   - la corona, que sobresale `--ov-crown-up` por encima de la tarjeta;
 *   - la tarjeta (`--ov-base-h`);
 *   - el halo de la tarjeta, que se derrama por DEBAJO de su caja.
 *
 * El 2026-08-01 se encontró la píldora cortada en seco por abajo: el halo se
 * derramaba 7 px y `.ov-stage` no reservaba ni uno (`align-items: flex-end`
 * pega la tarjeta al borde). La variante `.top` sí tenía su `padding-top`
 * para la corona; a la de abajo nunca le pusieron el equivalente.
 *
 * Estos tests fijan el presupuesto vertical. Si alguien vuelve a empujar el
 * halo hacia abajo, o se come el hueco, fallan acá y no en la cara del
 * usuario — que es donde se detectó esta vez.
 */

const css = fs.readFileSync(
  path.join(import.meta.dir, "RecordingOverlay.css"),
  "utf8",
);

const px = (v: string) => parseFloat(v.replace("px", "").trim());

/** Valor de una custom property declarada en el archivo. */
function variable(nombre: string): string {
  const m = new RegExp(`${nombre}:\\s*([^;]+);`).exec(css);
  if (!m) throw new Error(`no está declarada ${nombre}`);
  return m[1].replace(/\s+/g, " ").trim();
}

/**
 * Cuánto se derrama una sombra por debajo de su caja.
 * Para `offsetX offsetY blur spread`, el alcance hacia abajo es
 * `offsetY + spread + blur/2` (el desenfoque reparte la mitad hacia afuera).
 */
function derrameInferior(sombra: string): number {
  const capas = sombra.split(/,(?![^()]*\))/);
  let peor = 0;
  for (const capa of capas) {
    const nums = capa.match(/-?\d*\.?\d+px/g);
    if (!nums || nums.length < 4) continue;
    const [, offsetY, blur, spread] = nums.map(px);
    peor = Math.max(peor, offsetY + spread + blur / 2);
  }
  return peor;
}

/** El `padding-bottom` declarado en la regla base de `.ov-stage`. */
function huecoInferiorDelEscenario(): number {
  const i = css.indexOf(".ov-stage {");
  if (i < 0) throw new Error("no existe la regla .ov-stage");
  const bloque = css.slice(i, css.indexOf("}", i));
  const m = /padding-bottom:\s*([^;]+);/.exec(bloque);
  return m ? px(m[1]) : 0;
}

describe("el overlay cabe en su ventana", () => {
  test("el escenario reserva abajo al menos lo que se derrama el halo", () => {
    // Este es el bug de 2026-08-01: derrame 7px, hueco 0px.
    expect(huecoInferiorDelEscenario()).toBeGreaterThanOrEqual(
      derrameInferior(variable("--t-glow")),
    );
  });

  test("corona + tarjeta + hueco del halo entran en los 64 px de la ventana", () => {
    const ALTO_VENTANA = 64; // OVERLAY_HEIGHT en src-tauri/src/overlay.rs
    const usado =
      px(variable("--ov-crown-up")) +
      px(variable("--ov-base-h")) +
      huecoInferiorDelEscenario();
    // Con holgura: la corona también tiene su propio resplandor arriba.
    expect(usado).toBeLessThanOrEqual(ALTO_VENTANA - 4);
  });
});
