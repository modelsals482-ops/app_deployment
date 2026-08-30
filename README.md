# alsflow.cz

Web ALSflow — weby, software na míru a AI asistenti pro malé firmy.
Provozuje Retail Shops s.r.o., IČO 02512556.

---

## Vetve: kde se pracuje a kde se spousti

**Na `main` se nic nezkousi.** `main` je produkce, jde rovnou na alsflow.cz, a kazdy
push tam muze rozbit zivy web. Neni na to zadny mezikrok.

```
preview   sem jde vsechna prace          -> app-deployment-git-preview-als-incs-projects.vercel.app
main      jen odsouhlasene zmeny         -> alsflow.cz
```

Postup:

```bash
git checkout preview          # veskera prace sem
# ... zmeny, npm run build, kontroly ...
git push origin preview       # Vercel sam postavi nahled
```

Nahled je vzdy na stejne adrese, ukazuje spicku vetve `preview`:

    https://app-deployment-git-preview-als-incs-projects.vercel.app

Az to na nahledu sedi, teprve pak:

```bash
git checkout main
git merge --ff-only preview
git push origin main
```

`--ff-only` je zamerne. Kdyz to odmitne, znamena to, ze main mezitim dostal neco,
co preview nema, a je potreba to nejdriv srovnat, ne prejet.

### Nez se cokoli slouci do main

1. `npx astro build` projde
2. `node .github/scripts/check-js-syntax.cjs dist` projde
3. `node .github/scripts/check-csp-hosts.cjs dist` projde
4. stranka je videt na nahledu a vypada, jak ma
5. u tvrzeni o klientech: overit, ze to tak opravdu je

Bod 5 neni formalita. 2026-08-30 se na produkci dostala karta, ktera tvrdila, ze jsme
postavili web We Love Events. Nepostavili, delali jsme e-shop a asistenta. Slo to ven
bez toho, aby to Jakub predtim videl, a muselo se to stahovat z ziveho webu.

---

## Jak to běží

**Astro se statickým výstupem.** Do prohlížeče nejde žádný JavaScript navíc oproti tomu,
co si stránka sama vyžádá — Astro tady jen skládá HTML, které by se jinak psalo ručně
osmnáctkrát.

```
src/layouts/Base.astro     hlavička, patička, loader, skripty — jedno místo pro všechny stránky
src/pages/*.astro          stránky nového designu
public/                    všechno ostatní beze změny: starší stránky, obrázky, styly,
                           písma, robots.txt, sitemap.xml, llms.txt
api/                       serverless funkce na Vercelu (kontaktní formulář, onboarding)
vercel.json                bezpečnostní hlavičky, CSP, cleanUrls, cache
.github/scripts/           kontroly, které běží nad vydaným výstupem
```

```bash
npm install
npm run dev      # vývoj
npm run build    # vydá dist/
npm run check    # kontroly nad dist/ — spustit před commitem
```

### Proč Astro, když prodáváme weby bez build kroku

Protože osmnáct stránek je jiná situace než osm. Hlavička, patička a loader byly předtím
zkopírované v každém souboru — šest kopií navigace, šest patiček, sedm loaderů — a už se
kvůli tomu rozešly: čtyři stránky slibovaly v rozbalovacím menu „ozvu se týž den“, dvě ta
položka chyběla úplně. Nikdo si toho nevšiml, protože nikdo nečte šest souborů vedle sebe.

**Klientské weby na Astro nepřecházejí.** gen1.cz má jedenáct stránek, znalecsekelova.sk osm.
Tam je duplicitní hlavička levnější než závislosti, které je potřeba udržovat. Podrobněji
v [ASTRO.md](ASTRO.md).

---

## Co se nesmí rozbít

Každá z těchhle věcí už jednou stála reálnou chybu.

- **`cleanUrls: true`** — kanonická adresa a `og:url` musí být bez `.html`, jinak Google
  vidí dvě adresy soupeřící o tutéž stránku.
- **CSP je `script-src 'self'`** — nic se nenačte z CDN. Knihovny patří do `public/assets/vendor/`.
- **Nový `fetch()` na cizí hostitele = nový záznam v `connect-src`** ve `vercel.json`.
  Hlídá `.github/scripts/check-csp-hosts.cjs`. Chat byl kvůli tomu jednou celý den mrtvý.
