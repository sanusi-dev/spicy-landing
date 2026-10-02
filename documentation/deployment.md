# Deployment

Spicy is designed to run on the cashier's own machine or a small local server,
inside the restaurant. This page covers getting it there safely.

## Before you deploy

Work through this list. Each item is a real failure mode, not a hypothetical.

**Set a real `SECRET_KEY`.** If it is missing, Spicy falls back to a development
value published in the source. Anyone who knows it can forge session cookies and
sign in as anyone.

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

**Set `DEBUG=False`.** This is the one with the widest blast radius. With `DEBUG`
on, superusers bypass every write lock in the Django admin, so orders, ledger
entries, stock movements, and balances all become editable directly. The read-only
guards are still there in code, but the development bypass removes them.

**Set `ALLOWED_HOSTS`.** It defaults to accepting anything.

**Set `EMAIL_BACKEND`.** The default prints email to the terminal and sends
nothing. Signup notifications go nowhere until you do.

**Set the host's time zone.** Spicy fixes `TIME_ZONE` to UTC while recording
business dates in server-local time. If your server clock is UTC and your
restaurant is not, orders land on the wrong business day — which breaks the shift
close and the daily profit and loss. Run the host in your local zone.

**Set a real database password.** The example uses `postgres`/`postgres`.

## Settings module

`spicy/settings_production.py` layers production hardening on top of the base
settings: `DEBUG = False`, HTTPS redirect, secure session and CSRF cookies.

```bash
export DJANGO_SETTINGS_MODULE=spicy.settings_production
```

Nothing in the repository selects it for you — set it in the service definition or
the shell profile.

It does not set `SECRET_KEY`, `ALLOWED_HOSTS`, HSTS, or `CSRF_TRUSTED_ORIGINS`.
Those stay yours to configure.

## The stack in production

| Piece | Runs on |
|---|---|
| PostgreSQL | The cashier machine or a local server |
| Redis | Same host; cache and Celery broker |
| Gunicorn | Serves Django |
| Nginx or Caddy | Reverse proxy, terminates TLS, serves static and media |
| Vite build output | Served as static files |
| Celery worker | Only if you add tasks — see below |

## Running it

Build the front end once:

```bash
npm run build
uv run python manage.py collectstatic
```

Start the application:

```bash
DJANGO_SETTINGS_MODULE=spicy.settings_production gunicorn spicy.wsgi:application
```

Gunicorn is already a production dependency. Note that there is no Dockerfile and
no application service in the compose file — the compose file provides PostgreSQL
and Redis only, and the application runs directly on the host. That is
deliberate: the cashier machine runs the application locally.

## TLS

Terminate it at the reverse proxy, and set:

```
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
```

which `settings_production.py` already does. Behind a proxy without that header,
Django cannot tell the request was encrypted.

Set `SECURE_HSTS_SECONDS` at the proxy or in a local settings override once you are
confident in the domain.

## Celery

Celery is configured and can be started:

```bash
make celery
```

There are currently no scheduled tasks — the schedule is empty and no job is
defined. Starting the worker is optional and does nothing useful today. Redis is
required for the cache when `DEBUG` is off, so Redis must be running either way.

## Printers

Three thermal printers are expected: the cashier receipt printer, the kitchen
ticket, and the bar ticket. Each production unit holds its printer's IP address,
paper width, and cut mode, configured from the back office.

The printers are driven by a local print agent that receives jobs over HTTP on
localhost and speaks ESC/POS to the printer. Point each production unit at its
printer's address in your network.

If the print agent is not running, ticket and receipt dispatch reports a failure.
Settlement does not block on printing — a printer problem never stops a sale — but
the ticket will not reach the kitchen, so a printed order is not being cooked.

## Static and media files

Static assets and uploaded images must be served by the reverse proxy in
production. Django's development media helper does nothing once `DEBUG` is off, so
nothing serves `/media/` unless the proxy does.

Collected static goes to `static_root`; uploaded item images and profile pictures
go to `media/`. Both need to be writable by the application user and readable by
the proxy.

## Before you go live

1. `DEBUG=False`, a real `SECRET_KEY`, and a real `ALLOWED_HOSTS`.
2. A real email backend.
3. The host time zone matches the restaurant's trading day.
4. PostgreSQL and Redis running, with a real database password.
5. Front end built and static collected.
6. Reverse proxy serving static and media, terminating TLS.
7. **A tested backup.** See [Maintenance and backup](maintenance.md). Do not skip
   this; a backup you have never restored is not a backup.
8. Sign in as a superuser, then check that `/admin/` is reachable. Then check that
   a Manager and a Cashier get 403 on the pages they should not see.
9. Take a first backup before you process a single real order.

## Keeping it off the internet

Spicy has no outbound internet dependency for its core function. It runs on the
local network and keeps working when the internet is down.

One exception worth knowing: the default profile picture is a Gravatar derived
from the user's email address, which is a request to an external service. On an
isolated network it fails and the default avatar is shown. Nothing else is
affected. Upload a picture for each account if you would rather not make the
request.

## Network exposure

Expose the application to the local network only. Do not port-forward it to the
internet, and do not place it directly on a public interface. It is designed for a
restaurant's own Wi-Fi and assumes the people on that network are your staff.

If you need access from outside the site, put an authenticating proxy in front of
it rather than exposing Django directly.

## Upgrading

```bash
git pull
uv sync --frozen
make migrate
npm install && npm run build
python manage.py collectstatic
```

Take a backup first. Read the release notes for migrations that remove or rename
data, and check whether your customisations conflict.