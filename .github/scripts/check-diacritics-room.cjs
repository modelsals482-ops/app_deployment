// Fails the build when nadpisovy prechod prijde o svisle odsazeni.
//
// Proc to existuje: `background-clip: text` maluje jen uvnitr vlastniho boxu
// a ten je pri line-height 1.06 nizsi nez pismo. Vrsek carky nad "i" a hacku
// nad "e" pak zustane pruhledny - klient to hlasil trikrat za sebou a dvakrat
// se to "opravilo" na spatne vrstve. Odsazeni je jediny duvod, proc to dnes
// vypada spravne, a nic jineho by jeho smazani nezachytilo: build projde,
// stranka se vykresli, chybi jen par pixelu diakritiky.
//
// Kontroluje se vydany vystup (dist/), ne zdroj - stejne jako u ostatnich
// skriptu, aby se nekontrolovalo neco, co se do vydani nedostane.

const fs = require('fs');
const path = require('path');

const CSS = path.join(process.argv[2] || 'dist', 'assets/css/site-pages.css');

// Kolik odsazeni je potreba: pulka zaporneho prokladu, tedy
// (1.267 - 1.06) / 2 = 0.104em. Nize uz se diakritika useka.
const MIN_EM = 0.104;
const MUST_HAVE = ['.fade-head', '.fade-head .word-in', '.grad'];

const css = fs.readFileSync(CSS, 'utf8');

// Kazdy blok "selektory { deklarace }". Komentare pryc, at v nich skript
// nenajde selektor, ktery je jen popsany slovy.
const bez = css.replace(/\/\*[\s\S]*?\*\//g, '');
const bloky = [...bez.matchAll(/([^{}]+)\{([^{}]*)\}/g)];

const chybi = [];
for (const sel of MUST_HAVE) {
  const nalez = bloky.find((b) => {
    if (!b[1].split(',').some((s) => s.trim() === sel)) return false;
    const m = /padding-block:\s*([\d.]+)em/.exec(b[2]);
    return m && parseFloat(m[1]) >= MIN_EM;
  });
  if (!nalez) chybi.push(sel);
}

if (chybi.length) {
  console.error('CHYBA: prvek s background-clip: text nema misto na diakritiku.');
  console.error('Chybi padding-block aspon ' + MIN_EM + 'em u: ' + chybi.join(', '));
  console.error('Soubor: ' + CSS);
  process.exit(1);
}

console.log('OK: nadpisovy prechod ma misto na carky a hacky (' + MUST_HAVE.length + ' pravidla).');
