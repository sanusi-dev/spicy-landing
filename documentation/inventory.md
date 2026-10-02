# Inventory

Spicy tracks stock for drinks at the point of sale and for food through an
end-of-day kitchen count. The split is deliberate, and understanding it explains
most of the reporting.

## Why drinks and food are handled differently

A sold bottle leaves the shelf, one for one, at the moment it is paid for. The
counter knows exactly what it sold and exactly which bin it came from, so it can
deduct it immediately and value it exactly.

A sold plate of jollof rice tells you a portion was sold. It does not tell you how
much rice, oil, tomato, or chicken went into it. The kitchen knows better than the
counter — it saw the actual pans. So the system compares what the recipe says
should have been used against what the kitchen counts, and uses the kitchen's
count as the real cost.

The effect: drink cost is precise and automatic; food cost depends on the kitchen
counting honestly and promptly. Skipping the count makes food cost read as zero,
and the profit and loss statement warns you when that has happened rather than
reporting a flattering number.

## Items

Every product and every ingredient is an **Item**. They are the same record,
distinguished by three independent flags:

| Flag | Meaning |
|---|---|
| Sellable | Can appear on a menu and be sold. |
| Stock-tracked | Has a quantity and a value in a warehouse. |
| Purchasable | Can be received from a supplier or bought at market. |

Together with the item's department, the flags must fit one of four shapes. The
system refuses the rest:

| Department | Sellable | Stock-tracked | Purchasable | This is |
|---|---|---|---|---|
| Drinks | Yes | Yes | Yes | A drink you sell and count |
| Food | Yes | No | No | A dish on the menu |
| Food | No | Yes | Yes | An ingredient |
| Any | No | No | No | A template with sizes |

The shape of a sellable food item is the interesting one. A dish on the menu must
not be stock-tracked or purchasable, because you never receive "jollof rice" into a
warehouse and never count it — you count its rice, oil, and tomato. The dishes are
recipes over ingredients; they are not stock.

Each item also has a group (for catalog filtering and report grouping), a unit of
measure, an image, and a last purchase rate.

## Units of measure

Every item has a **stock unit** — the countable unit used for the bin, the ledger,
counts, and the point of sale. Bottles, kilograms, plates.

You can define a bulk purchase unit per item with a conversion: 1 crate = 24
bottles, 1 bag = 50 kg. This applies when receiving, not when selling. A sale of
one drink deducts one bottle, whatever pack it arrived in.

Receiving 5 crates at 12,000 each against a 24-per-crate conversion records 120
bottles into stock and blends the crate price into the per-bottle cost.

## Warehouses and bins

Three warehouses are expected:

| Warehouse | Holds |
|---|---|
| Central Store | Supplier deliveries and market purchases before distribution |
| Kitchen | Food ingredients |
| Bar | Drinks sold at the counter |

A **bin** is the current position of one item in one warehouse: quantity on hand,
quantity reserved for open orders, and the current unit cost. There is no separate
"available stock" figure — it is always on-hand minus reserved, computed at read
time.

Bins change only through the stock documents and sales described below. They are
read-only in the Django admin for the same reason.

## The stock ledger

Every movement writes an immutable **stock ledger entry** recording the item, the
warehouse, the signed quantity, the unit rate, and the resulting change in stock
value. Entries carry the document that caused them — a purchase receipt, a stock
entry, a reconciliation, a POS order.

Ledger entries cannot be edited or deleted. A correction is a new, reversing entry
pointing at the original. That is the audit trail: you can always reconstruct why
a number is what it is.

### How cost is worked out

Stock is valued at **perpetual weighted average cost**. There are no cost layers
and no FIFO queue.

- Receiving goods blends the new value into the running average:
  `(on hand × current cost + value received) ÷ (on hand + received)`.
- Issuing goods — a drink sold, a transfer out — values them at the current
  average cost and leaves the average unchanged.

