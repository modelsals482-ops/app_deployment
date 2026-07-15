// Vercel serverless function: /api/contact
// Website contact form -> Resend email to Jakub. Replaces the n8n intake webhook.
// Env (set in Vercel project settings): RESEND_API_KEY (required),
//   CONTACT_TO (default ryvola@alsflow.cz), RESEND_FROM (default "ALSflow <info@alsflow.cz>").
const LABELS = {
  urgency: { asap: 'Co nejdřív (tento týden)', this_month: 'Tento měsíc', exploring: 'Jen se rozhlížím' },
  biz: { salon: 'Kadeřnictví/salon', vet: 'Veterinář', dental: 'Zubní/lékař', physio: 'Fyzio/wellness', freelancer: 'Freelancer/OSVČ', small_firm: 'Malá firma', other: 'Jiné' },
  service: { email_bot: 'E-mailové odpovědi', recepce: 'Rezervace & Připomínky', feedback: 'Zpětná vazba', bundle: 'Bundle', custom: 'Bot na míru', unsure: 'Chce poradit' },
};
const L = (f, v) => (LABELS[f] && LABELS[f][v]) || v || '—';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const b = req.body || {};
  if (b.website) return res.status(200).json({ ok: true });          // honeypot -> silently drop
  if (!b.name || !b.email) return res.status(400).json({ error: 'missing name/email' });

  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error('RESEND_API_KEY not set'); return res.status(500).json({ error: 'config' }); }
  const from = process.env.RESEND_FROM || 'ALSflow <info@alsflow.cz>';
  const to = process.env.CONTACT_TO || 'ryvola@alsflow.cz';

  const text = [
    `Nová poptávka z alsflow.cz`, '',
    `Jméno:    ${b.name}`,
    `E-mail:   ${b.email}`,
    `Telefon:  ${b.phone || '—'}`,
    `Město:    ${b.city || '—'}`,
    `Začít:    ${L('urgency', b.urgency)}`,
    `Obor:     ${L('biz', b.biz)}   (tým: ${b.size || '—'})`,
    `Služba:   ${L('service', b.service)}`,
    `Problém:  ${b.pain || '—'}`,
    `Kdy volat:${b.pref_time || 'kdykoliv'}`, '',
    `Zpráva:   ${b.msg || '—'}`,
  ].join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, reply_to: b.email, subject: `Nová poptávka — ${b.name}`, text }),
    });
    if (!r.ok) throw new Error(`resend ${r.status}: ${(await r.text().catch(() => '')).slice(0, 200)}`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact send failed:', e.message);
    return res.status(500).json({ error: 'send' });
  }
};
