# Business rules

The rules Spicy enforces, and the reasoning behind them. Most of these are not
obvious from the interface, and several would surprise anyone coming from a
conventional point-of-sale system.

## Money

**Amounts are exact decimals.** Never floating point. Every amount keeps two
decimal places.

**Order totals round to whole naira, half up.** A total of 1,499.50 becomes
1,500. The 0.50 difference is stored as a rounding adjustment and posted to the
round-off account, so the ledger always reconciles to the cash actually taken.

**There is no tax.** No tax rate, no tax line, no tax template. The order total is
the sum of the line amounts, rounded.

**There are no discounts.** No coupon, no percentage off, no happy hour. A sale is
at the menu price. A mistake is corrected by cancelling or returning the order.

**Change is cash only.** Overpaying on a card or transfer is rejected. A customer
cannot hand over 2,000 on a card for a 1,500 bill.

**No partial payment.** The tender must cover the full total.

**Amounts of zero are dropped.** A payment row of 0 in a split tender is ignored
rather than stored.

## Orders

**An order is a draft until you send it.** Drafts are freely editable.

**Once a ticket exists, the order locks.** Sending to the kitchen creates an
immutable ticket. From then the order cannot be edited, even if a stale browser
sends a request — the server checks, not the browser.

**A submitted order cannot be modified at all.** Not by a manager, not by an
administrator. Corrections post reversals. The only exit from a paid order is a
return.

**An order is never hard-deleted.** Not even a mistake. An unsent draft is
abandoned as a tombstone: the status changes to discarded, the actor and time are
recorded, and an audit event captures what the order contained. The audit trail
cannot be purged.

**Three exits, one per stage.**

| Stage | Exit |
|---|---|
| Draft, never sent | Delete — tombstone |
| Draft, sent, unpaid | Cancel — kitchen gets a cancellation ticket |
| Submitted and paid | Return — negative order, stock and ledger reversed |

Choosing the wrong one is refused with an explanation rather than silently doing
something surprising.

**Drafts belong to their creator.** A cashier sees and changes only their own
drafts; another cashier gets a 404, not a 403, so a draft's existence is not
confirmed. Managers and administrators see all drafts on the shift.

**The open-draft cap is per shift, not per cashier.** The limit is enforced against
every draft on the shift under a database lock, so it cannot be dodged by opening
orders as several users.

**Prices are snapshotted onto the order line at the moment it is added.** Later
menu price changes do not rewrite the order. The item name and department are
snapshotted too, so renaming an item leaves history intact.

**Lines merge on item, guest, and comment.** Two lines for the same item and guest
combine only if their comments match — "no onion" and "extra spicy" stay separate
lines.

## Departments

**Every item is FOOD or DRINKS.** Not optional, not a category. The department
decides:

- which production unit receives the ticket,
- whether stock is deducted at the counter,
- which income and returns account receives the revenue.

## Stock

**Only drinks are deducted at the point of sale.** See below.

**Drinks are reserved when added to the cart and deducted when paid for.** Two
phases. Reserving stops two cashiers selling the last bottle; deducting is what
writes the ledger and costs the sale.

**A bin cannot be issued below what open orders have reserved.**

**Food is never stock-tracked.** A sellable food item must not be stock-tracked or
purchasable. A dish is a recipe over ingredients, not a stock item.

**Stock is valued at perpetual weighted average cost.** No FIFO, no layers.
Receiving blends into the average; issuing values at the current average.

**Ledger entries are immutable.** Corrections are reversing entries pointing at the
original. No one can edit or delete a stock movement.

**Cancellation reverses at the current average, not the original rate.** If prices
moved between a receipt and its cancellation, the difference goes to the inventory
price variance account. That variance is real drift and is recorded rather than
hidden.

**Opening stock is only for a genuinely fresh warehouse.** Rejected once the
warehouse has any ledger history, including a cancelled entry.

**A kitchen consumption count cannot exceed what the bin holds.** If it does, the
previous count or an unrecorded transfer is wrong.

**Waste is entered as the amount wasted**, not what is left.

**No stock entry may be dated in the future.**

## Shifts

**Exactly one shift is open at a time.** Globally, not per cashier. This is
enforced by a database lock, not just a check.

**At most one cash-type payment mode per shift.** A single drawer backs both
change given and the variance counted at close. Two cash drawers would make the
reconciliation ambiguous.

**Cashiers can close only their own shift.** Managers can close any shift.

**Open drafts block the close.** Finish or delete them first.

**A shift with orders cannot be cancelled.** Cancel the close instead.

