/* =====================================================================
   ALSflow — chování samostatných stránek

   1. navigace: stín po odrolování, rozbalovací panel, mobilní menu
   2. odhalování sekcí při rolování
   3. rok v patičce

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

    function set(open) {
      sheet.classList.toggle("open", open);
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
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
     3. Rok v patičce
     ================================================================== */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
