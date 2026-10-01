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

## Open decisions (not yet locked)

Candidates that came up but have no entry yet — promote to a numbered entry
once settled:

- **Deploy workflow:** drag & drop vs Git-connected. Affects whether
  `netlify.toml` (headers, redirects) applies at all.

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
