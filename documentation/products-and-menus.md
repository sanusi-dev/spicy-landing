# Products and menus

Manager or administrator access. This is the back office path; the cashier sees
the result on the POS.

## How the catalogue fits together

```
Item                    the product record — a dish, a drink, or an ingredient
├── flags              sellable / stock-tracked / purchasable
├── department         FOOD or DRINKS — decides which station it goes to
└── MenuItem           a price: "this item costs ₦2,500 on this menu"
```

An **item** is what exists. A **menu item** is what it costs on a given menu. The
same item can appear on several menus at different prices, and the POS shows the
active menu's price.

**The department is not a category.** It is a routing and costing decision: which
station prepares it, whether stock is deducted, and which income account it
credits. Item groups are the display categories on the POS.

## Item groups

Flat named categories with an optional description. They filter the POS catalog
and group the item-wise sales report. No ordering field — items sort
alphabetically within a group.

## Units of measure

Every item has a stock unit: the countable unit for its bin, the ledger, counts,
and the POS. Bottles, kilograms, plates.

You may also define a bulk purchase unit with a conversion, such as 1 crate = 24
bottles. That applies when receiving stock only. Selling one drink always deducts
one bottle.

Conversions are only allowed on items that are both stock-tracked and
purchasable — ingredients and drinks. A sellable dish cannot have one, because you
do not receive dishes into a warehouse.

## Items

Creating an item requires a name, group, unit, and department. The three flags
must match one of the four shapes below, and the system refuses anything else.

| Department | Sellable | Stock-tracked | Purchasable | Example |
|---|---|---|---|---|
| Drinks | Yes | Yes | Yes | Bottled water, beer |
| Food | Yes | No | No | Jollof rice |
| Food | No | Yes | Yes | Rice, cooking oil, tomato |
| Any | No | No | No | A template with sizes |

The sellable-food shape is the one to understand. A dish on the menu must not be
stock-tracked or purchasable. You never receive "jollof rice" into a warehouse and
never count it; you count its rice, oil, and tomato. The dish is a recipe over
ingredients, not a stock item. See [Inventory](inventory.md).

Items also take a code (assigned automatically as `ITEM-0001` if you leave it
blank), an image, and a description.

### What the system protects

- You cannot make an item non-sellable while an enabled menu line still points at
  it. Disable the menu line first.
- You cannot change an item's unit or turn off stock tracking or purchasing while
  conversions exist for it.
- You cannot change the unit while a recipe uses the item.
- A recipe ingredient must stay stock-tracked, purchasable, and non-sellable.
- Turning an item non-sellable deletes its add-on relationships, since an add-on
  with no price cannot be sold.

## Menus

A **menu** is a named collection of priced items. There is one active menu,
selected in restaurant settings; the POS shows only that one.

Disabling a menu hides all its items from the POS without deleting anything. Useful
for a seasonal menu or for a lunch list you run alongside the main one.

## Menu items

A menu item links an item to a menu at a price. Fields:

| Field | Notes |
|---|---|
| Item | The product being priced |
| Rate | The selling price. If left blank it defaults to the item's last purchase rate. |
| Special dish | Puts it under the POS specials filter |
| Disabled | Removes it from the POS immediately; the price stays in the database |
| Image | Falls back to the item's image |

The rate is a constraint-checked decimal and cannot be negative. There is no price
history and no price list — one price per menu per item.

## Sizes

A dish with sizes is a **template** item with sizes linked to it. The template
itself has none of the three flags set and is not sellable; the sizes are ordinary
items with their own prices.

On the POS, sizes collapse into a single card showing the parent name and the
price range, like ₦1,200 – ₦3,500. Tapping it opens a single-choice size picker,
and the chosen size joins the cart as its own line at its own price.

A size must be on a menu, otherwise the POS has no price to charge. Sizes are
resolved on the active menu, so a size priced on a different menu will not appear.

## Add-ons

An add-on is a separate sellable item linked to a parent, like "extra cheese" on a
pizza or "extra shot" on a coffee.

Selecting an add-on joins the cart as its own line at the add-on's own price, not
as a modification of the parent's price. So "jollof rice" at ₦2,000 plus "extra
plantain" at ₦500 is two lines totalling ₦2,500.

An add-on must be sellable and must be on an enabled menu line, or the POS has no
price for it. There are no modifier groups, no minimum or maximum selections, and
no add-on quantities — an add-on is a line, added once per selection.

## Recipes

A dish's ingredient card, on the item page. 0.125 kg rice, 0.03 kg oil, with a
yield. One active recipe per dish; sizes and add-ons carry their own.

Ingredients must be stock-tracked, purchasable, non-sellable food items. The
recipe register shows the plate cost — what one portion should cost at current
kitchen rates — which is for pricing decisions and never posts to the ledger.

Recipes are the input to the theoretical food cost on the daily profit and loss
statement. They do not move stock.

## Walkthrough: setting up a new menu

1. **Create item groups** for the categories you want in the POS sidebar.
2. **Create units of measure** for the countable units you use: bottle, kg, plate.
3. **Create ingredient items** — food, non-sellable, stock-tracked, purchasable —
   with their stock unit.
4. **Create drink items** — drinks, sellable, stock-tracked, purchasable.
   Add bulk purchase units and conversions where you buy by the crate or bag.
5. **Create dish items** — food, sellable, not stock-tracked. Add recipes for each.
6. **Create a menu** and add menu items with the selling rate for each drink and
   dish.
7. **Set the menu active** in restaurant settings.
8. **Create a production unit** per department if you have not, and point each at
   its warehouse and ledger accounts.
9. **Receive opening stock** for the store, kitchen, and bar, then transfer to the
   kitchen and bar.

Until the production units exist and carry their accounts, a sale will be rejected
with a message telling you which department is unconfigured. Until drink stock
arrives, drinks will show as unavailable.