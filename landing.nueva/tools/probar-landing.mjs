#!/usr/bin/env node
/* Arnés funcional de la landing de Trazo.
 *
 * Levanta su propio servidor estático, maneja un Chromium headless por CDP y
 * lo baja al terminar: un solo comando. Prueba COMPORTAMIENTO — lo que el gate
 * estático no puede ver.
 *
 *   node tools/probar-landing.mjs                        (contra la copia local)
 *   node tools/probar-landing.mjs https://usatrazo.vercel.app   (contra el sitio en vivo)
 *
 * No va dentro del gate de pre-flight: ese tiene que ser rápido y no depender
 * de un navegador. Son dos comandos porque son dos trabajos.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { levantar } from "./servidor.mjs";
import { abrirNavegador, irA, evaluar } from "./cdp.mjs";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

const fallos = [];
const ok = (m) => console.log(`  ok      ${m}`);
const fallo = (m) => {
  fallos.push(m);
  console.log(`  FALLO   ${m}`);
};

/* Con una URL como argumento se prueba el sitio publicado; sin ella, la copia
   local. Verificar solo en local deja pasar todo lo que el hosting cambia:
   rangos de video, cabeceras y archivos que no llegaron a subir. */
const remoto = process.argv[2];
const sitio = remoto
  ? { base: remoto.replace(/\/$/, ""), cerrar: async () => {} }
  : await levantar(RAIZ);
console.log(`Probando ${sitio.base}\n`);

const navegador = await abrirNavegador({ ancho: 1440, alto: 900 });

