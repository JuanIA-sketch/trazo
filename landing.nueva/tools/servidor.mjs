/* Servidor estático mínimo. Sin dependencias.
 * Lo usan el generador de la tarjeta OG y el arnés funcional, que necesitan
 * servir la landing por HTTP (file:// rompe fetch, módulos y rangos de video).
 */
import { createServer } from "node:http";
import { createReadStream, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
};

export function levantar(raizPedida, puerto = 0) {
  // resolve() deja separadores nativos: sin esto, una raíz con barras normales
  // ("C:/x/y") nunca coincide con el destino que arma join() ("C:\x\y\z") y el
  // guard de abajo responde 403 a todo.
  const raiz = resolve(raizPedida);

  const servidor = createServer((req, res) => {
    let ruta = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (ruta.endsWith("/")) ruta += "index.html";

    // Nada de salir de la raíz servida
    const destino = join(raiz, normalize(ruta).replace(/^(\.\.[/\\])+/, ""));
    if (!destino.startsWith(raiz + sep) && destino !== raiz) {
      res.writeHead(403).end("prohibido");
      return;
    }

    let st;
    try {
      st = statSync(destino);
      if (st.isDirectory()) throw new Error("dir");
    } catch {
      res.writeHead(404, { "content-type": "text/plain" }).end("404");
      return;
    }

    const tipo = TIPOS[extname(destino).toLowerCase()] || "application/octet-stream";

    // Peticiones de rango: sin esto el scrubbing no puede buscar dentro del
    // video y se queda congelado en el primer cuadro, sin dar ningún error.
    const rango = req.headers.range;
    if (rango) {
      const m = /bytes=(\d*)-(\d*)/.exec(rango);
      if (m) {
        const ini = m[1] ? parseInt(m[1], 10) : 0;
        const fin = m[2] ? parseInt(m[2], 10) : st.size - 1;
        res.writeHead(206, {
          "content-type": tipo,
          "content-range": `bytes ${ini}-${fin}/${st.size}`,
          "accept-ranges": "bytes",
          "content-length": fin - ini + 1,
        });
        createReadStream(destino, { start: ini, end: fin }).pipe(res);
        return;
      }
    }

    res.writeHead(200, {
      "content-type": tipo,
      "content-length": st.size,
      "accept-ranges": "bytes",
    });
    createReadStream(destino).pipe(res);
  });

  return new Promise((resolve) => {
    servidor.listen(puerto, "127.0.0.1", () => {
      const p = servidor.address().port;
      resolve({
        puerto: p,
        base: `http://127.0.0.1:${p}`,
        cerrar: () => new Promise((r) => servidor.close(r)),
      });
    });
  });
}
