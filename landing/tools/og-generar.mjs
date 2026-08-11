#!/usr/bin/env node
/* Genera la tarjeta que se ve al compartir el link (assets/og/og-trazo.png).
 *
 * La pinta un Chrome headless sobre tools/og.html, que enlaza el styles.css y
 * las tipografías REALES del sitio: si cambia la paleta o el copy del hero, se
 * vuelve a correr esto y la tarjeta queda al día. Por eso el generador vive en
 * el repo — un PNG versionado sin la fuente que lo produce no se puede rehacer.
 *
 *   node tools/og-generar.mjs
 */
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { levantar } from "./servidor.mjs";
import { abrirNavegador, irA, evaluar } from "./cdp.mjs";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..");
const SALIDA = join(RAIZ, "assets", "og", "og-trazo.png");
const ANCHO = 1200;
const ALTO = 630;

const sitio = await levantar(RAIZ);
const navegador = await abrirNavegador({ ancho: ANCHO, alto: ALTO });
let codigo = 0;

try {
  const pagina = await navegador.nuevaPestana();

  await pagina.cmd("Emulation.setDeviceMetricsOverride", {
    width: ANCHO,
    height: ALTO,
    deviceScaleFactor: 2, // 2x y luego se reduce: bordes y tipografía más limpios
    mobile: false,
  });

  await irA(pagina, `${sitio.base}/tools/og.html`, { esperaRed: 400 });

  // Sin esto la tarjeta sale con la tipografía de respaldo cada tanto
  await evaluar(pagina, "return document.fonts.ready.then(() => true);");
  await new Promise((r) => setTimeout(r, 350));

  const alto = await evaluar(pagina, "return document.getElementById('tarjeta').offsetHeight;");
  if (alto !== ALTO) {
    throw new Error(`La tarjeta mide ${alto}px de alto y tiene que medir ${ALTO}px.`);
  }

  const { data } = await pagina.cmd("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width: ANCHO, height: ALTO, scale: 0.5 },
  });

  mkdirSync(dirname(SALIDA), { recursive: true });
  writeFileSync(SALIDA, Buffer.from(data, "base64"));

  const kb = (statSync(SALIDA).size / 1024).toFixed(0);
  console.log(`Tarjeta OG escrita: assets/og/og-trazo.png (${ANCHO}x${ALTO}, ${kb} KB)`);
} catch (e) {
  console.error("No se pudo generar la tarjeta:", e.message);
  codigo = 1;
} finally {
  await navegador.cerrar();
  await sitio.cerrar();
}

process.exit(codigo);
