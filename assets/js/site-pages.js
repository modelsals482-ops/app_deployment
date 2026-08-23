/* =====================================================================
   ALSflow — chování samostatných podstránek

   Obsahuje totéž, co dělá úvodní stránka, jen bez věcí, které tu nejsou
   (formulářové okno, ukázka chatu, přepínání ceníku):
     1. síť částic v hlavičce,
     2. záře za kurzorem,
     3. odhalování sekcí při rolování,
     4. zmenšení navigace po odrolování,
     5. mobilní menu,
     6. rok v patičce.

   Bez cookies a bez sledování. Načítá se s atributem defer, takže
   nic neblokuje vykreslení.
   ===================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==================================================================
     1. Síť částic
     ================================================================== */
  (function () {
    if (reduced) return;

    var canvas = document.getElementById("particleCanvas");
    if (!canvas) return;

    var hero = canvas.closest(".hero");
    if (!hero) return;

    var ctx = canvas.getContext("2d");
    var COUNT = window.innerWidth < 768 || window.matchMedia("(pointer: coarse)").matches ? 26 : 64;
    var MAX_DIST = 150;
    var MOUSE_RADIUS = 130;
    var mouse = { x: null, y: null };
    var W = 0;
    var H = 0;
    var dots = [];

    function resize() {
      W = canvas.width = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    }

    function spawn() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.2 + 0.5,
      };
    }

    function init() {
      resize();
      dots = [];
      for (var i = 0; i < COUNT; i++) dots.push(spawn());
    }

    function step(p) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;

      if (mouse.x === null) return;

      var dx = p.x - mouse.x;
      var dy = p.y - mouse.y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < MOUSE_RADIUS && d > 0) {
        var force = (MOUSE_RADIUS - d) / MOUSE_RADIUS;
        p.x += (dx / d) * force * 1.8;
        p.y += (dy / d) * force * 1.8;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      for (var i = 0; i < dots.length; i++) {
        step(dots[i]);
        ctx.beginPath();
        ctx.arc(dots[i].x, dots[i].y, dots[i].r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fill();
      }

      for (var a = 0; a < dots.length; a++) {
        for (var b = a + 1; b < dots.length; b++) {
          var dx = dots[a].x - dots[b].x;
          var dy = dots[a].y - dots[b].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d >= MAX_DIST) continue;
          ctx.beginPath();
          ctx.moveTo(dots[a].x, dots[a].y);
          ctx.lineTo(dots[b].x, dots[b].y);
          ctx.strokeStyle = "rgba(255,255,255," + (1 - d / MAX_DIST) * 0.18 + ")";
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    var running = true;
    var rafId = null;

    function loop() {
      if (!running) return;
      draw();
      rafId = requestAnimationFrame(loop);
    }

    window.addEventListener("resize", function () { init(); });
    document.addEventListener("mousemove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    document.addEventListener("mouseleave", function () { mouse.x = null; mouse.y = null; });

    init();
    loop();

    /* Mimo obraz se kreslení zastaví, ať zbytečně nežere baterii. */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            if (!running) { running = true; loop(); }
          } else {
            running = false;
            if (rafId) cancelAnimationFrame(rafId);
          }
        });
      }, { threshold: 0 }).observe(hero);
    }
  })();

  /* ==================================================================
     2. Záře za kurzorem — jen myš, na dotyku nedává smysl
     ================================================================== */
  (function () {
    var glow = document.getElementById("cursorGlow");
    if (!glow || reduced || window.matchMedia("(hover: none), (pointer: coarse)").matches) return;

    var gx = window.innerWidth / 2;
    var gy = window.innerHeight / 2;
    var queued = false;

    document.addEventListener("mousemove", function (e) {
      gx = e.clientX;
      gy = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        glow.style.transform = "translate3d(" + gx + "px," + gy + "px,0) translate(-50%,-50%)";
        queued = false;
      });
    }, { passive: true });
  })();

  /* ==================================================================
     3. Odhalování při rolování
     ================================================================== */
  (function () {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || reduced) {
      items.forEach(function (el) { el.classList.add("visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("visible");
        io.unobserve(e.target);
      });
    }, { threshold: 0.01 });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ==================================================================
     4. Navigace po odrolování
     ================================================================== */
  (function () {
    var bar = document.getElementById("navbar");
    if (!bar) return;

    var queued = false;
    window.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        bar.classList.toggle("scrolled", window.scrollY > 40);
        queued = false;
      });
    }, { passive: true });
  })();

  /* ==================================================================
     5. Mobilní menu
     ================================================================== */
  (function () {
    var burger = document.getElementById("hamburger");
    var menu = document.getElementById("mobileMenu");
    if (!burger || !menu) return;

    function setOpen(open) {
      menu.classList.toggle("open", open);
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    }

    burger.addEventListener("click", function () { setOpen(!menu.classList.contains("open")); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) { setOpen(false); burger.focus(); }
    });
  })();

  /* ==================================================================
     6. Rok v patičce
     ================================================================== */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
