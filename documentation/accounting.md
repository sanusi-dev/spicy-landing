# Accounting and payables

Spicy keeps a double-entry general ledger. Every sale, refund, stock movement,
shift variance, supplier invoice, and supplier payment posts balanced entries
automatically. You can also enter journal entries by hand.

Manager or administrator access only.

## The chart of accounts

Accounts form a tree. A **group** has children and holds no postings; a **leaf**
receives them. Every root declares one of five types — Asset, Liability, Equity,
Income, Expense — and children inherit their parent's type, so an income account
cannot sit under assets.

Groups expand and collapse in the tree view. You can freeze an account to block
postings to it, or disable it. A group with children cannot be disabled, and an
account with postings is not deleted by accident.

Account names are unique.

## How the ledger is written

### Balance is enforced before anything is saved

A batch of ledger rows is accepted only if debits equal credits. The check runs
in `GLEntry.post()`, before the first row is written, and the write is atomic. An
unbalanced batch raises an error and writes nothing.

Individual rows must carry a debit or a credit, never both. A post to a group
account is rejected — only leaves receive postings.

A further guard rejects a batch where the same account appears on both the debit
and the credit side. Such legs would net to zero and silently vanish from the
statement, so the posting is refused instead. This is the check that catches a
payment mode mapped to a sales account.

**Missing configuration fails the whole posting.** If a sale needs an account that
is absent, disabled, frozen, or not a leaf, the settlement is rejected. Nothing
partial is written. A misconfigured chart produces a loud refusal, never a
half-posted sale.

### Ledger entries are immutable

A written entry cannot be edited or deleted. A correction is a reversal: the
originals are marked cancelled and mirror rows are written, **dated on the day you
cancelled** rather than backdated to the original. A correction made in October
belongs to October, and that is visible in the ledger.

### Fiscal years

Every posting resolves its fiscal year from its posting date. A date outside every
enabled fiscal year is rejected. Enabled years cannot overlap.

## What a sale posts

Settling an order writes four kinds of leg:

| Leg | Debit | Credit |
|---|---|---|
| Income | — | The department's income account, per line |
| Payment | Each payment mode's mapped account | — |
| Round-off | Round off, if the total rounded down | Round off, if it rounded up |
| Cost of goods sold | The drinks expense account | The bar warehouse's stock account, at cost |

**Food and drinks income are separate accounts.** Each line carries a snapshot of
its department, so a food line credits the kitchen's income account and a drink
line credits the bar's. This is why the food and drinks columns in the reports
reconcile against the ledger.

**Change reduces the cash leg.** The amount handed back as change is deducted from
the cash account, so a 2,000 payment on a 1,500 sale debits cash 1,500, not 2,000.

**Only drinks post cost of goods sold at settlement.** Food cost reaches the
ledger through the kitchen's consumption count, not through the till.

The voucher is keyed on the order's invoice number, and re-posting is a no-op, so
a retried request cannot duplicate a sale.

## What a refund posts

Submitting a return writes:

- Debit the department's **sales returns** account, per returned line.
- Credit each payment mode's account, pro-rated across the original tender.
- For a drink put back into stock: credit cost of goods sold and debit the bar
  warehouse, **at the rate the original sale used**. If the bin's cost has moved
  since, the return still reverses the sale exactly — no variance leg, no
  distortion.
- For a drink marked not restockable: credit cost of goods sold and debit
  **wastage** at the same rate, with no stock movement. The drink stays costed
  once and the loss is visible. The wastage account must differ from the drinks
  expense account; the system refuses a configuration where they are the same.

## Journal entries

Hand-entered vouchers, for anything the automatic postings do not cover — opening
balances, accruals, corrections.

A journal entry has a type (journal, cash, bank, or opening entry), a posting
date, and any number of lines. On submission:

- Debits must equal credits, and the total must be greater than zero.
- A line may not have both a debit and a credit, or neither.
- The same account may not appear on two lines.
- Opening entries require a source note on every line, and only one per fiscal
  year.
