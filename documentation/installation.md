# Installation

## What you need

| Requirement | Version | Notes |
|---|---|---|
| Python | 3.14 or newer | Required. Spicy uses syntax from 3.14. |
| PostgreSQL | 17 recommended | The only supported database. |
| Node.js and npm | Current LTS | Builds the CSS and JavaScript. |
| Docker and Docker Compose | Current | Runs PostgreSQL and Redis. Optional but easiest. |
| uv | Current | Manages Python dependencies. `pip` is not used. |
| make | Any | Convenience wrapper. On Windows, install it separately. |

## The quick way

```bash
git clone https://github.com/sanusi-dev/spicy.git
cd spicy
make init
```

`make init` copies the example environment file, starts PostgreSQL and Redis in
the background, runs the database migrations, and installs the frontend packages.

Then:

```bash
make dev
```

This starts Django and the asset build. Open <http://localhost:8000>.

The first time you sign in you need an administrator account. Create one:

```bash
make manage ARGS='createsuperuser'
```

A superuser is an administrator: they can assign roles to other people and reach
the Django admin site.

## Installing without Docker

If you would rather run PostgreSQL yourself:

```bash
uv sync                       # creates .venv and installs dependencies
createdb spicy
make migrate
npm install
npm run dev                   # in a second terminal
uv run manage.py runserver    # in a third terminal
```

Point `DATABASE_URL` in your `.env` at the local database:

```
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/spicy"
```

## Configuration

Spicy reads configuration from a `.env` file in the project root and from
environment variables. See [Configuration](configuration.md) for the full list of
settings.

The values that matter most before going live:

| Variable | Set it to |
|---|---|
| `SECRET_KEY` | A long random string. Generate one with `python -c "import secrets; print(secrets.token_urlsafe(64))"`. |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | The hostnames this installation answers to, comma-separated. |
| `DATABASE_URL` | Your PostgreSQL connection string. |
| `TIME_ZONE` | Not currently configurable. See the note below. |

> **Set the secret key.** If `SECRET_KEY` is missing, Spicy falls back to a
> hardcoded development value that is published in the source. Anyone who knows
> it can forge session cookies. Generate your own for any installation that
> holds real data.

> **Set the time zone.** Spicy currently fixes `TIME_ZONE` to UTC, while every
> business date is recorded using the server's local time. If your server's clock
> is on UTC and your restaurant is not, orders can be filed under the wrong
> business day, which matters at close of business. Run the server in your local
> time zone, or set the time zone on the host so Django's local time matches your
> trading day.

## Seeding a working setup

An empty database has no chart of accounts, no payment modes mapped to accounts,
and no menu, so the system cannot settle a sale until they exist. One command
builds the chain:

```bash
make manage ARGS='seed_pos_setup'
```

This creates the restaurant record, the three warehouses, the kitchen and bar
production units, payment modes, the production units' accounts, and an example
menu with items, prices, and drinks. It seeds the chart of accounts first if that
has not run.

For a real restaurant, treat the seeded menu as a starting point and replace it
with your own items. See [Configuration](configuration.md).

## Verifying the installation

```bash
make manage ARGS='check'
```

A healthy installation reports `System check identified no issues`.

To confirm the database is reachable and the schema is current:

```bash
make manage ARGS='showmigrations'
```

Any migration showing `[ ]` has not run.

## Running the tests

```bash
make test
```

The suite covers the order lifecycle, stock valuation, ledger posting, shift
reconciliation, permissions, and reporting. See [Development](development.md).

## Everyday commands

| Command | Does |
|---|---|
| `make dev` | Django and asset build together. Development only. |
| `make django` | Django alone. |
| `make manage ARGS='<command>'` | Any `manage.py` command. |
| `make migrations` | Write migrations for model changes. |
| `make migrate` | Apply migrations, waiting for the database to be ready. |
| `make shell` | Django shell. |
| `make dbshell` | PostgreSQL shell. |
| `make backup` | Snapshot the database and uploaded images. |
| `make restore ARGS='<file>'` | Restore a snapshot. |

## What to read next

[Configuration](configuration.md) to set up the restaurant, payment modes, and
accounts. [Users and roles](users-and-roles.md) to give your team access.