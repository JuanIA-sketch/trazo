/* =========================================================================
   app.js — Landing V2 de Trazo
   Cero dependencias. Solo transform y opacity. Todo bajo rAF.
   Orden: motion → intro → SO → header → reveals → tabs → velocidad →
          casos → demo → overlays → ask-ai → minijuego
   ========================================================================= */
var TRAZO_INIT = function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  /* sessionStorage puede lanzar en contextos con origen opaco: nunca sin red. */
  var lee = function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } };
  var guarda = function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) { } };

  /* -----------------------------------------------------------------------
     PENDIENTE — los 7 binarios del release v0.9.0.
     No se inventan URLs: se pegan aquí y el resto de la página se resuelve
     sola. Mientras estén vacías, los botones apuntan a la página de
     descargas y quedan marcados con data-pendiente.
     ----------------------------------------------------------------------- */
  var DESCARGAS = {
    pagina:   'https://github.com/JuanIA-sketch/trazo/releases/tag/v0.9.2',
    windows:  'https://github.com/JuanIA-sketch/trazo/releases/download/v0.9.2/Trazo_0.9.2_x64-setup.exe',
    macArm:   'https://github.com/JuanIA-sketch/trazo/releases/download/v0.9.2/Trazo_0.9.2_aarch64.dmg',
    macIntel: 'https://github.com/JuanIA-sketch/trazo/releases/download/v0.9.2/Trazo_0.9.2_x64.dmg',
    linux:    'https://github.com/JuanIA-sketch/trazo/releases/download/v0.9.2/Trazo_0.9.2_amd64.AppImage'
  };

  /* ---------------------------- 0 · MOVIMIENTO --------------------------- */
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var quieto = mq.matches;
  function aplicaMotion() {
    quieto = mq.matches;
    document.documentElement.setAttribute('data-motion', quieto ? 'off' : 'on');
  }
  aplicaMotion();
  if (mq.addEventListener) mq.addEventListener('change', aplicaMotion);
  else if (mq.addListener) mq.addListener(aplicaMotion);

  /* ------------------------------ 1 · INTRO ------------------------------ */
  (function intro() {
    var el = $('#intro');
    if (!el) return;
    if (lee('trazo:intro') === '1') { el.remove(); return; }
    document.documentElement.classList.add(quieto ? 'intro-static' : 'intro-anim');
    var ido = false;
    function fuera() {
      if (ido) return; ido = true;
      guarda('trazo:intro', '1');
      el.classList.add('is-out');
      document.documentElement.classList.remove('intro-anim', 'intro-static');
      setTimeout(function () { if (el.parentNode) el.remove(); }, 460);
    }
    var minimo = quieto ? 200 : 900;
    var arranque = performance.now();
    function cierraCuandoToque() {
      var falta = Math.max(0, minimo - (performance.now() - arranque));
      setTimeout(fuera, falta);
    }
    if (document.readyState === 'complete') cierraCuandoToque();
    else window.addEventListener('load', cierraCuandoToque, { once: true });
    setTimeout(fuera, 1200);   // techo duro
  })();

  /* --------------------- 2 · DETECCIÓN DE SISTEMA ----------------------- */
  var SO = { id: 'desconocido', nombre: 'Trazo', icono: '', url: '' };
  (function detecta() {
    try {
    var p = (navigator.userAgentData && navigator.userAgentData.platform) || '';
    var ua = navigator.userAgent || '';
    var movil = /Android|iPhone|iPad|iPod/i.test(ua) ||
      (navigator.userAgentData && navigator.userAgentData.mobile);
    if (movil) return;
    var s = (p + ' ' + ua).toLowerCase();
    if (/win/.test(s)) SO = { id: 'windows', nombre: 'Windows', icono: 'assets/so/windows.svg', url: DESCARGAS.windows };
    else if (/mac|darwin/.test(s)) SO = { id: 'macos', nombre: 'macOS', icono: 'assets/so/apple.svg', url: DESCARGAS.macArm };
    else if (/linux|x11|ubuntu/.test(s)) SO = { id: 'linux', nombre: 'Linux', icono: 'assets/so/linux.svg', url: DESCARGAS.linux };
    } catch (e) { }
  })();

  var SO_ICONOS = {
    windows: 'assets/so/windows.svg',
    macos: 'assets/so/apple.svg',
    linux: 'assets/so/linux.svg'
  };

  function pintaDescargas() {
    var esp = SO.id !== 'desconocido';
    var destino = SO.url || DESCARGAS.pagina || '#descargas';
    $$('[data-download]').forEach(function (a) {
      var txt = $('[data-download-label]', a);
      if (txt) {
        txt.textContent = a.hasAttribute('data-download-short') ? 'Descargar'
          : esp ? 'Descargar para ' + SO.nombre : 'Descargar Trazo';
      }
      var slot = $('[data-download-icon]', a);
      if (slot && SO.icono) slot.innerHTML = '<img src="' + SO.icono + '" alt="" width="16" height="16">';
      a.setAttribute('href', destino);
      if (!SO.url && !DESCARGAS.pagina) a.setAttribute('data-pendiente', 'true');
    });
    // «Otras plataformas» lleva los iconos de los SO que NO son el detectado.
    var otras = $('#hero-otras');
    if (otras) {
      otras.innerHTML = Object.keys(SO_ICONOS).filter(function (k) { return k !== SO.id; })
        .map(function (k) { return '<img src="' + SO_ICONOS[k] + '" alt="" width="16" height="16">'; }).join('');
    }
    $$('[data-all-downloads]').forEach(function (a) {
      a.setAttribute('href', DESCARGAS.pagina || '#descargas');
    });
    // Si no sabemos qué SO es, se muestran los tres para que nadie quede atrapado.
    var tres = $('#hero-os');
    if (tres) tres.hidden = esp;
    if (!SO.url && !DESCARGAS.pagina) {
      console.info('[Trazo] Faltan las URLs del release v0.9.0. Rellena el objeto DESCARGAS en app.js.');
    }
  }
  // macOS: intentar saber si es Apple Silicon para servir el binario correcto.
  if (SO.id === 'macos' && navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
    navigator.userAgentData.getHighEntropyValues(['architecture']).then(function (d) {
      if (d && d.architecture && d.architecture.indexOf('arm') === -1) SO.url = DESCARGAS.macIntel;
    }).catch(function () { }).then(pintaDescargas);
  } else {
    pintaDescargas();
  }

  /* ----------------------------- 3 · HEADER ----------------------------- */
  (function header() {
    var pill = $('.nav-pill'), sheet = $('.nav-sheet'), burger = $('.nav__burger'), dock = $('.dock');
    var hero = $('.hero');
    if (burger && sheet) {
      burger.addEventListener('click', function () {
        var open = sheet.classList.toggle('is-open');
        burger.setAttribute('aria-expanded', String(open));
      });
      $$('a', sheet).forEach(function (a) {
        a.addEventListener('click', function () { sheet.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); });
      });
    }
    var t = false;
    function onScroll() {
      if (t) return; t = true;
      requestAnimationFrame(function () {
        t = false;
        var y = window.scrollY || 0;
        if (pill) pill.classList.toggle('is-scrolled', y > 24);
        if (dock && hero) dock.classList.toggle('is-up', y > window.innerHeight * 0.9);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  /* ---------------------- 3.5 · HERO · MOTOR DE CUADROS -------------------
     150 cuadros repartidos en 10 atlas de 4×4. El scroll manda el índice.
     No hay video: ni currentTime, ni readyState, ni desbloqueo de iOS.
     ----------------------------------------------------------------------- */
  (function heroMotor() {
    var sec = $('#hero'), lienzo = $('#hero-canvas');
    if (!sec || !lienzo || !lienzo.getContext) return;

    var CUADROS = 150, COLS = 4, POR_ATLAS = 16, N_ATLAS = 10;
    var PRIMEROS = 4;                       // 40% de los atlas: el umbral del gate
    var CUADRO_QUIETO = 66;                 // el del póster, para reduced motion
    var REPOSO = [0, 0.44, 1];              // imanes del recorrido
    var movil = window.matchMedia('(max-width:900px)').matches;
    var CW = movil ? 854 : 1280, CH = movil ? 480 : 720;
    var RUTA = 'assets/hero/' + (movil ? 'mobile' : 'desktop') + '/atlas_';

    lienzo.width = CW; lienzo.height = CH;
    var ctx = lienzo.getContext('2d');
    var barra = $('#hero-load'), pista = $('#hero-load-bar');

    var atlas = new Array(N_ATLAS), estado = new Array(N_ATLAS);
    var resueltosGate = 0, liberado = false, visible = false, corriendo = false;
    var objetivo = 0, actual = 0, ultimo = -1;

    function progresoGate() {
      if (pista) pista.style.setProperty('--p', (resueltosGate / PRIMEROS).toFixed(3));
      if (resueltosGate >= PRIMEROS) libera();
    }
    function libera() {
      if (liberado) return;
      liberado = true;
      document.documentElement.classList.remove('hero-lock');
      if (barra) barra.classList.add('is-done');
    }
    function pide(n) {
      if (n < 0 || n >= N_ATLAS || atlas[n]) return;
      var img = new Image();
      atlas[n] = img; estado[n] = 'pide';
      img.onload = function () {
        estado[n] = 'ok';
        if (n < PRIMEROS) { resueltosGate++; progresoGate(); }
        pinta(); arranca();
      };
      img.onerror = function () {
        // Un atlas que no está no va a llegar: no dejamos a nadie esperando.
        estado[n] = 'err';
        if (n < PRIMEROS) { resueltosGate++; progresoGate(); }
      };
      img.src = RUTA + n + '.webp';
    }
    function suelta(n) {
      if (n < 0 || n >= N_ATLAS || !atlas[n]) return;
      atlas[n].onload = atlas[n].onerror = null;
      atlas[n].src = '';
      atlas[n] = null; estado[n] = null;
    }
    /* Carga por cercanía: un atlas decodificado son ~56 MB. Nunca los diez. */
    function cercania(i) {
      var n = Math.floor(i / POR_ATLAS);
      var desde = movil ? n : n - 1, hasta = n + 1;
      for (var k = 0; k < N_ATLAS; k++) {
        if (k >= desde && k <= hasta) pide(k);
        else if (k < PRIMEROS && !liberado) pide(k);   // el gate necesita los primeros
        else suelta(k);
      }
    }
    function pinta() {
      var i = Math.round(actual);
      var n = Math.floor(i / POR_ATLAS), local = i % POR_ATLAS;
      if (estado[n] !== 'ok') return;
      ctx.drawImage(atlas[n], (local % COLS) * CW, Math.floor(local / COLS) * CH, CW, CH, 0, 0, CW, CH);
      ultimo = i;
    }
    function progresoScroll() {
      var r = sec.getBoundingClientRect();
      var total = sec.offsetHeight - window.innerHeight;
      return clamp((-r.top) / (total || 1), 0, 1);
    }
    function bucle() {
      if (!visible || quieto) { corriendo = false; return; }
      actual += (objetivo - actual) * 0.18;
      if (Math.abs(objetivo - actual) < 0.35) actual = objetivo;
      if (Math.round(actual) !== ultimo) pinta();
      if (actual === objetivo && Math.round(actual) === ultimo) { corriendo = false; return; }
      requestAnimationFrame(bucle);
    }
    function arranca() {
      if (corriendo || quieto || !visible) return;
      corriendo = true; requestAnimationFrame(bucle);
    }
    var imanT;
    function alScroll() {
      if (quieto) return;
      var p = progresoScroll();
      objetivo = Math.round(p * (CUADROS - 1));
      cercania(objetivo);
      arranca();
      clearTimeout(imanT);
      imanT = setTimeout(function () {                  // imán: al parar, se asienta
        var p2 = progresoScroll();
        for (var k = 0; k < REPOSO.length; k++) {
          if (Math.abs(p2 - REPOSO[k]) < 0.045) {
            objetivo = Math.round(REPOSO[k] * (CUADROS - 1));
            arranca(); return;
          }
        }
      }, 170);
    }

    /* reduced motion: un solo cuadro fijo, sin bucle. Y vuelve sin recargar. */
    function modo() {
      if (quieto) {
        corriendo = false;
        actual = objetivo = CUADRO_QUIETO; ultimo = -1;
        libera();
        cercania(CUADRO_QUIETO);
        pinta();
      } else {
        document.documentElement.classList.add('hero-lock');
        if (barra) barra.classList.remove('is-done');
        liberado = false;
        setTimeout(libera, 8000);                       // salida por tiempo
        progresoGate();
        alScroll();
      }
    }
    if (mq.addEventListener) mq.addEventListener('change', modo);
    else if (mq.addListener) mq.addListener(modo);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible) arranca();
      }, { threshold: 0 }).observe(sec);
    } else visible = true;

    window.addEventListener('scroll', alScroll, { passive: true });
    window.addEventListener('resize', alScroll);
    modo();

    /* --- Segunda capa: pocas partículas que se apartan del cursor --------- */
    var polvo = $('#hero-dust');
    if (!polvo || movil || !window.matchMedia('(pointer:fine)').matches) return;
    var pc = polvo.getContext('2d'), P = [], raton = { x: -999, y: -999 }, dpr = 1;
    function mide() {
      var r = polvo.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      polvo.width = Math.round(r.width * dpr); polvo.height = Math.round(r.height * dpr);
      if (!P.length) {
        for (var i = 0; i < 70; i++) {
          P.push({
            x: Math.random() * polvo.width, y: Math.random() * polvo.height,
            vx: 0, vy: 0, r: (1 + Math.random() * 1.6) * dpr,
            a: 0.2 + Math.random() * 0.45, c: Math.random() < 0.45 ? '34,211,238' : '96,165,250'
          });
          P[i].bx = P[i].x; P[i].by = P[i].y;
        }
      }
    }
    mide();
    window.addEventListener('resize', function () { P.length = 0; mide(); });
    polvo.parentNode.addEventListener('pointermove', function (e) {
      var r = polvo.getBoundingClientRect();
      raton.x = (e.clientX - r.left) * dpr; raton.y = (e.clientY - r.top) * dpr;
    });
    polvo.parentNode.addEventListener('pointerleave', function () { raton.x = raton.y = -999; });
    (function polvoBucle() {
      requestAnimationFrame(polvoBucle);
      if (!visible || quieto) { pc.clearRect(0, 0, polvo.width, polvo.height); return; }
      pc.clearRect(0, 0, polvo.width, polvo.height);
      var R = 130 * dpr;
      for (var i = 0; i < P.length; i++) {
        var p = P[i], dx = p.x - raton.x, dy = p.y - raton.y, d = Math.hypot(dx, dy);
        if (d < R && d > 0.01) {
          var f = (1 - d / R) * 1.5;
          p.vx += (dx / d) * f; p.vy += (dy / d) * f;
        }
        p.vx += (p.bx - p.x) * 0.012; p.vy += (p.by - p.y) * 0.012;
        p.vx *= 0.9; p.vy *= 0.9;
        p.x += p.vx; p.y += p.vy;
        pc.beginPath();
        pc.fillStyle = 'rgba(' + p.c + ',' + p.a + ')';
        pc.arc(p.x, p.y, p.r, 0, 6.2832);
        pc.fill();
      }
    })();
  })();

  /* ---------------------- 3.6 · OBTURADOR DEL TITULAR ---------------------
     Parte el H1 en letras y le añade las tres franjas que lo barren. El texto
     ya está pintado antes de esto: es una mejora, no un requisito para leerlo.
     ----------------------------------------------------------------------- */
  (function obturador() {
    $$('[data-shutter]').forEach(function (raiz) {
      if (raiz.dataset.partido) return;
      raiz.dataset.partido = '1';
      raiz.setAttribute('aria-label', (raiz.innerText || raiz.textContent).replace(/\s+/g, ' ').trim());
      var n = 0;
      (function parte(nodo) {
        Array.prototype.slice.call(nodo.childNodes).forEach(function (hijo) {
          if (hijo.nodeType === 1) { parte(hijo); return; }
          if (hijo.nodeType !== 3 || !hijo.nodeValue.trim()) return;
          var frag = document.createDocumentFragment();
          hijo.nodeValue.split('').forEach(function (ch) {
            if (ch === ' ') { frag.appendChild(document.createTextNode(' ')); return; }
            var caja = document.createElement('span');
            caja.className = 'sh-ch';
            caja.style.setProperty('--i', n++);
            var base = document.createElement('span');
            base.className = 'sh-main';
            base.textContent = ch;
            caja.appendChild(base);
            for (var k = 1; k <= 3; k++) {
              var franja = document.createElement('span');
              franja.className = 'sh-s sh-s--' + k;
              franja.setAttribute('aria-hidden', 'true');
              franja.textContent = ch;
              caja.appendChild(franja);
            }
            frag.appendChild(caja);
          });
          nodo.replaceChild(frag, hijo);
        });
      })(raiz);
    });
  })();

  /* --------------------------- 4 · ENTRADAS ----------------------------- */
  (function reveals() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) { items.forEach(function (n) { n.classList.add('is-in'); }); return; }
    var entra = function (es, obs) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target); } });
    };
    var io = new IntersectionObserver(entra, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    // Los que piden un umbral propio (el subrayado de «Hey Trazo» dispara al 40%).
    var io40 = new IntersectionObserver(entra, { threshold: 0.4 });
    items.forEach(function (n) { (n.dataset.th ? io40 : io).observe(n); });
  })();

  /* -------------------- 5 · PESTAÑAS DE PLATAFORMA ---------------------- */
  (function tabs() {
    var box = $('#apps-tabs');
    if (!box) return;
    var btns = $$('button', box);
    var barra = $('#apps-frame-title');
    var etiqueta = $('#apps-frame-tag');
    var datos = {
      windows: { titulo: 'Trazo — Windows', tag: 'Ctrl + Space' },
      macos: { titulo: 'Trazo — macOS', tag: '⌥ + Space' },
      linux: { titulo: 'Trazo — Linux', tag: 'Ctrl + Space' }
    };
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (o) { o.setAttribute('aria-selected', String(o === b)); });
        var d = datos[b.dataset.plat] || datos.windows;
        if (barra) barra.textContent = d.titulo;
        if (etiqueta) etiqueta.textContent = d.tag;
      });
    });
    var actual = btns.filter(function (b) { return b.dataset.plat === SO.id; })[0];
    if (actual) actual.click();
  })();

  /* ------------------------- 6 · VELOCIDAD ------------------------------ */
  (function velocidad() {
    var sec = $('#velocidad');
    if (!sec) return;
    var kb = $('#lane-kb'), tz = $('#lane-tz');
    var mKb = $('#meter-kb'), mTz = $('#meter-tz');
    var wKb = $('#w-kb'), wTz = $('#w-tz');
    var reloj = $('#race-clock'), listo = $('#lane-done');
    if (!kb || !tz) return;

    var TEXTO = kb.dataset.texto || '';
    var PALABRAS = TEXTO.split(/\s+/).length;
    var PPM_KB = 45, PPM_TZ = 180;
    var T_TRAZO = PALABRAS / (PPM_TZ / 60);          // segundos que tarda Trazo
    var T_TOTAL = T_TRAZO * 1.15;                    // el scroll dura un poco más
    var caret = '<span class="caret" aria-hidden="true"></span>';

    function escribe(nodo, frac) {
      var n = Math.round(clamp(frac, 0, 1) * TEXTO.length);
      var trozo = TEXTO.slice(0, n);
      nodo.innerHTML = trozo.replace(/&/g, '&amp;').replace(/</g, '&lt;') + (frac < 1 ? caret : '');
    }
    var ultimoKb = -1, ultimoTz = -1, esperando = false;

    function pinta() {
      esperando = false;
      var r = sec.getBoundingClientRect();
      var total = sec.offsetHeight - window.innerHeight;
      var p = clamp((-r.top) / (total || 1), 0, 1);
      var seg = p * T_TOTAL;
      var fKb = clamp((seg * (PPM_KB / 60)) / PALABRAS, 0, 1);
      var fTz = clamp((seg * (PPM_TZ / 60)) / PALABRAS, 0, 1);
      if (Math.abs(fKb - ultimoKb) > 0.004) { escribe(kb, fKb); ultimoKb = fKb; }
      if (Math.abs(fTz - ultimoTz) > 0.004) { escribe(tz, fTz); ultimoTz = fTz; }
      if (mKb) mKb.style.setProperty('--fill', fKb.toFixed(3));
      if (mTz) mTz.style.setProperty('--fill', fTz.toFixed(3));
      if (wKb) wKb.textContent = Math.round(fKb * PALABRAS) + ' / ' + PALABRAS;
      if (wTz) wTz.textContent = Math.round(fTz * PALABRAS) + ' / ' + PALABRAS;
      if (reloj) reloj.textContent = seg.toFixed(1).replace('.', ',') + ' s transcurridos';
      if (listo) listo.classList.toggle('is-in', fTz >= 1);
    }
    function pide() { if (!esperando) { esperando = true; requestAnimationFrame(pinta); } }
    window.addEventListener('scroll', pide, { passive: true });
    window.addEventListener('resize', pide);
    pinta();
  })();

  /* ------------------- 7 · CASOS DE USO (sticky) ------------------------ */
  var CASOS = [
    {
      t: 'Programadores', d: 'Describe el cambio en voz alta y pégalo en el editor sin soltar el teclado.',
      app: 'cursor', appN: 'Cursor',
      dijo: 'saca la lógica de autenticación del componente y déjala en un hook aparte, después vemos los tests',
      salida: 'Extraer la lógica de autenticación del componente a un hook independiente. Los tests quedan para una segunda pasada.'
    },
    {
      t: 'Creadores', d: 'El guion sale hablando, no escribiendo. Después solo se corta.',
      app: 'notion', appN: 'Notion',
      dijo: 'el video de esta semana va de por qué el dictado local es más rápido, abro con la comparación de velocidad',
      salida: 'El video de esta semana trata sobre por qué el dictado local es más rápido. Abre con la comparación de velocidad.'
    },
    {
      t: 'Estudiantes', d: 'Apuntes de clase a la velocidad en que el profesor habla.',
      app: 'googledocs', appN: 'Google Docs',
      dijo: 'para la prueba entra materia hasta el capítulo cuatro, más los dos artículos que subió a la plataforma',
      salida: 'Para la prueba entra la materia hasta el capítulo 4, más los dos artículos que subió a la plataforma.'
    },
    {
      t: 'Soporte', d: 'Respuestas largas y correctas en el tiempo de una respuesta corta.',
      app: 'whatsapp', appN: 'WhatsApp',
      dijo: 'dile que ya revisamos el ticket, que el error era del certificado y que quedó andando desde las tres',
      salida: 'Ya revisamos tu ticket. El error venía del certificado y quedó funcionando desde las 15:00. Cualquier cosa nos escribes.'
    },
    {
      t: 'Ventas', d: 'El seguimiento se escribe apenas termina la llamada, no al día siguiente.',
      app: 'gmail', appN: 'Gmail',
      dijo: 'mándale el resumen de la reunión, que confirmamos precio y que el piloto arranca el lunes veintiuno',
      salida: 'Te envío el resumen de la reunión: confirmamos precio y el piloto arranca el lunes 21.'
    },
    {
      t: 'Escritores', d: 'Primera versión dictada, edición con las manos libres.',
      app: 'obsidian', appN: 'Obsidian',
      dijo: 'nota para el capítulo dos, la escena del puerto tiene que pasar de noche y no de día',
      salida: 'Nota para el capítulo 2: la escena del puerto tiene que pasar de noche, no de día.'
    },
    {
      t: 'Accesibilidad', d: 'Escribir en el computador sin usar las manos, en cualquier campo de texto.',
      app: 'googlechrome', appN: 'Chrome',
      dijo: 'buscar horario de atención del consultorio y agendar para la próxima semana en la mañana',
      salida: 'Buscar el horario de atención del consultorio y agendar para la próxima semana en la mañana.'
    },
    {
      t: 'Equipos', d: 'Actualizaciones de estado dictadas antes de la reunión, no durante.',
      app: 'linear', appN: 'Linear',
      dijo: 'el bug del login quedó cerrado, subo el fix a producción hoy y queda pendiente la migración',
      salida: 'El bug del login quedó cerrado. El fix sube a producción hoy; la migración queda pendiente.'
    }
  ];

  (function casos() {
    var lista = $('#casos-list');
    if (!lista) return;
    lista.innerHTML = CASOS.map(function (c, i) {
      return '<article class="case' + (i === 0 ? ' is-active' : '') + '" data-i="' + i + '">' +
        '<span class="case__n">0' + (i + 1) + '</span>' +
        '<h3 class="case__t">' + c.t + '</h3>' +
        '<p class="case__d">' + c.d + '</p></article>';
    }).join('');

    var chip = $('#pane-chip'), dijo = $('#pane-dijo'), salida = $('#pane-salida'), swap = $('#pane-swap');
    function muestra(i) {
      var c = CASOS[i]; if (!c || !swap) return;
      swap.classList.add('is-swapping');
      setTimeout(function () {
        if (chip) chip.innerHTML = '<img src="assets/logos/' + c.app + '.png" alt="" width="15" height="15"> ' + c.appN;
        if (dijo) dijo.textContent = '«' + c.dijo + '»';
        if (salida) salida.innerHTML = c.salida;
        swap.classList.remove('is-swapping');
      }, 180);
    }
    muestra(0);
    var items = $$('.case', lista);
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        items.forEach(function (n) { n.classList.toggle('is-active', n === e.target); });
        muestra(+e.target.dataset.i);
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    items.forEach(function (n) { io.observe(n); });
  })();

  /* ------------------------- 8 · ONDAS DEL OVERLAY ---------------------- */
  (function ondas() {
    var vivos = [];
    $$('.ov__wave[data-vivo]').forEach(function (w) {
      w.innerHTML = '';
      for (var i = 0; i < 11; i++) w.appendChild(document.createElement('i'));
    });
    $$('.ov__wave:not([data-vivo])').forEach(function (w) {
      w.innerHTML = '';
      var n = +(w.dataset.barras || 9);
      for (var i = 0; i < n; i++) {
        var b = document.createElement('i');
        b.style.setProperty('--h', (w.dataset.reposo ? 3 : 4 + Math.round(Math.abs(Math.sin(i * 1.7)) * 20)) + 'px');
        w.appendChild(b);
      }
    });
    var activos = new Set();
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? activos.add(e.target) : activos['delete'](e.target); });
      }, { threshold: 0.2 });
      $$('.ov__wave[data-vivo]').forEach(function (w) { io.observe(w); vivos.push(w); });
    } else {
      vivos = $$('.ov__wave[data-vivo]'); vivos.forEach(function (w) { activos.add(w); });
    }
    var t0 = 0;
    function late(ts) {
      requestAnimationFrame(late);
      if (quieto || ts - t0 < 90) return;
      t0 = ts;
      activos.forEach(function (w) {
        var barras = w.children;
        for (var i = 0; i < barras.length; i++) {
          var v = 5 + Math.abs(Math.sin(ts / 260 + i * 0.8) * Math.cos(ts / 410 + i)) * 21;
          barras[i].style.setProperty('--h', v.toFixed(1) + 'px');
        }
      });
    }
    if (vivos.length) requestAnimationFrame(late);
  })();

  /* --------------------------- 9 · DEMO EN VIVO -------------------------- */
  (function demo() {
    var zona = $('#demo');
    if (!zona) return;
    var parr = $('#demo-live'), estado = $('#demo-estado'), etiqueta = $('#demo-label');
    var log = $$('.logline', zona), boton = $('#demo-replay');
    var TXT = parr ? (parr.dataset.texto || '') : '';
    var timers = [];
    function limpia() { timers.forEach(clearTimeout); timers = []; }
    function pon(ms, fn) { timers.push(setTimeout(fn, ms)); }

    function corre() {
      limpia();
      if (parr) parr.textContent = '';
      log.forEach(function (l) { l.classList.remove('is-in'); });
      if (estado) estado.className = 'ov ov--grabando';
      if (etiqueta) etiqueta.textContent = 'grabando';
      log.forEach(function (l, i) { pon(300 + i * 700, function () { l.classList.add('is-in'); }); });
      pon(2600, function () {
        if (estado) estado.className = 'ov ov--transcribiendo';
        if (etiqueta) etiqueta.textContent = 'transcribiendo';
      });
      pon(3400, function () {
        if (estado) estado.className = 'ov ov--puliendo';
        if (etiqueta) etiqueta.textContent = 'puliendo';
      });
      pon(4200, function () {
        if (estado) estado.className = 'ov ov--copiado';
        if (etiqueta) etiqueta.textContent = 'copiado';
        if (!parr) return;
        if (quieto) { parr.textContent = TXT; return; }
        var i = 0;
        (function tecla() {
          parr.textContent = TXT.slice(0, i += 3);
          if (i < TXT.length) timers.push(setTimeout(tecla, 16));
        })();
      });
      pon(7200, function () {
        if (estado) estado.className = 'ov ov--reposo';
        if (etiqueta) etiqueta.textContent = 'listo';
      });
    }
    if (boton) boton.addEventListener('click', corre);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { corre(); io.disconnect(); } });
      }, { threshold: 0.4 });
      io.observe(zona);
    } else corre();
  })();

  /* ------------------------ 10 · PREGÚNTALE A UNA IA -------------------- */
  (function askAi() {
    var q = encodeURIComponent(
      '¿Qué es Trazo, la app de dictado por voz gratuita, de código abierto y 100% local en español? ' +
      'Compárala con Wispr Flow en privacidad, idioma y precio.'
    );
    var mapa = {
      chatgpt: 'https://chatgpt.com/?q=' + q,
      claude: 'https://claude.ai/new?q=' + q,
      perplexity: 'https://www.perplexity.ai/search?q=' + q
    };
    $$('[data-ask]').forEach(function (a) {
      var u = mapa[a.dataset.ask];
      if (u) { a.href = u; a.target = '_blank'; a.rel = 'noopener'; }
    });
  })();

  /* ---------------------------- 11 · MINIJUEGO -------------------------- */
  function gato(raiz) {
    var board = $('.gato__board', raiz), msg = $('.gato__msg', raiz), linea = $('.gato__line', raiz);
    if (!board || board.dataset.listo) return;
    board.dataset.listo = '1';
    $$('.gato__cell', board).forEach(function (n) { n.remove(); });
    var LINEAS = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    var T_PATH = 'M64 19C57 47 45 71 34 91c-4 8 0 9 6 4 14-12 24-27 32-42';
    var tablero, fin, bloqueado;
    var celdas = [];

    function svgX() {
      return '<svg viewBox="0 0 100 100" aria-hidden="true"><path class="gato__x" d="M26 26L74 74"/><path class="gato__x" d="M74 26L26 74"/></svg>';
    }
    function svgT() {
      return '<svg viewBox="0 0 100 130" aria-hidden="true"><path class="gato__t" d="' + T_PATH + '" ' +
        'style="fill:none;stroke:var(--color-primary);stroke-width:9;stroke-linecap:round"/>' +
        '<path class="gato__t" d="M14 44C36 38 62 33 88 36" style="fill:none;stroke:var(--color-primary);stroke-width:8;stroke-linecap:round"/></svg>';
    }
    function pos(i) { return { f: Math.floor(i / 3) + 1, c: (i % 3) + 1 }; }
    function etiqueta(i) {
      var p = pos(i), v = tablero[i];
      return 'fila ' + p.f + ', columna ' + p.c + ', ' + (v === 'x' ? 'tu ficha' : v === 'o' ? 'ficha de Trazo' : 'vacía');
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
      var a = celdas[l[0]].getBoundingClientRect(), b = celdas[l[2]].getBoundingClientRect();
      var r = board.getBoundingClientRect();
      var p = linea.querySelector('path');
      p.setAttribute('d', 'M' + (a.left - r.left + a.width / 2) + ' ' + (a.top - r.top + a.height / 2) +
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
      fin = true; if (msg) msg.textContent = txt;
      if (l) dibujaLinea(l);
      pinta();
      setTimeout(reinicia, 1500);
    }
    function juegaTrazo() {
      var l = libres(tablero);
      if (!l.length) return;
      var i;
      if (Math.random() < 0.15) i = l[Math.floor(Math.random() * l.length)];   // 15% al azar: ganable
      else i = minimax(tablero.slice(), 'o', 0).i;
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
    raiz.classList.add('is-in');   // dispara el trazado de las cuatro líneas
  }

  (function lanzaGato() {
    var raiz = $('#gato');
    if (!raiz) return;
    if (!('IntersectionObserver' in window)) { gato(raiz); return; }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { gato(raiz); io.disconnect(); }
    }, { rootMargin: '200px' });
    io.observe(raiz);
    /* Red de seguridad: son menos de 2 KB. Si el observador no dispara (marcos
       con su propio contenedor de scroll), el tablero se arma igualmente. */
    setTimeout(function () { gato(raiz); io.disconnect(); }, 2500);
  })();

  /* ------------------ 11.5 · ANILLO DE COMETAS DE LA TARJETA --------------
     La VELOCIDAD angular va sobre muelle (k=30, d=11): los cometas aceleran
     al pasar el ratón y siguen por inercia al salir, en vez de saltar.
     ----------------------------------------------------------------------- */
  (function cometas() {
    var card = $('#cta-beam');
    if (!card || card.dataset.beam) return;
    card.dataset.beam = '1';

    var IDLE = 42, HOVER = 240, K = 30, D = 11, PARADO = 40;
    var ang = 137.5, corriendo = false, enPantalla = false, ultimo = 0;
    var s = { x: IDLE, v: 0, t: IDLE };

    function pinta(a) {
      card.style.setProperty('--beam-a', (((a % 360) + 360) % 360).toFixed(2) + 'deg');
    }
    function paso(dt) {
      s.v += (K * (s.t - s.x) - D * s.v) * dt;
      s.x += s.v * dt;
      return s.x;
    }
    function frame(now) {
      if (!enPantalla || quieto || document.visibilityState === 'hidden') { corriendo = false; return; }
      if (!ultimo) ultimo = now;
      var dt = clamp((now - ultimo) / 1000, 0, 0.05);
      ultimo = now;
      ang += paso(dt) * dt;
      pinta(ang);
      requestAnimationFrame(frame);
    }
    function arranca() {
      if (corriendo || quieto || !enPantalla || document.visibilityState === 'hidden') return;
      corriendo = true; ultimo = 0; requestAnimationFrame(frame);
    }
    function modo() {
      if (quieto) { corriendo = false; s.x = s.t = IDLE; s.v = 0; ang = PARADO; pinta(PARADO); }
      else arranca();
    }
    card.addEventListener('pointerenter', function () { s.t = HOVER; arranca(); });
    card.addEventListener('pointerleave', function () { s.t = IDLE; });
    card.addEventListener('focusin', function () { s.t = HOVER; arranca(); });
    card.addEventListener('focusout', function () { s.t = IDLE; });
    document.addEventListener('visibilitychange', arranca);
    if (mq.addEventListener) mq.addEventListener('change', modo);
    else if (mq.addListener) mq.addListener(modo);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        enPantalla = es[0].isIntersecting;
        if (enPantalla) arranca();
      }, { threshold: 0.05 }).observe(card);
    } else { enPantalla = true; }
    pinta(ang);
    modo();
  })();

  /* --------- 11.6 · «TÚ PUEDES» · respaldo sin animation-timeline ---------
     Mismo patrón central que el showcase sticky: -45% arriba y abajo.
     ----------------------------------------------------------------------- */
  (function puedes() {
    var lista = $('.puedes__lista');
    if (!lista || lista.dataset.listo) return;
    var soporta = window.CSS && CSS.supports && CSS.supports('animation-timeline', 'view()');
    if (soporta || !('IntersectionObserver' in window)) return;
    lista.dataset.listo = '1';
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('activo', e.isIntersecting); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    $$('li', lista).forEach(function (n) { io.observe(n); });
  })();

  /* --------------------------- 12 · MARQUESINA -------------------------- */
  (function marquesina() {
    var t = $('#logos-track');
    if (!t || t.dataset.doble) return;
    t.dataset.doble = '1';
    t.innerHTML += t.innerHTML;   // duplicado para el bucle sin costura
  })();
};

/* Arranque a prueba de re-montajes. No hay bandera de «ya arrancó»: la verdad
   es el DOM vivo. Si el runtime reemplaza los nodos después de inicializar, la
   comprobación falla y se vuelve a armar. Los módulos son idempotentes. */
(function () {
  var n = 0, t = null, mo = null;

  function hecho() {
    var logos = document.getElementById('logos-track');
    var casos = document.getElementById('casos-list');
    return !!(logos && logos.dataset.doble && casos && casos.children.length);
  }
  function intenta() {
    if (!document.querySelector('.svg-defs') || hecho()) return hecho();
    try { TRAZO_INIT(); } catch (e) { console.warn('[Trazo] reintento de arranque', e); }
    if (hecho() && mo) { mo.disconnect(); mo = null; }
    return hecho();
  }

  intenta();
  if (window.MutationObserver) {
    mo = new MutationObserver(intenta);
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
  document.addEventListener('DOMContentLoaded', intenta);
  window.addEventListener('load', intenta);
  requestAnimationFrame(intenta);
  /* Vigilante: 300 ms nominales, resistente al estrangulamiento en iframes. */
  t = setInterval(function () { intenta(); if (n++ > 120) { clearInterval(t); t = null; } }, 300);
})();
