/* =====================================================================
   ALSflow — chat s Klárou

   Živý bot běží na vlastní instanci (n8n na Railway) a volá se přes
   webhook. Přeneseno beze změny logiky ze staré verze stránky; jediné,
   co se změnilo, je, že to už není vlepené v HTML.

   Klíč v hlavičce není tajemství a ani se tak nechová — je to jen
   hrubé síto proti tomu, aby webhook mohl mlátit kdokoli odkudkoli.
   Skutečné limity a ověření sedí na serveru.

   Adresa webhooku musí zůstat v connect-src v vercel.json. Když se
   přepíše tady a tam ne, prohlížeč každý požadavek zablokuje ještě
   před odesláním a chat je němý, aniž by cokoli spadlo — přesně tohle
   se stalo 19. 8. 2026, proto to hlídá i .github/scripts.
   ===================================================================== */
/* -- CHAT WIDGET JS -- */
(function() {
  var WEBHOOK = 'https://alsflow-chat.alsflow.cz/webhook/alsflow-chat';
  var API_KEY = 'alsflow-chat-2026';
  var MAX = 20;
  var sid = sessionStorage.getItem('als_chat_sid');
  if (!sid) {
    sid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    sessionStorage.setItem('als_chat_sid', sid);
  }
  var history = []; var msgCount = 0; var sending = false; var opened = false;

  /* STATIC FLOOR. The live bot is an upgrade, not a dependency. These answers are baked
     into the page, so an outage degrades the chat to a worse answer, never to no answer.
     Any reply from the bot overrides them. Keep in sync with prompts.js (node-bots/services/alsflow-klara) + cenik. */
  var FALLBACK = [
    { re: /cen[ay]|stoj|kolik|platb|balic|balíc|balíč/i,
      a: 'U asistentů: E-mailové odpovědi 2 500 Kč měsíčně, Rezervace a připomínky 4 500 Kč měsíčně, všechny tři služby 7 500 Kč měsíčně, jednorázové nastavení 8 000 až 10 000 Kč. Cenu webu nebo softwaru řekneme po úvodním hovoru, je pevná za dohodnutý rozsah.' },
    { re: /web|stránk|stranky|wordpress|doména|domena|hosting/i,
      a: 'Weby píšeme ručně, bez redakčního systému a bez pluginů. Web bývá živý do 6 až 10 pracovních dnů a průběžně vidíte rozpracovanou verzi. Víc na alsflow.cz/tvorba-webu.' },
    { re: /software|aplikac|panel|integrac|api|propoj|tabulk|excel|nástroj|nastroj/i,
      a: 'Stavíme menší nástroje na míru: administrační panely, propojení systémů, které spolu nemluví, a náhradu ručního přepisování do tabulek. Termín i cena vyjdou z krátké analýzy. Víc na alsflow.cz/vyvoj-softwaru.' },
    { re: /jak dlouho|nastaven|spust|hotov|trva|trvá|termín|termin/i,
      a: 'Asistenta nasadíme do 5 až 7 pracovních dnů, web bývá živý do 6 až 10 pracovních dnů. U softwaru se termín domlouvá podle rozsahu.' },
    { re: /co.{0,15}(del|děl|umi|umí)|k cemu|k čemu|jak to funguje|co (nabiz|nabíz)|na co je/i,
      a: 'ALSflow dělá tři věci: weby, menší software na míru a AI asistenty, kteří za vás odpovídají zákazníkům a domlouvají termíny.' },
    { re: /kader|kadeř|fyzio|veterin|zub|obor|hodi se|hodí se|firm/i,
      a: 'Asistenty stavíme pro kadeřnictví, fyzioterapie, veterináře, zubní ordinace a další živnostníky. Weby a nástroje děláme pro kohokoli, kdo je potřebuje.' },
    { re: /kde (najdu|je)|ceník|cenik|reference|ochran|kontakt na|stránk[ay] s/i,
      a: 'Ceník je na alsflow.cz/cenik, kontaktní formulář na alsflow.cz/kontakt a o nás na alsflow.cz/o-nas.' },
    { re: /kontakt|mail|telefon|zavolat|schuzk|schůzk|domluv/i,
      a: 'Napište na info@alsflow.cz nebo vyplňte formulář na alsflow.cz/kontakt. Odpovídáme do 48 hodin v pracovní dny a rovnou nabídneme termín hovoru.' }
  ];
  function degraded(q) {
    for (var i = 0; i < FALLBACK.length; i++) {
      if (FALLBACK[i].re.test(q)) {
        return FALLBACK[i].a + ' (Chat je teď dočasně omezený, proto odpovídám zjednodušeně. Pro detaily napište na info@alsflow.cz.)';
      }
    }
    return 'Chat je teď dočasně nedostupný. Napište prosím na info@alsflow.cz nebo vyplňte formulář na alsflow.cz/kontakt.';
  }
  window.toggleChat = function() {
    opened = !opened;
    var panel = document.getElementById('chatPanel');
    var badge = document.getElementById('chatBadge');
    if (panel) panel.classList.toggle('open', opened);
    if (panel) panel.setAttribute('aria-hidden', String(!opened));
    if (opened && badge) badge.style.display = 'none';
    if (opened) setTimeout(function() { var i = document.getElementById('chatInput'); if(i) i.focus(); }, 300);
  };
  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* Stránky, na které Klára smí odkázat. Seznam je natvrdo schválně: odpověď
     je výstup modelu, a kdyby si cestu vymyslel, obecný linkovač by udělal
     tlačítko na 404. Takhle může vzniknout jen odkaz na stránku, která existuje. */
  var PAGES = [
    { path: '/cenik',           label: 'Ceník',            re: /cen[íi]k|kolik (to )?stoj|cena|ceny/i },
    { path: '/kontakt',         label: 'Nezávazná nabídka', re: /kontakt|popt[áa]vk|nab[íi]dk|ozvat|napsat|formul[áa][řr]/i },
    { path: '/tvorba-webu',     label: 'Tvorba webu',      re: /tvorba-webu|\bweb(y|u|em)?\b|str[áa]nk/i },
    { path: '/vyvoj-softwaru',  label: 'Vývoj softwaru',   re: /vyvoj-softwaru|software|n[áa]stroj|panel|integrac/i },
    { path: '/ai-asistenti',    label: 'AI asistenti',     re: /ai-asistenti|asistent/i },
    { path: '/o-nas',           label: 'O nás',            re: /o-nas|o n[áa]s|kdo (za|jsme)/i },
    { path: '/e-mailove-odpovedi',   label: 'E-mailové odpovědi',  re: /e-mailove-odpovedi|e-mailov[ée] odpov/i },
    { path: '/rezervace-pripominky', label: 'Rezervace a připomínky', re: /rezervace-pripominky|rezervac|p[řr]ipom[íi]nk/i },
    { path: '/ochrana_dat',     label: 'Ochrana dat',      re: /ochrana_dat|ochran[aě] (osobn[íi]ch )?[úu]daj|gdpr/i }
  ];

  /* Bere jen stránky, které Klára opravdu zmínila — nejdřív podle konkrétní
     adresy v textu, teprve pak podle tématu. Nikdy víc než dvě, ať se z bubliny
     nestane rozcestník. Na stránku, kde návštěvník právě je, se neodkazuje. */
  function suggest(text) {
    var here = location.pathname.replace(/\.html$/, '') || '/';
    var byPath = [], byTopic = [];
    PAGES.forEach(function (pg) {
      if (pg.path === here) return;
      if (text.indexOf(pg.path) !== -1) byPath.push(pg);
      else if (pg.re.test(text)) byTopic.push(pg);
    });
    return byPath.concat(byTopic).slice(0, 2);
  }

  function addMsg(role, text) {
    var wrap = document.getElementById('chatMessages'); if (!wrap) return;
    var div = document.createElement('div'); div.className = 'chat-msg ' + role;
    var bub = document.createElement('div'); bub.className = 'chat-bubble-msg';
    bub.innerHTML = esc(text).replace(/\n/g,'<br>');
    div.appendChild(bub);

    if (role === 'bot') {
      var picks = suggest(text);
      if (picks.length) {
        var row = document.createElement('div');
        row.className = 'chat-actions';
        picks.forEach(function (pg) {
          var a = document.createElement('a');
          a.className = 'chat-action';
          a.href = pg.path;                 /* z pevného seznamu, ne z odpovědi */
          a.textContent = pg.label;
          row.appendChild(a);
        });
        div.appendChild(row);
      }
    }

    wrap.appendChild(div); wrap.scrollTop = wrap.scrollHeight;
  }
  function addTyping() {
    var wrap = document.getElementById('chatMessages'); if (!wrap) return;
    var div = document.createElement('div'); div.className = 'chat-msg bot'; div.id = 'chatTyping';
    div.innerHTML = '<div class="chat-bubble-msg"><span class="chat-typing-dots"><span></span><span></span><span></span></span></div>';
    wrap.appendChild(div); wrap.scrollTop = wrap.scrollHeight;
  }
  function removeTyping() { var t = document.getElementById('chatTyping'); if(t) t.remove(); }
  function updateCounter() { var el = document.getElementById('chatCounter'); if(el) el.textContent = msgCount + '/' + MAX; }
  window.sendChatMessage = function() {
    if (sending || msgCount >= MAX) return;
    var input = document.getElementById('chatInput');
    var msg = input ? input.value.trim() : ''; if (!msg) return;
    if (input) input.value = '';
    msgCount++; updateCounter(); addMsg('user', msg);
    var sendHistory = history.slice();
    history.push({ role: 'user', content: msg });
    if (history.length > 12) history = history.slice(-12);
    sending = true;
    var btn = document.getElementById('chatSend'); if(btn) btn.disabled = true;
    addTyping();
    fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ message: msg, session_id: sid, history: sendHistory, website: '' })
    })
    .then(function(r) { if (!r.ok) { throw new Error('http ' + r.status); } return r.json(); })
    .then(function(data) {
      removeTyping();
      var reply = (data && data.reply) ? String(data.reply) : degraded(msg);
      addMsg('bot', reply);
      history.push({ role: 'model', content: reply });
      if (history.length > 12) history = history.slice(-12);
    })
    .catch(function() { removeTyping(); addMsg('bot', degraded(msg)); })
    .finally(function() {
      sending = false; if(btn) btn.disabled = (msgCount >= MAX); updateCounter();
      if (msgCount >= MAX) addMsg('bot', 'Dosáhli jste limitu zpráv. Napište na info@alsflow.cz nebo vyplňte formulář na alsflow.cz/kontakt.');
    });
  };

  /* Dřív se tyhle tři věci volaly z onclick/onkeydown přímo ve značce.
     Nová stránka je má tady, aby značka zůstala čistá a chat se dal
     přenést na jinou stránku beze změny HTML. */
  (function () {
    var open = document.getElementById('chatBubble');
    var close = document.getElementById('chatClose');
    var send = document.getElementById('chatSend');
    var input = document.getElementById('chatInput');

    if (open) open.addEventListener('click', window.toggleChat);
    if (close) close.addEventListener('click', window.toggleChat);
    if (send) send.addEventListener('click', window.sendChatMessage);
    if (input) input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); window.sendChatMessage(); }
    });

    /* Escape zavírá panel, když je otevřený — dialog bez klávesnicové
       cesty ven je past pro každého, kdo nepoužívá myš. */
    document.addEventListener('keydown', function (e) {
      var panel = document.getElementById('chatPanel');
      if (e.key !== 'Escape' || !panel || !panel.classList.contains('open')) return;
      window.toggleChat();
      if (open) open.focus();
    });
  })();
})();
