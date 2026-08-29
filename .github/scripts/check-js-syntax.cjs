const fs = require('fs');
const path = require('path');

// Every page, not a hand-kept list — landing.html carried a broken form for weeks
// while sitting outside the old two-file list.
// Kde hledat. Po prechodu na Astro uz v korenu zadne .html nejsou - kontrolovat
// se musi vydany vystup (dist/), jinak skript nenajde nic a tvari se, ze je
// vsechno v poradku. Prazdny nalez je proto chyba, ne uspech.
const ROOT = process.argv[2] || '.';
if (!fs.existsSync(ROOT)) {
  console.error(`Slozka ${ROOT} neexistuje. Spustte nejdriv build.`);
  process.exit(1);
}
const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort()
  .map(f => path.join(ROOT, f));
if (htmlFiles.length === 0) {
  console.error(`V ${ROOT} nejsou zadne .html soubory - to je chyba, ne uspech.`);
  process.exit(1);
}
let hasError = false;

for (const file of htmlFiles) {
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let blockIndex = 0;

  while ((match = scriptRegex.exec(html)) !== null) {
    const attrs = match[1];
    const content = match[2].trim();
    if (/\bsrc\s*=/i.test(attrs) || !content) continue;
    if (/\btype\s*=\s*["'][^"']*["']/i.test(attrs) && !/type\s*=\s*["']text\/javascript["']/i.test(attrs)) continue;
    blockIndex++;

    try {
      new Function(content);
      console.log(`✓  ${file} — block ${blockIndex}: OK`);
    } catch (e) {
      console.error(`✗  ${file} — block ${blockIndex}: ${e.message}`);
      const lines = content.split('\n');
      const hasMinifiedLineComment = lines.some(
        l => l.length > 300 && /(?<!https?:)\/\//.test(l)
      );
      if (hasMinifiedLineComment) {
        console.error(`   ↳ Hint: line comment (//) found in minified code.`);
        console.error(`     Use /* */ block comments instead.`);
      }
      hasError = true;
    }
  }
}

if (hasError) {
  console.error('\n❌ JS validation failed — fix errors above before merging');
  process.exit(1);
} else {
  console.log('\n✅ All JS blocks valid');
}