# Overview

## What Spicy is

Spicy is a restaurant management system: the software a restaurant uses to take
orders, produce them, keep track of what it has in stock, count the money at the
end of a shift, and produce financial statements.

It is built for a single restaurant running on its own network. The cashier's
computer runs the application. Other devices on the same Wi-Fi — a manager's
laptop, an owner's tablet — can reach the back office. Nothing is sent to an
external service, and the system keeps working when the internet is down.

## The problem it solves

Restaurant software tends to come in one of two shapes. Small point-of-sale
systems handle the counter and nothing else, which means stock is a guess and
the books are reconstructed by hand. Larger management suites handle reporting
well but assume a chain, a support contract, and a monthly fee, and they often
cannot run on the hardware a restaurant already owns.

Spicy sits between those. It takes the order, deducts the drinks it sold from
stock, records the cost of those drinks against the day's profit, counts what the
kitchen actually used, and writes balanced accounting entries — on a single
machine on your own network, with the source available to read and change.

## Who it is for

Spicy assumes a particular way of working. It fits restaurants where:

- **A cashier enters every order and takes every payment.** Waiters may take
  orders on paper and hand them to the counter, but they do not use the system.
  There is no waiter-facing tablet mode.
- **The kitchen works from printed tickets,** not from a display screen. Food
  goes to the kitchen, drinks go to the bar, and each station has its own printer.
- **There is one location.** Not a chain, not a franchise, not a group of
  branches on one account.
- **The owner or manager wants real financial statements,** not just a sales
  total at the end of the day.

It does not fit a multi-branch group, a restaurant that needs table management
with a floor plan, or a business that requires tax handling.

## What it does

**Takes orders.** A cashier builds an order from the menu, assigning items to
guests when a table orders separately. Items can carry comments, sizes, and
add-ons. When the order is sent, it prints a kitchen ticket for food and a bar
ticket for drinks.

**Takes payment.** An order can be split across payment modes — part cash, part
bank transfer. Cash gives change. Card and transfer payments can require a
reference number, and a reference can only be used once.

**Keeps track of stock.** Drinks are deducted automatically when an order is
paid for, valued at a running weighted average cost. Food ingredients are not
deducted at the counter; the kitchen counts them at the end of the day. Stock
arrives through purchase receipts or market receipts, moves between the store and
the kitchen or bar by transfer, and is adjusted for count differences and waste.

**Counts the money.** A shift opens with a float per payment mode. At close, the
cashier counts the drawer, the system states what it expected, and the difference
is recorded. A shortage or excess above a set threshold needs a manager to approve
it with a written explanation, and posts to the ledger.

**Produces financial statements.** Sales are posted to a double-entry general
ledger at the moment of settlement, split between food and drinks. A daily profit
and loss statement shows gross sales, the cost of what was sold, direct and
indirect expenses, and what is left. There is a trial balance and a general ledger
report behind it.

**Tracks what you owe suppliers.** Suppliers have invoices, payments are allocated
across those invoices, and each supplier has an outstanding balance.

## What it does not do

Being clear about this early saves a lot of confusion.

| Not included | Why it matters |
|---|---|
| Taxes | Totals are line amounts rounded to whole naira. Adding VAT means extending the system. |
| Discounts and coupons | Every sale is at the menu price. Managers cancel orders; they do not discount them. |
| Customer accounts and loyalty | Orders carry a free-text customer name. There is no customer master, no stored balance, no loyalty points. |
| Table or floor plan management | Orders start by type (dine-in or takeaway) and guest count. No table assignment. |
| Multiple branches | One restaurant, one set of settings, one database. |
| Multi-currency | Amounts are naira. There is no exchange rate handling. |
| Payroll | Employee cost is a figure you enter on the daily profit and loss statement. There is no payroll engine. |

## How money is handled

Every monetary value is stored as an exact decimal, never a floating-point
number. Amounts keep two decimal places. Order totals are rounded to the nearest
whole naira using half-up rounding, and the difference between the exact total and
the rounded total is stored as a rounding adjustment and posted to a rounding
account. A customer paying with cash can receive change; an overpayment on a card
or transfer is rejected.

## Where things run

The cashier's machine hosts everything: the web server, the database, and the
print agent that drives the three thermal printers. The back office is reachable
from any device on the same network that can open a browser. The system has no
outbound internet dependency for its core function.

## Where to go next

[Installation](installation.md) covers getting it running. If you want to
understand the rules the system enforces — and several of them are unusual —
read [Business rules](business-rules.md).