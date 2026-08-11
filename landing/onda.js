/* =========================================================================
   FONDO VIVO — onda de voz + polvo galáctico                    (2026-08-01)

   Un canvas WebGL fijo detrás de toda la página. No es un video: la onda se
   calcula, así que no pesa, no se recorta y reacciona al scroll.

   REGLA DE ESTA CAPA: es atmósfera, no gráfico. Si en algún momento compite
   con el texto, está mal calibrada. Por eso las intensidades son bajas y hay
   un tope duro de brillo (VELO) antes de mezclarse con el fondo.
   ========================================================================= */
(function fondoOnda() {
  var cv = document.getElementById('onda-bg');
  if (!cv) return;

  var gl = cv.getContext('webgl', { alpha: true, antialias: false, depth: false })
        || cv.getContext('experimental-webgl', { alpha: true });
  if (!gl) return;                       /* sin WebGL: se queda el fondo CSS */

  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

  var FS = [
    'precision mediump float;',
    'uniform vec2 u_res; uniform float u_t; uniform float u_s; uniform vec2 u_m;',

    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }',

    /* Suma de senos: una onda de voz es exactamente eso. */
    'float onda(float x, float t, float amp){',
    '  return (sin(x*2.4 + t*0.55)*0.50',
    '        + sin(x*5.7 - t*0.85)*0.26',
    '        + sin(x*10.9 + t*1.25)*0.12) * amp;',
    '}',

    /* Polvo: rejilla de celdas, un punto por celda, a la deriva. */
    'float polvo(vec2 p, float t, float esc){',
    '  vec2 g = p*esc;',
    '  vec2 celda = floor(g);',
    '  vec2 f = fract(g);',
    '  float br = 0.0;',
    '  for(int j=-1;j<=1;j++){ for(int i=-1;i<=1;i++){',
    '    vec2 o = vec2(float(i),float(j));',
    '    vec2 id = celda + o;',
    '    float r = hash(id);',
    '    if(r < 0.55) continue;',                    /* solo algunas celdas tienen punto */
    '    vec2 pos = vec2(hash(id+7.1), hash(id+3.3));',
    '    pos.x = fract(pos.x + t*0.012*(0.4+r));',   /* deriva lenta y horizontal */
    '    pos.y += sin(t*0.25 + r*6.28)*0.05;',
    '    float d = length(f - o - pos);',
    '    float tam = mix(0.006, 0.022, hash(id+1.7));',
    '    br += smoothstep(tam, 0.0, d) * (0.35 + r*0.65);',
    '  }}',
    '  return br;',
    '}',

    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / u_res;',
    '  vec2 p  = uv*2.0 - 1.0;',
    '  float ar = u_res.x / u_res.y;',
    '  p.x *= ar;',

    '  float calma = clamp(u_s, 0.0, 1.0);',
    '  calma = calma*calma*(3.0-2.0*calma);',
    '  float amp = mix(0.30, 0.015, calma);',

    /* el cursor levanta la onda a su alrededor, suave */
    '  vec2 m = (u_m/u_res)*2.0-1.0; m.x *= ar;',
    '  float dm = distance(p, m);',
    '  amp += exp(-dm*dm*5.0) * 0.07 * (1.0-calma*0.7);',

    '  float env = smoothstep(ar*1.25, ar*0.1, abs(p.x));',

    '  vec3 azul = vec3(0.145,0.388,0.922);',
    '  vec3 cian = vec3(0.133,0.827,0.933);',
    '  vec3 col = vec3(0.0);',

    /* --- la onda, muy tenue: es un rumor de fondo, no un dibujo --- */
    '  float y = onda(p.x*1.9, u_t, amp*env);',
    '  float d = abs(p.y - y);',
    '  float nucleo = exp(-d*d*900.0) * 0.34;',
    '  float halo   = exp(-d*d*26.0)  * 0.12;',
    '  col += mix(azul, cian, clamp(uv.x*0.5 + nucleo, 0.0, 1.0)) * (nucleo + halo);',

    /* --- polvo galáctico en dos profundidades --- */
    '  float pf = polvo(p + vec2(u_t*0.008, 0.0), u_t, 2.6);',        /* lejos */
    '  float pc = polvo(p*0.55 + vec2(u_t*0.015, 3.7), u_t, 3.4);',   /* cerca */
    '  col += cian * pf * 0.13;',
    '  col += azul * pc * 0.20;',

    /* el polvo se anima cerca de la onda, como si la siguiera */
    '  float cerca = exp(-d*d*3.0);',
    '  col += cian * (pf+pc) * cerca * 0.16 * (1.0-calma*0.5);',

    /* --- techo de brillo: el texto manda, esto es atmósfera --- */
    '  float VELO = 0.30;',
    '  col = min(col, vec3(VELO));',

    /* se apaga hacia arriba y abajo para no tocar los titulares */
    '  float vinieta = smoothstep(1.15, 0.35, abs(p.y));',
    '  col *= 0.35 + vinieta*0.65;',

    '  float a = clamp(max(max(col.r,col.g),col.b)*3.2, 0.0, 1.0);',
    '  gl_FragColor = vec4(col, a);',
    '}'
  ].join('\n');

  function compila(t, s) {
    var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o);
    if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(o)); return null; }
    return o;
  }
  var vs = compila(gl.VERTEX_SHADER, VS), fs = compila(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs);
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'u_res'),
      uT   = gl.getUniformLocation(prog, 'u_t'),
      uS   = gl.getUniformLocation(prog, 'u_s'),
      uM   = gl.getUniformLocation(prog, 'u_m');

  /* DPR topado a 1.5: a pantalla completa y durante 30 pantallas de scroll,
     2x no aporta nada visible aquí y sí calienta el móvil. */
  function mide() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    cv.width  = Math.max(1, Math.round(innerWidth  * dpr));
    cv.height = Math.max(1, Math.round(innerHeight * dpr));
    gl.viewport(0, 0, cv.width, cv.height);
    gl.uniform2f(uRes, cv.width, cv.height);
  }
  addEventListener('resize', mide, { passive: true });
  mide();

  var raton = { x: cv.width * 0.5, y: cv.height * 0.55 },
      objRaton = { x: raton.x, y: raton.y },
      fino = matchMedia('(pointer:fine)').matches;

  if (fino) {
    addEventListener('pointermove', function (e) {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      objRaton.x = e.clientX * dpr;
      objRaton.y = (innerHeight - e.clientY) * dpr;
    }, { passive: true });
  }

  var scroll = 0, objScroll = 0;
  function alScroll() {
    var max = document.documentElement.scrollHeight - innerHeight;
    objScroll = max > 0 ? Math.min(scrollY / max, 1) : 0;
  }
  addEventListener('scroll', alScroll, { passive: true });
  alScroll();

  var mq = matchMedia('(prefers-reduced-motion: reduce)');
  var quieto = mq.matches, corriendo = false, t0 = performance.now();

  function bucle(now) {
    if (document.visibilityState === 'hidden') { corriendo = false; return; }
    var t = (now - t0) / 1000;
    raton.x += (objRaton.x - raton.x) * 0.05;
    raton.y += (objRaton.y - raton.y) * 0.05;
    scroll  += (objScroll - scroll) * 0.06;

    gl.uniform1f(uT, quieto ? 4.0 : t);
    gl.uniform1f(uS, scroll);
    gl.uniform2f(uM, raton.x, raton.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (quieto) { corriendo = false; return; }   /* un cuadro fijo y para */
    requestAnimationFrame(bucle);
  }
  function arranca() {
    if (corriendo || document.visibilityState === 'hidden') return;
    corriendo = true; requestAnimationFrame(bucle);
  }
  /* Bidireccional: apagar el ajuste devuelve el movimiento sin recargar. */
  function modo() { quieto = mq.matches; corriendo = false; arranca(); }
  if (mq.addEventListener) mq.addEventListener('change', modo);
  else if (mq.addListener) mq.addListener(modo);
  document.addEventListener('visibilitychange', arranca);

  arranca();
})();
