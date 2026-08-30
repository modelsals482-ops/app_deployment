// Vercel serverless function: /api/onboarding
// Client onboarding form -> Resend email to Jakub. Replaces the n8n client-onboarding webhook.
// Env: RESEND_API_KEY (required), TURNSTILE_SECRET_KEY (verify if set),
//   ONBOARDING_TO (default ryvola@alsflow.cz), RESEND_FROM (default "ALSflow <info@alsflow.cz>").
const LABELS = {
  firma: 'Firma', ico: 'IČO', kontaktni_osoba: 'Kontaktní osoba', telefon: 'Telefon', email: 'E-mail',
  produkt: 'Produkt', jmeno_asistenta: 'Jméno asistenta', ton: 'Tón', obor: 'Obor',
  oteviraci_doba: 'Otevírací doba', adresa: 'Adresa', verejny_telefon: 'Veřejný telefon',
  sluzby_a_ceny: 'Služby a ceny', caste_dotazy: 'Časté dotazy', kalendar: 'Kalendář',
  email_schranka: 'E-mail schránka', eskalacni_email: 'Eskalační e-mail', odkaz_materialy: 'Odkaz na materiály',
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const b = req.body || {};
  if (b.website) return res.status(200).json({ ok: true });                 // honeypot -> silently drop
  if (!b.email) return res.status(400).json({ error: 'missing email' });
  if (!b.dpa) return res.status(400).json({ error: 'dpa consent required' }); // clickwrap consent is mandatory

  // Cloudflare Turnstile - verify if configured, else reject (no email sent).
  const tsSecret = process.env.TURNSTILE_SECRET_KEY;
  if (tsSecret) {
    const ip = req.headers['cf-connecting-ip'] || (req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const form = new URLSearchParams({ secret: tsSecret, response: b.turnstileToken || '' });
    if (ip) form.append('remoteip', ip);
    try {
      const vr = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: form,
      });
      if (!(await vr.json()).success) return res.status(400).json({ error: 'turnstile' });
    } catch (e) { console.error('turnstile verify failed:', e.message); return res.status(400).json({ error: 'turnstile' }); }
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error('RESEND_API_KEY not set'); return res.status(500).json({ error: 'config' }); }
  const from = process.env.RESEND_FROM || 'ALSflow <info@alsflow.cz>';
  const to = process.env.ONBOARDING_TO || 'ryvola@alsflow.cz';

  const lines = Object.keys(LABELS).map((k) => `${LABELS[k].padEnd(20)} ${b[k] || '-'}`);
  const text = [
    'Nový onboarding formulář z alsflow.cz', '',
    ...lines, '',
    `Souhlas s DPA:       ${b.dpa ? 'ANO' : 'NE'}`,
  ].join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from, to, reply_to: b.email, subject: `Onboarding: ${b.firma || b.email}`, text }),
    });
    if (!r.ok) throw new Error(`resend ${r.status}: ${(await r.text().catch(() => '')).slice(0, 200)}`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('onboarding send failed:', e.message);
    return res.status(500).json({ error: 'send' });
  }
};
