/* =====================================================================
   Scény na pozadí — Three.js r128

   Přeneseno z dodané předlohy (Aegis / Remixed Bento), přebarveno do
   palety ALSflow a doplněné o to, co předloha neřešila: zastavení mimo
   obraz, „omezit pohyb", ztráta kontextu WebGL a úklid po sobě.

   Dvě scény:
     halftone  rastr teček, jejichž velikost se vlní od středu ven
     lines     koule z bodů propojených úsečkami, pomalu se otáčí

   Knihovna je uložená v repozitáři (assets/vendor/three.r128.min.js),
   ne z CDN — hlavička Content-Security-Policy má script-src 'self'
   a cizí skript by prohlížeč odmítl.

   Použití: <canvas data-scene="halftone"></canvas>
   ===================================================================== */
(function () {
  "use strict";

  if (!window.THREE) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  /* ==================================================================
     Společný životní cyklus

     Každá scéna dostane renderer, obsluhu rozměrů a smyčku, která běží
     jen když je plátno v obraze a záložka vepředu.
     ================================================================== */
  function host(canvas, build) {
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: !coarse });
    } catch (e) {
      return;   /* bez WebGL prostě nic, plocha zůstane černá */
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));

    var api = build(renderer);
    if (!api) return;

    function resize() {
      var box = canvas.parentElement || canvas;
      var w = Math.max(1, box.clientWidth);
      var h = Math.max(1, box.clientHeight);
      renderer.setSize(w, h, false);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      api.resize(w, h);
    }

    var queued = false;
    window.addEventListener("resize", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { resize(); queued = false; });
    });

    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { resize(); }).observe(canvas.parentElement || canvas);
    }

    resize();

    var clock = new THREE.Clock();
    var rafId = null;
    var running = false;

    function frame() {
      if (!running) return;
      api.tick(clock.getElapsedTime());
      renderer.render(api.scene, api.camera);
      rafId = requestAnimationFrame(frame);
    }

    function start() {
      if (running || reduced) return;
      running = true;
      clock.start();
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    /* Bez tohohle by po uspání zůstalo plátno prázdné až do reloadu. */
    canvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); stop(); });
    canvas.addEventListener("webglcontextrestored", function () { resize(); start(); });

    if (reduced) {
      api.tick(3.2);
      renderer.render(api.scene, api.camera);
      return;
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }, { threshold: 0 }).observe(canvas);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  }

  /* ==================================================================
     Rastr teček

     Vlna běží od středu ven, velikost i průhlednost tečky se řídí
     stejnou hodnotou, takže rastr u okraje přirozeně řídne.
     ================================================================== */
  function halftone(renderer) {
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    var grid = coarse ? 14 : 22;
    var step = 0.15;
    var pos = [];

    for (var x = -grid; x <= grid; x++) {
      for (var y = -grid; y <= grid; y++) {
        pos.push(x * step, y * step, 0);
      }
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));

    var mat = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        colA: { value: new THREE.Color(0x38dbf5) },   /* tyrkysová */
        colB: { value: new THREE.Color(0xa78bfa) },   /* fialová */
        dpr: { value: renderer.getPixelRatio() },
      },
      vertexShader: [
        "attribute float scale;",
        "uniform float time;",
        "uniform float dpr;",
        "varying float vAmp;",
        "varying vec2 vPos;",
        "void main() {",
        "  vPos = position.xy;",
        "  float d = length(position.xy);",
        "  float amp = sin(d * 5.2 - time * 2.1) * 0.5 + 0.5;",
        /* okraje utlumíme, ať rastr nekončí useknutě */
        "  amp *= smoothstep(3.4, 0.6, d);",
        "  vAmp = amp;",
        "  gl_PointSize = amp * 5.0 * dpr;",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}",
      ].join("\n"),
      fragmentShader: [
        "precision mediump float;",
        "uniform vec3 colA, colB;",
        "varying float vAmp;",
        "varying vec2 vPos;",
        "void main() {",
        "  vec2 c = gl_PointCoord - vec2(0.5);",
        "  if (length(c) > 0.5) discard;",
        "  vec3 col = mix(colA, colB, (vPos.y + 3.4) / 6.8);",
        "  gl_FragColor = vec4(col, vAmp * 0.85);",
        "}",
      ].join("\n"),
      transparent: true,
      depthWrite: false,
    });

    var points = new THREE.Points(geo, mat);
    scene.add(points);

    return {
      scene: scene,
      camera: camera,
      resize: function (w, h) {
        var a = w / h;
        camera.left = -a; camera.right = a;
        camera.top = 1; camera.bottom = -1;
        camera.updateProjectionMatrix();
        mat.uniforms.dpr.value = renderer.getPixelRatio();
      },
      tick: function (t) { mat.uniforms.time.value = t; },
    };
  }

  /* ==================================================================
     Síť úseček na kouli

     Body se rozsypou po povrchu koule a spojí se ty, které jsou blíž
     než daná vzdálenost. Předloha to počítala pro 200 bodů v O(n^2);
     tady je limit podle zařízení, ať se to na telefonu nezadrhne.
     ================================================================== */
  function lines(renderer) {
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 4.5;

    var group = new THREE.Group();
    scene.add(group);

    var count = coarse ? 110 : 190;
    var r = 2.5;
    var pos = new Float32Array(count * 3);

    for (var i = 0; i < count; i++) {
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(Math.random() * 2 - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    var idx = [];
    for (i = 0; i < count; i++) {
      for (var j = i + 1; j < count; j++) {
        var dx = pos[i * 3] - pos[j * 3];
        var dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        var dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < 1.2) idx.push(i, j);
      }
    }
    geo.setIndex(idx);

    var mat = new THREE.LineBasicMaterial({
      color: 0x5b9dff,
      transparent: true,
      opacity: 0.5,
    });

    group.add(new THREE.LineSegments(geo, mat));

    return {
      scene: scene,
      camera: camera,
      resize: function (w, h) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      },
      tick: function (t) {
        /* Dvojnásobek proti první verzi — otáčka za 24 s místo 48 s.
           Na podstránkách je koule od téhle úpravy hlavní obraz
           hlavičky, ne podklad sekce, a v tempu na podklad stála. */
        group.rotation.y = t * 0.26;
        group.rotation.x = t * 0.11;
      },
    };
  }

  var KINDS = { halftone: halftone, lines: lines };

  document.querySelectorAll("canvas[data-scene]").forEach(function (c) {
    var build = KINDS[c.dataset.scene];
    if (build) host(c, build);
  });
})();
