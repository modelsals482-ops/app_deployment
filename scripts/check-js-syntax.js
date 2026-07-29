// Parse every JS the site ships and fail on a syntax error.
// Runs AFTER `astro build`, so it checks the real output:
//   - inline <script> blocks in each built dist/*.html page (the homepage's is:inline scripts + every verbatim page)
//   - every external bundle in public/js/*.js (home.js — the homepage's main logic)
// `new Function(src)` throws on a syntax error without executing anything.
import fs from 'fs';
import path from 'path';

let hasError = false;
const check = (label, src) => {
  try { new Function(src); console.log(`✓  ${label}`); }
  catch (e) { console.error(`✗  ${label}: ${e.message}`); hasError = true; }
};

// 1. inline scripts in built HTML
const distDir = 'dist';
const htmlFiles = fs.existsSync(distDir)
  ? fs.readdirSync(distDir).filter((f) => f.endsWith('.html'))
  : [];
if (!htmlFiles.length) { console.error('No dist/*.html found — run `astro build` first.'); process.exit(1); }
const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(distDir, f), 'utf8');
  let m, i = 0;
  while ((m = scriptRe.exec(html)) !== null) {
    const attrs = m[1], content = m[2].trim();
    if (/\bsrc\s*=/i.test(attrs) || !content) continue;                 // external / empty
    if (/\btype\s*=/i.test(attrs) && !/type\s*=\s*["']text\/javascript["']/i.test(attrs)) continue; // JSON-LD etc
    check(`${f} — inline block ${++i}`, content);
  }
}

// 2. external bundles in public/js
const jsDir = path.join('public', 'js');
if (fs.existsSync(jsDir)) {
  for (const f of fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'))) {
    check(`public/js/${f}`, fs.readFileSync(path.join(jsDir, f), 'utf8'));
  }
}

if (hasError) { console.error('\n❌ JS validation failed'); process.exit(1); }
console.log('\n✅ All JS valid');
