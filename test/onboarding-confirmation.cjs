/* Overuje potvrzovaci e-mail v api/onboarding.js proti podvrzenemu Resendu. */
const assert = require('assert');
process.env.RESEND_API_KEY = 'test';
delete process.env.TURNSTILE_SECRET_KEY;
const handler = require('../api/onboarding.js');

function res() {
  return { code: 0, body: null,
    status(c) { this.code = c; return this; },
    json(b) { this.body = b; return this; } };
}
const body = {
  email: 'klient@example.cz', dpa: true, firma: 'Kadernictvi U Lipy',
  kontaktni_osoba: 'Petra Novakova', telefon: '+420111222333', produkt: 'recepce',
};

(async () => {
  // 1. stastna cesta: dva maily, spravni prijemci
  let sent = [];
  global.fetch = async (u, o) => { sent.push(JSON.parse(o.body)); return { ok: true, json: async () => ({ success: true }) }; };
  let r = res();
  await handler({ method: 'POST', headers: {}, body }, r);
  assert.strictEqual(r.code, 200, 'happy path must be 200');
  assert.strictEqual(sent.length, 2, 'expected 2 emails, got ' + sent.length);
  assert.strictEqual(sent[0].to, 'ryvola@alsflow.cz', 'lead goes to Jakub');
  assert.strictEqual(sent[1].to, 'klient@example.cz', 'confirmation goes to the client');
  assert.strictEqual(sent[1].reply_to, 'ryvola@alsflow.cz', 'replies must reach Jakub');
  assert.ok(sent[1].text.includes('Dobrý den, Petra Novakova,'), 'greets by name');
  assert.ok(sent[1].text.includes('Kadernictvi U Lipy'), 'echoes filled fields');
  assert.ok(!sent[1].text.includes('Kalendář'), 'must not list empty fields');
  assert.ok(/DPA\): udělen \d/.test(sent[1].text), 'records the DPA consent with a date');

  // 2. bez jmena nesmi vzniknout "Dobry den, ,"
  sent = [];
  r = res();
  await handler({ method: 'POST', headers: {}, body: { email: 'x@y.cz', dpa: true } }, r);
  assert.ok(sent[1].text.startsWith('Dobrý den,\n'), 'falls back cleanly without a name');

  // 3. kdyz selze POTVRZENI, onboarding uz je dorucen -> porad 200
  sent = [];
  let n = 0;
  global.fetch = async (u, o) => { n++; sent.push(JSON.parse(o.body)); return n === 1 ? { ok: true } : { ok: false, status: 500, text: async () => 'boom' }; };
  r = res();
  await handler({ method: 'POST', headers: {}, body }, r);
  assert.strictEqual(r.code, 200, 'failed confirmation must NOT fail the request');

  // 4. kdyz selze SAMOTNY onboarding -> 500, zadne potvrzeni
  sent = [];
  global.fetch = async (u, o) => { sent.push(JSON.parse(o.body)); return { ok: false, status: 500, text: async () => 'boom' }; };
  r = res();
  await handler({ method: 'POST', headers: {}, body }, r);
  assert.strictEqual(r.code, 500, 'failed lead must be 500');
  assert.strictEqual(sent.length, 1, 'no confirmation when the lead never arrived');

  console.log('onboarding confirmation: 4/4 OK');
})();
