# Maintenance and backup

## Backup

One command snapshots the database and the uploaded images:

```bash
make backup
```

It produces two files in `backups/`:

```
backups/spicy-2026-09-11-233000.sql.gz
backups/media-2026-09-11-233000.tar.gz
```

Backups contain sales figures and password hashes. They are gitignored and must
never be committed or sent anywhere public.

Retention: each successful backup deletes snapshots older than 14 days. Logs and
drill records are never deleted automatically.

Requires the `db` compose service running. It uses the database name and user
from the environment, matching `docker-compose.yml`.

### Schedule it

After close, before midnight:

```cron
30 23 * * * cd /path/to/spicy && make backup >> backups/backup.log 2>&1
```

### Copy them off the machine

Weekly, copy the newest database and media pair to external storage. A dump on the
same disk does not survive theft, fire, or a stolen laptop.

## Restore

```bash
make restore ARGS='backups/spicy-2026-09-11-233000.sql.gz'
```

Without `--yes`, it prints the target database and waits for you to type `yes`.
It refuses to proceed on a guess.

The restore terminates other connections, drops and recreates the database, loads
the dump, and runs migrations to confirm the schema is current.

Media is never touched unless you ask for it:

```bash
make restore ARGS='backups/spicy-2026-09-11-233000.sql.gz --yes \
  --with-media backups/media-2026-09-11-233000.tar.gz'
```

That separation is deliberate — a database-only restore cannot wipe your item
images by accident.

## Restore drills

A backup you have never restored is a guess. Run this whenever you change the
backup scripts, and at least once a quarter.

1. `make backup` — confirm both files exist and are not empty.
2. Restore into a scratch database, never the live one:

   ```bash
   docker compose exec db psql -U postgres -d postgres -c "CREATE DATABASE spicy_drill"
   gunzip -c backups/spicy-<timestamp>.sql.gz \
     | docker compose exec -T db psql -U postgres -d spicy_drill
   uv run manage.py check --database=default
   ```

3. Spot-check the order count and one login against the live figures.
4. Drop the scratch database.
5. Record the date and who did it in `backups/RESTORE_DRILLS.md`.

## When something goes wrong

| Symptom | Cause | Fix |
|---|---|---|
| `pg_isready` fails during backup | The database container is not running | `make start-bg` |
| Restore reports the database in use | Someone is still connected to it | Close open dashboards, then retry |
| Backups directory is growing | Retention only runs on a successful backup | Check the log; fix the failure so retention resumes |
| Snapshot file is tiny or empty | The dump failed mid-write | Delete it and back up again |

## Routine maintenance

### Weekly

- Check the backup ran and the files are non-empty.
- Copy the newest pair off the machine.
- Glance at the previous week's daily profit and loss statements.

### Monthly

- Run a restore drill.
- Review cash variances. A recurring shortfall on one drawer is a process
  problem, not a counting problem.
- Review unmapped dishes on the food usage report. A dish sold with no recipe
  costs nothing in the reports, which quietly flatters food cost.
- Check that dishes without recipes are either intentional or a setup gap.

### Quarterly

- Deactivate accounts for people who have left. Do not delete them — their name
  belongs on the orders and shifts they worked.
- Review who holds the administrator role.
- Confirm `DEBUG` is off and `SECRET_KEY` is not the fallback.
- Review suppliers with a growing outstanding balance.

### Annually

- Rotate the `SECRET_KEY` at a quiet moment. It invalidates all sessions, so
  everyone signs in again.
- Test a full restore into a clean environment.
- Review the chart of accounts against how you actually think about the business.

## Data hygiene

**Do not delete financial records.** Orders, ledger entries, and stock movements
cannot be deleted by design, and the guards are there to stop a cascade from
taking the history with it. If something is wrong, cancel it, return it, or post a
reversal.

**Correct with reversals, not edits.** A cancellation written today is dated today.
That is the correct accounting treatment and it makes the correction visible.

**Deactivate people, do not remove them.** A removed user loses the name on
hundreds of orders, and the audit trail becomes less useful exactly when you need
it.

**Keep the kitchen counting.** Everything about food cost accuracy depends on it.
The daily statement warns when a count is missing; the response is to count, not
to ignore the warning.

## What the system protects, and why

The guards are deliberate, and working around them damages the record:

- Submitted orders and written ledger entries cannot be edited.
- Stock ledger entries cannot be edited or deleted; corrections are reversals.
- A bin cannot be issued below what open orders have reserved.
- A ledger posting fails entirely rather than partially.
- A purchase receipt cannot be cancelled while an invoice references it.
- An invoice cannot be cancelled while a payment is allocated to it.

If you find yourself needing to bypass one, the underlying transaction is usually
wrong and a correcting document is the right answer.

## Monitoring

Logs go to the console at `INFO` for both `django` and `apps`. Set
`SPICY_LOG_LEVEL=DEBUG` to see the application's own activity.

There is no error-reporting service and no health endpoint. For a single-site
install that runs on the cashier's own machine, the practical monitoring is the
daily check that the machine restarted, the backup ran, and the shift closed
cleanly.

Worth watching manually:

- Whether the backup ran.
- Whether shifts are closing. A shift left open blocks every new order, because
  the POS refuses to take orders without one.
- Whether kitchen counts are being filed.