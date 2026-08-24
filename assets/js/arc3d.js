/* =====================================================================
   Prostorový oblouk — hlavička úvodní stránky

   Syrové WebGL, bez knihovny. Kreslí několik prstenců (výsečí anuloidu)
   v prostoru, natočených kolem společné osy, s jedním ostrým světlem
   a modrým obrysovým dosvitem. Materiál je skoro černý, takže objekt
   drží tvar spíš odlesky než barvou.

   Proč ne Three.js: knihovna má přes 600 kB a tahle scéna z ní potřebuje
   perspektivu, jednu matici a jeden shader. Celý soubor má osminu té
   velikosti a nevyžaduje build krok. Až bude potřeba načíst hotový model
   ve formátu GLTF, dovezeme Three.js a tohle zahodíme.

   Když prohlížeč WebGL nedá, soubor tiše skončí a v pozadí zůstane
   plošná varianta (predictive-arc.js).
   ===================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("arc3d");
  if (!canvas) return;

  var gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: false })
        || canvas.getContext("experimental-webgl", { antialias: true, alpha: true });
  if (!gl) return;

  canvas.dataset.on = "1";   /* plošná varianta se podle toho vypne */

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  /* ==================================================================
     Matice
     ================================================================== */
  function ident() { return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }

  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([
      f / aspect, 0, 0, 0,
      0, f, 0, 0,
      0, 0, (far + near) * nf, -1,
      0, 0, 2 * far * near * nf, 0,
    ]);
  }

  function multiply(a, b) {
    var o = new Float32Array(16);
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        var s = 0;
        for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
        o[i * 4 + j] = s;
      }
    }
    return o;
  }

  function translate(x, y, z) {
    var m = ident(); m[12] = x; m[13] = y; m[14] = z; return m;
  }

  function rotX(r) {
    var c = Math.cos(r), s = Math.sin(r), m = ident();
    m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m;
  }

  function rotY(r) {
    var c = Math.cos(r), s = Math.sin(r), m = ident();
    m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m;
  }

  function rotZ(r) {
    var c = Math.cos(r), s = Math.sin(r), m = ident();
    m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m;
  }

  /* Normálová matice: pro rotace a stejnoměrné měřítko stačí horní 3x3. */
  function normalMat(m) {
    return new Float32Array([m[0],m[1],m[2], m[4],m[5],m[6], m[8],m[9],m[10]]);
  }

  /* ==================================================================
     Geometrie — výseč anuloidu
     ================================================================== */
  function torusArc(R, r, sweep, segU, segV) {
    var pos = [], nrm = [], idx = [];
    for (var i = 0; i <= segU; i++) {
      var u = (i / segU) * sweep - sweep / 2;
      var cu = Math.cos(u), su = Math.sin(u);
      for (var j = 0; j <= segV; j++) {
        var v = (j / segV) * Math.PI * 2;
        var cv = Math.cos(v), sv = Math.sin(v);
        pos.push((R + r * cv) * cu, (R + r * cv) * su, r * sv);
        nrm.push(cv * cu, cv * su, sv);
      }
    }
    for (i = 0; i < segU; i++) {
      for (j = 0; j < segV; j++) {
        var a = i * (segV + 1) + j;
        var b = a + segV + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    return { pos: new Float32Array(pos), nrm: new Float32Array(nrm), idx: new Uint16Array(idx) };
  }

  /* ==================================================================
     Shadery
     ================================================================== */
  var VS = [
    "attribute vec3 aPos;",
    "attribute vec3 aNrm;",
    "uniform mat4 uProj, uView, uModel;",
    "uniform mat3 uNrm;",
    "varying vec3 vN, vW;",
    "void main() {",
    "  vec4 world = uModel * vec4(aPos, 1.0);",
    "  vW = world.xyz;",
    "  vN = normalize(uNrm * aNrm);",
    "  gl_Position = uProj * uView * world;",
    "}",
  ].join("\n");

  /* Materiál je skoro černý. Tvar drží ostrý odlesk od jednoho světla
     a modrý obrys na odvrácených hranách — stejný princip jako u tmavých
     předmětů na fotkách s jedním zdrojem. */
  var FS = [
    "precision mediump float;",
    "varying vec3 vN, vW;",
    "uniform vec3 uEye, uLight, uTint;",
    "uniform float uFade;",
    "void main() {",
    "  vec3 N = normalize(vN);",
    "  vec3 V = normalize(uEye - vW);",
    "  vec3 L = normalize(uLight - vW);",
    "  float diff = max(dot(N, L), 0.0);",
    "  vec3 H = normalize(L + V);",
    "  float spec = pow(max(dot(N, H), 0.0), 58.0);",
    "  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.6);",
    "  vec3 col = vec3(0.022)",
    "           + vec3(0.10, 0.11, 0.13) * diff",
    "           + vec3(0.85, 0.90, 1.00) * spec * 0.85",
    "           + uTint * rim * 0.55;",
    "  gl_FragColor = vec4(col * uFade, uFade);",
    "}",
  ].join("\n");

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("arc3d:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VS);
  var fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn("arc3d:", gl.getProgramInfoLog(prog));
    return;
  }
  gl.useProgram(prog);

  var geo = torusArc(1.0, 0.055, Math.PI * 1.42, coarse ? 96 : 168, coarse ? 10 : 16);

  var bPos = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bPos);
  gl.bufferData(gl.ARRAY_BUFFER, geo.pos, gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

  var bNrm = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bNrm);
  gl.bufferData(gl.ARRAY_BUFFER, geo.nrm, gl.STATIC_DRAW);
  var aNrm = gl.getAttribLocation(prog, "aNrm");
  gl.enableVertexAttribArray(aNrm);
  gl.vertexAttribPointer(aNrm, 3, gl.FLOAT, false, 0, 0);

  var bIdx = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.idx, gl.STATIC_DRAW);

  var uProj = gl.getUniformLocation(prog, "uProj");
  var uView = gl.getUniformLocation(prog, "uView");
  var uModel = gl.getUniformLocation(prog, "uModel");
  var uNrmL = gl.getUniformLocation(prog, "uNrm");
  var uEye = gl.getUniformLocation(prog, "uEye");
  var uLight = gl.getUniformLocation(prog, "uLight");
  var uTint = gl.getUniformLocation(prog, "uTint");
  var uFade = gl.getUniformLocation(prog, "uFade");

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  /* Prstence: poloměr, náklon, rychlost, odstín obrysu. */
  var RINGS = [
    { s: 1.00, tilt: 0.00, spin: 0.150, tint: [0.24, 0.42, 0.85], fade: 1.00 },
    { s: 0.82, tilt: 0.62, spin: -0.115, tint: [0.30, 0.50, 0.95], fade: 0.90 },
    { s: 1.18, tilt: -0.48, spin: 0.085, tint: [0.20, 0.34, 0.72], fade: 0.72 },
    { s: 0.63, tilt: 1.15, spin: -0.190, tint: [0.42, 0.56, 1.00], fade: 0.60 },
  ];
  if (coarse) RINGS.length = 2;

  var W = 0, H = 0, proj = null;
  var eye = [0, 0, 3.05];
  var pointer = { x: 0, y: 0 };

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    if (!W || !H) return;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    proj = perspective(0.85, W / H, 0.1, 60);
  }

  function draw(time) {
    if (!proj) return;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Kamera se za ukazatelem jen naklání, nepřelétá. */
    var ex = eye[0] + pointer.x * 0.55;
    var ey = eye[1] + pointer.y * 0.35;
    var view = multiply(rotY(-pointer.x * 0.16), translate(-ex, -ey, -eye[2]));
    view = multiply(rotX(pointer.y * 0.12), view);

    gl.uniformMatrix4fv(uProj, false, proj);
    gl.uniformMatrix4fv(uView, false, view);
    gl.uniform3f(uEye, ex, ey, eye[2]);
    gl.uniform3f(uLight, 2.6, 3.4, 2.2);

    for (var i = 0; i < RINGS.length; i++) {
      var r = RINGS[i];
      var m = multiply(rotZ(time * r.spin + i * 1.7), rotX(0.42 + r.tilt));
      m = multiply(rotY(time * r.spin * 0.6 + i), m);
      /* měřítko */
      for (var k = 0; k < 12; k++) m[k] *= r.s;

      gl.uniformMatrix4fv(uModel, false, m);
      gl.uniformMatrix3fv(uNrmL, false, normalMat(m));
      gl.uniform3fv(uTint, r.tint);
      gl.uniform1f(uFade, r.fade);
      gl.drawElements(gl.TRIANGLES, geo.idx.length, gl.UNSIGNED_SHORT, 0);
    }
  }

  /* ==================================================================
     Běh
     ================================================================== */
  var rafId = null, running = false, t0 = 0;

  function loop(now) {
    if (!running) return;
    if (!t0) t0 = now;
    draw((now - t0) / 1000);
    rafId = requestAnimationFrame(loop);
  }

  function start() { if (running || reduced) return; running = true; rafId = requestAnimationFrame(loop); }
  function stop() { running = false; if (rafId) cancelAnimationFrame(rafId); rafId = null; }

  resize();

  var queued = false;
  window.addEventListener("resize", function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { resize(); if (reduced) draw(0); queued = false; });
  });

  if (!coarse && !reduced) {
    window.addEventListener("mousemove", function (e) {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  if (reduced) { draw(0); return; }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0 }).observe(canvas);
  } else {
    start();
  }

  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
})();
