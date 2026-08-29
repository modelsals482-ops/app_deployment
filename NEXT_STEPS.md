# alsflow.cz — what is left before this branch can go live

Working checklist for the redesign on `claude/website-animations-design-l5d2ja`.
Written 2026-08-29. Full background is in the n8n repo: `session_logs.md`
(entry 2026-08-29) and `CLAUDE.md`.

Tick items off as they are done. Delete this file once the branch is merged.

---

## 1. Blocking — cannot launch without these

### [ ] 1.1 Four numbers from Jakub

Twelve loud yellow `doplnit` chips are waiting on **four** values:

| Value | Appears in |
|---|---|
| Response-time promise ("Odpovím do …") | `index.html` (hero + Proč my), `tvorba-webu.html` (price line + FAQ), `vyvoj-softwaru.html` (price line) |
| Web — price from | `index.html` (hero fact + Weby card), `tvorba-webu.html` (price line) |
| Web — monthly maintenance | `index.html` (Weby card), `tvorba-webu.html` (price line) |
| Software — price from | `index.html` (Software card), `vyvoj-softwaru.html` (price line) |

Find them all with:

```bash
grep -n 'class="todo"' *.html
```

The site must not ship with a single chip left. They are deliberately garish
so they cannot slip past.

### [ ] 1.2 `/cenik`, `/o-nas` and `/ochrana_dat` are still on the old design

Every new page links to all three from its nav and footer, so a visitor
clicking "Ceník" falls out of the redesign into a page with emoji icons,
a different header and a different footer.

On the new system: `index`, `tvorba-webu`, `vyvoj-softwaru`, `ai-asistenti`,
`kontakt`. Check which is which with:

```bash
for f in *.html; do grep -q site-pages.css "$f" && echo "NEW  $f" || echo "old  $f"; done
```

Porting a page means: swap the inline `<style>` block for
`site-pages.css` + `flash.css`, reuse the shared nav/footer markup from
`index.html`, and add the shared scripts from the bottom of `index.html`.

**`/cenik` also still describes chatbots only**, while the site now sells three
things. It cannot be rewritten before 1.1 lands, because it needs the web and
software prices.

`ochrana_dat.html` and `dpa.html` must keep their literal e-mail addresses —
that is the statutory contact point for GDPR requests, not a marketing CTA.

---

## 2. Decisions only Jakub can make

### [ ] 2.1 Analytics vs. the cookie claim

The new footer says *"Web nepoužívá cookies ani nástroje třetích stran."*
The rebuilt pages honour it. **`landing.html` and `dekujeme.html` still load
gtag and show a consent bar.**

```bash
grep -l "googletagmanager\|gtag(" *.html
```

Neither page is in the nav or `sitemap.xml` (`landing` looks like a paid-ads
page), which is why they were left alone — removing measurement from an ad
landing page is a business call.

Pick one:
- strip gtag + the consent bar from both, and the sentence becomes true site-wide; or
- soften the sentence so it does not claim more than the site does.

### [ ] 2.2 Merge path for two stacked branches

```
main (b8c8630, live)
 └── preview (639dd18)                        5 commits, never signed off
      └── claude/website-animations-…  (c70ef6c)   3 commits, this work
```

Either sign off both and merge together, or take `preview` first. Decide
before touching either branch.

---

## 3. Verify before `/kontakt` goes live

### [ ] 3.1 Vercel environment variables

`/api/contact` reads:

| Variable | Required | Note |
|---|---|---|
| `RESEND_API_KEY` | **yes** | without it the endpoint returns 500 |
| `TURNSTILE_SECRET_KEY` | strongly | **if unset, bot verification is skipped entirely** — the form still sends, just unprotected |
| `CONTACT_TO` | no | defaults to `ryvola@alsflow.cz` |
| `RESEND_FROM` | no | defaults to `ALSflow <info@alsflow.cz>` |

### [ ] 3.2 Turnstile sitekey is registered for the live domain

`kontakt.html` uses `0x4AAAAAAD2dJqPN10PUmbD9`, inherited from the old page.
Confirm it covers the domain `/kontakt` runs on. This could not be tested in
the sandbox — the egress proxy blocks Cloudflare, so the widget never renders
there.

### [ ] 3.3 Send one real submission from the preview

Verified in a browser already: empty submit flags the fields and sends
nothing; filling drives the meter to 5/5; a network failure restores the button
and resets the Turnstile token; success switches to the confirmation panel.

**Never tested: an actual end-to-end send**, because there is no `/api` when
serving the repo locally. Submit the live preview once and confirm the mail
arrives.

### [ ] 3.4 Turn off Deployment Protection before sharing a preview URL

Vercel → Settings → Deployment Protection → Vercel Authentication.
On by default; a client will hit a login wall without it.

---

## 4. Small stuff

### [ ] 4.1 `onboarding.html` still opens a `mailto:` from JavaScript

End of the onboarding wizard. It is a working feature, not a marketing CTA,
so it was left alone. Route it through `/kontakt` only if that is wanted.

### [ ] 4.2 Delete this file when the branch merges

---

## Ground rules that must not be broken

These have each already cost a real failure. Full list in the n8n repo's
`CLAUDE.md`.

- **Branch off `origin/main`, never off local `main`.** `git push origin HEAD:main`
  does not move the local ref, and branching off a stale `main` once shipped an
  empty review branch.
- **`cleanUrls: true`** — canonicals and `og:url` stay without `.html`, or Google
  sees two competing URLs per page.
- **CSP is `script-src 'self'`** — nothing loads from a CDN. Vendor libraries into
  `assets/vendor/`.
- **Any fetch to a new host must also be added to `connect-src` in `vercel.json`.**
  `.github/scripts/check-csp-hosts.js` enforces this and now scans
  `assets/js/*.js` as well as inline blocks.
- **Contrast against WCAG AA before shipping.** It has caught a real failure on
  every site so far, including twice on this branch.
- **Anything that hides content must fail open.** Reveal-on-scroll starts at
  `opacity: 0`; if the script does not load, the content is gone. The contact
  form therefore starts *visible* and the script adds the hiding class.

## Checks to run before any commit

```bash
node .github/scripts/check-js-syntax.js
node .github/scripts/check-csp-hosts.js
```
