# Glossary

Terms as Spicy uses them. Where a word could be read two ways, the alternative
reading is noted.

## Business

**Order.** The sale record. Carries an invoice number, a sequential order number,
the type, the customer name as free text, guest count, totals, status, and who
created and settled it.

**Order line.** One item on an order. Snapshots the item name, price, quantity,
department, guest, and comment at the time it was added.

**Draft.** An order before it is submitted. Editable.

**Settlement.** Taking payment for an order. One transaction that validates,
records payment, deducts drink stock, writes the general ledger, and submits the
order. If any part fails, nothing happens.

**Submission.** The order becoming final and immutable. Occurs only through
settlement or a return.

**Return.** A negative order mirroring a paid one. Restores stock and reverses the
ledger. See also *refund*.

**Refund.** The money side of a return. Spicy has no separate refund entity;
refunds are negative payment rows on a return order.

**Cancellation.** Voiding a sent but unpaid order. The kitchen gets a cancellation
ticket.

**Discard.** Abandoning an empty untouched draft. Retained for legacy data; the
normal path for abandoning a non-empty draft is delete-as-tombstone.

**Tombstone.** An abandoned draft. Its contents and audit trail survive; only the
status and actor change.

**Audit event.** An immutable record of an order mutation, with the actor and
metadata.

**Guest.** A person at the table. Raising the guest count creates customer cards,
and each order line belongs to one.

**Customer card.** A POS grouping of order lines for one guest. Not a customer
record — it is an integer on the line.

**Customer name.** Free text on the order, defaulting to "Walk-in Customer". Not a
customer master.

**Department.** `FOOD` or `DRINKS`. Not a display category — it decides ticket
routing, whether stock is deducted, and which accounts receive the revenue.

**Departmental split.** Reporting food and drinks revenue and cost separately.

**Production unit.** A station: the kitchen or the bar. One per department. Holds
its warehouse, printer settings, and three ledger accounts.

**Kitchen ticket / KOT.** The immutable ticket sent to the kitchen for food lines.

**Bar ticket / BOT.** The same record type, routed to the bar for drink lines.

**Cancellation ticket.** A new ticket marked Cancelled, created when a sent order
is cancelled. Numbered `CNCL-`.

**Ticket print status.** `PENDING`, `PRINTED`, or `CANCELLED`. Separate from the
ticket's own submitted/cancelled status.

## Shifts and money

**Shift.** The `POSOpeningEntry` record: one globally open trading period, opened
with a float and closed by a count. Not per cashier.

**Opening float.** Cash and electronic amounts declared when the shift opens, per
payment mode.

**Opening payment.** The record of one mode's float on a shift.

**Expected amount.** What a payment mode should hold at close: opening float plus
payments collected, less change given, less refunds, less cash-outs.

**Closing amount.** What was physically counted.

**Difference.** Counted minus expected. Negative is a shortage.

**Cash variance.** The total difference across all modes on a shift, posted to the
ledger at close.

**Variance approval threshold.** The amount above which closing requires a manager
and a written explanation.

**Cash-out.** Cash leaving the drawer during a shift — transport, ice, small
repairs. Submitted immediately.

**Payment mode.** A configurable payment type: cash, bank, general, or phone. See
also *GL mapping*.

**GL mapping.** The ledger account a payment mode's money lands in. Required
before a mode can settle an order.

**Change.** Cash handed back. Cash modes only.

**Rounding adjustment.** The difference between an order's exact total and its
whole-naira rounded total. Posted to the round-off account.

## Stock

**Item.** A product or an ingredient. The same record type, distinguished by the
sellable, stock-tracked, and purchasable flags.

**Item group.** A flat display category for the POS and item reports. Not a
department.

**Stock unit.** An item's countable unit — bottle, kilogram, plate. Used for the
bin, the ledger, counts, and the POS.

**Bulk purchase unit.** A purchase pack with a conversion: 1 crate = 24 bottles.
Applies on receipt, not on sale.

**Warehouse.** A stock location. Store, kitchen, and bar. Meaning comes from
configuration, not a type field.

**Bin.** The current position of one item in one warehouse: on hand, reserved,
and valued. Not editable — written only by the ledger.

**Stock ledger entry.** An immutable signed record of one movement. Also called an
SLE.

