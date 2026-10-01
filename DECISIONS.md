# Decisions

A running log of locked decisions for the Spicy landing page and docs site.
Each entry records the context, the decision and its consequences, so later
work doesn't re-litigate choices and follow-ups don't get lost.

- **Accepted** — in force, build against it.
- **Superseded by D-XXX** — replaced by a later entry; kept for history.
- **Proposed** — not locked yet; still fair game.

New entries go at the bottom, numbered in order. See the template at the end.

---

## D-001 — Docs pages live at the domain root, one folder per page

- **Date:** 2026-10-01
- **Status:** Accepted

**Context.** The docs (installation, setup, POS flows, back office, reports)
are the next phase: plain HTML pages sharing the landing page's
`assets/css/site.css` and `assets/js/site.js`. The site is hosted on Netlify
as its own site at `spicy.akorede.dev` (a subdomain of the existing portfolio
domain; the portfolio keeps its own Netlify site). The open question was
whether docs URLs look like `spicy.akorede.dev/<page>/` or
`spicy.akorede.dev/docs/<page>`.

**Decision.**

- Each docs page is a top-level folder containing an `index.html`:
  `introduction/index.html`, `installation/index.html`, `setup/index.html`, …
  Served as `spicy.akorede.dev/introduction/`, `/installation/`, `/setup/`, …
- No redirects or rewrites shape docs URLs, and no build step is introduced.
- `docs/index.html` stays as the docs hub (an overview linking to every
  page); the landing page keeps linking to `docs/`.
- The trailing-slash form is canonical, as Netlify serves `folder/index.html`
  at `/folder/` and 301s `/folder` to it.

**Consequences.**

- Zero configuration: works identically for drag & drop and Git-connected
  deploys. (A redirect-based scheme via `netlify.toml` would silently break
  under drag & drop, which ignores that file.)
- Every docs page keeps the existing relative-path pattern:
  `../assets/...` for shared assets, `../index.html` for home,
  `../<page>/` for other docs pages.
- Adding a page later means creating the folder + `index.html`, then linking
  it from the docs hub (and nav/footer where relevant).

---

## D-002 — The full docs skeleton ships up front

- **Date:** 2026-10-01
- **Status:** Accepted

**Context.** Docs content is not written yet, but agreeing the URLs and page
set later would mean moving files and breaking links. The choice was to build
the entire structure now, deploy it, and fill content into existing pages.

**Decision.**

- Eleven pages, one folder each, all under the URL scheme of D-001:
  `introduction/`, `installation/`, `setup/`, `menu/`, `inventory/`, `pos/`,
  `backoffice/`, `accounting/`, `reports/`, `troubleshooting/`, `glossary/`.
- `docs/index.html` is the hub, grouping pages as Getting started / Guides /
  Reference; it links every page and is indexable.
- Placeholder pages ship with `<meta name="robots" content="noindex">` and a
  "being written" note; the meta comes off when content lands.
- The landing page links at the real pages (hero buttons and footer columns).
- Adding a page later: create the folder + `index.html`, then add it to the
  sidebar (all pages) and the hub. Existing URLs never change.

**Consequences.**

- The skeleton deploys immediately; placeholders stay out of search results
  via `noindex` until they have content.
- The sidebar is duplicated in every page (no build step); a navigation change
  touches all twelve files. Accepted for now.

---

## D-003 — Docs pages use the v2 landing shell

- **Date:** 2026-10-01
- **Status:** Accepted

**Context.** The landing page was rebuilt on `assets/css/landing.css` (v2),
but the docs placeholder still used the older `site.css` design. Shipping docs
in the old shell would look like a different website.

**Decision.**

- Every docs page loads `assets/css/landing.css` then a docs-only layer,
  `assets/css/docs.css` (sticky sidebar, article typography), plus
  `assets/js/landing.js`.
- Same header, theme toggle, and footer as the landing page. The docs header
  drops the "Partner with Us" button because the waitlist modal is not part of
  the docs pages.
- The docs layer adds no dependencies and no build step.

**Consequences.**

- `landing.js` is shared: the waitlist modal is optional (it binds only when
  `#waitlist-modal` exists), so docs pages are safe without it.
- `assets/css/site.css` and `assets/js/site.js` are now referenced by nothing;
  retirement is an open decision below.

---

## Open decisions (not yet locked)

Candidates that came up but have no entry yet — promote to a numbered entry
once settled:

- **Deploy workflow:** drag & drop vs Git-connected. Affects whether
  `netlify.toml` (headers, redirects) applies at all.
- **Retire the legacy assets:** `assets/css/site.css` and `assets/js/site.js`
  are no longer referenced by any page.

---

## Template

````md
## D-XXX — <decision in one line>

- **Date:** YYYY-MM-DD
- **Status:** Accepted | Superseded by D-XXX | Proposed

**Context.** Why a decision was needed.

**Decision.** What was decided, as concrete rules.

**Consequences.** What follows from it, including follow-up work.
````
