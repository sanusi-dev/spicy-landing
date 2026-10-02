# Data model

The entities and how they connect. Useful when reading a bug report, extending
the system, or writing an import.

## The shape of it

Every record carries creation and update timestamps. Records are referenced
throughout with a protective constraint: an order cannot be deleted because its
items were, because the items are protected behind the order. Financial and stock
records are never cascade-deleted from the things they point at.

## Configuration

```
Restaurant                the single installation record
├── active_menu ──────────────► Menu
├── store_warehouse ─────────► Warehouse (Central Store)
├── default_warehouse ───────► Warehouse (Bar / POS)
└── 15 ledger accounts ───────► LedgerAccount

ProductionUnit            one per department: Kitchen (FOOD), Bar (DRINKS)
├── warehouse ───────────────► Warehouse
├── income_account ─────────► LedgerAccount
├── sales_returns_account ──► LedgerAccount
└── expense_account ────────► LedgerAccount
```

`Restaurant` is a singleton enforced by the database. There is no branch, no
location hierarchy, and no tenant key.

## Catalogue

```
ItemGroup                 display category
UOM                       countable unit: Bottle, Kg, Plate

Item                      a dish, a drink, or an ingredient
├── item_group ───────────► ItemGroup
├── stock_uom ────────────► UOM
├── variants ─────────────► Item        (a size, pointing at its template)
└── recipes ──────────────► Recipe

ItemUOMConversion         1 crate = 24 bottles, per item

Menu                      a named priced collection
└── items ────────────────► MenuItem
                              ├── menu ─► Menu
                              └── item ─► Item

ItemAddOn                 parent item + add-on item
ItemVariant               parent item + variant item

Recipe                    one active card per dish
└── items ────────────────► RecipeItem ─► Item (the ingredient)
```

An `Item` serves as product and ingredient alike; the sellable, stock-tracked, and
purchasable flags distinguish them.

## Orders

```
Order                     the sale record
├── created_by ───────────► CustomUser     (the cashier who built it)
├── cashier ──────────────► CustomUser     (who settled it)
├── opening_entry ────────► POSOpeningEntry
├── stock_warehouse ──────► Warehouse      (snapshot, changeable never)
├── return_against ───────► Order          (self-reference for returns)
├── items ────────────────► OrderItem
├── payments ─────────────► OrderPayment ─► ModeOfPayment
├── kots ─────────────────► KOT ──────────► ProductionUnit
│                             └── items ───► KOTItem ─► Item
└── audit_events ─────────► OrderAuditEvent ─► CustomUser

OrderSequence             the atomic counter behind order numbers
```

An `OrderItem` snapshots the item name, rate, department, and stock flag at the
time it was added. `OrderPayment` snapshots nothing — it points at the live
payment mode. `KOT` and `KOTItem` are immutable snapshots of what was sent to a
station.

## Inventory

```
Warehouse                 Store, Kitchen, Bar

Bin                       current position: item + warehouse
├── actual_qty
├── reserved_qty
└── valuation_rate        weighted average cost

StockLedgerEntry          immutable movement
├── item ─────────────────► Item
├── warehouse ────────────► Warehouse
├── quantity              signed
├── unit_rate
├── stock_value_change
├── variance_amount / variance_type
└── reversal_of_sle ──────► StockLedgerEntry
```

`Bin` is the running position. `StockLedgerEntry` is the history. Bin values are
written only by the ledger posting routine — never by hand, never from the admin.

### Stock documents

Three documents, each following draft → submitted → cancelled, each producing
ledger entries on submission and reversals on cancellation.

```
StockEntry                material receipt, or store-to-station transfer
└── items ────────────────► StockEntryDetail

StockReconciliation       opening stock, adjustment, consumption, waste
└── items ────────────────► StockReconciliationItem

PurchaseReceipt           supplier delivery into the store
└── items ────────────────► PurchaseReceiptItem
```

Cancellation posts reversing ledger entries dated the day of cancellation.

## Payments

```
ModeOfPayment             Cash, Bank Transfer, Card, USSD / Mobile Money
└── type                  CASH | BANK | GENERAL | PHONE
    is_default, enabled

PaymentGLMapping          one-to-one: mode → ledger account
```

One cash-type mode per shift, enforced at shift opening.

