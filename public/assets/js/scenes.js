/* =====================================================================
   Scény na pozadí - Three.js r128

   Přeneseno z dodané předlohy (Aegis / Remixed Bento), přebarveno do
   palety ALSflow a doplněné o to, co předloha neřešila: zastavení mimo
   obraz, „omezit pohyb", ztráta kontextu WebGL a úklid po sobě.

   Dvě scény:
     halftone  rastr teček, jejichž velikost se vlní od středu ven
     lines     koule z bodů propojených úsečkami, pomalu se otáčí

   Knihovna je uložená v repozitáři (assets/vendor/three.r128.min.js),
   ne z CDN - hlavička Content-Security-Policy má script-src 'self'
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
        /* Dvojnásobek proti první verzi - otáčka za 24 s místo 48 s.
           Na podstránkách je koule od téhle úpravy hlavní obraz
           hlavičky, ne podklad sekce, a v tempu na podklad stála. */
        group.rotation.y = t * 0.26;
        group.rotation.x = t * 0.11;
      },
    };
  }







  /* ==================================================================
     Bodovy rastr (dotmatrix)

     Prevzato z Originkitu (React + OGL) a prepsano do three.js, ktere uz
     se na strance vozi. Plocha se rozdeli na ctvercove bunky, uprostred
     kazde se vyhodnoti simplexovy sum a podle jasu se nakresli tecka:
     svetlo velka, tma zadna. Sum se v case posouva, takze rastrem
     prochazi vlna.

     Proti predloze bez mezikroku pres texturu. Predloha sum vyrenderuje
     do render targetu a pak ho cte ve stredu bunky, jenze presne ten
     stred si umime spocitat rovnou. Jeden pruchod misto dvou.
     ================================================================== */
  function dotmatrix(renderer) {
    var scene = new THREE.Scene();
    /* Fullscreen quad: kamera nic nepromita, geometrie uz je v clip space. */
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    var mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      /* fwidth() je ve WebGL 1 az v rozsireni, bez tohohle se shader nesestavi. */
      extensions: { derivatives: true },
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        /* uFrequency = jak drobny je vzor: vys = vic malych skvrn.
           uSpeed = jak rychle se vlna posouva. Obe zamerne nizko, pozadi
           ma dychat, ne poutat pozornost. */
        uCell: { value: 13 },
        uFrequency: { value: 1.9 },
        uSpeed: { value: 0.18 },
        uBias: { value: -0.05 },
        uGamma: { value: 1.2 },
        uColA: { value: new THREE.Color(0x38dbf5) },
        uColB: { value: new THREE.Color(0x5b9dff) },
        uColC: { value: new THREE.Color(0xa78bfa) },
      },
      vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
        "  vUv = uv;",
        "  gl_Position = vec4(position.xy, 0.0, 1.0);",
        "}",
      ].join("\n"),
      fragmentShader: [
        "precision highp float;",
        "uniform float uTime, uCell, uFrequency, uSpeed, uBias, uGamma;",
        "uniform vec2 uResolution;",
        "uniform vec3 uColA, uColB, uColC;",

        /* Ashimuv simplexovy sum, stejny jako v predloze. */
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
        "  float cell = max(uCell, 1.0);",
        "  vec2 pix = gl_FragCoord.xy;",

        /* Stred bunky, ve kterem se sum vyhodnoti. Cela bunka pak sdili
           jednu hodnotu, proto to vypada jako rastr a ne jako mlha. */
        "  vec2 cellIdx = floor(pix / cell);",
        "  vec2 center = (cellIdx + 0.5) * cell;",
        "  vec2 uvC = center / uResolution;",

        /* Pomer stran, aby bunky nebyly na sirokem monitoru natazene. */
        "  float aspect = uResolution.x / max(uResolution.y, 1.0);",
        "  vec2 nUv = (uvC - 0.5) * vec2(aspect, 1.0) + 0.5;",

        "  float n = abs(snoise(vec3(nUv * uFrequency, uTime * uSpeed)));",
        "  float gray = pow(clamp(n, 0.0001, 1.0), uGamma);",

        /* Ke krajum rastr rredne, jinak by plocha koncila ostrou hranou. */
        "  vec2 d = abs(uvC - 0.5) * 2.0;",
        "  float edge = (1.0 - smoothstep(0.86, 1.0, d.x)) * (1.0 - smoothstep(0.86, 1.0, d.y));",

        "  float k = clamp(gray + uBias, 0.0, 1.0);",
        "  float radius = k * 0.5;",

        /* Antialiasing na hrane tecky, aby nebyla zubata. */
        "  vec2 cellUv = fract(pix / cell) - 0.5;",
        "  float dist = length(cellUv);",
        "  float aa = fwidth(dist) + 1e-4;",
        "  float mark = 1.0 - smoothstep(radius - aa, radius + aa, dist);",

        /* Rampa pres tri barvy ALSflow misto duhy z predlohy. */
        "  vec3 col = k < 0.5 ? mix(uColA, uColB, k * 2.0)",
        "                     : mix(uColB, uColC, (k - 0.5) * 2.0);",

        "  gl_FragColor = vec4(col, mark * edge);",
        "}",
      ].join("\n"),
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

    return {
      scene: scene,
      camera: camera,
      resize: function (w, h) {
        /* gl_FragCoord je v pixelech kresliciho bufferu, ne v CSS pixelech. */
        var dpr = renderer.getPixelRatio();
        mat.uniforms.uResolution.value.set(w * dpr, h * dpr);
        mat.uniforms.uCell.value = (coarse ? 4 : 5) * dpr;
      },
      tick: function (t) { mat.uniforms.uTime.value = t; },
    };
  }

  var KINDS = { halftone: halftone, lines: lines, dotmatrix: dotmatrix };

  document.querySelectorAll("canvas[data-scene]").forEach(function (c) {
    var build = KINDS[c.dataset.scene];
    if (build) host(c, build);
  });
})();
