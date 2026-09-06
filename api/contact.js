// Vercel serverless function: /api/contact
// Website contact form -> Resend email to Jakub. Replaces the n8n intake webhook.
// Env (set in Vercel project settings): RESEND_API_KEY (required),
//   CONTACT_TO (default ryvola@alsflow.cz), RESEND_FROM (default "ALSflow <info@alsflow.cz>").
// Klíče z /kontakt jsou přidané vedle původních, ne místo nich: na
// /api/contact pořád posílá i landing.html se starou sadou hodnot a
// neznámý klíč by v e-mailu skončil jako holý řetězec.
const LABELS = {
  urgency: {
    asap: 'Co nejdřív (tento týden)', this_month: 'Tento měsíc',
    quarter: 'Do tří měsíců', exploring: 'Jen se rozhlížím',
  },
  biz: {
    salon: 'Kadeřnictví/salon', vet: 'Veterinář', dental: 'Zubní/lékař',
    physio: 'Fyzio/wellness', shop: 'Obchod/e-shop', services: 'Řemeslo/služby',
    freelancer: 'Freelancer/OSVČ', small_firm: 'Malá firma', other: 'Jiné',
  },
  service: {
    // /kontakt - tři řemesla
    web: 'WEB (nový nebo předělaný)', software: 'SOFTWARE na míru', ai: 'AI ASISTENT',
    vice: 'Víc věcí dohromady', nevim: 'Neví, chce poradit',
    // starší stránky s nabídkou chatbotů
    email_bot: 'E-mailové odpovědi', recepce: 'Rezervace & Připomínky',
    feedback: 'Zpětná vazba', bundle: 'Bundle', custom: 'Bot na míru', unsure: 'Chce poradit',
  },
  pain: {
    cas: 'Ztrácí čas ruční prací', zmeskane: 'Nestíhá odpovídat, unikají zakázky',
    web: 'Zastaralý nebo žádný web', systemy: 'Systémy spolu nemluví',
    tabulky: 'Všechno běží v tabulkách', jine: 'Jiné',
  },
};
const L = (f, v) => (LABELS[f] && LABELS[f][v]) || v || '-';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const b = req.body || {};
  if (b.website) return res.status(200).json({ ok: true });          // honeypot -> silently drop
  // Povinné je jen to, bez čeho nejde odpovědět. Jméno je nepovinné, protože
  // krátký formulář ho nesbírá - doptat se na ně v odpovědi je levnější než
  // ztratit poptávku na políčku navíc.
  if (!b.email || !b.msg) return res.status(400).json({ error: 'missing email/msg' });

  // Cloudflare Turnstile - if a secret is configured, the token must verify or we reject (no email sent).
  const tsSecret = process.env.TURNSTILE_SECRET_KEY;
  if (tsSecret) {
    const ip = req.headers['cf-connecting-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const form = new URLSearchParams({ secret: tsSecret, response: b.turnstileToken || '' });
    if (ip) form.append('remoteip', ip);
    try {
      const vr = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form,
      });
      const vj = await vr.json();
      if (!vj.success) return res.status(400).json({ error: 'turnstile' });
    } catch (e) { console.error('turnstile verify failed:', e.message); return res.status(400).json({ error: 'turnstile' }); }
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error('RESEND_API_KEY not set'); return res.status(500).json({ error: 'config' }); }
  const from = process.env.RESEND_FROM || 'ALSflow <info@alsflow.cz>';
  const to = process.env.CONTACT_TO || 'ryvola@alsflow.cz';

  const text = [
    `Nová poptávka z alsflow.cz`, '',
    `Jméno:    ${b.name || '-'}`,
    `E-mail:   ${b.email}`,
    `Telefon:  ${b.phone || '-'}`,
    `Město:    ${b.city || '-'}`,
    `Začít:    ${L('urgency', b.urgency)}`,
    `Obor:     ${L('biz', b.biz)}   (tým: ${b.size || '-'})`,
    `Služba:   ${L('service', b.service)}`,
    `Problém:  ${L('pain', b.pain)}`,
    `Kdy volat:${b.pref_time || 'kdykoliv'}`, '',
    `Zpráva:   ${b.msg || '-'}`,
  ].join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, reply_to: b.email, subject: `Nová poptávka: ${b.name || b.email}`, text }),
    });
    if (!r.ok) throw new Error(`resend ${r.status}: ${(await r.text().catch(() => '')).slice(0, 200)}`);

    // Potvrzení odesílateli. Až PO úspěšném odeslání poptávky a v samostatném
    // try/catch: kdyby potvrzení selhalo, poptávka je doručená a nesmí kvůli tomu
    // spadnout celý požadavek. Člověk by pak formulář odeslal znovu a Jakub by měl
    // stejný lead dvakrát.
    //
    // Cíl je vždy jen adresa, kterou odesílatel sám vyplnil, takže z toho nejde
    // udělat rozesílač. Formulář navíc chrání Turnstile.
    await sendConfirmation({ key, from, replyTo: to, b }).catch((e) =>
      console.error('contact confirmation failed (lead byl doručen):', e.message));

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact send failed:', e.message);
    return res.status(500).json({ error: 'send' });
  }
};

// Potvrzení pro člověka, který formulář odeslal. Prostý text, žádné obrázky ani
// sledovací pixely: stejný přístup jako u zbytku webu, a taky se to spolehlivěji
// doručí. Shrnutí toho, co poslal, je tam schválně - má tím doklad, co odešlo.
async function sendConfirmation({ key, from, replyTo, b }) {
  const text = [
    b.name ? `Dobrý den, ${b.name},` : 'Dobrý den,', '',
    'děkuji za zprávu, dorazila mi v pořádku.',
    'Ozvu se vám do 48 hodin v pracovní dny, na e-mail nebo telefon, který jste uvedl(a).',
    '',
    'Co bude dál:',
    '1. Přečtu si, co potřebujete, a projdu si váš web, pokud nějaký máte.',
    '2. Napíšu vám a nabídnu krátký hovor, patnáct minut stačí.',
    '3. Z hovoru vyjde pevná cena a termín. Ne odhad.',
    '',
    'Kdyby to bylo mezitím naléhavé, pište rovnou na ryvola@alsflow.cz.',
    '',
    'Pro vaši evidenci posílám, co dorazilo:',
    b.name ? `  Jméno:   ${b.name}` : null,
    `  E-mail:  ${b.email}`,
    `  Telefon: ${b.phone || '-'}`,
    `  Služba:  ${L('service', b.service)}`,
    b.msg ? `  Zpráva:  ${b.msg}` : null,
    '',
    'Jakub Ryvola',
    'ALSflow · alsflow.cz',
  ].filter((line) => line !== null).join('\n');

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to: b.email,
      reply_to: replyTo,
      subject: 'Máme vaši poptávku - ozvu se do 48 hodin',
      text,
    }),
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${(await r.text().catch(() => '')).slice(0, 200)}`);
}