- **`api/package.json` musí zůstat `{"type":"commonjs"}`.** Kořenový `package.json` má
  `"type": "module"` kvůli Astru a funkce v `api/` jsou psané jako CommonJS. Bez toho
  souboru kontaktní formulář spadne až za běhu.
- **Kontroly běží nad `dist/`, ne nad kořenem.** V kořeni už žádné `.html` nejsou, takže
  kontrola spuštěná tam by nenašla nic a prošla by zeleně. Prázdný nález je proto chyba.
- **Co se skrývá skriptem, musí být bez skriptu vidět.** Odhalování při rolování začíná na
  `opacity: 0` — když se skript nenačte, obsah zmizí. Formuláře proto startují viditelné.
- **Kontrast proti WCAG 2.2 AA** před spuštěním. Zatím to odhalilo skutečnou chybu na
  každém webu, který jsme postavili.
- **Robots a indexace se nekombinují.** Stránka, která má `noindex`, se nesmí zakázat
  v `robots.txt` — robot by ji nestáhl, značku by nikdy neviděl a adresu by zaindexoval
  podle odkazů.

---

## Sliby, které web dává

Musí platit i ve špatném týdnu, jinak na web nepatří.

| | |
|---|---|
| Odpověď na poptávku | do **48 hodin** v pracovní dny, s návrhem termínu hovoru |
| Web živý | do **6–10 pracovních dnů**, s průběžným náhledem během práce |
| Drobná úprava ve správě | do **2 pracovních dnů** |
| Nasazení AI asistenta | do **5–7 pracovních dnů** |
| Software | termín podle rozsahu, domluvený po krátké analýze |

**Cena platí za dohodnutý rozsah.** Když si klient přidá funkci, cena té změny se řekne
předem — to je rozdíl oproti „cena se nemění“, což není pravda a zkušený zákazník tomu
nevěří.

**Měření je rozhodnutí klienta**, ne vlastnost, kterou prodáváme. Prezentace ho mít nemusí
a pak není potřeba ani souhlasová lišta; e-shop ho chce a dostane ho i s lištou.

---

## Barvy

Přechod tyrkysová → modrá → fialová (`--grad`) je jeden zdroj pravdy pro nadpisy, tlačítka,
obrysy karet i dosvity.

**Zelená `--green` má jednu úlohu: znamená „ano, tohle platí“** — volná kapacita, co je
v paušálu, hotový krok, odeslaný formulář, termín v rozcestníku. Nikdy není jen ozdoba,
jinak by konkurovala přechodu.

---

## Větve

| Větev | Co to je |
|---|---|
| `main` | co běží na alsflow.cz |
| `astro` | přepis na Astro + redesign, čeká na ceny |

Značky `archiv/*` uchovávají věci, které už nikam nevedou, ale mají se dát dohledat:

- **`archiv/prvni-web`** — první podoba alsflow.cz, od nasazení 20. 4. 2026 do přestavby
  na tři pilíře v srpnu. Jednostránkový prodejní web AI asistentů. Našel prvního platícího
  klienta a odnesl si všechny lekce, které dnes drží tenhle repozitář.
  Prohlédnout: `git switch --detach archiv/prvni-web`
- `archiv/astro-migration`, `archiv/astro-rewrite` — dva starší pokusy o Astro, které se
  nikdy nesloučily. **Nezačínat z nich**, práce na `main` je dávno předběhla.

---

## Nasazení

Vercel staví každou větev, takže každá má vlastní náhledovou adresu. Astro se detekuje
z `package.json`, žádné nastavení navíc není potřeba.

⚠️ Před posláním náhledu komukoliv zvenčí vypnout **Settings → Deployment Protection →
Vercel Authentication**, jinak narazí na přihlašovací obrazovku.

Proměnné prostředí (Vercel → Settings → Environment Variables, **po přidání redeploy**):

| Proměnná | Nutná | K čemu |
|---|---|---|
| `RESEND_API_KEY` | ano | bez ní `/api/contact` vrací 500 |
| `TURNSTILE_SECRET_KEY` | ano | **bez ní se ověření robota přeskočí a formulář odesílá bez ochrany** |
| `CONTACT_TO` | ne | výchozí `ryvola@alsflow.cz` |
| `RESEND_FROM` | ne | výchozí `ALSflow <info@alsflow.cz>` |

---

## Co zbývá

Živý seznam je v [NEXT_STEPS.md](NEXT_STEPS.md).
