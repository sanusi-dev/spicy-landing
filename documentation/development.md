# Development

## Getting set up

Follow [Installation](installation.md) first. That gets you a running system.

```bash
make init
make dev
```

`make dev` runs Django and the asset build together through `scripts/dev.sh`. Use
`make django` for Django alone when you are not changing templates or assets.

## The stack

| Layer | Choice |
|---|---|
| Language | Python 3.14 |
| Framework | Django 6.0 |
| Database | PostgreSQL 17. The only supported backend. |
| Templates | Django templates, server-rendered |
| Interactivity | HTMX for partial swaps, Alpine.js for local state |
| Styling | Tailwind CSS |
| Assets | Vite |
| Dependencies | uv for Python, npm for the front end |
| Tasks | Celery with Redis, wired but with no scheduled jobs |
| Auth | django-allauth |

No REST API layer, no client-side framework, no websocket transport. The
server-rendered approach is what keeps a till usable on a modest machine.

## Project layout

```
spicy/            settings, root URLs, WSGI, Celery
apps/             the project packages
  users/          accounts, roles, avatars
  settings/       the restaurant record, production units, role assignment
  inventory/      items, warehouses, bins, ledger, stock documents
  menu/           menus, prices, add-ons, variants
  payments/       payment modes and GL mapping
  staff/          shifts, opening floats, reconciliation, cash-outs
  orders/         orders, lines, payments, tickets, POS views
  accounting/     chart of accounts, GL, journals, supplier payables
  reports/        daily P&L, sales reports, ledger reports
  web/            role routing, middleware, shared chrome
  utils/          shared base model, form helpers, rounding
templates/        the page shell, POS, back office, auth
assets/           Vite source
static/           built assets
media/            uploaded item and profile images
docs/             internal architecture reference
```

`apps/` is a top-level package directory, not a child of `spicy/`.

## Where the logic lives

Business rules live in models and services, not in views.

- **`models.py`** — validation, state transitions, guarded saves, immutable
  records. Most invariants are enforced here so they hold no matter which view
  touches the record.
- **`services.py`** — multi-record transactions. Anything that spans two tables
  and must succeed or fail together is a service function, decorated with
  `@transaction.atomic`.
- **Views** — parse the request, call the service, render. If you are writing
  business logic in a view, it probably belongs in a service.

The cross-app coupling concentrates in `orders/services.py`, which coordinates
inventory, menu, payments, settings, staff, and accounting. Settlement in
particular is one transaction spanning stock, payments, orders, and the ledger —
which is why it is a service and not a view.

## Conventions worth following

**Guarded saves over validation in views.** Financial and stock records override
`save()` to refuse illegal transitions and refuse edits outright. Keep the rule in
the model so it cannot be bypassed by a new view, a management command, or the
admin.

**Service functions own transactions.** Use `@transaction.atomic` and lock rows
you are about to modify. Order settlement, shift close, and stock submission all
lock the relevant rows before reading them.

**Fail closed on missing configuration.** When an account or setting is absent,
raise an error rather than substituting a default. A loud refusal at the moment of
the transaction beats a silent omission discovered in a report weeks later.

**Snapshot, do not reference, for historical lines.** Order lines and tickets copy
the name, price, and department at the time. Renaming an item must not rewrite
history.

**Money goes through `utils/rounding.py`.** `money()` for two places half-even,
`cash_round()` for whole naira half-up, `percent()` for three places. Do not call
`Decimal.quantize` directly.

**No Django signals for domain logic.** The only signals are for avatar file
cleanup and signup notification. Side effects are explicit calls from services, so
reading the call chain tells you what happens.

## Tests

```bash
make test
make test ARGS='apps.orders.tests.test_order --keepdb'
```

Django's test runner — no pytest, no external factory library. Fixtures are
`setUp` and `setUpTestData` methods.

Roughly 650 tests across 57 files, weighted towards the areas where correctness
matters most: the order lifecycle, stock valuation, ledger posting, and shift
reconciliation.

| App | Focus |
|---|---|
| orders | Lifecycle, settlement, tickets, reservations, returns, POS views |
| inventory | Ledger valuation, every document, conversions, recipes |
| accounting | Ledger posting, journals, payables, cash variance |
| staff | Shifts, reconciliation, cash-outs |
| reports | P&L computation, sales and ledger reports |
| settings | Restaurant record, production units, role assignment |
| menu | Prices, add-ons, variants |
| web | Role routing, middleware |

Shared setup lives in `apps/web/tests/base.py` and per-app `helpers.py`. The
accounting test helper builds a chart of accounts namespaced by restaurant id so
tests do not collide.

`--keepdb` is significantly faster when iterating on one module.

## Code quality

```bash
make ruff-format     # format
make ruff-lint       # lint and fix
make type-check      # mypy
make djlint-check    # template lint
```

Or install the hooks once and let them run on commit:

```bash
uv run pre-commit install --install-hooks
```

Configuration is in `pyproject.toml`: Ruff at 120 columns targeting Python 3.14,
mypy via the Django plugin, djlint in the Django profile.

## Adding a feature

1. Model and validate in `models.py`. Override `save()` for invariants that must
   hold regardless of caller.
2. If it spans records, add a service function with `@transaction.atomic` and the
   locks it needs.
3. Add the view, the form, the URL, and the template.
4. Declare the required role with the decorator from `apps/users/decorators.py`.
   Every view declares it explicitly; nothing infers it from the URL.
5. Write tests. For business rules, the test is the specification.
6. `make migrations`.
7. Run the suite.

If the feature changes a workflow, update the documentation as part of the same
change — the README's claim table maps marketing statements to their backing
evidence, and a feature that changes behaviour should update both.

## Management commands

| Command | Does |
|---|---|
| `seed_pos_setup` | Builds a working setup: restaurant, warehouses, payment modes, production units, accounts, example menu. |
| `seed_chart_of_accounts` | Seeds the chart and fiscal year, filling unset account references. Safe to re-run. |
| `seed_menu_catalog` | Seeds example items, variants, prices, and add-ons. `--force` resets. |
| `promote_user_to_superuser` | Grants superuser and staff flags to a named user. |
| `backfill_item_images` | Assigns the default image to items without one. |
| `bootstrap_celery_tasks` | Syncs `SCHEDULED_TASKS` to the beat schedule. |

## Front end

```bash
npm run dev          # watch and rebuild
npm run build        # production build
npm run type-check   # TypeScript check
```

Vite writes to `static/`. Django reads the manifest through django-vite, so in
development it points at the dev server and in production at the built manifest.

Templates use Tailwind classes directly. Alpine handles dialogs, focus, and local
state. HTMX swaps partials; keep the anchors stable, because partials depend on
exact target ids such as `#pos-main` and `#cart-panel`.

## Things to be careful about

**The `DEBUG`-gated admin bypass.** Superusers bypass every admin write lock when
`DEBUG` is on. The admin locks are keyed on that flag, so it is safe in
development and unsafe anywhere else.

**Role checks query on every access.** The role properties are plain properties,
not cached. Each access runs a small indexed query. It is fine at restaurant
traffic; be aware of it if you add role checks to a hot loop.

**Cancellation dates.** Reversals are dated on the day you cancel, not the original
date. This is intentional and is asserted by tests. Do not "fix" it to backdate.

**Settlement-time valuation on returns.** Returns reverse at the original sale's
rate, not the current weighted average. If a bin has re-blended since, the return
still reverses exactly. There are tests for both the rising and falling cases.

**Food cost is a count.** Do not add automatic ingredient deduction at the point
of sale. The whole reporting design depends on the kitchen count being the source
of food cost.