try {
  /* ── A · Errores de consola y carga de imágenes ─────────────── */

  const pagina = await navegador.nuevaPestana();
  const erroresConsola = [];
  pagina.on("Runtime.exceptionThrown", (p) => {
    erroresConsola.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text);
  });
  pagina.on("Runtime.consoleAPICalled", (p) => {
    if (p.type === "error") {
      erroresConsola.push(p.args.map((a) => a.value ?? a.description).join(" "));
    }
  });

  await pagina.cmd("Emulation.setDeviceMetricsOverride", {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  });
  await irA(pagina, `${sitio.base}/index.html`, { esperaRed: 1400 });

  erroresConsola.length
    ? fallo(`Errores en consola: ${erroresConsola.slice(0, 3).join(" | ")}`)
    : ok("Sin errores de consola.");

  const rotas = await evaluar(
    pagina,
    `return [...document.images].filter(i => i.complete && i.naturalWidth === 0)
       .map(i => i.getAttribute('src'));`
  );
  rotas.length
    ? fallo(`Imágenes que no cargaron: ${rotas.join(", ")}`)
    : ok(`Las ${await evaluar(pagina, "return document.images.length;")} imágenes cargan.`);

  /* ── B · El video del hero BUSCA de verdad al scrollear ─────── */
  /* Un video clavado en el primer cuadro no da ningún error: es el fallo mudo
     clásico del scrubbing, y solo se ve mirando currentTime. */

  const scrub = await evaluar(
    pagina,
    `const v = document.getElementById('hero-video');
     if (!v) return { error: 'no existe #hero-video' };
     return new Promise(res => {
       let listo = 0;
       const esperar = setInterval(() => {
         if (v.readyState >= 1 || ++listo > 60) {
           clearInterval(esperar);
           const antes = v.currentTime;
           const seccion = document.getElementById('hero-scroll');
           window.scrollTo(0, Math.round(seccion.offsetHeight * 0.55));
           setTimeout(() => res({
             antes, despues: v.currentTime,
             duracion: v.duration, readyState: v.readyState,
           }), 2200);
         }
       }, 50);
     });`
  );

  if (scrub.error) fallo(`Scrubbing: ${scrub.error}`);
  else if (!scrub.duracion || !isFinite(scrub.duracion)) {
    fallo("El video del hero no expuso duración: el servidor no responde rangos (206).");
  } else if (Math.abs(scrub.despues - scrub.antes) < 0.25) {
    fallo(
      `El video no avanza al scrollear (currentTime ${scrub.antes} -> ${scrub.despues}). ` +
        "Está clavado en el primer cuadro."
    );
  } else {
    ok(`El video busca al scrollear: ${scrub.antes.toFixed(2)}s -> ${scrub.despues.toFixed(2)}s de ${scrub.duracion.toFixed(2)}s.`);
  }

  // y hacia atrás
  const atras = await evaluar(
    pagina,
    `const v = document.getElementById('hero-video');
     const antes = v.currentTime;
     window.scrollTo(0, 0);
     return new Promise(res => setTimeout(() => res({ antes, despues: v.currentTime }), 2200));`
  );
  atras.despues < atras.antes - 0.2
    ? ok(`Y retrocede al subir: ${atras.antes.toFixed(2)}s -> ${atras.despues.toFixed(2)}s.`)
    : fallo(`El video no retrocede al subir (${atras.antes} -> ${atras.despues}).`);

  /* ── C · Cero desborde horizontal ───────────────────────────── */

  for (const ancho of [360, 768, 1440]) {
    await pagina.cmd("Emulation.setDeviceMetricsOverride", {
      width: ancho, height: 900, deviceScaleFactor: 1, mobile: ancho < 768,
    });
    await new Promise((r) => setTimeout(r, 500));

    const desborde = await evaluar(
      pagina,
      `const w = document.documentElement.clientWidth;
       // Un elemento más ancho que la ventana solo importa si NADIE lo recorta:
       // los glows y el grano se salen a propósito dentro de overflow:hidden.
       const recortado = el => {
         for (let p = el.parentElement; p; p = p.parentElement) {
           const s = getComputedStyle(p);
           if (s.overflowX !== 'visible' || s.overflow !== 'visible') return true;
           if (s.position === 'fixed') return true;
         }
         return false;
       };
       const culpables = [...document.querySelectorAll('body *')].filter(el => {
         const s = getComputedStyle(el);
         if (s.position === 'fixed' || s.display === 'none') return false;
         const r = el.getBoundingClientRect();
         if (r.width === 0) return false;
         if (r.right <= w + 1.5 && r.left >= -1.5) return false;
         return !recortado(el);
       }).slice(0, 4).map(el =>
         el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
           ? '.' + el.className.trim().split(/\\s+/).slice(0,2).join('.') : ''));
       return {
         documento: document.documentElement.scrollWidth > w + 1,
         culpables: [...new Set(culpables)],
       };`
    );

    // Cumplir la métrica no es cumplir la intención: además del scrollWidth,
    // que ningún bloque quede truncado dentro de un overflow.
    const truncado = await evaluar(
      pagina,
      `return [...document.querySelectorAll('.dl-meta, .dl-note, pre, code')]
         .filter(el => el.scrollWidth > el.clientWidth + 2)
         .map(el => el.className || el.tagName);`
    );

    if (desborde.documento || desborde.culpables.length) {
      fallo(`Desborde horizontal a ${ancho}px: ${desborde.culpables.join(", ") || "documento"}`);
    } else if (truncado.length) {
      fallo(`Contenido truncado dentro de un overflow a ${ancho}px: ${truncado.join(", ")}`);
    } else {
      ok(`Sin desborde ni contenido escondido a ${ancho}px.`);
    }
  }

  /* ── C2 · Los tres botones de descarga miden lo mismo ───────── */
  /* Un icono más alto que los otros empuja la altura de su píldora y las tres
     dejan de estar alineadas. No da error, solo se ve descuadrado. */

  await pagina.cmd("Emulation.setDeviceMetricsOverride", {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  });
  await new Promise((r) => setTimeout(r, 400));

  const botones = await evaluar(
    pagina,
    `return [...document.querySelectorAll('.dl-row .dl')].map(b => {
       const r = b.getBoundingClientRect();
       return { texto: b.textContent.trim().slice(0, 24),
                w: Math.round(r.width), h: Math.round(r.height) };
     });`
  );
  const anchos = [...new Set(botones.map((b) => b.w))];
  const altos = [...new Set(botones.map((b) => b.h))];
  if (anchos.length > 1 || altos.length > 1) {
    fallo(
      "Los botones de descarga no miden lo mismo: " +
        botones.map((b) => `${b.texto} ${b.w}x${b.h}`).join(" · ")
    );
  } else {
    ok(`Los ${botones.length} botones de descarga miden igual (${anchos[0]}x${altos[0]}).`);
  }

  /* ── D · prefers-reduced-motion, en los DOS sentidos ────────── */
  /* Atender solo el encendido deja la página congelada para siempre. */

  await pagina.cmd("Emulation.setDeviceMetricsOverride", {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  });
  await pagina.cmd("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await irA(pagina, `${sitio.base}/index.html`, { esperaRed: 1200 });

  const conReduce = await evaluar(
    pagina,
    `const h1 = document.querySelector('h1');
     const est = getComputedStyle(h1);
     const marquee = getComputedStyle(document.querySelector('.marquee-track'));
     return {
       h1Visible: est.opacity === '1' && h1.getBoundingClientRect().height > 0,
       texto: h1.textContent.trim().length,
       marqueeAnim: marquee.animationName,
     };`
  );
  conReduce.h1Visible && conReduce.texto > 10
    ? ok("Con movimiento reducido el contenido sigue visible y legible.")
    : fallo("Con movimiento reducido el contenido desaparece.");
  conReduce.marqueeAnim === "none"
    ? ok("Con movimiento reducido el carrusel se detiene.")
    : fallo(`El carrusel sigue animado con reduce (${conReduce.marqueeAnim}).`);

  await pagina.cmd("Emulation.setEmulatedMedia", { features: [] });
  await new Promise((r) => setTimeout(r, 600));
  const vuelve = await evaluar(
    pagina,
    `return getComputedStyle(document.querySelector('.marquee-track')).animationName;`
  );
  vuelve !== "none"
    ? ok("Al apagar movimiento reducido el movimiento vuelve sin recargar.")
    : fallo("Apagar movimiento reducido deja la página quieta para siempre.");

  /* ── E · El contenido no depende del JS ─────────────────────── */

  const sinJs = await navegador.nuevaPestana();
  await sinJs.cmd("Emulation.setScriptExecutionDisabled", { value: true });
  await sinJs.cmd("Emulation.setDeviceMetricsOverride", {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  });
  await irA(sinJs, `${sitio.base}/index.html`, { esperaRed: 900 });

  const texto = await sinJs.cmd("Runtime.evaluate", {
    expression: "document.body.innerText",
    returnByValue: true,
  });
  const cuerpo = texto.result.value || "";
  const faltantes = [
    "Habla como",
    "Descargar para Windows",
    "Descargar para macOS",
    "Descargar para Linux",
    "Tu voz nunca sale",
  ].filter((t) => !cuerpo.includes(t));

  faltantes.length
    ? fallo(`Sin JS falta contenido esencial: ${faltantes.join(", ")}`)
    : ok("Sin JS la página se lee entera y se puede descargar.");
  await sinJs.cerrar();

  /* ── F · Enlaces: ninguno muerto, los externos bien formados ── */

  const enlaces = await evaluar(
    pagina,
    `const as = [...document.querySelectorAll('a[href]')];
     return {
       vacios: as.filter(a => a.getAttribute('href') === '#').length,
       externosSinRel: as.filter(a => a.target === '_blank' && !a.rel.includes('noopener'))
         .map(a => a.getAttribute('href')).slice(0, 3),
       descargas: as.filter(a => /releases\\/download\\//.test(a.href)).length,
     };`
  );
  enlaces.vacios === 0 ? ok("Ningún enlace apunta a \"#\".") : fallo(`${enlaces.vacios} enlace(s) a "#".`);
  enlaces.externosSinRel.length === 0
    ? ok("Todos los target=_blank llevan rel=noopener.")
    : fallo(`target=_blank sin noopener: ${enlaces.externosSinRel.join(", ")}`);
  enlaces.descargas >= 3
    ? ok(`${enlaces.descargas} enlaces de descarga reales al release.`)
    : fallo(`Solo ${enlaces.descargas} enlaces de descarga; se esperan al menos 3.`);
} catch (e) {
  fallo(`El arnés se cayó: ${e.message}`);
} finally {
  await navegador.cerrar();
  await sitio.cerrar();
}

console.log(`\nRESULTADO: ${fallos.length} fallo(s)`);
process.exit(fallos.length ? 1 : 0);
