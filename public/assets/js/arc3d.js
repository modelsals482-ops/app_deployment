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
     výseče slábne, aby prstenec nekončil useknutě. Sčítá se aditivně.

     Přibyly dvě věci, kvůli kterým je pohyb vidět:

     uHead  Po oblouku objíždí světelný impuls s doznívající stopou.
            Samotné otáčení souměrného prstence oko nepozná — nemá se
            čeho chytit. Impuls je ten bod, který se dá sledovat.
     uReveal  Při načtení se prstenec nakreslí od jednoho konce ke
            druhému. Stránka tím začne pohybem, ne hotovým obrázkem. */
  var FS = [
    "precision mediump float;",
    "varying vec3 vN, vW;",
    "varying vec2 vUv;",
    "uniform vec3 uEye, uLight, uColA, uColB;",
    "uniform float uGain, uHead, uReveal;",
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
    /* nakreslení při startu */
    "  float grow = 1.0 - smoothstep(uReveal, uReveal + 0.10, vUv.x);",
    "  vec3 base = mix(uColA, uColB, vUv.x);",
    "  vec3 col = base * (0.16 + diff * 0.55 + rim * 0.85)",
    "           + vec3(1.0) * spec * 0.6;",
    /* Vzdálenost od hlavy impulsu, po nejkratší cestě přes konec
       oblouku — jinak by impuls u vUv.x = 1 skokem zmizel. */
    "  float d = vUv.x - uHead;",
    "  d -= floor(d + 0.5);",
    /* Míchá se aditivně přes šest prstenců, takže v překryvech se
       jasy sčítají — impuls je proto schválně úzký a spíš bledě modrý
       než bílý. Silnější verze překryvy vybílila a barva zmizela. */
    "  float head = exp(-d * d * 850.0);",
    "  float tail = exp(-d * d * 90.0) * step(d, 0.0) * 0.30;",
    "  col += vec3(0.72, 0.88, 1.0) * head * 1.20",
    "       + mix(uColA, uColB, 0.5) * tail;",
    "  gl_FragColor = vec4(col * uGain * ends * grow, 1.0);",
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
  ["uProj","uView","uModel","uNrm","uEye","uLight","uColA","uColB","uGain","uHead","uReveal"].forEach(function (n) {
    U[n] = gl.getUniformLocation(prog, n);
  });

  /* Aditivní míchání — překryvy se rozsvítí, nic se nezatmí. */
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  gl.disable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);

  /* Prstence: měřítko, náklon, rychlost otáčení, rychlost impulsu,
     dvojice barev, jas.

     Otáčení bylo dřív 0,05 až 0,21 rad/s — jedna otáčka za 30 sekund
     až dvě minuty. Měřitelně se to hýbalo, ale nikdo si toho nevšiml.
     Teď je to zhruba trojnásobek, tedy otáčka za 10 až 20 sekund, což
     už je pohyb, kterého si oko všimne, a pořád ne kolotoč.

     pul  Kolikrát za sekundu impuls objede oblouk. Prvočíselně
          rozházené, aby se prstence nesrovnaly do jednoho rytmu. */
  var RINGS = [
    { s: 1.30, tilt: 0.00, spin:  0.390, pul: 0.23, a: [0.16, 0.42, 1.00], b: [0.55, 0.30, 0.98], gain: 1.00 },
    { s: 1.05, tilt: 0.68, spin: -0.295, pul: 0.31, a: [0.10, 0.72, 0.98], b: [0.20, 0.40, 1.00], gain: 0.88 },
    { s: 1.62, tilt: -0.52, spin:  0.222, pul: 0.17, a: [0.62, 0.26, 0.96], b: [0.14, 0.48, 1.00], gain: 0.70 },
    { s: 0.80, tilt: 1.22, spin: -0.505, pul: 0.41, a: [0.24, 0.86, 0.94], b: [0.42, 0.36, 1.00], gain: 0.82 },
    { s: 1.95, tilt: 0.34, spin:  0.156, pul: 0.13, a: [0.30, 0.22, 0.90], b: [0.10, 0.60, 1.00], gain: 0.45 },
    { s: 0.58, tilt: -1.05, spin:  0.630, pul: 0.53, a: [0.70, 0.40, 1.00], b: [0.30, 0.80, 1.00], gain: 0.62 },
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

    /* Vlastní pomalý obchoz kamery. Bez něj se scéna hýbe jen tomu,
       kdo drží myš nad stránkou — na dotyku a při prvním pohledu
       stála. Přičítá se k ukazateli, takže myš pořád vede. */
    var camX = ptr.x + Math.sin(time * 0.17) * 0.42;
    var camY = ptr.y + Math.sin(time * 0.11 + 1.3) * 0.24;

    gl.clear(gl.COLOR_BUFFER_BIT);

    var view = multiply(rotY(-camX * 0.2), translate(shiftX, 0, -eyeZ));
    view = multiply(rotX(camY * 0.14), view);

    gl.uniformMatrix4fv(U.uProj, false, proj);
    gl.uniformMatrix4fv(U.uView, false, view);
    gl.uniform3f(U.uEye, -shiftX + camX * 0.6, camY * 0.4, eyeZ);
    gl.uniform3f(U.uLight, 2.4, 3.0, 2.6);

    for (var i = 0; i < RINGS.length; i++) {
      var r = RINGS[i];
      var m = multiply(rotZ(time * r.spin + i * 1.31), rotX(0.5 + r.tilt));
      m = multiply(rotY(time * r.spin * 0.55 + i * 0.8), m);

      /* Poloměr lehce pulzuje — prstence se tím rozjíždějí a zase
         stahují k sobě, takže se sestava nikdy nezastaví v jednom tvaru. */
      var puff = r.s * (1 + 0.045 * Math.sin(time * 0.43 + i * 1.7));
      for (var k = 0; k < 12; k++) m[k] *= puff;

      gl.uniformMatrix4fv(U.uModel, false, m);
      gl.uniformMatrix3fv(U.uNrm, false, normalMat(m));
      gl.uniform3fv(U.uColA, r.a);
      gl.uniform3fv(U.uColB, r.b);
      /* jas dýchá, každý prstenec ve své fázi */
      gl.uniform1f(U.uGain, r.gain * (0.80 + 0.20 * Math.sin(time * 0.9 + i)));
      /* hlava impulsu objíždí oblouk dokola */
      gl.uniform1f(U.uHead, (time * r.pul + i * 0.37) % 1);
      /* nakreslení při startu, prstence po sobě */
      gl.uniform1f(U.uReveal, Math.min(1, Math.max(0, (time - i * 0.13) / 0.95)));
      gl.drawElements(gl.TRIANGLES, geo.idx.length, gl.UNSIGNED_SHORT, 0);
    }
  }

  /* ==================================================================
     Běh
     ================================================================== */
  var rafId = null, running = false, t0 = 0, wait0 = 0;

  /* Hodiny scény se pouštějí, až zmizí úvodní loader. Nakreslení
     prstenců trvá zhruba sekundu a půl a loader je přes celou plochu —
     bez tohohle by celý nájezd proběhl za ním a nikdo by ho neviděl.
     Když loader vůbec nebyl (druhá návštěva v relaci), třída chybí a
     scéna se rozjede rovnou. Pojistka po 3,5 s pro případ, že by
     třída z jakéhokoli důvodu zůstala viset. */
  function covered(now) {
    if (!document.documentElement.classList.contains("als-loading")) return false;
    if (!wait0) wait0 = now;
    return now - wait0 < 3500;
  }

  function loop(now) {
    if (!running) return;
    if (!t0) {
      if (covered(now)) { rafId = requestAnimationFrame(loop); return; }
      t0 = now;
    }
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
