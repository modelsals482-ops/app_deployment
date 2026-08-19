# alsflow.cz - production website

The live marketing site for **ALSflow** (AI assistants for Czech sole traders and small firms).
Static HTML, no build step, deployed on Vercel.

- **Live:** https://alsflow.cz (`www` 308-redirects to apex)
- **Host:** Vercel · **DNS:** Cloudflare (DNS-only / grey cloud, `A` → `216.198.79.1`)
- **Registrar:** Wedos (nameservers moved to Cloudflare 2026-07-20)
- **Deploys:** push to `main` → Vercel builds and publishes automatically

> ⚠️ **This is production.** Every push to `main` is live within about a minute. There is no
> staging branch.

---

## Current state

**Static HTML monolith, deliberately.** There is no framework and no build step: Vercel serves
these `.html` files as they are. `index.html` is a single 136 KB file with CSS and JS inline.

**A partial Astro rewrite exists on the branch `astro-migration`** - read
[Astro branch](#the-astro-branch-read-before-merging) before assuming it is ready. It is not a
drop-in replacement and merging it as-is would revert live fixes.

**Live integrations**

| Feature | Where it goes |
|---|---|
| Site chat "Klára" | `https://alsflow-chat.alsflow.cz/webhook/alsflow-chat` (Node bot on the WebGlobe VPS) |
| Contact + landing forms | `/api/contact` → Resend |
| Onboarding form | `/api/onboarding` |
| Bot protection | Cloudflare Turnstile (site key in the HTML, secret in Vercel) |
| Analytics | GA4 `G-CEX6XVFWD7`, Consent Mode, analytics off until the banner is accepted |

---

## Structure

```
index.html                        the homepage - 136 KB, CSS + JS inline
landing.html                      standalone lead-capture landing page
cenik.html  o-nas.html            pricing, about
e-mailove-odpovedi.html           product page - email replies
rezervace-pripominky.html         product page - bookings & reminders
ai-asistent-pro-kadernictvi.html  vertical landing - hairdressers
ai-asistent-pro-fyzioterapeuty.html  vertical landing - physios
onboarding.html                   client onboarding form
dekujeme.html                     thank-you page (form success target)
ochrana_dat.html  dpa.html        privacy policy, data processing agreement
404.html
api/contact.js                    Vercel function: contact + landing forms → Resend
api/onboarding.js                 Vercel function: onboarding form
vercel.json                       security headers (incl. CSP), cleanUrls, redirects
sitemap.xml  robots.txt  llms.txt
lenis.min.js                      self-hosted smooth scroll (CSP blocks CDNs - see traps)
.github/workflows/validate.yml    CI, runs on every push
.github/scripts/                  the two checks CI runs
```

## Required environment variables (Vercel → Settings → Environment Variables)

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | **yes** | all form email. Without it `/api/contact` returns 500 |
| `TURNSTILE_SECRET_KEY` | **set** | when present, a form POST without a valid token is rejected 400 |
| `CONTACT_TO` | no | default `ryvola@alsflow.cz` |
| `RESEND_FROM` | no | default `ALSflow <info@alsflow.cz>` |

---

## Traps - each of these has already broken the live site

### 1. `vercel.json` CSP `connect-src` must list every host the pages fetch

**This took the site chat down silently for over a week.** The chat widget was repointed to
`alsflow-chat.alsflow.cz`, but `connect-src` still allowlisted the retired Railway host. The
backend was healthy, the build passed, the deploy passed - and every visitor's browser blocked
the request before it left the page. **A CSP failure is invisible everywhere except a visitor's
console.**

> Change a `fetch()` target, change `vercel.json` **in the same commit**.
> `.github/scripts/check-csp-hosts.js` now fails the build on this. Do not remove it.

### 2. Never read these HTML files with PowerShell `Get-Content`

It double-encodes UTF-8 and turns every Czech diacritic into mojibake. It shipped a garbled live
site once. Use `[IO.File]::ReadAllBytes` / base64, or an editor that preserves encoding. **After
any scripted edit, verify the non-ASCII character counts are unchanged before pushing.**

### 3. Use `/* */` block comments in inline JS, never `//`

A `//` comment inside a minified IIFE swallowed the rest of the line and threw a `SyntaxError`
that killed the cookie-consent script.

### 4. Self-host third-party JS

`script-src 'self'` means a CDN `<script>` silently fails in production while working locally.
That is why `lenis.min.js` is committed here instead of loaded from a CDN. Any new fetch target
also needs adding to `connect-src`.

### 5. A Turnstile token is single-use

Call `window.turnstile.reset()` in the error path of any form, or the first failure permanently
breaks that form for the visitor.

---

## CI

`.github/workflows/validate.yml` runs on every push and PR to `main`:

1. **`check-js-syntax.js`** - parses every inline `<script>` in every `.html`. It used to check
   only two files by name, which is part of why `landing.html` carried a dead form endpoint
   unnoticed. It now globs all of them.
2. **`check-csp-hosts.js`** - extracts every `fetch()` target from the pages (resolving
   `fetch(WEBHOOK)` back to its `const`) and fails if a host is missing from `connect-src`.
   Relative URLs are covered by `'self'` and skipped.

**Limitation worth knowing:** the CSP check verifies the header and the code agree. It does
**not** check that the host is alive. It catches "you changed the endpoint and forgot the
header"; it does not catch "the host was deleted".

---

## The Astro branch - read before merging

The branch `astro-migration` is **not** a finished framework rewrite. What it actually contains:

- **One page** converted: `src/pages/index.astro`, still a single 54 KB file. It is not split
  into components or layouts.
- **Every other page sits in `public/` as untouched static HTML** - Astro passes them through
  without processing them.
- The genuine win: homepage CSS and JS are extracted to `public/styles/home.css` (57 KB) and
  `public/js/home.js` (25 KB), so they become separately cacheable instead of inline.
- `astro.config.mjs` has **no** sitemap integration and **no** i18n.

⚠️ **The branch is 7 commits behind `main` and diverged.** Merging it as-is would revert:
the CSP fix (bringing the chat outage back), the `landing.html` form fix, and both CI scripts.
Rebase it on `main` first and keep `main`'s `vercel.json`, `landing.html` and `.github/`.

---

## Accounts

| Service | What it controls |
|---|---|
| **Vercel** | hosting, deploys, all env vars and secrets |
| **Cloudflare** | DNS for alsflow.cz + Turnstile |
| **Resend** | all outbound form email |
| **Google** | GA4 + Search Console |
| **Wedos** | domain registrar |
| **WebGlobe VPS** | hosts Klára, the chat this site talks to |

Related repos: `modelsals482-ops/n8n` → `node-bots/` (the bots, including Klára) ·
`modelsals482-ops/financial_advisor` (business strategy docs).
