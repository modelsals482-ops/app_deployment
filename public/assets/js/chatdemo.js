/* =====================================================================
   Ukázka asistenta (16. 10.) - jedna pro úvodní stránku i AI asistenty

   Návštěvník klikne na zprávu zákazníka a vidí, co asistent udělá:
   zpráva přijde, asistent ji "promyslí" (kroky se odškrtávají), napíše
   odpověď a ukazatel nahoře dojede na 100 %. Když jde o věc, kterou
   asistent sám neřeší, ukazatel se zastaví a čeká na "Schválit".

   Nic se neodesílá, všechno je připravené dopředu v JSON uvnitř
   ukázky (<script type="application/json">). Odpověď se nepíše po
   písmenech do prázdného boxu (dřív to skákalo, jak text přibýval):
   celá věta se vysází hned, jen neviditelná, a slova se postupně
   rozsvěcují. Výška se tak nemění.

   Bez skriptu zůstane vidět úvodní text a seznam zpráv.
   ===================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.documentElement.getAttribute("data-vykon") === "minimalni";

  document.querySelectorAll("[data-chatdemo]").forEach(init);

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function init(root) {
    var cfgEl = root.querySelector("script[type='application/json']");
    if (!cfgEl) return;
    var cfg = JSON.parse(cfgEl.textContent);
    var fns = cfg.functions;
    var cur = fns[0], run = 0, timers = [];

    var picker = root.querySelector(".cd-pick");
    var inbox = root.querySelector(".cd-inbox");
    var thread = root.querySelector(".cd-thread");
    var bar = root.querySelector(".cd-bar i");
    var pct = root.querySelector(".cd-pct");
    var state = root.querySelector(".cd-state");
    var title = root.querySelector(".cd-name");

    function later(fn, ms) { timers.push(setTimeout(fn, reduced ? 0 : ms)); }
    function stopAll() { timers.forEach(clearTimeout); timers = []; run++; }
    function progress(p, text, cls) {
      bar.style.transform = "scaleX(" + (p / 100) + ")";
      pct.textContent = Math.round(p) + " %";
      state.textContent = text;
      root.setAttribute("data-state", cls || "busy");
    }

    function idle() {
      stopAll();
      thread.textContent = "";
      var w = el("div", "cd-msg cd-bot cd-wait");
      w.append(el("span", "cd-dots"));
      w.append(el("span", null, cfg.idle || "Čekám na zprávu…"));
      thread.append(w);
      progress(0, "Čeká na zprávu", "idle");
      root.classList.remove("cd-used");
    }

    function renderInbox() {
      inbox.textContent = "";
      cur.messages.forEach(function (m, i) {
        var b = el("button", "cd-mail");
        b.type = "button";
        b.style.setProperty("--c", cur.color || "var(--blue)");
        var top = el("small");
        top.append(el("span", null, m.from), el("span", null, m.time));
        b.append(top, el("span", "cd-mail-t", m.text));
        b.addEventListener("click", function () { play(i, b); });
        inbox.append(b);
      });
      if (title) title.textContent = cur.name;
    }

    function play(i, btn) {
      stopAll();
      var me = run, m = cur.messages[i];
      root.classList.add("cd-used");
      inbox.querySelectorAll(".cd-mail").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      thread.textContent = "";

      var q = el("div", "cd-msg cd-them", m.text);
      thread.append(q);
      progress(8, "Přišla zpráva");

      var steps = el("ul", "cd-steps");
      thread.append(steps);
      var n = m.steps.length, t = 500;
      m.steps.forEach(function (s, k) {
        later(function () {
          if (me !== run) return;
          var li = el("li", null, s);
          steps.append(li);
          later(function () { if (me === run) li.classList.add("ok"); }, 450);
          progress(10 + (k + 1) * (55 / n), s);
        }, t);
        t += 700;
      });

      later(function () {
        if (me !== run) return;
        var typing = el("div", "cd-msg cd-bot cd-typing");
        typing.append(el("span", "cd-dots"));
        thread.append(typing);
        progress(72, "Píše odpověď");

        later(function () {
          if (me !== run) return;
          typing.remove();
          var a = el("div", "cd-msg cd-bot");
          a.append(el("b", null, cfg.botLabel || "AI asistent"));
          var words = m.reply.split(" ");
          var spans = words.map(function (w) { var s = el("span", "cd-w", w + " "); a.append(s); return s; });
          thread.append(a);
          spans.forEach(function (s, k) { later(function () { if (me === run) s.classList.add("on"); }, k * 45); });

          later(function () {
            if (me !== run) return;
            if (m.end === "approve") {
              progress(90, m.endText || "Čeká na vaše schválení", "wait");
              var ok = el("button", "cd-approve", "Schválit");
              ok.type = "button";
              ok.addEventListener("click", function () {
                ok.remove();
                progress(100, m.doneText || "Hotovo, odesláno", "done");
              });
              thread.append(ok);
            } else {
              progress(100, m.endText || "Hotovo, odpovězeno", "done");
            }
          }, words.length * 45 + 250);
        }, 900);
      }, t);
    }

    if (picker && fns.length > 1) {
      fns.forEach(function (f, k) {
        var b = el("button", "cd-fn");
        b.type = "button";
        b.style.setProperty("--c", f.color);
        b.setAttribute("aria-pressed", String(k === 0));
        b.append(el("b", null, f.label));
        b.append(el("span", null, f.desc));
        if (f.soon) b.append(el("em", null, "Připravuji"));
        b.addEventListener("click", function () {
          cur = f;
          picker.querySelectorAll(".cd-fn").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          root.style.setProperty("--fc", f.color);
          renderInbox();
          idle();
        });
        picker.append(b);
      });
    }

    root.style.setProperty("--fc", cur.color || "var(--blue)");
    renderInbox();
    idle();
    root.querySelector(".cd-reset") && root.querySelector(".cd-reset").addEventListener("click", function () {
      inbox.querySelectorAll(".cd-mail").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      idle();
    });
    root.classList.add("cd-ready");
  }
})();
