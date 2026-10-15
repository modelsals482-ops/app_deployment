/* =====================================================================
   Skládané sklo - pozadí hlavičky úvodní stránky (16. 10.)

   Vlastní shader podle vzhledu "Glass Fold" z 21st.dev (kód tamtoho je
   zamčený, tohle je napsané od nuly): průsvitné skleněné tabule
   přeložené přes sebe, hrany ohybů svítí a kde se tabule překrývají,
   je plocha světlejší. Barvy jsou ALSflow (modrá, fialová, azurová).

   Pět tabulí, každá je pás nad zvlněnou čarou. Žádná knihovna, žádná
   textura, jeden průchod. Kreslí se jen když je plátno v obraze
   a záložka vepředu, v rozlišení max. 1:1 (plocha je měkká, víc pixelů
   není vidět). Ve stupni "minimalni" nic, při omezeném pohybu jeden
   stojící snímek.

   Použití: <canvas data-glassfold></canvas>
   ===================================================================== */
(function () {
  "use strict";

  if (document.documentElement.getAttribute("data-vykon") === "minimalni") return;
  var canvas = document.querySelector("canvas[data-glassfold]");
  if (!canvas) return;
  var gl = canvas.getContext("webgl", { alpha: false, antialias: false });
  if (!gl) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var VS = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }";
  var FS = [
    "precision highp float;",
    "uniform vec2 uRes;",
    "uniform float uTime;",
    "const vec3 BG = vec3(0.008, 0.010, 0.030);",
    "const vec3 BLUE = vec3(0.16, 0.30, 0.86);",
    "const vec3 VIOLET = vec3(0.42, 0.28, 0.88);",
    "const vec3 EDGE = vec3(0.62, 0.86, 1.0);",
    "float hash(vec2 q) { return fract(sin(dot(q, vec2(127.1, 311.7))) * 43758.5453); }",
    "void main() {",
    "  vec2 uv = gl_FragCoord.xy / uRes;",
    "  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;",
    "  float a = -0.62;",
    "  p = mat2(cos(a), -sin(a), sin(a), cos(a)) * p;",
    "  float t = uTime * 0.22;",
    "  vec3 col = BG;",
    "  float light = 0.0;",
    "  for (int i = 0; i < 5; i++) {",
    "    float f = float(i);",
    /* hrana ohybu: pomalá vlna + kratší vlnka, každá tabule jinak */
    "    float y = -0.95 + f * 0.40",
    "            + 0.20 * sin(p.x * (1.1 + f * 0.27) + t * (0.9 + f * 0.21) + f * 1.9)",
    "            + 0.05 * sin(p.x * 3.3 - t * 1.4 + f * 2.3);",
    "    float d = p.y - y;",
    "    float w = 0.62 + 0.1 * sin(f * 2.1);",
    /* tabule = pás nad hranou, ke svému vzdálenému okraji slábne */
    "    float pane = smoothstep(0.0, 0.006, d) * (1.0 - smoothstep(w * 0.55, w, d));",
    "    vec3 tint = mod(f, 2.0) < 1.0 ? BLUE : VIOLET;",
    "    col += tint * pane * (0.07 + 0.26 * exp(-d * 4.0));",
    /* ostrá světelná hrana + měkký dosvit, jas se posouvá podél hrany */
    "    float shine = 0.55 + 0.45 * sin(p.x * 1.7 - t * 2.2 + f * 1.3);",
    "    light += (exp(-abs(d) * 70.0) * 0.85 + exp(-abs(d) * 10.0) * 0.18) * shine;",
    "  }",
    "  col += EDGE * light;",
    "  col = col / (1.0 + col * 0.55);",
    "  col *= 1.0 - 0.45 * length((uv - vec2(0.62, 0.5)) * vec2(1.1, 1.3));",
    "  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.035;",
    "  gl_FragColor = vec4(max(col, 0.0), 1.0);",
    "}",
  ].join("\n");

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  var vs = shader(gl.VERTEX_SHADER, VS), fs = shader(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uRes = gl.getUniformLocation(prog, "uRes"), uTime = gl.getUniformLocation(prog, "uTime");

  function resize() {
    var w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    canvas.width = w; canvas.height = h;   /* 1:1, viz hlavička souboru */
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  }

  var t = 4, last = 0, rafId = 0, running = false, seen = true;
  function draw() { gl.uniform1f(uTime, t); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
  function frame(now) {
    if (!running) return;
    rafId = requestAnimationFrame(frame);
    if (last) t += Math.min(now - last, 100) / 1000;
    last = now;
    draw();
  }
  function start() { if (running || reduced) return; running = true; last = 0; rafId = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(rafId); }

  resize();
  draw();
  canvas.setAttribute("data-on", "1");
  if ("ResizeObserver" in window) new ResizeObserver(function () { resize(); if (!running) draw(); }).observe(canvas);
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); stop(); });
  if (reduced) return;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { seen = es[0].isIntersecting; seen ? start() : stop(); }).observe(canvas);
  } else start();
  document.addEventListener("visibilitychange", function () { document.hidden || !seen ? stop() : start(); });
})();
