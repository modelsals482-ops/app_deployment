/* =====================================================================
   ALSflow — interaktivní ukázky na stránce AI asistentů

   Tři ukázky, na kterých si návštěvník může sáhnout na to, co kupuje:
     1. schránka — vybere e-mail, nechá si vygenerovat odpověď
     2. recepce — napíše dotaz, dostane odpověď z připravené sady
     3. zpětná vazba — projde hodnocení a odpovědi na ně

   Odpovědi jsou natvrdo v tomhle souboru. Je to ukázka, ne živý bot:
   živý bot sedí v chatu vpravo dole (chat-widget.js) a ten volá server.

   Obsluha je delegovaná přes data- atributy, ne přes onclick ve
   značce — značka pak zůstane čitelná a přibývání ukázek neznamená
   sahat do HTML i do skriptu zároveň.
   ===================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ==================================================================
     1. Střídání oboru v nadřádku

     Slovo se prostřídá, ne nadpis — nadpis rozsekává reveal.js na
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

  /* ==================================================================
     2. Přepínání ukázek
     ================================================================== */
  var panes = document.getElementById("demo");

  function showPane(name, btn) {
    if (!panes) return;
    panes.querySelectorAll(".demo-tab").forEach(function (b) {
      var on = b === btn;
      b.classList.toggle("on", on);
      b.setAttribute("aria-selected", String(on));
    });
    panes.querySelectorAll(".demo-pane").forEach(function (p) {
      p.classList.toggle("on", p.id === "pane-" + name);
    });
  }

  /* ==================================================================
     3. Schránka — vygenerovaná odpověď
     ================================================================== */
  var REPLIES = [
    "Dobr&yacute; den, Kate&rcaron;ino,<br><br>d&ecaron;kuji za z&aacute;jem. Ve st&rcaron;edu od 10:00 a ve &ccaron;tvrtek od 14:00 m&aacute;m volno &mdash; hod&iacute; se v&aacute;m n&ecaron;kter&yacute; z term&iacute;n&uring;? Potvr&dcaron;te pros&iacute;m a po&scaron;lu v&aacute;m potvrzen&iacute;.<br><br>S pozdravem",
    "Dobr&yacute; den, Marku,<br><br>prvn&iacute; n&aacute;v&scaron;t&ecaron;va stoj&iacute; 850 K&ccaron; a trv&aacute; p&rcaron;ibli&zcaron;n&ecaron; 45 minut. Zahrnuje vstupn&iacute; konzultaci a o&scaron;et&rcaron;en&iacute;. Chcete rovnou napl&aacute;novat term&iacute;n?<br><br>S pozdravem",
    "Dobr&yacute; den, Lenko,<br><br>samoz&rcaron;ejm&ecaron;, term&iacute;n p&rcaron;esuneme. V p&rcaron;&iacute;&scaron;t&iacute;m t&yacute;dnu m&aacute;m volno v pond&ecaron;l&iacute; v 10:00 nebo v &uacute;ter&yacute; v 15:00 &mdash; co v&aacute;m vyhovuje v&iacute;c?<br><br>S pozdravem",
  ];

  function pickMail(row) {
    if (!panes) return;
    panes.querySelectorAll(".mail-row").forEach(function (r) { r.classList.remove("on"); });
    row.classList.add("on");
  }

  function writeReply(idx, row) {
    pickMail(row);
    var area = document.getElementById("replyArea");
    var text = document.getElementById("replyText");
    var sent = document.getElementById("replySent");
    if (!area || !text) return;

    if (sent) sent.hidden = true;
    area.classList.remove("on");

    /* Krátká prodleva, ať je vidět, že odpověď někdo psal — bez ní se
       jen skokem vymění obsah a nevypadá to jako práce stroje. */
    setTimeout(function () {
      text.innerHTML = REPLIES[idx] || REPLIES[0];
      area.classList.add("on");
    }, reduced ? 0 : 340);
  }

  /* ==================================================================
     4. Recepce — dotaz a odpověď
     ================================================================== */
  var ANSWERS = {
    "Kdy m&aacute;te volno tento t&yacute;den?":
      "Voln&eacute; term&iacute;ny tento t&yacute;den:<br>&bull; St&rcaron;eda <b>10:00</b> a <b>15:30</b><br>&bull; &Ccaron;tvrtek <b>09:00</b> a <b>14:00</b><br>&bull; P&aacute;tek <b>11:00</b><br>Kter&yacute; v&aacute;m vyhovuje?",
    "Zarezervuj mi p&aacute;tek 14:00":
      "Hotovo. <b>P&aacute;tek 14:00</b> je zarezervovan&yacute;, potvrzen&iacute; v&aacute;m p&rcaron;ijde na e-mail. P&rcaron;ipom&iacute;nku po&scaron;lu ve &ccaron;tvrtek ve&ccaron;er.",
    "Kolik stoj&iacute; o&scaron;et&rcaron;en&iacute;?":
      "Cen&iacute;k:<br>&bull; Z&aacute;kladn&iacute; o&scaron;et&rcaron;en&iacute;: <b>850 K&ccaron;</b>, 45 minut<br>&bull; Prodlou&zcaron;en&eacute; o&scaron;et&rcaron;en&iacute;: <b>1 200 K&ccaron;</b>, 75 minut<br>&bull; Prvn&iacute; n&aacute;v&scaron;t&ecaron;va se vstupn&iacute; konzultac&iacute;: <b>950 K&ccaron;</b>",
    "Chci zru&scaron;it term&iacute;n ve &ccaron;tvrtek":
      "Zru&scaron;eno &mdash; v&aacute;&scaron; <b>&ccaron;tvrte&ccaron;n&iacute; term&iacute;n</b> je pry&ccaron;. Chcete rovnou naj&iacute;t n&aacute;hradn&iacute;?",
    "Kde v&aacute;s najdu?":
      "Najdete n&aacute;s na adrese <b>M&aacute;nesova 12, Praha 2</b>. MHD: metro N&aacute;m&ecaron;st&iacute; M&iacute;ru, v&yacute;stup A. Parkov&aacute;n&iacute; na ulici.",
  };

  var MISS = "Na tohle m&aacute; uk&aacute;zka jen p&rcaron;ipraven&eacute; odpov&ecaron;di. Skute&ccaron;n&yacute; asistent odpov&iacute; na cokoli &mdash; zkuste chat vpravo dole.";

  function ask(raw) {
    var wrap = document.getElementById("askWrap");
    if (!wrap || !raw) return;

    var mine = document.createElement("div");
    mine.className = "ask-bubble me";
    mine.textContent = raw;                 /* textContent, ne innerHTML */
    wrap.appendChild(mine);
    wrap.scrollTop = wrap.scrollHeight;

    var wait = document.createElement("div");
    wait.className = "ask-bubble bot";
    wait.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
    wrap.appendChild(wait);
    wrap.scrollTop = wrap.scrollHeight;

    setTimeout(function () {
      wait.remove();
      var out = document.createElement("div");
      out.className = "ask-bubble bot";
      /* Klíč se hledá podle textu tlačítka, takže sedí na zápis
         s entitami; co se nenajde, spadne na jednu obecnou větu. */
      out.innerHTML = ANSWERS[htmlKey(raw)] || MISS;
      wrap.appendChild(out);
      wrap.scrollTop = wrap.scrollHeight;
    }, reduced ? 0 : 820);
  }

  /* Text z pole je čistý Unicode, klíče v tabulce jsou s entitami —
     tohle je srovná na společný tvar. */
  var decoder = document.createElement("textarea");
  function htmlKey(plain) {
    for (var k in ANSWERS) {
      decoder.innerHTML = k;
      if (decoder.value === plain) return k;
    }
    return plain;
  }

  /* ==================================================================
     5. Jedna obsluha na všechno
     ================================================================== */
  document.addEventListener("click", function (e) {
    var tab = e.target.closest("[data-pane]");
    if (tab) { showPane(tab.dataset.pane, tab); return; }

    var gen = e.target.closest("[data-reply]");
    if (gen) {
      e.preventDefault();
      writeReply(Number(gen.dataset.reply), gen.closest(".mail-row"));
      return;
    }

    var row = e.target.closest(".mail-row");
    if (row) { pickMail(row); return; }

    var send = e.target.closest("[data-sent]");
    if (send) {
      var area = document.getElementById("replyArea");
      var sent = document.getElementById("replySent");
      if (area) area.classList.remove("on");
      if (sent) {
        sent.hidden = false;
        setTimeout(function () { sent.hidden = true; }, 3500);
      }
      return;
    }

    var chip = e.target.closest("[data-ask]");
    if (chip) { ask(chip.textContent.trim()); return; }

    var go = e.target.closest("[data-ask-send]");
    if (go) {
      var input = document.getElementById("askInput");
      if (input && input.value.trim()) { ask(input.value.trim()); input.value = ""; }
    }
  });

  var askInput = document.getElementById("askInput");
  if (askInput) {
    askInput.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      e.preventDefault();
      if (this.value.trim()) { ask(this.value.trim()); this.value = ""; }
    });

    /* Nápověda v poli se střídá, ať je vidět, na co se dá ptát. */
    if (!reduced) {
      var hints = Object.keys(ANSWERS).map(function (k) { decoder.innerHTML = k; return decoder.value; });
      var h = 0;
      askInput.placeholder = hints[0];
      setInterval(function () {
        if (document.activeElement === askInput || document.hidden) return;
        h = (h + 1) % hints.length;
        askInput.placeholder = hints[h];
      }, 2800);
    }
  }
})();
