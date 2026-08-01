/* Cliente CDP mínimo: lanza un Chrome headless, habla con él por WebSocket y
 * lo baja al terminar. Sin dependencias — Node 22+ trae WebSocket global.
 */
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CANDIDATOS = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
];

export function buscarNavegador() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const hallado = CANDIDATOS.find((p) => existsSync(p));
  if (!hallado) {
    throw new Error(
      "No encontré Chrome ni Edge. Definí CHROME_PATH apuntando al ejecutable."
    );
  }
  return hallado;
}

async function esperarPuerto(puerto, msMax = 20000) {
  const limite = Date.now() + msMax;
  while (Date.now() < limite) {
    try {
      const r = await fetch(`http://127.0.0.1:${puerto}/json/version`);
      if (r.ok) return await r.json();
    } catch {
      /* todavía no levantó */
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  throw new Error("Chrome no abrió el puerto de depuración a tiempo.");
}

export async function abrirNavegador({ ancho = 1280, alto = 800 } = {}) {
  const bin = buscarNavegador();
  const puerto = 9500 + Math.floor(process.pid % 400);
  const perfil = mkdtempSync(join(tmpdir(), "trazo-cdp-"));

  const proc = spawn(
    bin,
    [
      `--remote-debugging-port=${puerto}`,
      `--user-data-dir=${perfil}`,
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-background-timer-throttling",
      "--autoplay-policy=no-user-gesture-required",
      `--window-size=${ancho},${alto}`,
      "about:blank",
    ],
    { stdio: "ignore" }
  );

  const version = await esperarPuerto(puerto);
  const ws = new WebSocket(version.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true });
    ws.addEventListener("error", rej, { once: true });
  });

  let id = 0;
  const pendientes = new Map();
  const oyentes = new Map();
  const sesiones = new Map();

  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pendientes.has(msg.id)) {
      const { res, rej } = pendientes.get(msg.id);
      pendientes.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      return;
    }
    if (msg.method) {
      (oyentes.get(msg.method) || []).forEach((fn) => fn(msg.params, msg.sessionId));
    }
  });

  function enviar(method, params = {}, sessionId) {
    const mid = ++id;
    return new Promise((res, rej) => {
      pendientes.set(mid, { res, rej });
      ws.send(JSON.stringify({ id: mid, method, params, sessionId }));
      setTimeout(() => {
        if (pendientes.has(mid)) {
          pendientes.delete(mid);
          rej(new Error(`CDP sin respuesta: ${method}`));
        }
      }, 30000);
    });
  }

  function alRecibir(method, fn) {
    if (!oyentes.has(method)) oyentes.set(method, []);
    oyentes.get(method).push(fn);
  }

  async function nuevaPestana() {
    const { targetId } = await enviar("Target.createTarget", { url: "about:blank" });
    const { sessionId } = await enviar("Target.attachToTarget", {
      targetId,
      flatten: true,
    });
    sesiones.set(targetId, sessionId);

    const api = {
      targetId,
      sessionId,
      cmd: (m, p) => enviar(m, p, sessionId),
      on: (m, fn) =>
        alRecibir(m, (params, sid) => {
          if (sid === sessionId) fn(params);
        }),
      cerrar: () => enviar("Target.closeTarget", { targetId }),
    };

    await api.cmd("Page.enable");
    await api.cmd("Runtime.enable");
    return api;
  }

  return {
    nuevaPestana,
    cerrar: async () => {
      try {
        ws.close();
      } catch {}
      try {
        proc.kill();
      } catch {}
      await new Promise((r) => setTimeout(r, 250));
      try {
        rmSync(perfil, { recursive: true, force: true });
      } catch {}
    },
  };
}

/** Navega y espera a que la página quede quieta (load + red en calma). */
export async function irA(pagina, url, { esperaRed = 900 } = {}) {
  const cargado = new Promise((res) => pagina.on("Page.loadEventFired", res));
  await pagina.cmd("Page.navigate", { url });
  await cargado;
  await new Promise((r) => setTimeout(r, esperaRed));
}

/** Evalúa una expresión en la página y devuelve el valor ya deserializado. */
export async function evaluar(pagina, expresion) {
  const r = await pagina.cmd("Runtime.evaluate", {
    expression: `(() => { ${expresion} })()`,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) {
    throw new Error(
      r.exceptionDetails.exception?.description || r.exceptionDetails.text
    );
  }
  return r.result.value;
}
