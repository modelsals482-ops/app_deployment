/* =====================================================================
   Predictive Arc — pozadí úvodní stránky

   Volná adaptace scény Predictive Arc z ThreeUI (varianta amber-halftone).
   Předloha běží na Three.js r128 a je laděná do jantarové; tady je to
   čisté Canvas 2D v modré paletě ALSflow, protože:
     - hlavička Content-Security-Policy má script-src 'self', takže knihovna
       z CDN by se nenačetla a vozit si kvůli pozadí celý Three.js je moc,
     - dům staví weby bez build kroku a Canvas 2D nic z toho nepotřebuje.

   Co scéna dělá:
     Ze společného ohniska se rozbíhají soustředné oblouky. Každý roste,
     u vnějšího okraje slábne a rozpadá se do rastru teček — halftone.
     Před nimi běží jeden světlý „predikční" oblouk s tečkovanou stopou,
     která ukazuje, kudy poletí. Ohnisko se pomalu stěhuje za myší.

   Ohleduplnost:
     - při „omezit pohyb" se vykreslí jediný statický snímek,
     - mimo obraz se smyčka zastaví,
     - na dotykových zařízeních se ohnisko nehýbe a teček je míň.
   ===================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("arcCanvas");
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  /* ------------------------------------------------------------------
     Ladicí čísla scény
     ------------------------------------------------------------------ */
  var ARCS = coarse ? 9 : 16;      /* kolik oblouků je v cyklu naráz */
  var CYCLE = 9.5;                 /* sekund, než oblouk doběhne z ohniska ven */
  var SPREAD = 1.55;               /* jak široký výsek oblouky zabírají, v radiánech */
  var DOT_STEP = coarse ? 12 : 8;  /* rozteč teček po oblouku v pixelech */

  var COL_CORE = [96, 165, 250];   /* #60a5fa — základní modrá */
  var COL_LEAD = [147, 197, 253];  /* #93c5fd — predikční oblouk */
  var COL_FAR = [168, 85, 247];    /* #a855f7 — fialová na vzdálených obloucích */

  /* ------------------------------------------------------------------
     Rozměry
     ------------------------------------------------------------------ */
  var W = 0, H = 0, DPR = 1, R = 0;
  var focus = { x: 0, y: 0 };      /* kam scéna míří */
  var target = { x: 0, y: 0 };     /* kam se stěhuje */

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    /* Ohnisko sedí vlevo dole mimo plochu, oblouky pak stoupají doprava
       nahoru přes celou hlavičku. */
    var home = { x: W * -0.05, y: H * 1.18 };
    target.x = home.x;
    target.y = home.y;
    if (!focus.x && !focus.y) {
      focus.x = home.x;
      focus.y = home.y;
    }
    R = Math.sqrt(W * W + H * H) * 1.05;
  }

  /* ------------------------------------------------------------------
     Halftone: velikost tečky podle toho, kde na oblouku leží
     ------------------------------------------------------------------ */
  function dotSize(t, life) {
    /* t   = pozice po oblouku, 0 na jednom konci, 1 na druhém
       life = jak daleko je oblouk od ohniska, 0 až 1 */
    var ends = Math.sin(Math.PI * t);           /* uprostřed plno, na koncích nic */
    var env = Math.sin(Math.PI * Math.pow(life, 0.55));  /* nabere a zase vyhasne */
    return Math.max(0, ends * ends * env * 3.4);
  }

  function mix(a, b, k) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * k),
      Math.round(a[1] + (b[1] - a[1]) * k),
      Math.round(a[2] + (b[2] - a[2]) * k),
    ];
  }

  /* ------------------------------------------------------------------
     Jeden oblouk
     ------------------------------------------------------------------ */
  function drawArc(life, angle, lead) {
    var radius = life * R;
    if (radius < 8) return;

    /* Kolik teček se na oblouk vejde. Delší oblouk jich má víc, aby
       rozteč zůstala pořád stejná. */
    var arcLen = radius * SPREAD;
    var count = Math.max(6, Math.round(arcLen / DOT_STEP));
    var base = lead ? COL_LEAD : mix(COL_CORE, COL_FAR, life);
    var glow = lead ? 1 : 0.5;

    for (var i = 0; i <= count; i++) {
      var t = i / count;
      var r = dotSize(t, life);
      if (r < 0.12) continue;

      var a = angle - SPREAD / 2 + SPREAD * t;
      var x = focus.x + Math.cos(a) * radius;
      var y = focus.y + Math.sin(a) * radius;
      if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(" + base[0] + "," + base[1] + "," + base[2] + "," +
        Math.min(0.9, r * 0.3 * glow).toFixed(3) + ")";
      ctx.fill();
    }
  }

  /* Predikční stopa: řídké tečky před vedoucím obloukem, které naznačují,
     kudy poletí dál. Tohle je ta „predikce" z názvu scény. */
  function drawPrediction(life, angle) {
    var steps = 5;
    for (var s = 1; s <= steps; s++) {
      var ahead = life + s * 0.055;
      if (ahead > 1) break;
      var radius = ahead * R;
      var count = Math.max(4, Math.round(radius * SPREAD / (DOT_STEP * 3.2)));
      for (var i = 0; i <= count; i++) {
        var t = i / count;
        var a = angle - SPREAD / 2 + SPREAD * t;
        var x = focus.x + Math.cos(a) * radius;
        var y = focus.y + Math.sin(a) * radius;
        if (x < 0 || x > W || y < 0 || y > H) continue;
        var alpha = Math.sin(Math.PI * t) * (1 - s / steps) * 0.3 * Math.sin(Math.PI * ahead);
        if (alpha <= 0.004) continue;
        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(147,197,253," + alpha.toFixed(3) + ")";
        ctx.fill();
      }
    }
  }

  /* ------------------------------------------------------------------
     Snímek
     ------------------------------------------------------------------ */
  var t0 = 0;

  function frame(now) {
    if (!t0) t0 = now;
    var time = (now - t0) / 1000;

    /* ohnisko se líně stěhuje k cíli */
    focus.x += (target.x - focus.x) * 0.045;
    focus.y += (target.y - focus.y) * 0.045;

    ctx.clearRect(0, 0, W, H);

    /* Úhel výseku se pomalu kolébá, ať scéna nestojí. */
    var angle = -Math.PI / 2 + Math.sin(time * 0.11) * 0.13 + 0.5;

    for (var i = 0; i < ARCS; i++) {
      var life = ((time / CYCLE) + i / ARCS) % 1;
      drawArc(life, angle + Math.sin(time * 0.07 + i) * 0.02, false);
    }

    /* vedoucí oblouk běží ve vlastním, pomalejším cyklu */
    var leadLife = (time / (CYCLE * 1.6)) % 1;
    drawPrediction(leadLife, angle);
    drawArc(leadLife, angle, true);

    rafId = requestAnimationFrame(frame);
  }

  function still() {
    ctx.clearRect(0, 0, W, H);
    var angle = -Math.PI / 2 + 0.5;
    for (var i = 0; i < ARCS; i++) drawArc((i + 0.5) / ARCS, angle, false);
    drawArc(0.42, angle, true);
  }

  /* ------------------------------------------------------------------
     Běh
     ------------------------------------------------------------------ */
  var rafId = null;
  var running = false;

  function start() {
    if (running || reduced) return;
    running = true;
    t0 = 0;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  resize();

  var resizeQueued = false;
  window.addEventListener("resize", function () {
    if (resizeQueued) return;
    resizeQueued = true;
    requestAnimationFrame(function () {
      resize();
      if (reduced) still();
      resizeQueued = false;
    });
  });

  if (!coarse && !reduced) {
    window.addEventListener("mousemove", function (e) {
      /* Ohnisko se za myší jen přitahuje, nesedí přesně na ní — jinak by
         scéna poskakovala. */
      target.x = W * -0.05 + (e.clientX - W / 2) * 0.12;
      target.y = H * 1.18 + (e.clientY - H / 2) * 0.05;
    }, { passive: true });
  }

  if (reduced) {
    still();
    return;
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0 }).observe(canvas);
  } else {
    start();
  }

  document.addEventListener("visibilitychange", function () {
    document.hidden ? stop() : start();
  });
})();
