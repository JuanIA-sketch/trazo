/* Trazo — landing
 *
 * Todo lo de acá es MEJORA PROGRESIVA. Si este archivo no carga, no se ejecuta
 * o falla a mitad, la página sigue entera: el hero muestra su póster, el texto
 * está en el HTML y todos los enlaces funcionan. Nada de contenido invisible
 * esperando un script.
 */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ─────────────────────────────────────────────────────────────
   * 1 · Scrubbing del hero: el scroll maneja el video
   * ───────────────────────────────────────────────────────────── */

  /* Fracción del camino hacia el objetivo cada 16.67 ms (un cuadro a 60 Hz).
     Se normaliza por delta de tiempo más abajo: con un factor fijo por cuadro,
     cuánto suavizado hay lo decidiría el refresco del monitor y no el diseño
     — el mismo scrub se siente rezagado a 60 Hz y seco a 120 Hz. */
  var SUAVIZADO = 0.16;
  var FPS_VIDEO = 24; // hero.mp4 / hero.webm van a 24 fps

  function montarScrubber(video, seccion) {
    var objetivo = 0; // segundo al que queremos llegar
    var suave = 0; // segundo interpolado que efectivamente escribimos
    var ultimoTs = 0;
    var rafId = 0;
    var corriendo = false;
    var desbloqueado = false;

    function recorrido() {
      // Cuánto scroll consume el tramo anclado: alto total menos la ventana
      // que se queda pegada. Sale del CSS (164svh − 100svh), no de un número
      // escrito a mano acá.
      return Math.max(1, seccion.offsetHeight - window.innerHeight);
    }

    function progreso() {
      var top = seccion.getBoundingClientRect().top;
      var p = -top / recorrido();
      return p < 0 ? 0 : p > 1 ? 1 : p;
    }

    /* iOS no deja buscar dentro de un video que nunca se reprodujo.
       Un play()/pause() mudo lo desbloquea. Se intenta una sola vez. */
    function desbloquear() {
      if (desbloqueado) return;
      desbloqueado = true;
      var p = video.play();
      if (p && typeof p.then === "function") {
        p.then(function () {
          video.pause();
        }).catch(function () {
          /* autoplay bloqueado: se reintenta solo con el primer gesto real */
          desbloqueado = false;
        });
      } else {
        try {
          video.pause();
        } catch (e) {
          /* no pasa nada: el scrub igual escribe currentTime */
        }
      }
    }

    function tick(ts) {
      if (!corriendo) return;
      rafId = requestAnimationFrame(tick);

      var dur = video.duration;

      /* El objetivo avanza SIEMPRE, aunque el video todavía no pueda pintar.
         Condicionarlo a readyState lo bloquea justo mientras un seek está en
         vuelo — readyState cae por debajo de 2 durante la búsqueda — y el
         video se queda clavado en el último cuadro que alcanzó. */
      if (dur && isFinite(dur) && dur > 0) {
        objetivo = progreso() * dur;
      }

      /* Delta topado en 50 ms: al volver de una pestaña en segundo plano el
         primer delta sería enorme y el video pegaría un salto en vez de
         reengancharse suave. */
      var dt = ultimoTs ? Math.min(ts - ultimoTs, 50) : 16.67;
      ultimoTs = ts;
      suave += (objetivo - suave) * (1 - Math.pow(1 - SUAVIZADO, dt / 16.67));

      /* readyState se consulta cada cuadro, no por evento: un listener `once`
         se pierde si la capa se desmonta y se vuelve a montar. */
      if (video.readyState < 1) return;

      /* Throttle de ESCRITURA, no de cálculo. Pedir un seek nuevo mientras el
         anterior sigue en vuelo los encola y produce tirones. */
      if (!video.seeking && Math.abs(video.currentTime - suave) > 1 / FPS_VIDEO) {
        try {
          video.currentTime = suave;
        } catch (e) {
          /* algunos navegadores tiran si el seek llega antes de los metadatos */
        }
      }
    }

    function arrancar() {
      if (corriendo || reduce.matches) return;
      corriendo = true;
      ultimoTs = 0;
      video.classList.add("is-scrubbing");
      video.style.willChange = "transform"; // entra con la capa…
      desbloquear();
      rafId = requestAnimationFrame(tick);
    }

    function parar() {
      if (!corriendo) return;
      corriendo = false;
      cancelAnimationFrame(rafId);
      video.style.willChange = ""; // …y sale con ella
    }

    /* El bucle corre solo mientras el hero se ve. Fuera de él, cero trabajo. */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        function (entradas) {
          entradas[0].isIntersecting ? arrancar() : parar();
        },
        { rootMargin: "120px" }
      ).observe(seccion);
    } else {
      arrancar();
    }

    /* prefers-reduced-motion es bidireccional: apagarlo tiene que devolver el
       movimiento sin recargar la página. */
    function alCambiarMotion() {
      if (reduce.matches) {
        parar();
        try {
          video.currentTime = 0;
        } catch (e) {}
      } else {
        arrancar();
      }
    }
    reduce.addEventListener
      ? reduce.addEventListener("change", alCambiarMotion)
      : reduce.addListener(alCambiarMotion);

    window.addEventListener("resize", function () {
      ultimoTs = 0;
    });
  }

  var heroVideo = document.getElementById("hero-video");
  var heroSeccion = document.getElementById("hero-scroll");
  if (heroVideo && heroSeccion && !reduce.matches) {
    /* preload="auto" ya está en el HTML; si el video no carga, el poster queda */
    heroVideo.addEventListener("error", function () {
      heroVideo.classList.add("is-broken");
    });
    montarScrubber(heroVideo, heroSeccion);
  }

  /* ─────────────────────────────────────────────────────────────
   * 2 · Reveals para navegadores sin animation-timeline
   * (Chromium ya los hace en CSS; esto es para Firefox y Safari)
   * ───────────────────────────────────────────────────────────── */

  var soportaScrollTimeline =
    window.CSS &&
    CSS.supports &&
    CSS.supports("animation-timeline", "view()");

  if (!soportaScrollTimeline && "IntersectionObserver" in window && !reduce.matches) {
    var bloques = document.querySelectorAll(".reveal");
    if (bloques.length) {
      document.documentElement.classList.add("js-reveal");
      var obs = new IntersectionObserver(
        function (entradas) {
          entradas.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add("is-in");
              obs.unobserve(e.target);
            }
          });
        },
        { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
      );
      bloques.forEach(function (b) {
        obs.observe(b);
      });
    }
  }

  /* ─────────────────────────────────────────────────────────────
   * 3 · Demo: el video es mejora progresiva sobre el póster
   *
   * El HTML sale con el póster estático — nunca con una referencia a un
   * archivo que no existe. Cuando la grabación esté en assets/demo/, se
   * enciende poniendo data-demo-ready="true" en #demo-slot. Sin ese flag no
   * se pide nada, así que no hay 404 posible.
   *
   * Dos formas, según data-demo-modo:
   *   "loop"  → clip corto ambiental, en bucle y mudo.
   *   "pieza" → grabación larga (el demo de ~2 min): con controles, con
   *             sonido, sin bucle y sin precarga. Un video de dos minutos en
   *             bucle y sin controles no se puede ni pausar ni buscar, que es
   *             justo lo que alguien quiere hacer con una demostración.
   * ───────────────────────────────────────────────────────────── */

  var slot = document.getElementById("demo-slot");
  if (slot && slot.dataset.demoReady === "true") {
    var esPieza = slot.dataset.demoModo !== "loop";
    var poster = slot.querySelector("img");
    var v = document.createElement("video");
    v.className = esPieza ? "pieza" : "loop";
    v.preload = "none";
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    if (esPieza) {
      v.controls = true;
    } else {
      v.muted = true;
      v.loop = true;
    }
    if (poster) v.poster = poster.getAttribute("src");

    if (slot.dataset.demoWebm) {
      var s1 = document.createElement("source");
      s1.src = slot.dataset.demoWebm;
      s1.type = "video/webm";
      v.appendChild(s1);
    }
    if (slot.dataset.demoMp4) {
      var s2 = document.createElement("source");
      s2.src = slot.dataset.demoMp4;
      s2.type = "video/mp4";
      v.appendChild(s2);
    }

    var pill = document.createElement("button");
    pill.className = "play-pill";
    pill.type = "button";
    pill.innerHTML = '<span class="tri" aria-hidden="true"></span>Ver el demo';

    v.addEventListener("error", function () {
      /* si la grabación no carga, volvemos al póster y sacamos el botón */
      if (v.parentNode) v.parentNode.removeChild(v);
      if (pill.parentNode) pill.parentNode.removeChild(pill);
      if (poster) poster.hidden = false;
    });

    pill.addEventListener("click", function () {
      /* con controles hay que darle el foco al player, no dejarlo mudo */
      if (esPieza) v.muted = false;
      v.play().then(
        function () {
          pill.hidden = true;
        },
        function () {}
      );
    });

    if (poster) poster.hidden = true;
    slot.appendChild(v);
    slot.appendChild(pill);
  }
})();
