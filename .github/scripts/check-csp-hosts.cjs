// .cjs because package.json now sets "type": "module" for Astro; this is a plain
// CommonJS script and Node would otherwise refuse the require() calls.
// Fails the build when a page fetch()es a host that the CSP connect-src does not allow.
//
// Why this exists: on 2026-08-19 the site chat was dead for anyone who opened it.
// The widget had been repointed to alsflow-chat.alsflow.cz, but vercel.json still
// allowlisted the retired Railway host, so the browser blocked every request before
// it left the page. The build passed, the deploy passed, the backend was healthy —
// the only symptom was in a visitor's console. A CSP mismatch is invisible to every
// check that does not load a real page, so it needs its own check.
//
// Scope: fetch() with an absolute URL, either inline or via a nearby const. Relative
// URLs ('/api/contact') are covered by 'self' and skipped. XHR/sendBeacon are not
// used on this site; add them here if that changes.

const fs = require('fs');

// The pages are built output now, so the directory to scan is an argument; vercel.json
// still lives at the repo root. An empty directory means the build did not produce
// anything - fail rather than pass a check that inspected nothing.
const CONFIG = process.env.VERCEL_JSON || 'vercel.json';
const dir = process.argv[2] || '.';
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort();
if (htmlFiles.length === 0) {
  console.error(`No .html files in "${dir}" - nothing was checked. Did the build run?`);
  process.exit(1);
}

// --- the allowlist, straight out of the deployed header ---------------------
const vercel = JSON.parse(fs.readFileSync(CONFIG, 'utf8'));
let csp = '';
for (const rule of vercel.headers || []) {
  for (const h of rule.headers || []) {
    if (h.key.toLowerCase() === 'content-security-policy') csp = h.value;
  }
}
if (!csp) {
  console.error(`❌ No Content-Security-Policy found in ${CONFIG}`);
  process.exit(1);
}

const connectSrc = (csp.split(';').find(d => d.trim().startsWith('connect-src')) || '')
  .replace('connect-src', '').trim().split(/\s+/).filter(Boolean);

const allowed = new Set(
  connectSrc.filter(t => t.startsWith('http')).map(t => t.replace(/\/$/, ''))
);

console.log(`connect-src allows: ${[...allowed].join(', ') || '(nothing beyond self)'}\n`);

// --- what the pages actually call -------------------------------------------
let hasError = false;
let checked = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(require('path').join(dir, file), 'utf8');

  // inline scripts only — external ones are governed by script-src, not this check
  const js = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m => !/\bsrc\s*=/i.test(m[1]))
    .map(m => m[2])
    .join('\n');
  if (!js) continue;

  // const NAME = 'https://...'  — so `fetch(WEBHOOK, {...})` resolves
  const vars = {};
  for (const m of js.matchAll(/(?:const|let|var)?\s*([A-Za-z_$][\w$]*)\s*=\s*['"`](https?:\/\/[^'"`]+)['"`]/g)) {
    vars[m[1]] = m[2];
  }

  for (const m of js.matchAll(/fetch\(\s*(?:['"`]([^'"`]+)['"`]|([A-Za-z_$][\w$]*))/g)) {
    const url = m[1] !== undefined ? m[1] : vars[m[2]];
    if (!url || !/^https?:\/\//.test(url)) continue;   // relative => 'self'
    checked++;
    const origin = new URL(url).origin;
    if (allowed.has(origin)) {
      console.log(`✓  ${file} → ${origin}`);
    } else {
      console.error(`✗  ${file} → ${origin}  NOT in connect-src`);
      hasError = true;
    }
  }
}

if (hasError) {
  console.error(`\n❌ CSP mismatch — the browser will block these requests.`);
  console.error(`   Add the host to connect-src in ${CONFIG}, or fix the fetch() URL.`);
  process.exit(1);
}
console.log(`\n✅ All ${checked} absolute fetch target(s) allowed by connect-src`);
