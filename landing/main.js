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

/* =========================================================================
   MUELLE DEL ANILLO DE COMETAS                                 (2026-08-01)
   Escribe --beam-a sobre #cta-beam y nada más. Un muelle en vez de una
   rotación lineal: al pasar el ratón acelera y al salir vuelve solo, sin
   saltos. Solo corre cuando la tarjeta está en pantalla y la pestaña visible.
   ========================================================================= */
(function anilloCometas() {
  var card = document.getElementById('cta-beam');
  if (!card) return;

  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var IDLE = 26, HOVER = 96, K = 30, D = 11, PARADO = 40;
  var ang = 137.5, corriendo = false, enPantalla = false, ultimo = 0;
  var s = { x: IDLE, v: 0, t: IDLE };
  var quieto = mq.matches;

  function pinta(a) {
    card.style.setProperty('--beam-a', (((a % 360) + 360) % 360).toFixed(2) + 'deg');
  }
  function frame(now) {
    if (!enPantalla || quieto || document.visibilityState === 'hidden') { corriendo = false; return; }
    if (!ultimo) ultimo = now;
    var dt = Math.max(0, Math.min((now - ultimo) / 1000, 0.05));
    ultimo = now;
    s.v += (K * (s.t - s.x) - D * s.v) * dt;   /* muelle amortiguado */
    s.x += s.v * dt;
    ang += s.x * dt;
    pinta(ang);
    requestAnimationFrame(frame);
  }
  function arranca() {
    if (corriendo || quieto || !enPantalla || document.visibilityState === 'hidden') return;
    corriendo = true; ultimo = 0; requestAnimationFrame(frame);
  }
  function modo() {
    quieto = mq.matches;
    if (quieto) { corriendo = false; s.x = s.t = IDLE; s.v = 0; pinta(PARADO); }
    else arranca();                              /* vuelve sin recargar */
  }

  card.addEventListener('pointerenter', function () { s.t = HOVER; arranca(); });
  card.addEventListener('pointerleave', function () { s.t = IDLE; });
  card.addEventListener('focusin',  function () { s.t = HOVER; arranca(); });
  card.addEventListener('focusout', function () { s.t = IDLE; });
  document.addEventListener('visibilitychange', arranca);
  if (mq.addEventListener) mq.addEventListener('change', modo);
  else if (mq.addListener) mq.addListener(modo);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      enPantalla = es[0].isIntersecting;
      if (enPantalla) arranca();
    }, { threshold: 0 }).observe(card);
  } else { enPantalla = true; }

  modo();
})();

/* =========================================================================
   MINIJUEGO DEL FOOTER — el gato                               (2026-08-01)
   Minimax con un 15% de jugadas al azar: sin eso es imbatible y la pregunta
   «¿me ganas?» sería mentira. Nueve <button> reales para teclado y lector
   de pantalla. Se arma solo cuando el footer se acerca.
   ========================================================================= */
