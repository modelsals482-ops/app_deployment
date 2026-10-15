/* =====================================================================
   ALSflow - interaktivní ukázky na stránce AI asistentů

   Od 16. 10. tu zůstalo jen střídání oboru v nadřádku. Ukázka "Zkuste
   si to teď" běží na společném chatdemo.js (stejná jako na úvodu).
   ===================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==================================================================
     1. Střídání oboru v nadřádku

     Slovo se prostřídá, ne nadpis - nadpis rozsekává reveal.js na
     slova a měnit mu obsah pod rukama by ho rozbilo.
     ================================================================== */
  (function () {
    var el = document.getElementById("cyclingWord");
    if (!el || reduced) return;

    var words = ["kade&rcaron;nictv&iacute;", "veterin&aacute;&rcaron;e", "fyzioterapeuty",
                 "zubn&iacute; ordinace", "salony kr&aacute;sy", "mal&eacute; firmy"];
    var i = 0;

    setInterval(function () {
      if (document.hidden) return;
      el.style.opacity = "0";
      el.style.transform = "translateY(7px)";
      setTimeout(function () {
        i = (i + 1) % words.length;
        el.innerHTML = words[i];
        el.style.opacity = "1";
        el.style.transform = "none";
      }, 260);
    }, 2400);
  })();

})();