- Opening entries go through a read-only review screen before submitting.

Submission writes the ledger. Cancellation posts a reversal dated today. A
cancelled entry can be amended into a new draft, once, and both remain on file.

## Shift variance

When a shift closes with a difference, a balanced journal entry is written in the
same transaction as the close.

The variance lands on **the drawer that actually held it**. A shortage on the
transfer mode debits the shortage account and credits the transfer mode's own
account — it never touches cash. A shortage on cash debits the shortage account and
credits cash. A surplus goes the other way.

The close fails if the account matching the sign of the variance is unconfigured.
You cannot close a shift with an unrecorded variance.

If the difference exceeds the restaurant's variance approval threshold, closing
requires a manager and a written explanation.

## Supplier payables

### Suppliers

A supplier has a name, a type, contact details, and optionally its own payable
account. One supplier can be marked default. Its outstanding balance is the sum of
what its submitted invoices owe, less what has been allocated to them.

### Purchase receipts and invoices

These are separate on purpose:

- A **purchase receipt** is goods arriving. It moves stock and posts a debit to
  stock against a credit to goods-received-not-billed. Nobody has been paid.
- A **supplier invoice** is the bill. It clears that liability and creates the
  payable.

Invoicing is receipt-first. You create an invoice against a purchase receipt and
the stock lines are generated from it — quantity and rate copied from the receipt
and locked. You do not retype the goods, and you cannot disagree with what was
received. Expense lines such as a delivery charge are typed by hand, since they
are not part of the receipt.

On submission the invoice posts:

- Stock lines: debit goods-received-not-billed, credit payable.
- Expense lines: debit the default supplier expense account, credit payable.

An invoice with only expenses needs no receipt.

A receipt cannot be cancelled while a submitted invoice references it. A supplier
invoice cannot be cancelled while a payment has been allocated to it. Both rules
exist so a liability cannot vanish while money is still moving against it.

### Payments

A supplier payment selects a mode and is allocated across that supplier's
outstanding invoices. It posts a debit to payable and a credit to the mode's
account.

All of it is validated: at least one allocation, allocations summing to the
payment amount, every invoice belonging to that supplier and submitted, and no
allocation exceeding what is outstanding. The invoice then shows as unpaid, partly
paid, or paid.

## Ledger reports

### General ledger

Rows in date order for a fiscal year and date range, filterable to one account.
With an account selected, a brought-forward row appears showing the balance
carried in, and a running balance tracks across the page. Rows link through to
the voucher that created them — the order, journal entry, supplier invoice,
purchase receipt, stock entry, reconciliation, or shift cash-out.

Cancelled rows are shown alongside their reversals, so a corrected posting visibly
nets to zero.

### Trial balance

Leaf accounts only, from the fiscal year start to an as-of date, including opening
entries. Accounts that have closed to zero are omitted. Debits equal credits, and
the totals line proves it.

### Simple profit and loss

Income less expense from every ledger account flagged for the profit and loss
statement, with the food and drinks income split out.

Two different profit and loss figures exist, and it is worth knowing which is which:

- **The daily profit and loss** is a management snapshot for one business day. It
  has three columns, uses actual kitchen counts for food cost, and includes the
  expense lines you enter.
- **The simple profit and loss** is the ledger summarised over a period. It shows
  what was posted, nothing more.

They answer different questions and will not match line for line. The daily
statement includes expenses the ledger has no posting for; the ledger includes
entries with no equivalent on the daily statement.

There is no balance sheet report. The ledger holds the data for one — asset,
liability, and equity balances are all there in the trial balance — but no such
report is built.

## The accounting engine fails closed

Worth stating plainly, because it is the design principle underneath all of this:

If a posting cannot be completed correctly, it is refused. Nothing partial is
written. Configuration errors surface as errors at the moment they matter, on the
transaction that needed the account — not as a silent omission you discover in a
report weeks later.