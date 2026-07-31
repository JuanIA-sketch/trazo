#!/usr/bin/env node
/* Gate estático de la landing de Trazo. Sin dependencias, sin red, sin
 * navegador: corre en segundos y sirve de pre-flight del deploy.
 *
 *   node tools/verificar-landing.mjs
 *
 * Sale con código 1 si hay algún fallo. Los avisos no rompen el gate.
 */
import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { dirname, join, relative, posix } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, "..");
const DOMINIO = "https://usatrazo.vercel.app";

const fallos = [];
const avisos = [];
const fallo = (m) => fallos.push(m);
const aviso = (m) => avisos.push(m);

const html = readFileSync(join(RAIZ, "index.html"), "utf8");
const css = readFileSync(join(RAIZ, "styles.css"), "utf8");

/* ── 1 · Estructura del documento ─────────────────────────────── */

if (!/<html[^>]+lang="es"/.test(html)) fallo("Falta lang=\"es\" en <html>.");
if (!/<meta[^>]+name="viewport"/.test(html)) fallo("Falta el meta viewport.");

const titulo = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? "";
if (titulo.length < 20 || titulo.length > 70) {
  fallo(`El <title> mide ${titulo.length} caracteres; se espera entre 20 y 70.`);
}

const desc = /<meta\s+name="description"\s+content="([^"]*)"/.exec(html)?.[1] ?? "";
if (desc.length < 70 || desc.length > 200) {
  fallo(`La meta description mide ${desc.length} caracteres; se espera entre 70 y 200.`);
}
if (!/<link\s+rel="canonical"/.test(html)) fallo("Falta el link canonical.");

/* ── 1b · El CSS tiene que parsear ────────────────────────────── */
/* Un comentario mal cerrado deja el resto del bloque como CSS crudo y el
   navegador lo descarta en silencio: no hay error, solo estilos que faltan. */

