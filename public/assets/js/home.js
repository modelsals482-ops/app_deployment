/* Titulni strana: klikaci ukazka asistenta. Nic se neodesila. */
(function () {
  var demo = document.getElementById('demo');
  if (!demo) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SCENES = {
    sobota: {
      text: 'Dobrý den, máte v sobotu volno na barvení?',
      does: 'Podívá se do kalendáře salonu a najde volné termíny.',
      reply: 'Dobrý den, v sobotu je volno v 9:00 a ve 13:30. Mám vám jeden z těch časů zapsat? Barvení trvá zhruba dvě hodiny. Píše vám AI asistent salonu.',
      status: 'Odpovězeno', cls: 'ok'
    },
    cena: {
      text: 'Kolik u vás stojí střih a vousy?',
      does: 'Odpoví podle ceníku, který mu dáte.',
      reply: 'Dobrý den, střih s úpravou vousů stojí 650 Kč a trvá 45 minut. Pokud chcete, rovnou vám najdu volný termín. Píše vám AI asistent salonu.',
      status: 'Odpovězeno', cls: 'ok'
    },
    reklamace: {
      text: 'Minule mi barva nechytla tak, jak jsme se domluvily. Co s tím?',
      does: 'Tohle sám neřeší. Předá to vám i se shrnutím a zákaznici dá vědět.',
      reply: 'Dobrý den, mrzí mě to. Předal jsem vaši zprávu majitelce salonu a ozve se vám osobně. Píše vám AI asistent salonu.',
      status: 'Předáno vám', cls: 'fw'
    }
  };
  var mails = demo.querySelectorAll('.mail');
  var vIn = demo.querySelector('[data-v="in"]');
  var vDoes = demo.querySelector('[data-v="does"]');
  var vOut = demo.querySelector('[data-v="out"]');
  var st = demo.querySelector('.status');
  var run = 0;

  function setStatus(text, cls) { st.textContent = text; st.className = 'status' + (cls ? ' ' + cls : ''); }

  function show(key) {
    var s = SCENES[key], me = ++run, i = 0;
    mails.forEach(function (m) { m.setAttribute('aria-pressed', m.dataset.k === key ? 'true' : 'false'); });
    vIn.textContent = s.text;
    vDoes.textContent = s.does;
    vOut.textContent = '';
    setStatus('Zpracovává');
    if (reduce) { vOut.textContent = s.reply; setStatus(s.status, s.cls); return; }
    vOut.classList.add('typing');
    setTimeout(function step() {
      if (me !== run) return;
      i = Math.min(s.reply.length, i + 2);
      vOut.textContent = s.reply.slice(0, i);
      if (i < s.reply.length) setTimeout(step, 16);
      else { vOut.classList.remove('typing'); setStatus(s.status, s.cls); }
    }, 450);
  }

  mails.forEach(function (m) { m.addEventListener('click', function () { show(m.dataset.k); }); });
  demo.querySelector('.link-btn').addEventListener('click', function () {
    run++;
    mails.forEach(function (m) { m.setAttribute('aria-pressed', 'false'); });
    vIn.textContent = 'Vyberte zprávu vlevo.';
    vDoes.textContent = '';
    vOut.textContent = '';
    vOut.classList.remove('typing');
    setStatus('Čeká');
  });
})();