**Reservation.** Stock held for an open draft order. Incremented when a drink
joins the cart, converted to a real deduction when the order is paid for.

**Weighted average cost / WAC.** The valuation method. Receiving blends into the
running average; issuing values at the current average. Also called PWAC in the
technical reference.

**Stock entry.** A document for a market receipt or a store-to-station transfer.

**Stock reconciliation.** A document for opening stock, adjustment, consumption,
or waste.

**Purchase receipt.** A document for goods delivered into the store. Creates a
liability through goods-received-not-billed.

**Goods received not billed / GRNI.** The liability account recording goods
received but not yet invoiced.

**Menu.** A named collection of priced items. One is active at a time.

**Menu item.** A price: an item at a rate on a menu. The rate is the POS selling
price.

**Add-on.** A separate sellable item added to another. Joins the cart as its own
line at its own price.

**Variant.** A size of a dish, modelled as its own item linked to a template. The
POS shows the template as a card with a price range.

**Recipe.** The ingredient card for a dish, with a yield. One active per dish.

**Theoretical usage.** Recipe multiplied by dishes sold. A memo figure.

**Actual usage.** What the kitchen counted. The real food cost.

**Consumption count.** The end-of-day kitchen count of what was used.

**Wastage.** Stock spoiled, broken, or over-prepared. Entered as the amount lost.

**Not restockable.** A flag on a returned line meaning the goods are not going
back on the shelf. Cost moves to wastage.

## Accounting

**Chart of accounts.** The tree of ledger accounts.

**Group.** An account with children. Receives no postings.

**Leaf account.** An account that receives postings. The only kind that can be
posted to.

**Account type.** Asset, Liability, Equity, Income, or Expense. Declared on a root
and inherited by children.

**GL entry.** One side of a posting: an account, a date, a debit or credit, and
the voucher that caused it. Immutable.

**Voucher.** The grouping that makes a set of GL entries. An order, a journal
entry, a supplier invoice, and so on.

**Journal entry.** A hand-entered voucher. See also *opening entry*.

**Opening entry.** The journal that loads opening balances. One per fiscal year,
with a source note on every line.

**Fiscal year.** A date range that ledger postings fall inside. Enabled years
cannot overlap.

**Reversal.** The correcting entries for a cancelled document, dated on the day of
cancellation.

**Sales returns account.** The account a refund debits, per department. Distinct
from an expense account.

**Wastage account.** Where a loss of stock is expensed.

**Round-off account.** Where rounding adjustments land.

**Stock in hand.** A warehouse's inventory asset account.

**Trial balance.** Leaf account debits, credits, and balances to an as-of date,
within a fiscal year, including opening entries. Debits equal credits.

**Simple profit and loss.** The ledger summarised over a period.

**Supplier invoice.** The bill for received goods. Clears the goods-received
liability and creates the payable.

**Payable.** What you owe a supplier.

**Allocation.** How much of a payment settles a particular invoice.

## Reporting

**Daily profit and loss.** The management snapshot for one business day, in food,
drinks, and total columns. Posts nothing to the ledger.

**Business day.** The trading day defined by a configurable start hour. Not
necessarily midnight to midnight.

**Query report.** A filter-and-table report computed at read time over orders,
closing entries, or ledger rows.

**POS register.** One row per closed shift with per-mode reconciliation.

**Prime cost.** Drink cost plus employee cost. Highlighted because it usually
predicts the month.

**Food usage not counted.** The warning on a profit and loss statement when food
was sold but no kitchen count was filed. Food cost reads zero and is flagged as
unknown.

## Technical

**Base model.** The shared abstract model providing created and updated timestamps.

**Service function.** A function in a `services.py` that performs a
multi-record transaction atomically.

**Guarded save.** A model `save()` override that refuses illegal transitions or
edits to immutable records.

**Fail closed.** Refusing a transaction rather than completing it partially when
configuration is missing.

**HTMX.** The mechanism that swaps HTML fragments in place instead of reloading
the page.

**Alpine.js.** Small client-side behaviour — dialogs, focus, local state.

**Bar.** The drinks station, and its warehouse.

**Store.** The central warehouse where deliveries are received.

**Makefile.** The command wrapper: `make dev`, `make test`, `make backup`, and
the rest.