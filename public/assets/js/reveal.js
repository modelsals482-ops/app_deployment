/* =====================================================================
   Odhalování nadpisů (.reveal-words) - celý nadpis najednou

   Dřív se nadpis rozsekal na slova (GSAP + ScrollTrigger) a každé slovo
   vyjelo z masky. Vypadalo to hezky jen v cíli: v půlce cesty slova stála
   v různé výšce, maska ořezávala spodky písmen, slova přesahovala do
   odstavce pod nadpisem a v Chromu s grafickou kartou zůstávaly na
   obrazovce otisky ("dvakrát vytištěný nadpis"). Jakub to opakovaně
   hlásil jako rozbitý text (15. 10. 2026).

   Teď: nadpis pod přehybem dostane .rw-wait (neviditelný, o kousek níž)
   a když vjede do obrazu, jednou plynule vyjede celý. Žádné rozsekání,
   žádné masky, žádný GSAP (o 114 kB méně skriptu). Nadpisy, které jsou
   vidět hned po načtení, se nehýbou vůbec.

   Bez skriptu, s omezeným pohybem nebo v minimálním stupni je nadpis
   prostě vidět - skript ho nikdy neschová dřív, než ho umí ukázat.
   ===================================================================== */
(function () {
  "use strict";
  var targets = document.querySelectorAll(".reveal-words");
  if (!targets.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window)) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.remove("rw-wait");
      io.unobserve(e.target);
    });
  }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });

  targets.forEach(function (el) {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;   /* už je vidět */
    el.classList.add("rw-wait");
    io.observe(el);
  });
})();