**A close cannot be cancelled once a newer shift is open.**

**The period end is set at the moment of submission**, not when the form was
opened.

**A non-cash counted amount above expected is rejected.** You cannot deposit bank
money you did not process. Cash surplus is allowed.

**A large variance needs a manager and a written explanation.** The threshold is
configurable.

**Cash-outs are immediate, not drafted.** The shift close is the review point.
Only a manager can cancel one, and only while the shift is open.

## Accounting

**Debits must equal credits, checked before anything is written.** The check runs
before the first row is saved and the write is atomic.

**A posting fails closed on missing configuration.** If a needed account is absent,
disabled, frozen, or a group, the entire settlement is refused. Nothing partial is
written. A misconfiguration is loud, not silent.

**Ledger entries cannot be edited or deleted.** Corrections are reversals.

**Reversals are dated on the day you cancel**, never backdated. A correction made
in October belongs to October.

**An account cannot appear on both sides of one posting.** Such legs would net to
zero and vanish from the statement, so the posting is refused.

**Only leaf accounts receive postings.**

**A payment mode cannot be mapped to a sales account.** It would credit income
when money arrives.

**Settling requires the payment mode to have been declared at shift opening.** A
mode added mid-shift is not usable for settlement until the next shift, even if it
shows as enabled.

**Electronic payment references are unique.** Reusing one is rejected, which
catches a double-entered transaction.

**Payment rows are immutable once the order is settled.**

**Returns reverse at the original sale's rate**, not the current weighted average.
A bin that has re-blended since the sale still reverses exactly, with no variance
leg.

**Not-restockable returns go to wastage, not back to stock.** The drink stays
costed once and the loss is visible. The wastage account must differ from the
drinks expense account.

**Sales returns accounts are required.** A refund with no returns account configured
is refused rather than posted to an arbitrary account.

**Only drinks post cost of goods sold at settlement.** Food cost reaches the
ledger through the kitchen's consumption count.

**Cash variance lands on the drawer that held it.** A shortage on the transfer mode
credits the transfer account, not cash.

## Roles

See [Users and roles](users-and-roles.md) for the access matrix. The rules worth
restating:

**Every page declares its own required role on the server.** Nothing relies on the
URL or on hiding a button.

**An anonymous request redirects to sign-in. A signed-in user with the wrong role
gets 403.** Different outcomes, so you can tell a session problem from a permission
one.

**Another cashier's draft returns 404, not 403**, so its existence is not
confirmed.

**Only an administrator creates accounts and assigns roles.**

**Deactivating preserves history.** Use it rather than removing someone who has
left, so their past orders and shifts keep their name.

## Audit

**Every order mutation records an immutable event** with the actor and metadata:
created, item added, item removed, quantity changed, cleared, tickets created,
submitted, cancelled, discarded, return created, return submitted.

**Audit events cannot be edited or deleted.**

## Reporting

**Returns net on the return date**, not the date of the original sale.

**Query reports exclude drafts, cancellations, and discards.** Only submitted
orders and returns count as sales.

**The daily profit and loss posts nothing to the ledger.** It is a snapshot of what
the ledger already holds, plus figures you enter.

**Submitting freezes it.** Later changes to your rate settings do not rewrite a
submitted statement. Cancel and amend to correct one.

**A submitted statement cannot have a late kitchen count folded in.** The frozen
flag stands.

**Missing food usage is flagged, not hidden.** A day with food sales and no kitchen
count is stamped, so food cost never silently reads zero.

**Monthly recurring expenses prorate daily, with the last day absorbing the
remainder**, so the month totals exactly.

## Scope

Deliberate boundaries, not gaps in progress:

- One restaurant, one location, one database.
- Cashier-operated. No waiter mode.
- No taxes, discounts, coupons, or pricing rules.
- No customer master, customer accounts, or loyalty.
- No table or floor plan.
- One currency.
- Employee cost is a figure you enter, not a payroll engine.

## Assumptions the system makes

Worth knowing because they are not configurable:

**The cashier knows the price.** There is no table management, so nobody needs to
look up a menu price mid-order the way a waiter would.

**The kitchen works from paper.** There is no kitchen display screen and no
prepared/ready state. A ticket is printed and that is the whole interface.

**Food usage is counted, not measured.** This is the largest single assumption in
the system and it directly determines food cost accuracy.

**Cancellations are rare enough that a manager must approve one.** That is why
cashiers cannot cancel or return.

**One drawer per shift.** Enforced, so the reconciliation is meaningful.