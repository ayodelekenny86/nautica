# Pricing Strategy

How the order value is set, when to discount, when to surge, and the guardrails
that keep the 30%/15% model profitable.

## The price equation

```
orderValue = listPrice × (1 − discountPercent/100) × (1 + surgePercent/100)
```

Three levers, all operator-controlled through the pricing console
(`updatePricing` in `src/lib/payments.js`). The split (30/20/15) is separate
and also operator-controlled — but changing it changes the whole model, so it
is governed (see guardrails).

## The three levers

### 1. List price (the shelf price)

The undiscounted price of the water. Currently GH₵600 for a standard 1,000-
gallon delivery. Set by the operator, reviewed quarterly against:
- GWCL bulk tariff + seller's cost of supply
- Informal street-tanker price (the competitive ceiling)
- What the buyer will bear for certified, tracked delivery

**Rule:** list price should sit at or slightly above the informal tanker price.
Nautica wins on trust and speed, not on being the cheapest shelf price — the
discount does the rest.

### 2. Discount (the promotion lever)

The most powerful lever because it moves the order value itself. Current
default: 50% (GH₵600 → GH₵300).

| Discount | Order value | Nautica net/order | Use |
|---|---|---|---|
| 0% | GH₵600 | GH₵166.20 | Premium / no-promo periods |
| 25% | GH₵450 | GH₵124.65 | Standard promo |
| **50%** | **GH₵300** | **GH₵83.10** | **Default customer acquisition** |
| 60% | GH₵240 | GH₵66.48 | Aggressive growth / dry-season entry |
| 70% | GH₵180 | GH₵49.86 | Loss-leader territory — avoid |

**Guardrail:** discount depth × buyer-fee depth must never push net below
GH₵60/order (the variable cost floor). At 50% discount the model has a 63%
buffer above that floor; at 70% it has essentially none.

### 3. Surge (the scarcity lever)

Applied to the *discounted* price, so it raises the real charge rather than
inflating the discount back. 100% platform revenue.

| Surge | Order value (on 50% disc.) | Nautica net/order | Use |
|---|---|---|---|
| 0% | GH₵300 | GH₵83.10 | Normal |
| 25% | GH₵375 | GH₵103.88 | Dry-season onset |
| 50% | GH₵450 | GH₵124.65 | Peak scarcity (Dec–Feb) |
| 100% | GH₵600 | GH₵166.20 | Emergency only — cap here |

**Guardrail:** surge above 50% triggers a visible "scarcity pricing" notice to
the buyer and an operator log entry. Above 100% requires founder approval. The
goal is to capture scarcity rent without the "gouging" reputation that would
invite regulation.

## Volume-tier pricing (designed)

Institutional and high-volume buyers get a lower per-order list price in
exchange for commitment:

| Tier | Commitment | List price | Effective discount |
|---|---|---|---|
| Retail | Per-order | GH₵600 | 50% promo → GH₵300 |
| Business | 80 orders/mo | GH₵520 | 50% → GH₵260 |
| Enterprise | Unlimited + SLA | GH₵480 | 50% → GH₵240 |

The lower list price is funded by the SaaS subscription (see
[REVENUE-MODEL.md](./REVENUE-MODEL.md)), so the platform net per order holds
roughly constant while the buyer's per-order cost falls.

## Guardrails (the rules that protect the model)

1. **Net floor.** No combination of discount + fee cut may push Nautica net
   below GH₵50/order. The pricing console rejects a split that would.
2. **Surge cap.** Hard cap at 100% without founder approval; visible notice
   above 50%.
3. **Split changes are governed.** The 30/15/15 split is not a casual lever.
   Changing it requires an ops-signed change with a 30-day notice to sellers
   (their payout changes). The `validateSplit` function enforces the shares
   sum to 100% before any money moves.
4. **No silent fees.** Every charge is itemised on the receipt. The buyer fee
   is shown as its own line; there are no delivery-time surprises.
5. **Discount ≠ fee cut.** Never fund a discount by cutting the buyer fee —
   that compounds two revenue losses. Fund discounts from the list price or
   from SaaS mix.

## How the levers map to strategy

| Goal | Lever combination |
|---|---|
| Acquire buyers fast | Deep discount (50–60%), fee at 15% |
| Dry-season revenue | Surge 25–50%, discount held |
| Win institutions | Volume-tier list price + SaaS subscription |
| Protect margin | Raise list price, hold discount, never cut fee |
| Defend against informal undercut | Match shelf price, win on trust + speed |