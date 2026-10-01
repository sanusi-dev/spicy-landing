# Spicy landing page

Static, dependency-free rebuild of the [ury.app](https://ury.app) landing page,
re-skinned for Spicy. This is the **landing page first pass**: the design,
layout and interactions are 1:1 with the reference site; the marketing copy is
still the reference text and gets rewritten in the next pass.

- **No build step, no server, no dependencies.** Plain HTML + CSS + vanilla JS.
- **Deploy by drag & drop** to Netlify (or any static host).
- **Images are placeholders** until real screenshots are supplied — every slot
  is documented below and marked in the HTML.

---

## Preview locally

The page references a `docs/` folder, so serve it over HTTP (opening
`index.html` directly works, but the Docs links won't resolve):

```bash
cd /home/breezy/Documents/dev/spicy-pos-landingpage-and-documentation
python3 -m http.server 8899
# open http://localhost:8899/
```

## Deploy to Netlify

The repo is <https://github.com/sanusi-dev/spicy-landing> (public).

**Git deploy (recommended).** Connect it once and every push to `main`
publishes:

1. <https://app.netlify.com/start> → **Import an existing project** → GitHub.
2. Pick `spicy-landing`. Leave build command **empty** and publish directory
   as `.` — `netlify.toml` already sets this.
3. Rename the site: **Site configuration → Site details → Change site name**
   (e.g. `spicy-pos`).
4. Custom domain `spicy.akorede.dev`: **Domain management → Add a domain**.
   - If `akorede.dev` uses Netlify DNS, Netlify can add the record for you.
   - Otherwise create a `CNAME` record for `spicy` pointing at your
     `*.netlify.app` hostname at your DNS provider.
   - HTTPS is provisioned automatically.

**Drag & drop** still works if you just want a preview: drop the folder on
<https://app.netlify.com/drop>. Note this ignores `netlify.toml` **and**
`.gitignore`, so it uploads `preview/` and `fonts/` too (~5 MB of design
exploration that visitors never request). Prefer the Git deploy.

---

## File map

```
index.html                     the landing page (all copy + sections)
docs/index.html                documentation placeholder (built out later)
assets/
  css/site.css                 fonts + reset + design system + project tweaks
  js/site.js                   nav, reveals, tabs, modal, form
  fonts/                       Geist + Geist Mono (self-hosted variable fonts)
  img/
    logo.svg                   Spicy lockup (light)
    logo-inverse.svg           Spicy lockup (dark theme)
    screens/pos-main.webp      real POS screenshot used in the hero
    og-image.png               social preview (not wired up yet)
    placeholders/              generated placeholder art (see below)
  logo/                        original Spicy brand assets (svg + favicons)
tools/
  make_placeholders.py         regenerates assets/img/placeholders/
  install_hero_shot.py         turns a pasted capture into screens/pos-main.webp
  tighten_site_logo.py         crops assets/img/logo*.svg to the artwork bounds
```

**Logo size:** `assets/img/logo.svg` and `logo-inverse.svg` are the site's copies
of the brand lockup. The exported lockups size their `viewBox` from the
wordmark's layout box, which reserves the font's full ascender height — but
"spicy" has no ascenders, so ~26% of the height is empty and the top padding is
3× the bottom. `tools/tighten_site_logo.py` rewrites the `viewBox` on these two
files so `height` in CSS equals the visible artwork. Re-run it if the lockup is
re-exported from `tools/generate.py`:

```bash
~/.venv/filetools/bin/python tools/tighten_site_logo.py
```

The palette masters under `assets/logo/` are intentionally left untouched.

**Netlify Form detection:** `index.html` contains a hidden `waitlist` form.
Keep it in the file or the partner form stops working.

---

## Replacing the images

The hero is a real screenshot: `assets/img/screens/pos-main.webp`. The rest of
the artwork is generated SVG placeholders under `assets/img/placeholders/`.

Drop a real file into `assets/img/`, then update the matching `src="…"` in
`index.html` (each remaining slot has an `IMAGE SLOT` comment right where it
lives).

| Slot | Where it appears | Real asset |
|---|---|---|
| `screens/pos-main.webp` | Hero screenshot — **done** | 1880×925 WebP, 73 KB |
| `placeholders/og-image.svg` | Social share preview | `assets/img/og-image.png` (1200×628) |

To install a new hero capture, drop the file in the project root and run:

```bash
~/.venv/filetools/bin/python tools/install_hero_shot.py "Pasted image.png"
```

It resizes to 1880px wide, flattens an unused alpha channel, writes
`assets/img/screens/pos-main.webp`, and prints the `width`/`height` attributes
to paste into `index.html`.

> Social platforms do not render SVG, so the `og:image` / `twitter:image` meta
> tags still need a PNG/JPG. `assets/img/og-image.png` already exists but is
> not referenced yet.

`placeholders/intelligence-huf.svg`, `placeholders/video-announcement.svg`,
`placeholders/client-*.svg` and `placeholders/hero-pos.svg` are left over from
sections that were removed (Intelligence, "Trusted by", "In the wild", and the
old hero respectively) and are no longer referenced by `index.html`.

Regenerate placeholders (e.g. after changing sizes):

```bash
~/.venv/filetools/bin/python tools/make_placeholders.py
```

---

## Editing copy

All copy lives in `index.html`, in page order:

1. Nav + hero
2. Hero screenshot
3. Why Spicy
4. Core value cards
5. Platform tabs (`#platform`) — six panels, each with chips + a mock visual
6. Audience (`#audience`), getting started
7. Open-source strip + final CTA
8. Footer

The copy is Spicy's own as of the September 2026 rewrite. Every product claim
traces to `FEATURES.md` in the RestPOS repo (`~/Documents/dev/RestPOS`), so
**check it there before adding a feature bullet** — the page previously carried
ury.app text promising ERPNext/Frappe, AI, floor plans, kiosks and multi-outlet
support, none of which Spicy has.

Things the page deliberately does not claim, because they are Planned or
Deferred in `FEATURES.md`: the local print agent (printer config exists, the
agent does not), customer master / loyalty, discounts and coupons, and
multi-branch. Mock currency is naira and the sample menu is Nigerian to match
the project's whole-naira rounding.

The hero proof strip makes structural claims about the product rather than
social proof, since there is no customer count to cite yet.

## Brand tokens

Everything themes from one place: the `--accent-*` ramp in `:root` of
`assets/css/site.css` (light) and `html[class~=dark]` (dark).

```css
/* light */
--accent-400: #ea580c;   /* eyebrow rule, decorative */
--accent-500: #c2410c;   /* buttons, links, active states, stat values */
--accent-600: #9a3412;   /* button hover */

/* dark */
--accent-500: #fb923c;
--accent-600: #fdba74;   /* button hover */
```

The light-theme `--accent-500` is deliberately a deeper orange: white text on
it measures 5.2:1 (WCAG AA). The brand's brighter flame orange (`#F97316`)
measures 2.8:1 against white, so it is used for the decorative accents and the
hero glow, and as the dark-theme primary. If you prefer the bright orange on
buttons in light mode too, pair it with dark ink text (`var(--ink-950)`) which
measures 6.9:1 — one small change to `.ury-btn--primary`.

**Fonts:** Geist / Geist Mono are self-hosted in `assets/fonts/`. Swap the
`@font-face` blocks at the top of `site.css` to use a different family.

## Theme

Light is the default, matching the reference design; the full dark theme is
retained. To follow the operating system setting, add
`data-follow-system-theme` to the `<html>` element of `index.html` and
`docs/index.html`.

Preview screenshots: `preview/landing-light.jpg` and `preview/landing-dark.jpg`.

## The partner form

"Partner with Us" opens the waitlist modal. Submissions POST to a Netlify Form
named `waitlist`:

- View submissions in Netlify: **Forms → waitlist**.
- Add an email notification: **Forms → Form notifications**.
- The Netlify free tier includes 100 submissions/month.
- Locally the form shows the success state without sending anything and logs
  `local preview: waitlist submission not sent.` to the console.
- To point it somewhere else, edit `CONFIG.waitlistEndpoint` in
  `assets/js/site.js`.

## Documentation (next phase)

`docs/index.html` is a styled placeholder that keeps every Docs link working.
The plan is plain HTML pages that share `assets/css/site.css` and
`assets/js/site.js`, linked from the landing page nav/footer.

Each docs page lives in a top-level folder (`introduction/index.html`,
`installation/index.html`, …) so it is served at `spicy.akorede.dev/introduction/`
etc., with `docs/` as the hub. Locked decisions like this one are logged in
[DECISIONS.md](DECISIONS.md).

## Notes

- Interactions were reimplemented in vanilla JS with no dependencies: nav
  scroll state, mobile nav menu, IntersectionObserver reveals, tabs, and the
  modal with validation.
- `tools/`, `preview/`, `fonts/` and `assets/logo/` contain earlier Spicy brand
  work (logo forge, previews, brand fonts). Nothing there is used by the site
  yet beyond `assets/logo/favicons/`.
- Accessibility: tabs are keyboard operable, modals trap focus and close on
  Escape, all interactive elements are real buttons/links.