## Shifts

```
POSOpeningEntry           the shift
├── cashier ──────────────► CustomUser
├── opening_payments ─────► OpeningPayment ─► ModeOfPayment
└── closing_entry ────────► POSClosingEntry

POSClosingEntry           the close, with per-mode reconciliation
└── closing_payments ─────► ClosingPayment
                              ├── mode_of_payment
                              ├── opening_amount
                              ├── expected_amount
                              ├── closing_amount    (counted)
                              └── difference
└── variance_journal_entry ► JournalEntry

ShiftCashOut              mid-shift cash leaving the drawer
└── mode_of_payment, amount, reason
```

An opening entry stays submitted after close; the presence of a closing entry is
what marks it closed.

## Accounting

```
LedgerAccount             tree: parent ──► children
├── is_group              a group takes no postings
├── account_type          ASSET | LIABILITY | EQUITY | INCOME | EXPENSE
├── report_type           BALANCE_SHEET | PROFIT_AND_LOSS
├── freeze_account, disabled
└── warehouse / payment mapping (reverse relations)

FiscalYear                date range; enabled years cannot overlap

GLEntry                   one side of a posting — immutable
├── account ──────────────► LedgerAccount
├── posting_date
├── debit, credit
├── voucher_type, voucher_no
├── fiscal_year ──────────► FiscalYear
└── is_cancelled

JournalEntry              hand-entered voucher
└── accounts ─────────────► JournalEntryAccount ─► LedgerAccount
```

Voucher types written to the ledger: Order, Journal Entry, Supplier Invoice,
Supplier Payment, Purchase Receipt, Stock Entry, Stock Reconciliation, Shift
Cash-Out.

## Payables

```
Supplier
├── payable_account ──────► LedgerAccount
└── invoices ─────────────► SupplierInvoice
                              ├── purchase_receipt ─► PurchaseReceipt
                              ├── items ────────────► SupplierInvoiceItem
                              │                        └── source_receipt_line
                              ├── expenses ──────────► SupplierInvoiceExpense
                              └── allocations ───────► SupplierPaymentAllocation

SupplierPayment
└── mode_of_payment ──────► ModeOfPayment
```

## Reporting

```
PnLConfiguration          singleton: business-day hour, electricity, depreciation
├── PnLMaterial           report-level consumable, not inventory stock
└── PnLRecurringExpense   by kind, direct/indirect, daily/monthly/percentage

DailyPnL                  one draft, one submitted, per business date
├── lines ───────────────► DailyPnLLine          (section, label, food, drinks, total)
├── cogs_rows ────────────► DailyPnLCogsRow
├── consumption_rows ────► DailyPnLConsumptionRow
├── theoretical_rows ─────► DailyPnLTheoreticalRow
└── unmapped_rows ────────► DailyPnLUnmappedRow
└── amended_from ─────────► DailyPnL
```

Submission freezes the totals and the recurring rates onto the document. The
statement is a snapshot; it holds no live references.

Query reports hold no models. They aggregate orders, closing entries, and ledger
rows at read time.

## Users

```
CustomUser                username login, avatar, is_active
└── groups ───────────────► Group
                             Spicy Admin
                             Spicy Manager
                             Spicy Cashier
```

Roles are Django groups read by name on each request. There is no role column and
no per-user permission grants.

## Relationships worth knowing

- An order references the shift it was taken on. Draft listings, settlement, and
  closing all filter through it.
- An order line snapshots the item's department, which selects the production unit
  that receives the ticket and the income account that receives the revenue.
- Only drink lines reach the stock ledger from a sale.
- A drink line's ledger cost comes from the stock ledger entries that settlement
  wrote — the accounting does not recompute it.
- A purchase receipt references the store warehouse and creates a liability
  through goods-received-not-billed. The supplier invoice clears that liability.
- A return references its original order and its original lines, and reverses
  stock and ledger at the original sale's rate.

## Extending it

Migrations are ordered and applied automatically. When a schema change touches
financial or stock records, the existing guards still apply — immutable ledger
entries and protected references mean a migration cannot quietly break history.

The migration layer carries an explicit single-location assertion: if more than
one branch or POS profile somehow exists, the migration refuses to run rather than
collapsing them and losing data.