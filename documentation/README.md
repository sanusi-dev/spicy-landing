# Spicy Documentation

Spicy is an open source restaurant management system. It runs the counter, the
kitchen, the bar, the stock room, and the books as one system, on hardware you
control, with no internet connection required.

This documentation covers the application for the people who run it and look
after it: the owner reading a profit and loss statement, the manager reconciling
a drawer, the cashier taking orders, and the developer deploying it.

## Start here

| If you are | Read |
|---|---|
| Evaluating the system | [Overview](overview.md) |
| Installing it for the first time | [Installation](installation.md) |
| Setting up the restaurant | [Configuration](configuration.md) |
| Giving people access | [Users and roles](users-and-roles.md) |
| Working the counter | [Daily operations](daily-operations.md) |
| Managing stock | [Inventory](inventory.md) |
| Reading the numbers | [Reporting](reporting.md) |
| Sending it live | [Deployment](deployment.md) |
| Looking after it | [Maintenance and backup](maintenance.md) |
| Building on it | [Development](development.md) |

## Reference

- [Business rules](business-rules.md) — the rules the system enforces, and why.
- [Data model](data-model.md) — the entities and how they connect.
- [Glossary](glossary.md) — what each term means in Spicy.

## How the system is put together

Spicy is a Django application. Everything runs in one process against one
PostgreSQL database. There is no separate API server, no message queue doing
real work, and no client-side application framework. The cashier screen is
server-rendered HTML that updates in place over HTMX; Alpine.js handles the
handful of interactions that need to happen in the browser.

The parts are separated by business domain, not by layer:

| Area | Owns |
|---|---|
| Orders | Orders, order lines, payments, kitchen and bar tickets, audit trail |
| Inventory | Items, warehouses, stock balances, the stock ledger, stock documents |
| Menu | Menus, selling prices, variants, add-ons |
| Payments | Payment modes and their ledger account mapping |
| Staff | Shifts, opening floats, drawer reconciliation, cash-outs |
| Accounting | Chart of accounts, general ledger, journal entries, supplier payables |
| Reports | Daily profit and loss, sales reports, ledger reports |
| Settings | The single restaurant record, production units, user roles |
| Users | Accounts, roles, avatars |
| Web | Routing, middleware, shared page chrome |

Orders sit at the centre. Settling an order writes to the stock ledger and the
general ledger in the same database transaction, so a sale either lands
completely or not at all.

## Two things worth knowing before you read further

**There is no tax system.** Order totals are the sum of the line amounts, rounded
to the nearest whole naira. If you need VAT or sales tax, you will need to
extend the system; do not assume it is there.

**Food is not deducted from stock at the point of sale.** Only drinks are. A
sold plate of food does not reduce an ingredient count, because in practice the
kitchen controls how much of each ingredient actually got used. The kitchen
counts what it consumed at the end of the day, and that count becomes the food
cost of sale. This is a deliberate decision and it explains a large part of how
the reporting works. See [Inventory](inventory.md) and
[Business rules](business-rules.md).