(function minijuegoGato() {
  var raiz = document.getElementById('gato');
  if (!raiz) return;

  function arma() {
    var board = raiz.querySelector('.gato__board');
    var msg   = raiz.querySelector('.gato__msg');
    var linea = raiz.querySelector('.gato__line');
    if (!board || board.dataset.listo) return;
    board.dataset.listo = '1';

    var LINEAS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    var tablero, fin, bloqueado, celdas = [];

    function svgX() {
      return '<svg viewBox="0 0 100 100" aria-hidden="true">' +
        '<path class="gato__x" d="M26 26L74 74"/><path class="gato__x" d="M74 26L26 74"/></svg>';
    }
    /* La ficha de Trazo es su propia «t» cursiva, no un círculo. */
    function svgT() {
      var s = 'fill:none;stroke:var(--primary);stroke-width:9;stroke-linecap:round';
      return '<svg viewBox="0 0 100 130" aria-hidden="true">' +
        '<path class="gato__t" d="M64 19C57 47 45 71 34 91c-4 8 0 9 6 4 14-12 24-27 32-42" style="' + s + '"/>' +
        '<path class="gato__t" d="M14 44C36 38 62 33 88 36" style="' + s + ';stroke-width:8"/></svg>';
    }
    function etiqueta(i) {
      var f = Math.floor(i / 3) + 1, c = (i % 3) + 1, v = tablero[i];
      return 'fila ' + f + ', columna ' + c + ', ' +
        (v === 'x' ? 'tu ficha' : v === 'o' ? 'ficha de Trazo' : 'vacía');
    }
    function gana(t, j) {
      for (var i = 0; i < LINEAS.length; i++) {
        var l = LINEAS[i];
        if (t[l[0]] === j && t[l[1]] === j && t[l[2]] === j) return l;
      }
      return null;
    }
    function libres(t) { var r = []; for (var i = 0; i < 9; i++) if (!t[i]) r.push(i); return r; }
    function minimax(t, turno, prof) {
      if (gana(t, 'o')) return { s: 10 - prof };
      if (gana(t, 'x')) return { s: prof - 10 };
      var l = libres(t);
      if (!l.length) return { s: 0 };
      var mejor = null;
      for (var i = 0; i < l.length; i++) {
        t[l[i]] = turno;
        var s = minimax(t, turno === 'o' ? 'x' : 'o', prof + 1).s;
        t[l[i]] = null;
        if (!mejor || (turno === 'o' ? s > mejor.s : s < mejor.s)) mejor = { s: s, i: l[i] };
      }
      return mejor;
    }
    function dibujaLinea(l) {
      if (!linea) return;
      var a = celdas[l[0]].getBoundingClientRect(),
          b = celdas[l[2]].getBoundingClientRect(),
          r = board.getBoundingClientRect();
      linea.querySelector('path').setAttribute('d',
        'M' + (a.left - r.left + a.width / 2) + ' ' + (a.top - r.top + a.height / 2) +
        'L' + (b.left - r.left + b.width / 2) + ' ' + (b.top - r.top + b.height / 2));
      linea.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height);
      linea.classList.add('is-on');
    }
    function pinta() {
      celdas.forEach(function (b, i) {
        var v = tablero[i];
        b.innerHTML = v === 'x' ? svgX() : v === 'o' ? svgT() : '';
        b.disabled = !!v || fin;
        b.setAttribute('aria-label', etiqueta(i));
      });
    }
    function termina(txt, l) {
      fin = true;
      if (msg) msg.textContent = txt;
      if (l) dibujaLinea(l);
      pinta();
      setTimeout(reinicia, 1500);
    }
    function juegaTrazo() {
      var l = libres(tablero);
      if (!l.length) return;
      var i = Math.random() < 0.15
        ? l[Math.floor(Math.random() * l.length)]      /* ganable a propósito */
        : minimax(tablero.slice(), 'o', 0).i;
      tablero[i] = 'o';
      var g = gana(tablero, 'o');
      if (g) return termina('Te gané. ¿Otra?', g);
      if (!libres(tablero).length) return termina('Empate. Otra.');
      bloqueado = false;
      pinta();
    }
    function juega(i) {
      if (fin || bloqueado || tablero[i]) return;
      tablero[i] = 'x'; bloqueado = true; pinta();
      var g = gana(tablero, 'x');
      if (g) return termina('Me ganaste. Ahora descarga Trazo.', g);
      if (!libres(tablero).length) return termina('Empate. Otra.');
      setTimeout(juegaTrazo, 380);
    }
    function reinicia() {
      tablero = new Array(9).fill(null); fin = false; bloqueado = false;
      if (linea) linea.classList.remove('is-on');
      if (msg) msg.textContent = '';
      pinta();
    }

    for (var i = 0; i < 9; i++) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'gato__cell'; b.dataset.i = i;
      b.addEventListener('click', function () { juega(+this.dataset.i); });
      board.appendChild(b); celdas.push(b);
    }
    reinicia();
    raiz.classList.add('is-in');       /* dispara el trazado de las 4 líneas */
  }

  if (!('IntersectionObserver' in window)) { arma(); return; }
  var io = new IntersectionObserver(function (es) {
    if (es[0].isIntersecting) { arma(); io.disconnect(); }
  }, { rootMargin: '200px' });
  io.observe(raiz);
  /* Red de seguridad: son menos de 2 KB. Si el observador no dispara, el
     tablero se arma igual y nadie se queda con una rejilla vacía. */
  setTimeout(function () { arma(); io.disconnect(); }, 2500);
})();

