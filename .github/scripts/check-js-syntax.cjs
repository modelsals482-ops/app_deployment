// .cjs because package.json now sets "type": "module" for Astro; this is a plain
// CommonJS script and Node would otherwise refuse the require() calls.
const fs = require('fs');

// Every page, not a hand-kept list — landing.html carried a broken form for weeks
// while sitting outside the old two-file list.
// Every page, not a hand-kept list - landing.html carried a broken form for weeks
// while sitting outside the old two-file list.
//
// Takes the directory to scan, because the pages are built output now (dist/) rather
// than files at the repo root. Empty means the build did not run, or ran somewhere
// else - fail rather than pass a check that inspected nothing.
const dir = process.argv[2] || '.';
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort();
if (htmlFiles.length === 0) {
  console.error(`No .html files in "${dir}" - nothing was checked. Did the build run?`);
  process.exit(1);
}
let hasError = false;

for (const file of htmlFiles) {
  if (!fs.existsSync(require('path').join(dir, file))) continue;
  const html = fs.readFileSync(require('path').join(dir, file), 'utf8');
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