# Reporting

Spicy produces three kinds of report, and they answer different questions.

| Report | Question |
|---|---|
| Daily profit and loss | Did the day go well, and what did it cost me? |
| Sales reports | What sold, when, and to whom? |
| Ledger reports | What does the accounting say? |

## The daily profit and loss

This is the statement an owner actually looks at. It is built for one business
day, across three columns — food, drinks, and total.

It is a management snapshot. It does not post to the general ledger, and it never
will: the ledger already holds the sale, the cost of sale, and the cash variance.
The statement summarises them for reading.

### How the day is bounded

A trading day does not end at midnight if you close at 3am. The business-day start
hour is configurable — set it to 5am and a "day" runs from 5am that morning to 5am
the next. This matters because sales, kitchen counts, and shift closes are all
matched to the same window.

### What it calculates

| Line | Where it comes from |
|---|---|
| Gross sales | Sum of order line amounts, split by department |
| Round off | The rounding adjustments of the day's orders |
| Net sales | Gross sales plus round-off |
| Cost of goods sold — food | **Actual kitchen usage**: the consumption and waste counts for the day, valued at kitchen cost |
| Cost of goods sold — drinks | Drink stock movements for the day, valued at what they cost |
| Theoretical food cost | Memo. Recipes multiplied by dishes sold, returns netted |
| Food cost variance | Memo. Theoretical less actual |
| Direct expenses | Materials you entered, electricity, ad-hoc items |
| Gross profit | Net sales less cost of goods sold less direct expenses |
| Employee cost | Recurring rates, or a figure you override for the day |
| Depreciation | A configured daily amount |
| Cash variance | Shift close shortages and excesses, from the ledger |
| Net profit | Gross profit less employee cost, depreciation, and cash variance |

Prime cost — drink cost plus employee cost — is highlighted, because for most
restaurants that is the number that predicts whether the month survives.

Theoretical food cost and food cost variance are memo lines. They do not change
gross profit. They are there so you can see whether the kitchen is counting
honestly: a large positive variance means actual usage ran well above what the
recipes predict, which usually means over-preparation, unrecorded waste, or a count
that was not taken properly.

### The food usage warning

If food was sold on a day with no kitchen count filed, the statement is stamped
**"Food usage not counted"** and food cost reads zero. It says so on the statement
rather than reporting a flattering number.

This is deliberate. A food cost that silently reads zero produces a profit figure
nobody should believe. The warning is a prompt to count.

Dishes sold with no active recipe are listed as unmapped on the usage report, so
they do not disappear from costing without trace.

### Working with the statement

The statement is a draft until you submit it. On submission the totals and the
recurring expense rates are frozen — later changes to your rate settings do not
rewrite history. Submitting posts nothing.

One draft and one submitted statement per business date. If a statement needs
correcting after submission, cancel it and amend; the amendment copies the inputs
into a new draft linked to the cancelled one, and both remain on file.

### Expenses on the statement

Two kinds, both configured once in P&L settings:

- **Recurring expenses** with a kind: direct daily, indirect daily, indirect
  monthly, indirect percentage of gross, employee daily, employee monthly.
  Monthly amounts are prorated daily, with the last day of the month absorbing the
  remainder so the month totals exactly.
- **Per-statement entries**: materials with a quantity and rate, electricity
  meter readings opening and closing with a rate, ad-hoc amounts, and an employee
  cost override.

Materials here are report lines, not inventory items. Use them for consumables
that are not stocked — cooking gas, cleaning supplies.

## Sales reports

All run on the order's posting date and include submitted orders and returns.
Drafts, cancellations, and discarded orders are excluded.

| Report | Shows |
|---|---|
| Today, Daywise | Bills, gross, refunds, net per day, with the food and drinks split |
| Monthwise | The same, grouped by calendar month |
| Item-wise | Quantity, gross, refunded, and net per item, filterable by department and group |
| Employee-wise | Bills and net per cashier |
| Service-wise | Dine-in against takeaway, with the food and drinks split |
| Time-wise | Twenty-four hourly buckets — how much you sell at 1am versus 8pm |
| Cancelled invoices | Lost sales from cancellations, with the reason |
| Average bill | Net sales divided by bill count, daily or monthly |
| POS register | One row per closed shift with per-mode detail |

Returns net against the date the return was submitted, not the date of the
original sale. An item renamed after it sold still collapses into one row, because
reports read the order line's snapshot rather than the item's current name.

Periods, average-bill rows, and service rows link through to the order register
with the matching filters applied.

## Ledger reports

Covered in [Accounting and payables](accounting.md). The general ledger, trial
balance, and simple profit and loss.

## Stock reports

Covered in [Inventory](inventory.md). Stock balance, stock ledger, and food usage.

## The shift close as a register report

The POS register is one row per closed shift: the cashier, the period, the bills,
the net total, and what each payment mode was expected to hold against what was
counted. It is the end-of-shift version of the sales reports and the starting
point for reconciling against the bank.

## Exports

The daily profit and loss register, the sales and ledger reports, and the stock
reports export to CSV. Exports respect the same permissions as the page they came
from, and a capped export returns an error rather than truncating silently.

## A note on what the numbers mean

Revenue is precise. It comes from the order lines at the moment of settlement.

Drink cost is precise. It comes from the stock movements those sales caused, at
the cost the bin actually carried.

Food cost is a count. It is exactly as good as the kitchen's count, which is why
the statement tells you when it is missing.

Employee cost, rent, depreciation, and electricity are what you enter. Spicy does
not read them from anything else. Treat those lines as your figures, not the
system's measurements.