const aperturas = (css.match(/\/\*/g) || []).length;
const cierres = (css.match(/\*\//g) || []).length;
if (aperturas !== cierres) {
  fallo(`Comentarios de CSS descuadrados: ${aperturas} "/*" contra ${cierres} "*/".`);
}

const sinComentarios = css.replace(/\/\*[\s\S]*?\*\//g, "");
const llaves = (sinComentarios.match(/\{/g) || []).length - (sinComentarios.match(/\}/g) || []).length;
if (llaves !== 0) {
  fallo(`Llaves de CSS descuadradas: sobran ${llaves > 0 ? llaves + " {" : -llaves + " }"}.`);
}
// texto suelto fuera de una regla: la firma de un comentario que se cerró antes
for (const trozo of sinComentarios.split("}")) {
  const cabeza = trozo.split("{")[0];
  if (/[a-záéíóúñ]{4,}\s+[a-záéíóúñ]{4,}\s+[a-záéíóúñ]{4,}/i.test(cabeza.replace(/\s+/g, " "))) {
    fallo(`Prosa suelta en el CSS, fuera de comentario: "${cabeza.trim().slice(0, 60)}…"`);
    break;
  }
}

/* ── 2 · Referencias: todo lo que se pide tiene que existir ───── */

const REF = /(?:src|href)="([^"]+)"|poster="([^"]+)"/g;
const referencias = new Set();
const externas = new Set();
for (const m of html.matchAll(REF)) {
  const url = m[1] ?? m[2];
  if (!url || url.startsWith("#") || url.startsWith("data:")) continue;
  if (/^https?:\/\//i.test(url)) externas.add(url);
  else referencias.add(url.split("?")[0]);
}
// url() del CSS, quitando antes los data: (traen url(%23id) anidados que no
// son archivos, sino referencias a filtros SVG dentro del propio data-URI)
const cssSinDataUri = css.replace(/url\((['"]?)data:[^)]*\1\)/g, "url(inline)");
for (const m of cssSinDataUri.matchAll(/url\((['"]?)([^)'"]+)\1\)/g)) {
  const url = m[2].split("?")[0];
  if (url === "inline" || url.startsWith("#") || url.startsWith("%23")) continue;
  referencias.add(url);
}

for (const ref of referencias) {
  if (!existsSync(join(RAIZ, ref))) {
    fallo(`Referencia rota: "${ref}" no existe en el disco.`);
  }
}

/* ── 3 · Nada externo salvo las tipografías declaradas ────────── */

const HOSTS_OK = new Set([
  "fonts.googleapis.com",
  "fonts.gstatic.com",
  "github.com",
  "chatgpt.com",
  "claude.ai",
  "www.perplexity.ai",
  "schema.org",
  "usatrazo.vercel.app",
  "openapi.vercel.sh",
]);
for (const url of externas) {
  const host = new URL(url).hostname;
  if (!HOSTS_OK.has(host)) aviso(`Recurso externo no declarado: ${host}`);
  if (/localhost|127\.0\.0\.1/.test(url)) fallo(`Quedó una URL local en el HTML: ${url}`);
}

/* ── 4 · Imágenes: alt y medidas (si faltan, la página salta) ─── */

for (const m of html.matchAll(/<img\b[^>]*>/g)) {
  const tag = m[0];
  const src = /src="([^"]*)"/.exec(tag)?.[1] ?? "(sin src)";
  const decorativa = /aria-hidden="true"/.test(tag);
  const alt = /alt="([^"]*)"/.exec(tag);
  if (!alt) fallo(`<img> sin atributo alt: ${src}`);
  else if (!decorativa && alt[1].trim() === "" && !/^\s*$/.test(alt[1])) {
    /* alt="" es válido solo en decorativas del carrusel duplicado */
  }
  if (!/width="\d+"/.test(tag) || !/height="\d+"/.test(tag)) {
    fallo(`<img> sin width/height (provoca saltos de layout): ${src}`);
  }
}

/* ── 5 · Open Graph: la trampa de la URL absoluta ─────────────── */

const meta = (prop) =>
  new RegExp(`<meta\\s+(?:property|name)="${prop}"\\s+content="([^"]*)"`).exec(html)?.[1];

const ogImage = meta("og:image");
const ogUrl = meta("og:url");

if (!ogImage) fallo("Falta og:image: el link se comparte sin tarjeta.");
if (!ogUrl) fallo("Falta og:url.");

if (ogImage && ogUrl) {
  for (const [nombre, valor] of [["og:image", ogImage], ["og:url", ogUrl]]) {
    if (!valor.startsWith("https://")) {
      fallo(`${nombre} tiene que ser absoluta y https; es "${valor}".`);
    }
  }
  if (/\.svg($|\?)/i.test(ogImage)) fallo("og:image es SVG y WhatsApp no lo renderiza.");

  // los dos apuntando al mismo dominio: el copiar-pegar entre proyectos deja
  // justo este error y la tarjeta sale con la foto de otro sitio
  try {
    const hi = new URL(ogImage).hostname;
    const hu = new URL(ogUrl).hostname;
    if (hi !== hu) fallo(`og:image (${hi}) y og:url (${hu}) apuntan a dominios distintos.`);
  } catch {
    fallo("og:image u og:url no son URL válidas.");
  }

  // y el archivo tiene que estar en la carpeta que se sube
  const rutaOg = new URL(ogImage).pathname.replace(/^\//, "");
  if (!existsSync(join(RAIZ, rutaOg))) {
    fallo(`og:image apunta a "${rutaOg}", que no existe en la carpeta a desplegar.`);
  }
  // se pide por URL absoluta, pero es un archivo nuestro: cuenta como referenciado
  referencias.add(rutaOg);
  if (!meta("twitter:card")) fallo("Falta twitter:card.");
}

/* ── 6 · El dominio del HTML contra el dominio real ───────────── */
/* Comparar el HTML consigo mismo no alcanza: puede estar coherente y a la vez
   entero equivocado. Se contrasta con el proyecto de Vercel. */

const rutaProyecto = join(RAIZ, ".vercel", "project.json");
if (existsSync(rutaProyecto)) {
  const proyecto = JSON.parse(readFileSync(rutaProyecto, "utf8"));
  const nombre = proyecto.projectName ?? proyecto.name;
  if (nombre) {
    const hostHtml = new URL(DOMINIO).hostname;
    const esperado = new RegExp(`^${nombre}(-[a-z0-9]+)*\\.vercel\\.app$`);
    if (!esperado.test(hostHtml)) {
      fallo(
        `El dominio del HTML (${hostHtml}) no corresponde al proyecto de Vercel "${nombre}".`
      );
    }
  }
} else {
  aviso("No hay .vercel/project.json todavía: no puedo contrastar el dominio real.");
}

for (const decl of [DOMINIO, ogImage, ogUrl].filter(Boolean)) {
  if (!decl.startsWith(DOMINIO)) {
    fallo(`URL fuera del dominio declarado (${DOMINIO}): ${decl}`);
  }
}

/* ── 7 · Higiene de lo que se sube ────────────────────────────── */

const ignorePath = join(RAIZ, ".vercelignore");
let patrones = [];
if (!existsSync(ignorePath)) {
  fallo("Falta .vercelignore: se subirían las fuentes pesadas y los tokens de Vercel.");
} else {
  patrones = readFileSync(ignorePath, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  for (const necesario of [".env", ".env.*", ".vercel", "tools/"]) {
    if (!patrones.includes(necesario)) {
      fallo(`.vercelignore no excluye "${necesario}".`);
    }
  }
}

const ignorado = (ruta) =>
  patrones.some((p) => {
    if (p.endsWith("/")) return ruta === p.slice(0, -1) || ruta.startsWith(p);
    if (p.includes("*")) {
      return new RegExp("^" + p.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$").test(ruta);
    }
    return ruta === p || ruta.startsWith(p + "/");
  });

/* El fallo que más caro sale: excluir del deploy algo que la página SÍ pide.
   En local funciona y en producción es un 404. */
for (const ref of referencias) {
  const limpia = posix.normalize(ref).replace(/^\.\//, "");
  if (ignorado(limpia)) {
    fallo(`"${limpia}" está referenciado por la página pero .vercelignore lo excluye.`);
  }
}

/* Y al revés: lo que se sube sin que nadie lo pida */
const listar = (dir) => {
  const salida = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === ".git" || e.name === ".vercel") continue;
    const abs = join(dir, e.name);
    if (e.isDirectory()) salida.push(...listar(abs));
    else salida.push(relative(RAIZ, abs).split("\\").join("/"));
  }
  return salida;
};

const SUELTOS_OK = new Set([
  "index.html", "styles.css", "main.js", "site.webmanifest",
  "vercel.json", ".vercelignore", "assets/icons/icon-512.png",
]);
let pesoDesplegado = 0;
for (const archivo of listar(RAIZ)) {
  if (ignorado(archivo)) continue;
  pesoDesplegado += statSync(join(RAIZ, archivo)).size;
  if (!referencias.has(archivo) && !SUELTOS_OK.has(archivo)) {
    aviso(`Se sube sin que nadie lo referencie: ${archivo}`);
  }
}

/* ── 7b · Caché inmutable solo sobre nombres versionados ───────── */
/* El fallo que costó una sesión entera: /assets/ servido con caché de un año
   e inmutable, y encima se regeneró el video conservando el nombre. Para
   quien ya había visitado la página, ese archivo quedaba congelado un año —
   veía la versión vieja y ninguna cantidad de deploys se la cambiaba. */

const rutaVercel = join(RAIZ, "vercel.json");
if (existsSync(rutaVercel)) {
  const conf = JSON.parse(readFileSync(rutaVercel, "utf8"));
  for (const regla of conf.headers ?? []) {
    const cache = (regla.headers ?? []).find(
      (h) => h.key.toLowerCase() === "cache-control"
    );
    if (!cache || !/immutable/i.test(cache.value)) continue;

    // Un patrón inmutable obliga a que TODO lo que sirve lleve versión o hash
    // en el nombre; si no, actualizarlo nunca le llega a quien ya estuvo.
    const prefijo = regla.source.replace(/\(\.\*\)$/, "").replace(/^\//, "");
    const alcanzados = [...referencias].filter((r) => r.startsWith(prefijo));
    const sinVersion = alcanzados.filter(
      (r) => !/[-_](v\d+|[0-9a-f]{8,})\.[a-z0-9]+$/i.test(r)
    );
    if (sinVersion.length) {
      fallo(
        `vercel.json sirve "${regla.source}" como immutable, pero ` +
          `${sinVersion.length} archivo(s) no llevan versión en el nombre ` +
          `(${sinVersion.slice(0, 3).join(", ")}…). Al regenerarlos, quien ya ` +
          `visitó la página seguiría viendo los viejos.`
      );
    }
  }
}

/* ── 8 · Presupuesto de peso del hero ─────────────────────────── */

/* Los archivos del hero se leen DEL HTML, no de una lista escrita a mano:
   al versionar los nombres, una lista fija se queda midiendo la nada y el
   presupuesto pasa en verde sin haber comprobado nada. */
const bloqueHero = /<video id="hero-video"[\s\S]*?<\/video>/.exec(html)?.[0] ?? "";
const HERO = [
  ...[...bloqueHero.matchAll(/src="([^"]+\.webm)"/g)].map((m) => m[1]),
  ...[...bloqueHero.matchAll(/poster="([^"]+)"/g)].map((m) => m[1]),
];
if (!HERO.length) fallo("No pude leer los archivos del hero desde el HTML.");
const pesoHero = HERO.reduce(
  (t, f) => t + (existsSync(join(RAIZ, f)) ? statSync(join(RAIZ, f)).size : 0),
  0
);
if (HERO.length && pesoHero === 0) {
  fallo(`El hero mide 0 bytes: ${HERO.join(", ")} no existen en el disco.`);
}
const MB = 1024 * 1024;
if (pesoHero > 10 * MB) {
  fallo(`El hero pesa ${(pesoHero / MB).toFixed(1)} MB y el techo en móvil es 10 MB.`);
}

/* ── 9 · Tiempos de movimiento desde variables ────────────────── */
/* Se mira el TIEMPO, no la declaración entera: una regla que descarte toda
   línea con var(--) deja pasar `transform 520ms var(--ease)` sin decir nada. */

const DURACION = /(?:transition|animation)(?:-duration)?\s*:\s*([^;}]+)[;}]/g;
const tiemposALaMano = new Set();
for (const m of css.matchAll(DURACION)) {
  for (const t of m[1].matchAll(/(?<![\w-])(\d+(?:\.\d+)?)(m?s)(?![\w-])/g)) {
    tiemposALaMano.add(t[0]);
  }
}
if (tiemposALaMano.size > 14) {
  aviso(
    `Hay ${tiemposALaMano.size} duraciones escritas a mano en el CSS ` +
      `(${[...tiemposALaMano].slice(0, 5).join(", ")}…). Conviene moverlas a tokens.`
  );
}

/* ── 10 · El contenido no puede depender del JS ───────────────── */

if (/class="[^"]*\breveal\b/.test(html) && !/\.js-reveal\s+\.reveal/.test(css)) {
  fallo("Los .reveal se ocultan sin que exista la clase de respaldo .js-reveal.");
}
if (!/<h1[^>]*>[\s\S]*?<\/h1>/.test(html)) fallo("No hay <h1> en el HTML servido.");

const cuerpoSinScript = html.replace(/<script[\s\S]*?<\/script>/g, "");
if (!/Descargar para Windows/.test(cuerpoSinScript)) {
  fallo("Los botones de descarga no están en el HTML: dependen del JS.");
}

/* ── 11 · Los artefactos descargables tienen que estar enlazados ─ */

const SISTEMAS = [
  ["Windows", /releases\/download\/[^"]*\.(exe|msi)/],
  ["macOS", /releases\/download\/[^"]*\.dmg/],
  ["Linux", /releases\/download\/[^"]*\.(AppImage|deb|rpm)/],
];
for (const [nombre, patron] of SISTEMAS) {
  if (!patron.test(html)) fallo(`No hay ningún enlace de descarga real para ${nombre}.`);
}
if (/href="#"/.test(html)) {
  const cuantos = html.match(/href="#"/g).length;
  fallo(`Quedan ${cuantos} enlace(s) apuntando a "#".`);
}

/* ── Resultado ────────────────────────────────────────────────── */

for (const a of avisos) console.log(`  aviso   ${a}`);
for (const f of fallos) console.log(`  FALLO   ${f}`);

console.log(
  `\nPeso a desplegar: ${(pesoDesplegado / MB).toFixed(2)} MB · ` +
    `hero: ${(pesoHero / MB).toFixed(2)} MB`
);
console.log(`RESULTADO: ${fallos.length} fallo(s), ${avisos.length} aviso(s)`);
process.exit(fallos.length ? 1 : 0);