So buying a crate of a drink dearer than the average raises the average for
everything in the bin, and selling one at that average costs the average amount.

## Receiving stock

Two documents bring goods in, and the distinction is whether the supplier expects
to be paid later.

### Purchase receipt

Goods delivered on credit. Goes into the central Store, valued at the rate on the
receipt, blended into the bin cost. Posts a debit to the store's stock account and
a credit to goods-received-not-billed, because the money is not moving yet — you
owe the supplier.

Rates must be greater than zero. Lines may be entered in the stock unit or a bulk
purchase unit; the quantity is converted once, on submission.

### Stock entry — material receipt

Goods bought at market and paid immediately. Also goes into the central Store and
blends into the bin cost, but you select the payment mode that funded it, and the
ledger credits that mode's account directly. There is no payable.

Use this for produce and staples bought on the day rather than on an account.

## Moving stock

**Stock entry — material transfer** moves goods from the central Store to the
kitchen or bar. There is no rate on a transfer line: value moves at the source
bin's current average, and the destination recalculates its own average.

You cannot drive a source bin negative. You cannot cancel a transfer once stock
has already been consumed from the destination — transfer the remainder back or
file an adjustment.

A transfer between two warehouses that share the same ledger account produces no
ledger entry, because there is nothing to record.

## Counting

**Stock reconciliation** handles four situations, and the reason you choose
determines the ledger entry.

| Reason | Use it for | Ledger |
|---|---|---|
| Opening stock | Seeding a brand-new warehouse. Rejected once the warehouse has any ledger history. | Debit stock, credit temporary opening equity |
| Adjustment | Correcting a count difference, either direction. | Debit or credit stock adjustments against the warehouse |
| Consumption | End-of-day kitchen count of what was used. Food items, kitchen warehouse only. Cannot exceed what is in the bin. | Debit the kitchen's expense account, credit the kitchen's stock |
| Waste or damage | Something spoiled, broke, or was over-prepared. Enter the amount wasted, not what is left. Cannot exceed on-hand minus reserved. | Debit wastage, credit the warehouse |

The consumption count is the one that matters for reporting. It is what turns
theoretical food cost into actual food cost.

Every reason posts to the ledger on submission, and cancellation reverses it,
dated on the day you cancel rather than backdated to the original.

## Recipes

A **recipe** is the ingredient card for one dish: 0.125 kg rice, 0.03 kg oil, and
so on, with a yield. One active recipe per dish. Only food dishes have them, and
only dishes that are not size templates — each size carries its own card.

The ingredient quantities are in the ingredient's own stock unit, and the yield is
baked into the line quantities.

Two things follow:

- **Theoretical usage** is the recipe multiplied by the dishes sold, with returns
  netted off. It is a memo figure on the profit and loss statement.
- **Actual usage** is what the kitchen counted. It is the cost of goods sold for
  food.

A dish sold with no active recipe appears on the usage report as unmapped, so it
shows up rather than silently costing nothing.

Recipes never move stock. Editing a recipe changes the theoretical figure only,
and never rewrites a profit and loss statement that has already been submitted.

## Stock reports

**Inventory → Stock balance** shows opening, received, issued, and closing
quantities per item. **Inventory → Stock ledger** is the full movement history,
filterable, with a CSV export. **Inventory → Food usage** compares theoretical
against actual for the day and lists unmapped dishes.

## Rules worth remembering

- Receiving goods costs the bin and raises or lowers the average cost.
- Selling a drink deducts it at the current average.
- Cancelling a receipt reverses at the current average, and the difference between
  that and the original rate goes to the inventory price variance account. If
  prices moved between the receipt and its cancellation, that variance is real and
  is recorded.
- A bin cannot be issued below what is reserved for open orders.
- No ledger entry may be dated in the future.
- Ledger entries cannot be edited or deleted, by anyone, including administrators.
- The kitchen count cannot exceed what the kitchen bin holds. If it does, the
  previous count or an unrecorded transfer is wrong.