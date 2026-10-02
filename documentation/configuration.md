# Configuration

Spicy has one configuration record for the installation. Everything that could
differ between restaurants — the trading name, the active menu, which warehouse
the counter sells from, how many drafts a cashier may hold open — lives on it.
You cannot create a second one.

## Restaurant settings

**Settings → Restaurant settings.** Requires a manager or administrator.

| Field | What it does |
|---|---|
| Company | Trading name, printed on documents. |
| Invoice series prefix | Prefix for invoice numbers. Defaults to `REST-`. |
| Address | Restaurant address. |
| Active menu | Which menu the POS shows. Items on a disabled menu stay in the database but do not appear at the counter. |
| Central Store warehouse | Where supplier deliveries and market purchases are received. |
| Bar / POS warehouse | Where drink stock is deducted when an order is paid for. |
| Max open drafts | How many unsent orders a shift may hold open. Default 50. |
| Allow cashiers full history | When off, cashiers see only today's paid sales in order history. Managers always see everything. |
| Require payment reference | Forces a reference on every non-cash payment. |
| Variance approval threshold | A cash difference larger than this needs a manager's written explanation to close. |

Three warehouses are expected: the central Store, the Kitchen, and the Bar. They
must be different warehouses, and the Bar must be the one assigned as the POS
warehouse. The system refuses configurations that contradict this.

## Production units

A production unit is a station: the kitchen and the bar. There is exactly one per
department, and the department determines which tickets it receives.

**Settings → Production units.** Viewing requires manager or administrator;
editing requires manager or administrator.

Each production unit holds:

- Its warehouse — the Kitchen's is where food ingredients live.
- Printer settings: IP address, paper width (58mm or 80mm), and cut mode (full,
  partial, or none).
- Suppress ticket printing for takeaway orders. Useful for a bar that does not
  need a ticket on drinks taken away.
- Three ledger accounts: income, sales returns, and expense.

Assigning the department's income account is what splits food revenue from drinks
revenue in the ledger. Without it, sales fall back to the restaurant's default
income account and you lose the split.

## Payment modes

**Settings → Payments.**

Four types exist, and the type decides how the mode behaves:

| Type | Behaves as |
|---|---|
| Cash | Can dispense change. Can be declared as the shift's drawer. |
| Bank | Electronic. Overpayment rejected. Reference required if the restaurant demands one. |
| General | Electronic. |
| Phone | Electronic. |

A fresh install seeds Cash, Bank Transfer, Card, USSD / Mobile Money. Each can be
enabled or disabled, and exactly one is the default.

Each mode needs a **GL mapping**: the ledger account its money lands in. A sale
paid with an unmapped mode is rejected at settlement, so mapping is not optional
once you take money. Give each electronic mode its own account if you want to see
them separately; by default all electronic modes share one account.

**Only one cash-type mode may be declared per shift.** A single drawer backs both
change and the close variance, so two cash modes on one shift would make the
reconciliation ambiguous and the system refuses it.

Viewing payment modes requires manager or administrator. Creating or editing them
requires a manager.

## The chart of accounts

**Accounting → Chart of accounts.** Manager or administrator only.

Accounts form a tree. A group has children and no postings; a leaf carries an
account type and receives postings. Every root declares one of five types —
Asset, Liability, Equity, Income, Expense — and children inherit their parent's
type. An account can be frozen to block postings, or disabled.

The seed command creates a working chart:

```
Assets
├── Cash Account
├── Bank Accounts → Electronic Account
└── Inventory Stock → Stock in Hand — <each warehouse>
Liabilities
├── Accounts Payable
└── Stock Received But Not Billed
Equity
├── Owner's Equity
└── Temporary Opening
Income
├── Food Sales
├── Drinks Sales
├── Food Sales Returns
└── Drinks Sales Returns
Expenses
├── Cost of Goods Sold
├── Food COGS
├── Round Off
├── Wastage
├── Inventory Price Variance
├── Supplier Expenses
├── Stock Adjustments
└── Petty Cash Expenses
```

Account names are unique. Renaming a seeded account is fine as long as you
re-point anything that references it.

The accounting engine fails closed. If a sale needs an account that is missing,
disabled, frozen, or not a leaf, the whole settlement is rejected rather than
posting a partial entry. A missing configuration is loud, not silent.

