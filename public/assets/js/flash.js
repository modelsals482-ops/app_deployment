/* =====================================================================
   ALSflow — chování vrstvy „flash"

   Doplněk k site-pages.js. Nic z toho není potřeba k tomu, aby se
   stránka dala přečíst nebo proklikat — bez skriptu zůstane černá
   stránka s přechody a funkčním obsahem.

   Obsah:
     1. vrstvy pozadí (koule, zrno, dosvit u kurzoru, ukazatel rolování)
     2. částicová síť v hlavičce — přenesená z původního webu o chatbotech
     3. dosvit u kurzoru
     4. ukazatel odrolování
     5. náklon karet a odlesk podle kurzoru
     6. odpočet čísel
     7. ukázka konverzace se rozjede, až je vidět
     8. paralaxa hlavičky

   Všechno těžké se zastavuje mimo obraz a při „omezit pohyb" vůbec
   nenaskočí.
   ===================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  /* Malá pomůcka — jeden rAF na sérii událostí, ne jeden na každou. */
  function throttled(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fn(); });
    };
  }

  /* ==================================================================
     1. Vrstvy pozadí

     Vkládají se skriptem, ne značkou na každé stránce — je to čistá
     dekorace a osm prázdných divů v každém souboru by byl jen šum.
     ================================================================== */
  (function () {
    function layer(html, cls) {
      var el = document.createElement("div");
      el.className = cls;
      el.setAttribute("aria-hidden", "true");
      el.innerHTML = html;
      document.body.insertBefore(el, document.body.firstChild);
      return el;
    }

    layer("<i class='o1'></i><i class='o2'></i><i class='o3'></i><i class='o4'></i>", "orbs");
    if (!reduced) layer("", "grain");
    if (fine) layer("", "cursor-glow").id = "cursorGlow";
    layer("<i></i>", "progress");
  })();

  /* ==================================================================
     2. Částicová síť v hlavičce

     Přenesené z původního webu (ai-asistenti.html) a upravené: plátno
     se vkládá do scény hlavičky, běží jen když je hlavička v obraze
     a body uhýbají kurzoru.
     ================================================================== */
  (function () {
    if (reduced) return;

    var stage = document.querySelector(".hero .hero-stage");
    if (!stage) return;

    var canvas = document.createElement("canvas");
    canvas.id = "particles";
    canvas.setAttribute("aria-hidden", "true");
    stage.insertBefore(canvas, stage.firstChild);

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    var COUNT = coarse ? 26 : 68;
    var MAX_DIST = 148;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    var w = 0, h = 0;
    var pts = [];

    function size() {
      var box = stage.getBoundingClientRect();
      w = Math.max(1, box.width);
      h = Math.max(1, box.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      pts = [];
      for (var i = 0; i < COUNT; i++) {
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.32,
          vy: (Math.random() - 0.5) * 0.32,
          r: Math.random() * 1.15 + 0.45,
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, w, h);

      var i, j, p;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;


        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(226,236,255,0.7)";
        ctx.fill();
      }

      /* Spojnice se kreslí v modré, ne v bílé jako v předloze — na
         téhle stránce je modrá jediný akcent a bílá síť by soupeřila
         s textem hlavičky. */
      for (i = 0; i < pts.length; i++) {
        for (j = i + 1; j < pts.length; j++) {
          var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d >= MAX_DIST) continue;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = "rgba(120,170,255," + ((1 - d / MAX_DIST) * 0.19).toFixed(3) + ")";
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    var running = false, raf = null;

    function loop() {
      if (!running) return;
      step();
      raf = requestAnimationFrame(loop);
    }

    function start() { if (running) return; running = true; raf = requestAnimationFrame(loop); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

    size();
    seed();

    window.addEventListener("resize", throttled(function () { size(); seed(); }));

    /* Hvězdné pozadí schválně nereaguje na myš. Efekt byl za hlavním obloukem
       stejně sotva vidět a stál dvě věci na horké cestě: čtení rozměrů prvku
       při každém pohybu kurzoru (vynucený přepočet rozvržení) a výpočet
       vzdálenosti pro každý bod v každém snímku. Na kurzor reaguje jenom
       hlavní 3D oblouk v arc3d.js — ten je vidět a stojí to za to. */

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }, { threshold: 0 }).observe(stage);
    } else {
      start();
    }

    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
  })();

  /* ==================================================================
     3. Dosvit u kurzoru
     ================================================================== */
  (function () {
    var glow = document.getElementById("cursorGlow");
    if (!glow) return;

    var gx = window.innerWidth / 2, gy = window.innerHeight / 2;
    var move = throttled(function () {
      glow.style.transform = "translate3d(" + gx + "px," + gy + "px,0) translate(-50%,-50%)";
    });

    document.addEventListener("pointermove", function (e) {
      gx = e.clientX; gy = e.clientY; move();
    }, { passive: true });
  })();

  /* ==================================================================
     4. Ukazatel odrolování

     Šířka jde přes scaleX v CSS, ne přes width — měnit šířku znamená
     přepočítat rozvržení při každém posunu kolečka.
     ================================================================== */
  (function () {
    var bar = document.querySelector(".progress i");
    if (!bar) return;

    var sync = throttled(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? window.scrollY / max : 0;
      bar.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4));
    });

    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  })();

  /* ==================================================================
     5. Náklon karty a odlesk

     Náklon se předává do --rx / --ry, úhel odlesku do --sa. Pohyb
     kreslí CSS, tady se jen počítá.
     ================================================================== */
  (function () {
    if (reduced || !fine) return;

    var cards = document.querySelectorAll(".tilt, .panel-sheen");
    if (!cards.length) return;

    cards.forEach(function (card) {
      /* Odlesk potřebuje vlastní prvek — ::before i ::after už jsou
         na kartě zabrané dosvitem a barevným obrysem. */
      if (card.classList.contains("panel-sheen") && !card.querySelector(":scope > .sheen")) {
        var sheen = document.createElement("span");
        sheen.className = "sheen";
        sheen.setAttribute("aria-hidden", "true");
        card.appendChild(sheen);
      }

      var tilt = card.classList.contains("tilt");
      var rx = 0, ry = 0, sa = 120;

      var apply = throttled(function () {
        if (tilt) {
          card.style.setProperty("--rx", rx.toFixed(2) + "deg");
          card.style.setProperty("--ry", ry.toFixed(2) + "deg");
        }
        card.style.setProperty("--sa", sa.toFixed(0) + "deg");
      });

      card.addEventListener("pointerenter", function () {
        if (tilt) { card.classList.add("is-live"); card.style.setProperty("--ly", "-5px"); }
      });

      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        rx = -y * 7;
        ry = x * 9;
        sa = 90 + x * 90;
        apply();
      }, { passive: true });

      card.addEventListener("pointerleave", function () {
        rx = ry = 0;
        if (tilt) {
          card.classList.remove("is-live");
          card.style.setProperty("--rx", "0deg");
          card.style.setProperty("--ry", "0deg");
          card.style.setProperty("--ly", "0px");
        }
      });
    });
  })();

  /* ==================================================================
     6. Odpočet čísel

     Odpočet běží přes rAF, ne přes setInterval — jinak se na pomalém
     zařízení rozchází s obrazem. Číslo se formátuje česky (mezera
     mezi tisíci) a text se nastaví i na konci, aby vždycky seděl.
     ================================================================== */
  (function () {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;

    function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

    if (reduced || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.textContent = fmt(Number(el.dataset.count) || 0); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        io.unobserve(el);

        var target = Number(el.dataset.count) || 0;
        var dur = 1100;
        var t0 = null;

        function frame(t) {
          if (t0 === null) t0 = t;
          var k = Math.min(1, (t - t0) / dur);
          /* zpomalení na konci — číslo dojede, ne dosekne */
          var e2 = 1 - Math.pow(1 - k, 3);
          el.textContent = fmt(Math.round(target * e2));
          if (k < 1) requestAnimationFrame(frame);
          else el.textContent = fmt(target);
        }

        requestAnimationFrame(frame);
      });
    }, { threshold: 0.45 });

    els.forEach(function (el) { el.textContent = "0"; io.observe(el); });
  })();

  /* ==================================================================
     7. Ukázka konverzace

     Bubliny naskakují po sobě, ale až když se na ně někdo dívá.
     Bez skriptu i při „omezit pohyb" je vidět celá konverzace.
     ================================================================== */
  (function () {
    var demos = document.querySelectorAll(".chat-demo");
    if (!demos.length) return;

    if (reduced || !("IntersectionObserver" in window)) {
      demos.forEach(function (d) { d.classList.add("on"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("on");
        io.unobserve(e.target);
      });
    }, { threshold: 0.35 });

    demos.forEach(function (d) { io.observe(d); });
  })();

  /* ==================================================================
     7b. Odhalování velkých bloků

     site-pages.js sleduje .rev; .rev-pop je jeho silnější varianta
     a potřebuje vlastní pozorovatele, jinak by zůstala schovaná.
     ================================================================== */
  (function () {
    var items = document.querySelectorAll(".rev-pop");
    if (!items.length) return;

    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ==================================================================
     8. Paralaxa hlavičky

     Text hlavičky se při rolování posune o kus pomaleji než stránka
     a slábne. Scéna za ním zůstává — jinak by se hlavička rozpadla
     na dvě rychlosti a bylo by to znát.
     ================================================================== */
  (function () {
    if (reduced) return;

    var copy = document.querySelector(".hero .hero-copy");
    if (!copy) return;

    var sync = throttled(function () {
      var y = window.scrollY;
      if (y > window.innerHeight) return;
      var k = Math.min(1, y / (window.innerHeight * 0.9));
      copy.style.transform = "translate3d(0," + (y * 0.16).toFixed(1) + "px,0)";
      copy.style.opacity = String(1 - k * 0.85);
    });

    window.addEventListener("scroll", sync, { passive: true });
  })();

  /* ==================================================================
     9. Podtržení pod barevným slovem

     Rozjede se, až je nadpis v obraze — jinak by doběhlo dřív, než na
     něj někdo dojede.
     ================================================================== */
  (function () {
    var marks = document.querySelectorAll(".grad-underline");
    if (!marks.length) return;

    if (!("IntersectionObserver" in window)) {
      marks.forEach(function (m) { m.classList.add("in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });

    marks.forEach(function (m) { io.observe(m); });
  })();
})();
