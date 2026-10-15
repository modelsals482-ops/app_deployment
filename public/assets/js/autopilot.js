/* =====================================================================
   "Co software udělá za vás": přepínání záložek a scén.

   Bez skriptu zůstane vidět první scéna v konečném stavu (ostatní mají
   hidden). Skript přidá .anim jen tam, kde se smí hýbat, sám přepíná
   scény co ~7 s, dokud je blok v obraze a dokud uživatel nesáhne na
   záložku sám. Pak už řídí on.
   ===================================================================== */
(function () {
  "use strict";
  var root = document.querySelector("[data-ap]");
  if (!root) return;

  var tabs = Array.prototype.slice.call(root.querySelectorAll(".ap-tab"));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.getAttribute("data-vykon") === "minimalni";
  var DUR = 7000, cur = 0, timer = 0, visible = false, userTook = false, hover = false;

  if (!still) root.classList.add("anim", "auto");

  function countUp(panel) {
    panel.querySelectorAll("[data-to]").forEach(function (el) {
      var to = +el.getAttribute("data-to"), suf = el.getAttribute("data-suf") || "", t0 = 0;
      if (still) { el.textContent = to + suf; return; }
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / 1100);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  function show(i, focus) {
    cur = (i + tabs.length) % tabs.length;
    tabs.forEach(function (t, k) {
      var on = k === cur;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      panels[k].hidden = !on;
      panels[k].classList.remove("is-on");
    });
    /* Vynucené přepočítání, aby se animace scény pustila znovu od začátku. */
    void panels[cur].offsetWidth;
    panels[cur].classList.add("is-on");
    var bar = tabs[cur].querySelector(".ap-prog");
    if (bar) { bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; }
    countUp(panels[cur]);
    if (focus) tabs[cur].focus();
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    if (still || userTook || !visible || hover) return;
    timer = setTimeout(function () { show(cur + 1); }, DUR);
  }

  tabs.forEach(function (t, k) {
    t.addEventListener("click", function () {
      userTook = true;
      root.classList.remove("auto");
      show(k);
    });
    t.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      userTook = true;
      root.classList.remove("auto");
      show(cur + d, true);
    });
  });

  root.addEventListener("pointerenter", function () { hover = true; root.classList.add("paused"); clearTimeout(timer); });
  root.addEventListener("pointerleave", function () { hover = false; root.classList.remove("paused"); schedule(); });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      var was = visible;
      visible = es[0].isIntersecting;
      if (visible && !was) show(cur); else if (!visible) clearTimeout(timer);
    }, { threshold: 0.35 }).observe(root);
  } else {
    visible = true;
    show(0);
  }
})();
