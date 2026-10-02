# Daily operations

This is the cashier's day, in order. Every step assumes a shift is open, because
Spicy will not let you take an order otherwise.

## Opening the shift

Open **Open shift** on the POS. For each payment mode in use, enter the amount in
the drawer at the start of the day — the float.

Two rules:

- **At most one cash-type mode per shift.** The single drawer backs both change
  given during the day and the variance counted at close. Two cash modes would
  make the reconciliation ambiguous.
- **Only one shift can be open at a time.** This is enforced globally, not per
  cashier. If a shift is already open when you try to open one, you are joining
  the existing shift rather than starting a second.

The opening float is recorded against each mode and becomes the baseline for the
close. Getting it right is the difference between a variance that means
something and one that means nothing.

## Taking an order

Start a new order from the POS. The order is a draft until you send it to the
kitchen.

**The catalog** shows the active menu grouped by item group, with a category
sidebar, a specials filter, and search. Each card shows the name, price, and an
image or initials placeholder.

- Clicking a card adds it to the cart.
- Items with sizes collapse into one card showing the price range. Tapping it
  opens a size picker; the chosen size joins the cart as its own line at its own
  price.
- Items with add-ons open a dialog first. Selected add-ons join the cart as
  separate lines.
- Drinks that are out of stock are greyed out and cannot be selected. Food is
  never gated on stock — see [Inventory](inventory.md).
- Search matches item names, variant names, and item codes.

**Inside the cart** you can:

- Set the order type: dine-in or takeaway.
- Change the guest count, from 1 to 50. Each guest becomes a customer card, and
  items you add belong to the active guest. Tickets and receipts group by guest,
  so a table ordering separately is handled by switching guests as you add.
- Lowering the guest count below a guest who still has items is blocked.
- Adjust quantities, edit, or remove lines.
- Add a comment to a line — "no onion", "table 4".
- Clear the whole cart, but only while nothing has been sent to the kitchen.

Adding a drink reserves its stock immediately, so a second cashier cannot sell the
last unit while this order is open. If the reservation cannot be made, the line is
rejected and nothing changes.

## Sending to the kitchen

**Send** creates one immutable ticket per department and prints it:

- Food lines go to the kitchen production unit as a KOT.
- Drink lines go to the bar production unit as a BOT.

Tickets are snapshots. Once created, a ticket's contents never change — if the
order was wrong, you cancel it and the kitchen gets a cancellation ticket. That
is why an order cannot be edited after sending, even if the browser tries to.

A production unit can suppress tickets for takeaway orders, which is useful for a
bar that does not need a ticket on drinks taken away.

The POS shows each ticket's print status — pending, printed, or cancelled — and a
manager can retry a failed print or reprint a ticket.

## Taking payment

**Pay** opens the payment dialog with the balance pre-filled. You can split across
modes: part cash, part transfer.

- Cash may be overpaid, and the change is shown and recorded.
- Overpaying on a card or transfer is rejected.
- Electronic payments need a reference when the restaurant requires one.
  References are unique — the same reference cannot be used twice, which catches
  a double-entered transaction.
- Only modes that were declared when the shift opened are accepted.
- Only enabled modes with a ledger account mapping are accepted.

Settling does several things at once, in a single database transaction. If any
part fails, nothing happens: the order stays a draft, no payment row is written,
stock is untouched, and no ledger entry is created.

On success the order becomes submitted and immutable, drink stock is deducted,
the general ledger is written, and the receipt prints. Settlement also creates the
kitchen and bar tickets if they do not exist yet, so a paid order can never escape
the kitchen.

A printer failure at this point warns but does not block the sale.

## Order history

History lists today's submitted, paid, non-return orders by default, with filters
for status, payment mode, order type, and a search box. Selecting a row opens a
detail drawer.

Cashiers see only paid sales. Managers see everything, including returns,
cancellations, and discarded drafts, and can reprint receipts and tickets.

## Cash-outs

Cash leaving the drawer during the shift — transport, ice, small repairs — is
recorded as a cash-out. Choose the mode, the amount, and a reason. A cash-out is
submitted immediately; the shift close is the review point, not the cash-out.

A cash-out reduces that mode's expected drawer amount automatically, so you do not
correct for it by hand. Cashiers can record them; only a manager can cancel one,
and only while the shift is open.

## Cancelling work

Three different actions, and picking the wrong one is refused with an explanation.

| The situation | The action |
|---|---|
| Draft, never sent to the kitchen | Delete it. A tombstone is kept for the audit trail. |
| Draft, sent to the kitchen, unpaid | Cancel it. The kitchen gets a cancellation ticket and any drink reservation is released. |
| Submitted and paid | Return it. See below. |

A paid order cannot be cancelled. There is no path from a settled sale back to a
void that erases it — correcting money means recording a refund.

Cancelling requires a reason: wrong order, customer changed mind, cashier error,
or other with a note.

## Closing the shift

**Close shift** shows the reconciliation before you commit to it:

| Column | Meaning |
|---|---|
| Opening float | What you declared at open, per mode |
| Expected | Opening + collected − change given − refunds − cash-outs |
| Counted | What you physically counted |
| Difference | Counted − expected |

Count each drawer and enter the figure. A shortfall or surplus becomes the
difference.

- A **non-cash** counted amount above what was expected is rejected. You cannot
  deposit bank money you did not process; a figure higher than expected means the
  count is wrong, not that the drawer holds extra.
- A cash surplus is allowed and flows into the variance.
- If the total difference exceeds the restaurant's variance approval threshold,
  closing requires a manager and a written explanation.
- Open drafts block the close. Finish or delete them first.

Closing stores the shift's sales totals, writes a ledger entry for any variance
against the drawer that actually held it, and links the close to the opening. A
cash shortage debits the configured shortage account and credits the drawer's own
account — so a shortage on the transfer mode never lands on the cash account.

Cancelling a close reverses the variance entry and does not reopen the shift. Once
a new shift is open, the previous close can no longer be cancelled. To correct a
count afterwards, reopen and re-close — do not edit the stored figures.

## Refunds

A manager creates a return against a paid order. The return starts as a draft
mirroring the order, with negative quantities.

Reduce or remove lines as needed before submitting. Each drink line can be marked
**not restockable** — for a returned bottle that is already broken or poured away.
Those lines do not go back into stock; instead the cost moves to the wastage
account, so the drink stays costed once and the loss is visible.

Submitting the return:

- Restores drink stock at the rate the original sale used, not the current
  weighted average. If prices moved since the sale, the return still reverses the
  sale exactly.
- Records negative payment rows, pro-rated across the original payment modes.
- Reduces the shift's expected drawer amount, so a same-day refund nets out of the
  close.
- Writes refund ledger entries.

One active return per order. A fully returned order has nothing left to refund, and
a second attempt is refused.

## The daily loop

1. Open the shift with the float.
2. Take orders, send to the kitchen, take payment.
3. Record cash-outs as they happen.
4. Close the shift, count the drawer, explain any variance.
5. In the kitchen, count what was consumed and what was wasted.
6. Produce the daily profit and loss.

Steps 5 and 6 are the manager's, and they are what make the food cost on the
profit and loss statement real rather than assumed. See
[Reporting](reporting.md).