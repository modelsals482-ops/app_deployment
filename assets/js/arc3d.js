/* =====================================================================
   Predictive Arc — prostorová scéna přes celou hlavičku

   Syrové WebGL, bez knihovny. Prstence (výseče anuloidu) se rozbíhají
   ze společné osy, každý má vlastní barvu z modro-fialovo-tyrkysového
   pásma a svítí aditivně, takže se v překryvech barvy sčítají.

   Proti dřívější verzi: scéna je přes celou hlavičku, ne v pravém
   sloupci, prstenců je víc, materiál není skoro černý a přibyl
   vnitřní dosvit. Bylo to na tmavé ploše moc potichu.

   Aditivní míchání znamená, že se scéna nikdy nekreslí tmavší než
   pozadí — proto je pod textem čitelná i bez masky.

   Když prohlížeč WebGL nedá, soubor tiše skončí a zůstane plošná
   varianta (predictive-arc.js).
   ===================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("arc3d");
  if (!canvas) return;

  var gl = canvas.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: false })
        || canvas.getContext("experimental-webgl", { antialias: true, alpha: true });
  if (!gl) return;

  canvas.dataset.on = "1";

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

  function translate(x, y, z) { var m = ident(); m[12] = x; m[13] = y; m[14] = z; return m; }
  function rotX(r) { var c = Math.cos(r), s = Math.sin(r), m = ident(); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; }
  function rotY(r) { var c = Math.cos(r), s = Math.sin(r), m = ident(); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; }
  function rotZ(r) { var c = Math.cos(r), s = Math.sin(r), m = ident(); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; }
  function normalMat(m) { return new Float32Array([m[0],m[1],m[2], m[4],m[5],m[6], m[8],m[9],m[10]]); }

  /* ==================================================================
     Geometrie — výseč anuloidu
     ================================================================== */
  function torusArc(R, r, sweep, segU, segV) {
    var pos = [], nrm = [], uv = [], idx = [];
    for (var i = 0; i <= segU; i++) {
      var t = i / segU;
      var u = t * sweep - sweep / 2;
      var cu = Math.cos(u), su = Math.sin(u);
      for (var j = 0; j <= segV; j++) {
        var v = (j / segV) * Math.PI * 2;
        var cv = Math.cos(v), sv = Math.sin(v);
        pos.push((R + r * cv) * cu, (R + r * cv) * su, r * sv);
        nrm.push(cv * cu, cv * su, sv);
        uv.push(t, j / segV);
      }
    }
    for (i = 0; i < segU; i++) {
      for (j = 0; j < segV; j++) {
        var a = i * (segV + 1) + j, b = a + segV + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    return { pos: new Float32Array(pos), nrm: new Float32Array(nrm),
             uv: new Float32Array(uv), idx: new Uint16Array(idx) };
  }

  /* ==================================================================
     Shadery
     ================================================================== */
  var VS = [
    "attribute vec3 aPos;",
    "attribute vec3 aNrm;",
    "attribute vec2 aUv;",
    "uniform mat4 uProj, uView, uModel;",
    "uniform mat3 uNrm;",
    "varying vec3 vN, vW;",
    "varying vec2 vUv;",
    "void main() {",
    "  vec4 world = uModel * vec4(aPos, 1.0);",
    "  vW = world.xyz;",
    "  vN = normalize(uNrm * aNrm);",
    "  vUv = aUv;",
    "  gl_Position = uProj * uView * world;",
    "}",
  ].join("\n");

  /* Barva se po délce oblouku přelévá mezi dvěma odstíny, ke konci
     výseče slábne, aby prstenec nekončil useknutě. Sčítá se aditivně. */
  var FS = [
    "precision mediump float;",
    "varying vec3 vN, vW;",
    "varying vec2 vUv;",
    "uniform vec3 uEye, uLight, uColA, uColB;",
    "uniform float uGain;",
    "void main() {",
    "  vec3 N = normalize(vN);",
    "  vec3 V = normalize(uEye - vW);",
    "  vec3 L = normalize(uLight - vW);",
    "  float diff = max(dot(N, L), 0.0);",
    "  vec3 H = normalize(L + V);",
    "  float spec = pow(max(dot(N, H), 0.0), 42.0);",
    "  float rim = pow(1.0 - max(dot(N, V), 0.0), 2.2);",
    /* konce výseče doběhnou do ztracena */
    "  float ends = smoothstep(0.0, 0.13, vUv.x) * smoothstep(1.0, 0.87, vUv.x);",
    "  vec3 base = mix(uColA, uColB, vUv.x);",
    "  vec3 col = base * (0.16 + diff * 0.55 + rim * 0.85)",
    "           + vec3(1.0) * spec * 0.6;",
    "  gl_FragColor = vec4(col * uGain * ends, 1.0);",
    "}",
  ].join("\n");

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn("arc3d:", gl.getShaderInfoLog(s)); return null; }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VS);
  var fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn("arc3d:", gl.getProgramInfoLog(prog)); return; }
  gl.useProgram(prog);

  var geo = torusArc(1.0, 0.048, Math.PI * 1.45, coarse ? 110 : 200, coarse ? 10 : 18);

  function buf(data, name, size) {
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }
  buf(geo.pos, "aPos", 3);
  buf(geo.nrm, "aNrm", 3);
  buf(geo.uv, "aUv", 2);

  var bIdx = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.idx, gl.STATIC_DRAW);

  var U = {};
  ["uProj","uView","uModel","uNrm","uEye","uLight","uColA","uColB","uGain"].forEach(function (n) {
    U[n] = gl.getUniformLocation(prog, n);
  });

  /* Aditivní míchání — překryvy se rozsvítí, nic se nezatmí. */
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.disable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  /* Prstence: měřítko, náklon, rychlost, dvojice barev, jas. */
  var RINGS = [
    { s: 1.30, tilt: 0.00, spin:  0.130, a: [0.16, 0.42, 1.00], b: [0.55, 0.30, 0.98], gain: 1.00 },
    { s: 1.05, tilt: 0.68, spin: -0.098, a: [0.10, 0.72, 0.98], b: [0.20, 0.40, 1.00], gain: 0.88 },
    { s: 1.62, tilt: -0.52, spin:  0.074, a: [0.62, 0.26, 0.96], b: [0.14, 0.48, 1.00], gain: 0.70 },
    { s: 0.80, tilt: 1.22, spin: -0.168, a: [0.24, 0.86, 0.94], b: [0.42, 0.36, 1.00], gain: 0.82 },
    { s: 1.95, tilt: 0.34, spin:  0.052, a: [0.30, 0.22, 0.90], b: [0.10, 0.60, 1.00], gain: 0.45 },
    { s: 0.58, tilt: -1.05, spin:  0.210, a: [0.70, 0.40, 1.00], b: [0.30, 0.80, 1.00], gain: 0.62 },
  ];
  if (coarse) RINGS.length = 3;

  var W = 0, H = 0, proj = null;
  var eyeZ = 3.6;
  var shiftX = 0;   /* na širokých obrazovkách scéna uhne doprava od textu */
  var ptr = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    if (!W || !H) return;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    proj = perspective(0.9, W / H, 0.1, 60);

    /* Na šířku sedí text vlevo, scéna se odsune doprava, ať si
       nekonkurují. Na výšku se skládají pod sebe, tam zůstane na střed. */
    shiftX = W / H > 1.15 ? 1.05 : 0;
  }

  function draw(time) {
    if (!proj) return;

    /* ukazatel dojíždí, ať scéna nepodskakuje */
    ptr.x += (ptr.tx - ptr.x) * 0.05;
    ptr.y += (ptr.ty - ptr.y) * 0.05;

    gl.clear(gl.COLOR_BUFFER_BIT);

    var view = multiply(rotY(-ptr.x * 0.2), translate(shiftX, 0, -eyeZ));
    view = multiply(rotX(ptr.y * 0.14), view);

    gl.uniformMatrix4fv(U.uProj, false, proj);
    gl.uniformMatrix4fv(U.uView, false, view);
    gl.uniform3f(U.uEye, -shiftX + ptr.x * 0.6, ptr.y * 0.4, eyeZ);
    gl.uniform3f(U.uLight, 2.4, 3.0, 2.6);

    for (var i = 0; i < RINGS.length; i++) {
      var r = RINGS[i];
      var m = multiply(rotZ(time * r.spin + i * 1.31), rotX(0.5 + r.tilt));
      m = multiply(rotY(time * r.spin * 0.55 + i * 0.8), m);
      for (var k = 0; k < 12; k++) m[k] *= r.s;

      gl.uniformMatrix4fv(U.uModel, false, m);
      gl.uniformMatrix3fv(U.uNrm, false, normalMat(m));
      gl.uniform3fv(U.uColA, r.a);
      gl.uniform3fv(U.uColB, r.b);
      /* jas lehce dýchá, každý prstenec ve své fázi */
      gl.uniform1f(U.uGain, r.gain * (0.86 + 0.14 * Math.sin(time * 0.5 + i)));
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
    requestAnimationFrame(function () { resize(); if (reduced) draw(6); queued = false; });
  });

  if (!coarse && !reduced) {
    window.addEventListener("mousemove", function (e) {
      ptr.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ptr.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  /* Kontext se může ztratit (uspání, přepnutí GPU) — bez tohohle by
     plátno zůstalo prázdné až do reloadu. */
  canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); stop(); });
  canvas.addEventListener("webglcontextrestored", function () { resize(); start(); });

  if (reduced) { draw(6); return; }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0 }).observe(canvas);
  } else { start(); }

  document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
})();