## Fiscal years

A fiscal year has a start and end date and cannot overlap another enabled year.
Every ledger posting resolves its fiscal year from its posting date, so a sale
cannot be posted into a year that does not cover the day it happened. Creating the
current year is part of setup; the seed does it.

## Environment variables

Spicy reads these from the environment or a `.env` file. Only `spicy/settings.py`
reads the environment.

### Required in production

| Variable | Default | Notes |
|---|---|---|
| `SECRET_KEY` | insecure fallback | **Set this.** It signs sessions and CSRF tokens. |
| `DEBUG` | `True` | **Set `False`.** Leaving it on disables every write lock in the Django admin. |
| `ALLOWED_HOSTS` | `["*"]` | **Set this.** Comma-separated hostnames. |
| `DATABASE_URL` | unset | PostgreSQL connection string. Falls back to the `DJANGO_DATABASE_*` variables. |
| `DJANGO_DATABASE_HOST` | `localhost` | Use `db` when running against the Docker service. |
| `DJANGO_DATABASE_NAME` | `spicy` | |
| `DJANGO_DATABASE_USER` | `postgres` | |
| `DJANGO_DATABASE_PASSWORD` | `***` | |
| `DJANGO_DATABASE_PORT` | `5432` | |

### Sessions, cache, and tasks

| Variable | Default | Notes |
|---|---|---|
| `REDIS_URL` | unset | Falls back to `REDIS_HOST` / `REDIS_PORT`. |
| `REDIS_TLS_URL` | unset | Checked if `REDIS_URL` is empty. |
| `REDIS_HOST` | `localhost` | Use `redis` under Docker. |
| `REDIS_PORT` | `6379` | |

With `DEBUG` on, the cache is disabled entirely. With `DEBUG` off, Redis backs
both the cache and the Celery broker.

### Email

| Variable | Default | Notes |
|---|---|---|
| `EMAIL_BACKEND` | console backend | **Set this in production.** The default prints mail to the terminal and sends nothing. |
| `DEFAULT_FROM_EMAIL` | a hardcoded address | |
| `SERVER_EMAIL` | `noreply@localhost:8000` | |

Signups email the site administrators. If the backend is left on console, you
will never know a signup happened.

### Frontend build

| Variable | Default |
|---|---|
| `DJANGO_VITE_DEV_MODE` | follows `DEBUG` |
| `DJANGO_VITE_HOST` | `localhost` |
| `DJANGO_VITE_PORT` | `5173` |

### Logging

| Variable | Default |
|---|---|
| `DJANGO_LOG_LEVEL` | `INFO` |
| `SPICY_LOG_LEVEL` | `INFO` |

Setting `SPICY_LOG_LEVEL` to `DEBUG` is the quickest way to see what the
application is doing.

### Present in the example file but not read by the application

`GOOGLE_ANALYTICS_ID`, `TURNSTILE_KEY`, `TURNSTILE_SECRET`, `DJANGO_PORT`,
`POSTGRES_PORT`, and `REDIS_PORT` are not read by Django. The port variables are
read by `docker-compose.yml`; the rest are inert.

## Production settings module

`spicy/settings_production.py` layers on top of the main settings and sets
`DEBUG = False`, forces HTTPS redirects, and marks session and CSRF cookies
secure. Select it explicitly:

```bash
export DJANGO_SETTINGS_MODULE=spicy.settings_production
```

Nothing in the repository sets this for you. It does not set `SECRET_KEY`,
`ALLOWED_HOSTS`, HSTS, or `CSRF_TRUSTED_ORIGINS`, so those remain your
responsibility.

## Django admin

Available at `/admin/` to superusers. It is a data-inspection surface, not the
back office: orders, ledger entries, stock ledger rows, and stock balances are
read-only there, because they change only through the application's own
workflows. Master data — items, warehouses, menus, accounts, suppliers — can be
edited there, subject to the same validation as the back office.

Two cautions. With `DEBUG` on, superusers bypass the read-only locks entirely,
so do not run a development configuration against real data. And because the
locks are keyed on `DEBUG`, an installation left in development mode is one
setting away from exposing the admin as fully writable.