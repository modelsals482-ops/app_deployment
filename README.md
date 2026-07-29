# alsflow.cz — Astro

The alsflow.cz website, migrated from a single 139 KB `index.html` monolith to Astro.
Built to deploy on Vercel exactly like the old static site (same `vercel.json`, same `/api`
serverless functions, same URLs). **Not yet live** — this repo exists so a Vercel preview can
be verified before the domain is cut over. The old `app_deployment` repo stays as the rollback.

## What changed vs. the monolith

Nothing the visitor sees. The homepage was sliced apart for maintainability, byte-for-byte:

| Was (one file) | Now |
|---|---|
| 1042 lines of inline CSS | `public/styles/home.css` (served verbatim) |
| ~550-line inline JS bundle | `public/js/home.js` (served verbatim) |
| everything else | `src/pages/index.astro` — the markup + `<head>` + small positional scripts |

The homepage's small scripts (GA consent, JSON-LD, the hero animation, Lenis init) stay inline
via `is:inline` at their original positions. Literal `{`/`}` in markup (two `onclick`/`onkeydown`
handlers) are written as `&#123;`/`&#125;` so Astro doesn't parse them as expressions; the browser
decodes them back. A content-union diff against the live homepage confirmed **zero content lost,
zero added**.

The other 12 pages are carried **verbatim** in `public/` (they were already clean separate files —
no reason to touch them):
`404, ai-asistent-pro-fyzioterapeuty, ai-asistent-pro-kadernictvi, cenik, dekujeme, dpa,
e-mailove-odpovedi, landing, o-nas, ochrana_dat, onboarding, rezervace-pripominky`.

## Structure
```
src/pages/index.astro     the homepage (markup + head)
public/styles/home.css    homepage CSS (verbatim)
public/js/home.js         homepage JS (verbatim)
public/*.html             the 12 other pages (verbatim)
public/*.{png,txt,xml}    favicon, hero, og-image, lenis.min.js, robots, sitemap, llms
api/contact.js            Vercel function — contact form → Resend  (unchanged)
api/onboarding.js         Vercel function — onboarding form → Resend (unchanged)
api/package.json          {"type":"commonjs"} — keeps the CJS functions working under this ESM project
vercel.json               headers/CSP/cleanUrls/redirects (verbatim from the live site)
```

## Run locally
```bash
npm install
npm run build      # -> dist/
npm run preview    # serve dist/ (note: cleanUrls/redirects and /api functions are Vercel-only)
```
`npm run dev` also works for editing, but the inline `is:inline` scripts run only as classic
globals (same as production), so `build` + `preview` is the truest local check.

## CI
`.github/workflows/validate.yml` runs on every push/PR:
1. `astro build` must succeed (same build Vercel runs).
2. `scripts/check-js-syntax.js` parses every inline `<script>` in the built HTML **and**
   `public/js/home.js` — catches JS typos the build itself won't.

Vercel is a third gate: a failed build never promotes to production.

## Going live (do this yourself, when ready)
1. In Vercel → **Add New Project** → import this repo. Framework auto-detects as **Astro**
   (build `astro build`, output `dist`). No adapter needed.
2. Copy the **environment variables** from the current alsflow.cz project into the new one:
   `RESEND_API_KEY`, and any of `CONTACT_TO`, `ONBOARDING_TO`, `RESEND_FROM`, `TURNSTILE_SECRET_KEY`
   that are set. Without `RESEND_API_KEY` the forms return 500.
3. Deploy the preview. **Test on the preview URL before touching the domain:**
   submit the contact form and the onboarding form (confirm the Resend email arrives),
   click through `/cenik`, `/o-nas`, etc. (confirm `cleanUrls` resolves), check `/dakuji` → `/dekujeme`.
4. Only once the preview checks out: move the `alsflow.cz` domain to this project.
   The old `app_deployment` deployment stays as instant rollback.
