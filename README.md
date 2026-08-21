# alsflow.cz - production website

Marketing site for **ALSflow** (AI assistants for Czech sole traders and small firms).
**Astro 5**, static output, deployed on Vercel.

- **Live:** https://alsflow.cz (`www` 308-redirects to apex)
- **Host:** Vercel · **DNS:** Cloudflare (DNS-only / grey cloud) · **Registrar:** Wedos
- **Deploys:** push to `main` publishes within about a minute. There is no staging branch.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # -> ./dist
npm run preview    # serve ./dist exactly as Vercel will
```

> `npm run dev` does **not** run the `/api` functions. To exercise `/api/contact`
> locally, use the Vercel CLI, or test against a real deploy.

---

## Why Astro, and what it replaced

This was 13 hand-written HTML files where every page carried its own copy of the
`<head>`, the header, the footer, the cookie banner, and the design tokens. Changing
the footer meant editing it in six places, and analytics only existed on three pages
because nobody remembered to paste the snippet into the other ten.

The conversion kept every page's body content byte-for-byte. **Ten of the thirteen
pages render identical visible text**; the three that differ do so only because the
cookie banner wording is now the same on all of them instead of three variants.

| | Before | After |
|---|---|---|
| Total HTML shipped | 317 KB | **215 KB** |
| Homepage HTML | 139 KB | **75 KB** |
| CSS | inline, duplicated per page | shared hashed files, cached immutably |
| Pages with analytics | 3 of 13 | **13 of 13** |
| Sitemap | hand-maintained `sitemap.xml` | generated at build |
| Canonical URLs | copy-pasted per page | derived from the route |

## Structure

```
src/
  layouts/Base.astro        <head>, SEO, Open Graph, fonts, GA4, consent banner
  components/
    Header.astro            the shared .topbar header (6 pages)
    Footer.astro            links + copyright; `variant="legal"` for dpa/ochrana_dat
    Analytics.astro         GA4 + Consent Mode v2, denied until accepted
    CookieBanner.astro      the banner and its consent logic
  styles/global.css         design tokens, base, header/footer, banner
  pages/                    one .astro per route, page-specific CSS in a <style> block
api/                        Vercel serverless functions (contact, onboarding)
public/                     images, lenis.min.js, robots.txt, llms.txt
vercel.json                 security headers (incl. CSP), cache tiers, cleanUrls, redirects
.github/                    CI: JS syntax + CSP host checks
```

**`landing` and `dekujeme` keep their own `<header>` inline.** Theirs have no `.topbar`
wrapper and their CSS targets `header > a` directly, so reusing the shared component
would break their layout. **`index` keeps its own `<footer>`** because it is the only
one with the logo, the link grid and the full company address. Two one-offs and one
one-off do not justify variant props.

## Routing and URLs

`vercel.json` sets `cleanUrls: true`, so pages are served extensionless: `/cenik`,
not `/cenik.html`. Three things must agree with that and do:

- `build.format: 'file'` emits `cenik.html` rather than `cenik/index.html`
- `Base.astro` strips the `.html` off `Astro.url.pathname` when building the canonical
- the sitemap `serialize()` hook does the same to every URL it emits

Get one of them wrong and you ship canonicals pointing at URLs that 308-redirect.

---

## Traps - each of these has already broken the live site

### 1. `vercel.json` CSP `connect-src` must list every host the pages fetch

**This took the site chat down silently for over a week.** The widget was repointed to
`alsflow-chat.alsflow.cz` while `connect-src` still allowlisted the retired Railway
host. The backend was healthy, the build passed, the deploy passed, and every visitor's
browser blocked the request before it left the page. **A CSP failure is invisible
everywhere except a visitor's console.**

> Change a `fetch()` target, change `vercel.json` in the same commit.
> `.github/scripts/check-csp-hosts.js` fails the build on this. Do not remove it.

### 2. Inline scripts need `is:inline`

Astro otherwise bundles and hoists them, which breaks `gtag` ordering and moves code
out of `<head>`. Every browser-side script here is marked `is:inline` on purpose.

### 3. Use `/* */` block comments in inline JS, never `//`

A `//` comment inside a minified block once swallowed the rest of the line and threw a
`SyntaxError` that killed the cookie-consent script.

### 4. Never read these files with PowerShell `Get-Content`

It double-encodes UTF-8 and turns every Czech diacritic into mojibake. It shipped a
garbled live site once. After any scripted edit, check that the non-ASCII character
counts are unchanged before pushing.

### 5. Self-host third-party JS

`script-src 'self'` means a CDN `<script>` silently fails in production while working
locally. That is why `lenis.min.js` is committed rather than loaded from a CDN.

### 6. A Turnstile token is single-use

Call `window.turnstile.reset()` in a form's error path, or the first failure
permanently breaks that form for the visitor.

### 7. The chat has a static floor. Keep it in sync.

`index.astro` bakes in answers to the five most common questions (pricing, setup time,
what it does, industries, contact). Klára overrides them whenever she replies; if she
is unreachable, returns non-2xx, or returns an empty reply, the visitor still gets a
real answer instead of a dead end.

> **The cost of that pattern is duplication.** Prices now live both here and in
> `node-bots/services/alsflow-klara/src/prompts.js`. Change one, change the other.

## Caching

`vercel.json` tiers deliberately:

| Path | Cache-Control | Why |
|---|---|---|
| `/_astro/*` | 1 year, immutable | content-hashed, can never go stale |
| images, `lenis.min.js` | 1 day | stable filenames, so a swap must still propagate |
| `*.xml`, `*.txt` | 1 hour | |
| HTML | `max-age=0, must-revalidate` | a copy edit must be live immediately |

## CI

Runs on every push and PR to `main`:

1. **`check-js-syntax.js`** parses every inline `<script>` in every built page.
2. **`check-csp-hosts.js`** extracts every `fetch()` target and fails if a host is
   missing from `connect-src`.

The CSP check verifies the header and the code agree. It does **not** check that the
host is alive: it catches "you changed the endpoint and forgot the header", not "the
host was deleted".

## Accounts

| Service | Controls |
|---|---|
| **Vercel** | hosting, deploys, env vars (`RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`) |
| **Cloudflare** | DNS + Turnstile |
| **Resend** | all outbound form email |
| **Google** | GA4 `G-CEX6XVFWD7` + Search Console |
| **WebGlobe VPS** | hosts Klára, the chat this site talks to |

Related: `modelsals482-ops/n8n` → `node-bots/` (the bots) ·
`modelsals482-ops/financial_advisor` (business strategy docs).
