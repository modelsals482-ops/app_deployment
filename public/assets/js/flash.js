/* =====================================================================
   ALSflow - chování vrstvy „flash"

   Doplněk k site-pages.js. Nic z toho není potřeba k tomu, aby se
   stránka dala přečíst nebo proklikat - bez skriptu zůstane černá
   stránka s přechody a funkčním obsahem.

   Obsah:
     1. vrstvy pozadí (koule, ukazatel rolování)
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

  /* Malá pomůcka - jeden rAF na sérii událostí, ne jeden na každou. */
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

     Vkládají se skriptem, ne značkou na každé stránce - je to čistá
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
    layer("<i></i>", "progress");
  })();

  /* ==================================================================
     4. Ukazatel odrolování

     Šířka jde přes scaleX v CSS, ne přes width - měnit šířku znamená
     přepočítat rozvržení při každém posunu kolečka.
     ================================================================== */
  (function () {
    var bar = document.querySelector(".progress i");
    if (!bar) return;

    /* Délka stránky se čte jen při změně velikosti, ne v každém snímku:
       scrollHeight vynutí přepočet rozvržení a na WLE to stálo 12 ms
       z 16 ms snímku. */
    var max = 0;
    function measure() { max = document.documentElement.scrollHeight - window.innerHeight; }
    measure();
    if ("ResizeObserver" in window) new ResizeObserver(measure).observe(document.body);

    var sync = throttled(function () {
      var p = max > 0 ? window.scrollY / max : 0;
      bar.style.setProperty("--p", Math.min(1, Math.max(0, p)).toFixed(4));
    });

    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", function () { measure(); sync(); });
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
      /* Odlesk potřebuje vlastní prvek - ::before i ::after už jsou
         na kartě zabrané dosvitem a barevným obrysem. */
      /* Odlesk za myší je vypnutý (15. 10.), karta se jen naklání. */
      if (false && card.classList.contains("panel-sheen") && !card.querySelector(":scope > .sheen")) {
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

     Odpočet běží přes rAF, ne přes setInterval - jinak se na pomalém
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
          /* zpomalení na konci - číslo dojede, ne dosekne */
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
     a slábne, aurora za ním ještě pomaleji. Dvě rychlosti dají hloubku
     bez 3D (jako hlavička na WLE). Jen transform a opacity, takže to
     zvládne kompozitor bez přepočtu rozvržení.
     ================================================================== */
  (function () {
    if (reduced) return;

    /* Od 16. 10. i na podstránkách: text hlavičky odjíždí pomaleji a další
       sekce se přes něj přesune (viz .hero-move + section v site-pages.css).
       Ostrovy na O mě mají vlastní pohyb, ty se vynechávají. */
    var copy = document.querySelector(".hero .hero-copy, .hero-plain:not(.islands > *) > .wrap");
    var glow = document.querySelector(".hero .aurora, .hero-plain > .aurora, .hero-plain > canvas");
    if (!copy && !glow) return;

    var sync = throttled(function () {
      var y = window.scrollY;
      if (y > window.innerHeight) return;
      var k = Math.min(1, y / (window.innerHeight * 0.9));
      if (copy) {
        copy.style.transform = "translate3d(0," + (y * 0.16).toFixed(1) + "px,0)";
        copy.style.opacity = String(1 - k * 0.85);
      }
      if (glow) glow.style.transform = "translate3d(0," + (y * 0.32).toFixed(1) + "px,0)";
    });

    window.addEventListener("scroll", sync, { passive: true });
  })();

  /* ==================================================================
     9. Podtržení pod barevným slovem

     Rozjede se, až je nadpis v obraze - jinak by doběhlo dřív, než na
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
