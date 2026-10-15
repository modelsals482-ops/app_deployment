/* =====================================================================
   Cik-cak postup (Zigzag.astro), 16. 10.

   Křivka vede od kroku ke kroku (z vnitřní hrany jedné karty na vnitřní
   hranu další) a při rolování se dokresluje, na jejím konci svítí
   tečka. Body se spočítají z poloh karet, takže sedí na každé šířce;
   přepočítají se jen při změně velikosti. Při rolování se mění jen
   stroke-dashoffset a poloha tečky.

   Na úzké obrazovce (karty pod sebou) je křivka skrytá a čáru kreslí
   CSS. Bez skriptu jsou karty prostě pod sebou/vedle sebe bez křivky.
   ===================================================================== */
(function () {
  "use strict";
  var lists = document.querySelectorAll("[data-zz]");
  if (!lists.length) return;
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.getAttribute("data-vykon") === "minimalni";

  lists.forEach(function (zz) {
    var svg = zz.querySelector(".zz-svg");
    var track = zz.querySelector(".zz-track"), line = zz.querySelector(".zz-line"), tip = zz.querySelector(".zz-tip");
    var steps = zz.querySelectorAll(".zz-step");
    var len = 0, top = 0, h = 1, queued = false;

    function build() {
      if (getComputedStyle(svg).display === "none") { len = 0; return; }
      var W = zz.offsetWidth, H = zz.offsetHeight;
      svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      /* offset*, ne getBoundingClientRect: karty v tu chvíli ještě můžou
         přijíždět ze strany a transform by body posunul. */
      var pts = [];
      steps.forEach(function (s, i) {
        var right = i % 2 === 0;   /* levá karta: bod na pravé hraně */
        pts.push([right ? s.offsetLeft + s.offsetWidth + 14 : s.offsetLeft - 14, s.offsetTop + s.offsetHeight / 2]);
      });
      var d = "M" + pts[0][0] + " " + pts[0][1];
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], mx = (a[0] + b[0]) / 2;
        d += " C" + mx + " " + a[1] + " " + mx + " " + b[1] + " " + b[0] + " " + b[1];
      }
      track.setAttribute("d", d);
      line.setAttribute("d", d);
      len = line.getTotalLength();
      line.style.strokeDasharray = len + " " + len;
      top = zz.getBoundingClientRect().top + window.scrollY;
      h = H;
      sync();
    }

    function sync() {
      queued = false;
      if (!len) return;
      var p = still ? 1 : Math.min(1, Math.max(0, (window.scrollY + window.innerHeight * 0.62 - top) / h));
      line.style.strokeDashoffset = String(len * (1 - p));
      var pt = line.getPointAtLength(len * p);
      tip.setAttribute("cx", pt.x);
      tip.setAttribute("cy", pt.y);
      tip.style.opacity = p > 0.01 && p < 0.995 ? "1" : "0";
    }

    build();
    if ("ResizeObserver" in window) new ResizeObserver(build).observe(zz);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    if (!still) window.addEventListener("scroll", function () { if (!queued) { queued = true; requestAnimationFrame(sync); } }, { passive: true });
  });
})();