/* =========================================================================
   MENÚ MÓVIL                                                   (2026-08-01)
   El nav estaba en display:none sin nada que lo abriera: las cuatro
   secciones eran inalcanzables desde un teléfono.
   ========================================================================= */
(function menuMovil() {
  var btn = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-movil');
  if (!btn || !menu) return;

  function abre(v) {
    btn.setAttribute('aria-expanded', v ? 'true' : 'false');
    btn.setAttribute('aria-label', v ? 'Cerrar el menú' : 'Abrir el menú');
    menu.hidden = !v;
  }
  btn.addEventListener('click', function () {
    abre(btn.getAttribute('aria-expanded') !== 'true');
  });
  /* Al elegir sección se cierra solo: si no, el panel tapa el destino. */
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) abre(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { abre(false); btn.focus(); }
  });
  /* Al pasar a escritorio el menú deja de tener sentido. */
  var mq = window.matchMedia('(min-width:861px)');
  function alCambiar() { if (mq.matches) abre(false); }
  if (mq.addEventListener) mq.addEventListener('change', alCambiar);
  else if (mq.addListener) mq.addListener(alCambiar);
})();

/* =========================================================================
   PALABRA QUE ROTA EN EL TITULAR                                (2026-08-01)
   «Envía como si lo hubieras escrito / redactado / corregido / pulido /
   repasado». Todas encajan en la misma frase, así que la gramática nunca
   se rompe pase lo que pase.
   Sin librerías: el componente de referencia usaba motion/react.
   ========================================================================= */
(function palabraRotatoria() {
  var caja = document.querySelector('.flip');
  if (!caja) return;
  var palabras = (caja.dataset.flip || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  if (palabras.length < 2) return;

  var hueco = caja.querySelector('.flip__pal');
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var i = 0, corriendo = false, enPantalla = false, temporizador = null;

  /* Se reserva el ancho de la palabra más larga ANTES de empezar: sin esto
     la línea se reajusta en cada cambio y el titular entero da un salto. */
  function fijaAncho() {
    var max = 0;
    var sonda = document.createElement('span');
    sonda.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap';
    caja.appendChild(sonda);
    palabras.forEach(function (p) {
      sonda.textContent = p;
      max = Math.max(max, sonda.getBoundingClientRect().width);
    });
    caja.removeChild(sonda);
    caja.style.minWidth = Math.ceil(max) + 'px';
  }

  function pinta(txt, saliendo) {
    hueco.textContent = '';
    for (var k = 0; k < txt.length; k++) {
      var s = document.createElement('span');
      s.className = 'flip__l' + (saliendo ? ' sale' : '');
      s.textContent = txt[k];
      /* El escalonado por letra es lo que hace que se lea como escritura
         y no como un simple fundido. */
      s.style.animationDelay = (k * 26) + 'ms' + (saliendo ? '' : ', 0ms');
      hueco.appendChild(s);
    }
  }

  function siguiente() {
    if (!enPantalla || mq.matches || document.visibilityState === 'hidden') { corriendo = false; return; }
    var actual = palabras[i];
    pinta(actual, true);                       /* la de fuera se va */
    setTimeout(function () {
      i = (i + 1) % palabras.length;
      pinta(palabras[i], false);               /* la nueva entra */
    }, 300 + actual.length * 26);
    temporizador = setTimeout(siguiente, 3400);
  }

  function arranca() {
    if (corriendo || mq.matches || !enPantalla || document.visibilityState === 'hidden') return;
    corriendo = true;
    temporizador = setTimeout(siguiente, 2200);
  }
  function para() { corriendo = false; clearTimeout(temporizador); }

  fijaAncho();
  pinta(palabras[0], false);
  window.addEventListener('resize', fijaAncho, { passive: true });

  /* Bidireccional: apagar el ajuste de movimiento devuelve la rotación. */
  function modo() {
    if (mq.matches) { para(); pinta(palabras[i], false); }
    else arranca();
  }
  if (mq.addEventListener) mq.addEventListener('change', modo);
  else if (mq.addListener) mq.addListener(modo);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') para(); else arranca();
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      enPantalla = es[0].isIntersecting;
      if (enPantalla) arranca(); else para();
    }, { threshold: 0 }).observe(caja);
  } else { enPantalla = true; arranca(); }
})();
