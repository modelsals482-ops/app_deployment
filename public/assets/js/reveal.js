/* =====================================================================
   Odhalování textu po slovech - GSAP + ScrollTrigger

   Převzato z dodané předlohy: každé slovo se zabalí do obálky s
   overflow:hidden a vyjede zespodu. Doplněno oproti předloze:

   - text se čte z textContent, ne z innerHTML, takže se do stránky
     nedá přes obsah propašovat značka
   - když GSAP chybí nebo má návštěvník zapnuté „omezit pohyb",
     nadpis se prostě ukáže; bez toho by zůstal navždy schovaný
   - obálky dostanou aria-hidden a vedle nich zůstane celý text pro
     čtečky, jinak by čtečka četla po slovech s pauzami

   Ostatní prvky (.rev) si dál odhaluje CSS, tohle je jen pro nadpisy.
   ===================================================================== */
(function () {
  "use strict";

  var targets = document.querySelectorAll(".reveal-words");
  if (!targets.length) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ok = window.gsap && window.ScrollTrigger && !reduced;

  if (!ok) {
    targets.forEach(function (el) { el.style.visibility = "visible"; });
    return;
  }

  window.gsap.registerPlugin(window.ScrollTrigger);

  /* Rozseká obsah na slova. Zlomy řádků zůstanou zlomy. */
  function split(el) {
    var parts = [];
    el.childNodes.forEach(function (node) {
      if (node.nodeType === 1 && node.tagName === "BR") { parts.push({ br: true }); return; }
      if (node.nodeType === 1) {
        /* Vnořený prvek (typicky <span class="grad">) se musí rozsekat na
           slova stejně jako obyčejný text. Kdyby se vzal vcelku, byl by to
           jeden inline-block, který se nemůže zalomit - celá barevná fráze
           by spadla na další řádek, a po doběhnutí animace, kdy se nadpis
           vrátí do původní podoby, by se text přeskládal a slova by viditelně
           poskočila. Přesně to Jakub hlásil na „Kdo odpoví první, ten...".

           Přechod tím netrpí: je svislý a slova stojí na společné účaří,
           takže po slovech vypadá stejně jako přes celou frázi (viz
           poznámka u .word-in v site-pages.css). */
        var slova = String(node.textContent).split(/\s+/).filter(Boolean);
        slova.forEach(function (w) {
          var klon = node.cloneNode(false);   /* jen obal, bez obsahu */
          klon.textContent = w;
          parts.push({ html: klon.outerHTML, text: w });
        });
        return;
      }
      String(node.textContent).split(/\s+/).forEach(function (w) {
        if (w) parts.push({ text: w });
      });
    });
    return parts;
  }

  targets.forEach(function (el) {
    /* Původní podoba nadpisu. Po doběhnutí ji vrátíme zpátky - viz onComplete. */
    var original = el.innerHTML;

    var parts = split(el);
    if (!parts.length) { el.style.visibility = "visible"; return; }

    var full = el.textContent.replace(/\s+/g, " ").trim();
    el.textContent = "";

    var holder = document.createElement("span");
    holder.setAttribute("aria-hidden", "true");

    parts.forEach(function (p, i) {
      if (p.br) { holder.appendChild(document.createElement("br")); return; }

      var mask = document.createElement("span");
      mask.className = "word-mask";

      var inner = document.createElement("span");
      inner.className = "word-in";
      if (p.html) inner.innerHTML = p.html;   /* jen vlastní značka ze stránky */
      else inner.textContent = p.text;

      mask.appendChild(inner);
      holder.appendChild(mask);

      /* Mezera se nevkládá před interpunkci - jinak by se tečka za
         barevným slovem odsunula na vlastní pozici. */
      var next = parts[i + 1];
      var punct = next && !next.br && /^[.,!?:;)\u2026]/.test(next.text || "");
      if (i < parts.length - 1 && !punct) holder.appendChild(document.createTextNode(" "));
    });

    el.appendChild(holder);

    /* Celý text vedle, jen pro čtečky. */
    var sr = document.createElement("span");
    sr.className = "vh";
    sr.textContent = full;
    el.appendChild(sr);

    el.style.visibility = "visible";

    window.gsap.to(el.querySelectorAll(".word-in"), {
      scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
      y: "0%",
      duration: 0.85,
      ease: "power4.out",
      stagger: 0.045,

      /* Jakmile animace doběhne, vrátíme nadpis do původní podoby.

         Rozsekaný nadpis je pro prohlížeč nesrovnatelně dražší než obyčejný
         text: každé slovo je vlastní inline-block s maskou přes overflow,
         s transformem a s vlastním přechodem ořezaným na text
         (background-clip). Na jedné stránce jich takhle zůstávaly desítky -
         a přesně na téhle kombinaci vznikají při rolování otisky
         předchozího vykreslení, které Jakub hlásil jako dvakrát vytištěný
         nadpis.

         Po doběhnutí už k ničemu nejsou. Nadpis je zpátky jeden prvek
         s jedním přechodem, tedy přesně to, co by tam bylo bez skriptu.
         Zmizí tím i pomocná kopie pro čtečky - původní text je zpět. */
      onComplete: function () { el.innerHTML = original; },
    });
  });
})();
