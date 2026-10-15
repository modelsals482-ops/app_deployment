/* =====================================================================
   Pixelové vlny (bodový rastr) - syrové WebGL, bez Three.js

   Stejný shader jako dřívější scéna "dotmatrix" ve scenes.js, jen bez
   knihovny: celá scéna je jeden obdélník přes plátno a fragment shader.
   Three.js (600 kB) kvůli tomu vozit nemusíme (15. 10.).

   Plocha se rozdělí na čtvercové buňky, uprostřed každé se vyhodnotí
   simplexový šum a podle jasu se nakreslí tečka. Šum se v čase posouvá,
   takže rastrem prochází vlna.

   Šetří se: kreslí se max. 30 snímků za sekundu (vlna je pomalá, víc
   není vidět), jen když je plátno v obraze a záložka vepředu, a ve
   stupni "minimalni" vůbec. Při omezeném pohybu se nakreslí jeden
   stojící snímek.

   Použití: <canvas class="scene scene-wide" data-dotwave></canvas>
   ===================================================================== */
(function () {
  "use strict";

  if (document.documentElement.getAttribute("data-vykon") === "minimalni") return;
  var canvases = document.querySelectorAll("canvas[data-dotwave]");
  if (!canvases.length) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  var VS = "attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }";

  var FS = [
    "precision highp float;",
    "uniform float uTime, uCell;",
    "uniform vec2 uResolution;",
    "const vec3 A = vec3(0.220, 0.859, 0.961);",   /* #38dbf5 */
    "const vec3 B = vec3(0.357, 0.616, 1.000);",   /* #5b9dff */
    "const vec3 C = vec3(0.655, 0.545, 0.980);",   /* #a78bfa */

    /* Ashimův simplexový šum. */
    "vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }",
    "vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }",
    "vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }",
    "vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }",
    "float snoise(vec3 v) {",
    "  const vec2 C = vec2(1.0/6.0, 1.0/3.0);",
    "  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);",
    "  vec3 i = floor(v + dot(v, C.yyy));",
    "  vec3 x0 = v - i + dot(i, C.xxx);",
    "  vec3 g = step(x0.yzx, x0.xyz);",
    "  vec3 l = 1.0 - g;",
    "  vec3 i1 = min(g.xyz, l.zxy);",
    "  vec3 i2 = max(g.xyz, l.zxy);",
    "  vec3 x1 = x0 - i1 + C.xxx;",
    "  vec3 x2 = x0 - i2 + C.yyy;",
    "  vec3 x3 = x0 - D.yyy;",
    "  i = mod289(i);",
    "  vec4 p = permute(permute(permute(",
    "             i.z + vec4(0.0, i1.z, i2.z, 1.0))",
    "           + i.y + vec4(0.0, i1.y, i2.y, 1.0))",
    "           + i.x + vec4(0.0, i1.x, i2.x, 1.0));",
    "  float n_ = 0.142857142857;",
    "  vec3 ns = n_ * D.wyz - D.xzx;",
    "  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);",
    "  vec4 x_ = floor(j * ns.z);",
    "  vec4 y_ = floor(j - 7.0 * x_);",
    "  vec4 x = x_ * ns.x + ns.yyyy;",
    "  vec4 y = y_ * ns.x + ns.yyyy;",
    "  vec4 h = 1.0 - abs(x) - abs(y);",
    "  vec4 b0 = vec4(x.xy, y.xy);",
    "  vec4 b1 = vec4(x.zw, y.zw);",
    "  vec4 s0 = floor(b0) * 2.0 + 1.0;",
    "  vec4 s1 = floor(b1) * 2.0 + 1.0;",
    "  vec4 sh = -step(h, vec4(0.0));",
    "  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;",
    "  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;",
    "  vec3 p0 = vec3(a0.xy, h.x);",
    "  vec3 p1 = vec3(a0.zw, h.y);",
    "  vec3 p2 = vec3(a1.xy, h.z);",
    "  vec3 p3 = vec3(a1.zw, h.w);",
    "  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));",
    "  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;",
    "  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);",
    "  m = m * m;",
    "  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));",
    "}",

    "void main() {",
    "  vec2 pix = gl_FragCoord.xy;",
    "  vec2 center = (floor(pix / uCell) + 0.5) * uCell;",
    "  vec2 uvC = center / uResolution;",
    "  float aspect = uResolution.x / max(uResolution.y, 1.0);",
    "  vec2 nUv = (uvC - 0.5) * vec2(aspect, 1.0) + 0.5;",
    "  float n = abs(snoise(vec3(nUv * 1.9, uTime * 0.18)));",
    "  float k = clamp(pow(clamp(n, 0.0001, 1.0), 1.2) - 0.05, 0.0, 1.0);",
    /* ke krajům rastr řídne, plocha nekončí ostrou hranou */
    "  vec2 d = abs(uvC - 0.5) * 2.0;",
    "  float edge = (1.0 - smoothstep(0.86, 1.0, d.x)) * (1.0 - smoothstep(0.86, 1.0, d.y));",
    /* hrana tečky vyhlazená o jeden pixel bufferu, bez rozšíření pro fwidth() */
    "  float dist = length(fract(pix / uCell) - 0.5);",
    "  float aa = 1.0 / uCell;",
    "  float mark = 1.0 - smoothstep(k * 0.5 - aa, k * 0.5 + aa, dist);",
    "  vec3 col = k < 0.5 ? mix(A, B, k * 2.0) : mix(B, C, (k - 0.5) * 2.0);",
    "  gl_FragColor = vec4(col, mark * edge);",
    "}",
  ].join("\n");

  canvases.forEach(run);

  function run(canvas) {
    var gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: false });
    if (!gl) return;

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

    var uTime = gl.getUniformLocation(prog, "uTime");
    var uCell = gl.getUniformLocation(prog, "uCell");
    var uRes = gl.getUniformLocation(prog, "uResolution");

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uCell, (coarse ? 4 : 5) * dpr);
    }

    var t = 0, last = 0, rafId = 0, running = false;

    function draw() {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uTime, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    function frame(now) {
      if (!running) return;
      rafId = requestAnimationFrame(frame);
      if (last && now - last < 33) return;   /* 30 snímků za sekundu stačí */
      if (last) t += Math.min(now - last, 100) / 1000;
      last = now;
      draw();
    }

    function start() { if (running || reduced) return; running = true; last = 0; rafId = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(rafId); }

    resize();
    t = 3.2;
    if ("ResizeObserver" in window) new ResizeObserver(function () { resize(); if (!running) draw(); }).observe(canvas);
    canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); stop(); });

    draw();
    if (reduced) return;

    var seen = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { seen = es[0].isIntersecting; seen ? start() : stop(); }).observe(canvas);
    } else start();
    document.addEventListener("visibilitychange", function () { document.hidden || !seen ? stop() : start(); });
  }
})();
