# Přechod alsflow.cz na Astro

Tahle větev je místo, kde bude bydlet přepis. Odbočená z `preview`
(commit `331dafe`), takže vychází z hotového redesignu, ne ze staré podoby webu.

> **Stav: prázdná příprava.** Nic se zatím nepřepsalo. Tenhle soubor říká,
> proč do toho jít, co to stojí, a v jakém pořadí to udělat.

---

## Proč vůbec

Web má **18 stránek** a **329 kB HTML**. Hlavička, patička a skript s loaderem
jsou v každém souboru **zkopírované**: šest kopií navigace, šest patiček,
sedm kopií loaderu. Když se změní jedna položka v menu, musí se to opravit
na šesti místech a na sedmé se na to zapomene.

To je jediný skutečný důvod. Ne rychlost, ne moderní stack.

**Astro vydá pořád obyčejné statické HTML.** Ve výchozím nastavení neposílá
do prohlížeče žádný JavaScript navíc, takže web zůstane přesně tak rychlý,
jak je teď. Layout se napíše jednou a stránka je jen obsah.

## Co to stojí

**Přibude build krok.** To je přesně to, co dům­ní postup u klientských webů
záměrně odmítá: žádný build, žádný CMS, žádné závislosti k aktualizaci.
Znamená to `node_modules`, `package.json` a build, který se za dva roky může
rozbít kvůli něčemu, co s webem nesouvisí.

⚠️ **Na to pozor v textech.** `/tvorba-webu` prodává „bez build kroku".
U klientského webu o osmi stránkách to platí dál a nic se nemění. U našeho
vlastního webu o osmnácti stránkách je to jiná situace — a když se na to někdo
zeptá, tohle je ta odpověď. Kdyby se argument otočil na „build krok je fajn",
rozbije to pozici celé stránky.

**Klientské weby na Astro nepřecházejí.** gen1.cz má jedenáct stránek,
znalecsekelova.sk osm. Tam se duplicita ještě vyplatí víc než závislosti.

## Pořadí prací

1. `npm create astro@latest` do podsložky, `output: 'static'`, žádná integrace.
2. `src/layouts/Base.astro` — hlavička, patička, loader, `<head>` s jedním
   místem na titulek, popis a kanonickou adresu.
3. Nejdřív **jedna** stránka: `o-nas` (nejmenší z nových). Porovnat vydané HTML
   se současným souborem — mají si být rovné až na bílé znaky.
4. Zbytek nového systému: `index`, `tvorba-webu`, `vyvoj-softwaru`,
   `ai-asistenti`, `kontakt`.
5. Staré stránky (`cenik`, `ochrana_dat`, `dpa`, `onboarding`, `landing`,
   `dekujeme`, `404`, vertikální stránky) přenést **beze změny** jako soubory
   v `public/`. Přepisovat je až tehdy, když se stejně mění obsah.
6. `api/*.js` patří do `public/api/` respektive zůstávají jako Vercel funkce —
   nesahat na ně, jsou to serverless funkce, ne stránky.
7. `vercel.json` beze změny: `cleanUrls`, hlavičky i CSP zůstávají.

## Co se nesmí ztratit

Tohle už jednou každé stálo reálnou chybu:

- **`cleanUrls: true`** — kanonická adresa a `og:url` bez `.html`.
- **CSP `script-src 'self'`** — nic z CDN. Knihovny zůstávají v `assets/vendor/`.
  Astro nesmí začít vkládat skripty z jiného původu.
- **Nový fetch = nový host v `connect-src`** ve `vercel.json`.
  Hlídá `.github/scripts/check-csp-hosts.js`.
- **Odhalování při rolování musí selhat otevřeně.** Co se skrývá skriptem,
  musí být bez skriptu vidět.
- **Kontrast proti WCAG 2.2 AA** před spuštěním.
- Oba kontrolní skripty v `.github/scripts/` musí dál běžet — po přepisu
  na vydaný výstup, ne na zdroj.

## Kdy to zahodit

Když po přepisu první stránky vyjde najevo, že vydané HTML nesedí, nebo že
build přidává víc práce, než kolik ušetří kopírovaná hlavička — zahodit větev
a zůstat u ručního HTML. Duplicitní hlavička v šesti souborech je pořád
menší problém než build, kterému nikdo nerozumí.

---

Historie: dva starší pokusy o Astro (`astro-migration`, `astro-rewrite`) se
nikdy nesloučily a měsíce práce na `main` je předběhly. Jsou zachované jako
značky `archiv/astro-migration` a `archiv/astro-rewrite`, kdyby v nich něco bylo.
**Nezačínat z nich** — začít z `preview`, jako tahle větev.
