/* =====================================================================
   ALSflow — chování poptávkového formuláře

   Formulář funguje i bez tohohle souboru: je to obyčejný <form>
   s required atributy, který prohlížeč zkontroluje sám a odešle na
   /api/contact. Skript přidává jen to, co dělá vyplňování snesitelným —
   fajfky, ukazatel postupu, hlášky u konkrétního pole a odeslání bez
   překreslení stránky.

   Co skript nedělá: nekontroluje nic, na čem by závisela bezpečnost.
   Honeypot, Turnstile i kontrola povinných údajů běží znovu na serveru
   (api/contact.js) — tady jde čistě o to, co vidí člověk.
   ===================================================================== */
(function () {
  "use strict";

  var form = document.getElementById("poptavka");
  if (!form) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fields = Array.prototype.slice.call(form.querySelectorAll(".field"));
  var consent = form.querySelector('input[name="gdpr"]');
  var btn = document.getElementById("send");
  var meter = document.querySelector(".form-meter");

  /* ==================================================================
     Co je vyplněné

     „Hotové" pole je takové, které něco obsahuje a prohlížeč ho bere.
     U nepovinných polí se fajfka ukazuje taky — je to zpětná vazba,
     ne známkování.
     ================================================================== */
  function control(f) { return f.querySelector("input, select, textarea"); }

  function filled(el) {
    if (!el) return false;
    if (!el.value) return false;
    return typeof el.checkValidity !== "function" || el.checkValidity();
  }

  function mark(f) {
    var el = control(f);
    f.classList.toggle("ok", filled(el));
    if (filled(el)) f.classList.remove("bad");
  }

  /* ==================================================================
     Ukazatel postupu

     Počítá jen povinná pole plus souhlas — jinak by lišta nikdy
     nedojela na konec a slibovala by víc práce, než je potřeba.
     ================================================================== */
  function required() {
    return fields.filter(function (f) {
      var el = control(f);
      return el && el.hasAttribute("required");
    });
  }

  var req = required();

  function sync() {
    if (!meter) return;
    var total = req.length + (consent ? 1 : 0);
    var done = req.filter(function (f) { return filled(control(f)); }).length
             + (consent && consent.checked ? 1 : 0);

    var bar = meter.querySelector(".bar i");
    var num = meter.querySelector(".num");
    if (bar) bar.style.setProperty("--p", total ? (done / total).toFixed(3) : 0);
    if (num) num.textContent = done + " / " + total;
    meter.classList.toggle("done", done === total);
  }

  fields.forEach(function (f) {
    var el = control(f);
    if (!el) return;

    if (el.tagName === "SELECT") f.classList.add("is-select");

    el.addEventListener("input", function () { mark(f); sync(); });
    el.addEventListener("change", function () { mark(f); sync(); });
    el.addEventListener("blur", function () {
      mark(f);
      /* Vytknout se smí až potom, co člověk pole opustil, a jen když
         do něj něco psal. Červený rámeček na poli, kterého se nikdo
         nedotkl, je jenom otravný. */
      if (el.value && !filled(el)) f.classList.add("bad");
    });

    /* stav po obnovení stránky, kdy prohlížeč pole předvyplní */
    mark(f);
  });

  if (consent) consent.addEventListener("change", sync);
  sync();

  /* ==================================================================
     Pole nabíhají po sobě

     Třída se přidává odsud, ne ve značce: kdyby se tenhle soubor
     nenačetl, formulář musí být vidět celý. Proto je výchozí stav
     „viditelné" a schovává se až tady, o snímek před rozjezdem.
     ================================================================== */
  (function () {
    var grid = form.querySelector(".form-grid");
    if (!grid || reduced || !("IntersectionObserver" in window)) return;

    fields.forEach(function (f, i) { f.style.setProperty("--i", i); });
    grid.classList.add("stagger");

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.05 });

    io.observe(grid);

    /* Pojistka: kdyby pozorovatel z jakéhokoli důvodu nespustil,
       po dvou sekundách se pole ukážou tak jako tak. */
    setTimeout(function () { grid.classList.add("in"); }, 2000);
  })();

  /* ==================================================================
     Odeslání
     ================================================================== */
  var LABEL = btn ? btn.innerHTML : "";
  var errBox = document.getElementById("formErr");

  function fail(msg) {
    if (!errBox) return;
    errBox.textContent = msg;
    errBox.hidden = false;
  }

  function busy(on) {
    if (!btn) return;
    btn.disabled = on;
    btn.innerHTML = on
      ? '<span class="spin" aria-hidden="true"></span>Odes&iacute;l&aacute;m&hellip;'
      : LABEL;
  }

  function shake(el) {
    if (reduced || !el) return;
    el.classList.remove("shake");
    void el.offsetWidth;             /* vynutí restart animace */
    el.classList.add("shake");
  }

  function val(name) {
    var el = form.elements[name];
    return el && el.value ? el.value : "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (errBox) errBox.hidden = true;

    /* Nejdřív ať se vyjádří prohlížeč — zná typy polí líp než my. */
    if (!form.checkValidity()) {
      fields.forEach(function (f) {
        var el = control(f);
        if (el && el.hasAttribute("required") && !filled(el)) f.classList.add("bad");
      });
      sync();

      var first = form.querySelector(".field.bad, :invalid");
      if (first) {
        shake(first.closest(".field") || first);
        var focusable = first.matches("input, select, textarea") ? first : control(first);
        if (focusable) focusable.focus();
      }
      fail("Zkontrolujte prosím označená pole.");
      return;
    }

    busy(true);

    /* Klíče musí sedět na to, co čte api/contact.js. */
    var payload = {
      name: val("name"),
      email: val("email"),
      phone: val("phone"),
      city: val("city"),
      urgency: val("urgency"),
      biz: val("biz"),
      size: val("size"),
      service: val("service"),
      pain: val("pain"),
      pref_time: val("pref_time") || "kdykoliv",
      msg: val("msg"),
      website: val("website"),
      turnstileToken: val("cf-turnstile-response"),
    };

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) throw new Error("http " + res.status);
        var card = document.getElementById("formCard");
        var done = document.getElementById("formDone");
        if (card) card.hidden = true;
        if (done) {
          done.classList.add("on");
          done.setAttribute("tabindex", "-1");
          done.focus({ preventScroll: true });
          /* Potvrzení musí být vidět celé — po odeslání je člověk
             většinou dole u tlačítka. */
          if (window.__lenis) window.__lenis.scrollTo(done, { offset: -110 });
          else done.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
        }
      })
      .catch(function () {
        busy(false);
        shake(btn);
        fail("Odeslání se nepovedlo. Zkuste to prosím znovu, nebo napište přímo na info@alsflow.cz.");
        /* Turnstile token je jednorázový — bez obnovení by druhý pokus
           spadl na serveru, i kdyby už bylo všechno v pořádku. */
        if (window.turnstile) window.turnstile.reset();
      });
  });
})();
