/* =====================================================================
   ALSflow — chování samostatných stránek

   1. navigace: stín po odrolování, rozbalovací panel, mobilní menu
   2. odhalování sekcí při rolování
   4. plynulé rolování přes Lenis a kotvy skrz něj
   5. vlna po kliknutí na tlačítko
   6. dosvit uvnitř karty za kurzorem
   8. magnetické tlačítko
   9. obtažení obvodu tlačítka
  10. rok v patičce

   Prostorová scéna v hlavičce má vlastní soubor (arc3d.js), plošná
   záloha taky (predictive-arc.js). Bez cookies, bez sledování.
   ===================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==================================================================
     1a. Navigace — pozadí ztmavne, jakmile se odroluje
     ================================================================== */
  (function () {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var queued = false;
    function sync() { nav.classList.toggle("scrolled", window.scrollY > 8); }
    window.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { sync(); queued = false; });
    }, { passive: true });
    sync();
  })();

  /* ==================================================================
     1b. Rozbalovací panel

     Myš ho otevře najetím, jako v předloze. Klávesnice a dotyk kliknutím
     — samotné :hover by položku na dotykovém displeji nešlo otevřít
     a z klávesnice by byla nedosažitelná úplně.
     ================================================================== */
  (function () {
    var items = document.querySelectorAll(".menu li.has-drop");
    if (!items.length) return;

    var fine = window.matchMedia("(hover: hover) and (pointer: fine)");

    items.forEach(function (li) {
      var btn = li.querySelector("button");
      var timer = null;

      function open(state) {
        li.classList.toggle("open", state);
        if (btn) btn.setAttribute("aria-expanded", String(state));
      }

      if (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          open(!li.classList.contains("open"));
        });
      }

      li.addEventListener("mouseenter", function () {
        if (!fine.matches) return;
        clearTimeout(timer);
        open(true);
      });

      /* Krátká prodleva, ať panel nezmizí při přejezdu mezi tlačítkem
         a panelem — mezi nimi je mezera. */
      li.addEventListener("mouseleave", function () {
        if (!fine.matches) return;
        timer = setTimeout(function () { open(false); }, 140);
      });

      li.addEventListener("focusout", function (e) {
        if (!li.contains(e.relatedTarget)) open(false);
      });
    });

    document.addEventListener("click", function (e) {
      items.forEach(function (li) { if (!li.contains(e.target)) li.classList.remove("open"); });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      items.forEach(function (li) {
        if (!li.classList.contains("open")) return;
        li.classList.remove("open");
        var b = li.querySelector("button");
        if (b) { b.setAttribute("aria-expanded", "false"); b.focus(); }
      });
    });
  })();

  /* ==================================================================
     1c. Mobilní menu
     ================================================================== */
  (function () {
    var burger = document.getElementById("burger");
    var sheet = document.getElementById("sheet");
    if (!burger || !sheet) return;

    var restoreY = 0;

    /* Zamek patri na <html>, ne na <body>. `body { overflow: hidden }` na iOS
       pozici nezamkne — jen z body udela vlastni rolovaci kontejner a stranka
       vyskoci na zacatek. Presne to se delo: menu se otevrelo, ale obrazovka
       skocila nahoru a vypadalo to, ze se nestalo nic. */
    function set(open) {
      if (open) restoreY = window.scrollY;
      sheet.classList.toggle("open", open);
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      document.documentElement.style.overflow = open ? "hidden" : "";
      if (!open) window.scrollTo(0, restoreY);
    }

    burger.addEventListener("click", function () { set(!sheet.classList.contains("open")); });
    sheet.addEventListener("click", function (e) { if (e.target.closest("a")) set(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && sheet.classList.contains("open")) { set(false); burger.focus(); }
    });
  })();

  /* ==================================================================
     2. Odhalování při rolování
     ================================================================== */
  (function () {
    var items = document.querySelectorAll(".rev");
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
    }, { threshold: 0.06, rootMargin: "0px 0px -6% 0px" });

    items.forEach(function (el) { io.observe(el); });
  })();


  /* ==================================================================
     4. Plynulé rolování (Lenis 1.3.25, uložený v repozitáři)

     Knihovna se načítá jako první, takže když tu není, jen se přeskočí
     a rolování zůstane nativní. Na dotyku se nezapíná — tam je natívní
     rolování plynulé samo a zásah do něj působí lepkavě.
     ================================================================== */
  var lenis = null;
  (function () {
    if (reduced || !window.Lenis) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    lenis = new window.Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      syncTouch: false,
    });

    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.__lenis = lenis;   /* stejná úmluva jako na ostatních webech */
  })();

  /* Kotvy v rámci stránky musí jít přes Lenis, jinak by skočily. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    if (id === "#") return;
    var el = document.querySelector(id);
    if (!el) return;

    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { offset: -78 });
    else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });

    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
  });

  /* ==================================================================
     5. Vlna po kliknutí na tlačítko
     ================================================================== */
  document.addEventListener("pointerdown", function (e) {
    if (reduced) return;
    var btn = e.target.closest(".btn");
    if (!btn) return;

    var r = btn.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 2.2;
    var span = document.createElement("span");
    span.className = "ripple";
    span.style.width = span.style.height = size + "px";
    span.style.left = (e.clientX - r.left - size / 2) + "px";
    span.style.top = (e.clientY - r.top - size / 2) + "px";
    btn.appendChild(span);
    setTimeout(function () { span.remove(); }, 640);
  });

  /* ==================================================================
     6. Dosvit uvnitř karty jede za kurzorem

     Souřadnice se předávají do vlastních vlastností, samotný dosvit
     kreslí CSS — tady se jen počítá pozice.
     ================================================================== */
  (function () {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;

    var cards = document.querySelectorAll(".panel-glow");
    if (!cards.length) return;

    cards.forEach(function (card) {
      var queued = false, mx = 0, my = 0;
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        mx = e.clientX - r.left;
        my = e.clientY - r.top;
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
          card.style.setProperty("--mx", mx + "px");
          card.style.setProperty("--my", my + "px");
          queued = false;
        });
      }, { passive: true });
    });
  })();


  /* ==================================================================
     8. Magnetické tlačítko

     Posun se předává do vlastních vlastností, samotný pohyb dělá CSS.
     Rozsah je schválně malý — větší už působí, že tlačítko utíká.
     ================================================================== */
  (function () {
    if (reduced || !window.matchMedia("(pointer: fine)").matches) return;

    document.querySelectorAll(".btn-magnet").forEach(function (btn) {
      var queued = false, tx = 0, ty = 0;

      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 14;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 9;
        if (queued) return;
        queued = true;
        requestAnimationFrame(function () {
          btn.style.setProperty("--tx", tx.toFixed(2) + "px");
          btn.style.setProperty("--ty", ty.toFixed(2) + "px");
          queued = false;
        });
      }, { passive: true });

      btn.addEventListener("pointerleave", function () {
        btn.style.setProperty("--tx", "0px");
        btn.style.setProperty("--ty", "0px");
      });
    });
  })();

  /* ==================================================================
     9. Obtažení obvodu

     Obdélník se kreslí do SVG, které se musí přeměřit podle skutečné
     velikosti tlačítka — jinak by se linka u širšího nápisu roztáhla.
     ================================================================== */
  (function () {
    var traced = document.querySelectorAll(".btn-trace");
    if (!traced.length) return;

    var NS = "http://www.w3.org/2000/svg";

    traced.forEach(function (btn) {
      var svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "edge");
      svg.setAttribute("aria-hidden", "true");
      var rect = document.createElementNS(NS, "rect");
      svg.appendChild(rect);
      btn.appendChild(svg);

      function measure() {
        var r = btn.getBoundingClientRect();
        if (!r.width) return;
        svg.setAttribute("viewBox", "0 0 " + r.width + " " + r.height);
        rect.setAttribute("x", "1");
        rect.setAttribute("y", "1");
        rect.setAttribute("width", String(r.width - 2));
        rect.setAttribute("height", String(r.height - 2));
        rect.setAttribute("rx", "10");
        var per = 2 * (r.width + r.height);
        rect.style.setProperty("--per", per);
        rect.style.strokeDasharray = "8 " + per;
        btn.style.setProperty("--per", per + "px");
        /* hodnoty pro stav při najetí musí sedět na skutečný obvod */
        rect.dataset.per = String(per);
      }

      measure();
      if ("ResizeObserver" in window) new ResizeObserver(measure).observe(btn);

      btn.addEventListener("pointerenter", function () {
        var per = Number(rect.dataset.per) || 200;
        rect.style.strokeDasharray = per / 2 + " " + per / 2;
        rect.style.strokeDashoffset = String(-per / 2);
      });
      btn.addEventListener("pointerleave", function () {
        var per = Number(rect.dataset.per) || 200;
        rect.style.strokeDasharray = "8 " + per;
        rect.style.strokeDashoffset = "8";
      });
    });

    /* Přechod pro obtažení — jeden na celý dokument. */
    var defs = document.createElementNS(NS, "svg");
    defs.setAttribute("width", "0");
    defs.setAttribute("height", "0");
    defs.setAttribute("aria-hidden", "true");
    defs.style.position = "absolute";
    defs.innerHTML = '<defs><linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#38dbf5"/><stop offset="50%" stop-color="#5b9dff"/>' +
      '<stop offset="100%" stop-color="#a78bfa"/></linearGradient></defs>';
    document.body.appendChild(defs);
  })();

  /* ==================================================================
     10. Rok v patičce
     ================================================================== */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
