# Unit Economics

What one order earns and costs, traced to the pesewa. This is the atomic unit
the whole business is built from — every projection in
[FINANCIAL-PROJECTIONS.md](./FINANCIAL-PROJECTIONS.md) is this table multiplied
by order count.

## The base order

A standard residential delivery: **1,000 gallons (~3,785 litres)**, list price
GH₵600, 50% promotional discount, no surge.

```
Order value (water)                    GH₵300.00
```

## Where every pesewa goes

| Party | Basis | Amount | % of buyer pays |
|---|---|---|---|
| **Buyer pays** | order + 20% fee | **GH₵360.00** | 100.0% |
| → Seller receives | 70% of order | GH₵210.00 | 58.3% |
| → Driver receives | 15% of order | GH₵45.00 | 12.5% |
| → Payment processing | ~2% of buyer pays | GH₵7.20 | 2.0% |
| → **Nautica net** | remainder | **GH₵97.80** | **27.2%** |
| **Total** | | **GH₵360.00** | **100.0%** |

The four rows sum exactly to what the buyer pays. Nothing is unaccounted for —
that is the property `allocate()` in `src/lib/money.js` guarantees with
largest-remainder rounding.

## The platform's cut, shown two ways

```
Seller commission (30% of order)       GH₵90.00
Buyer service fee (20% of order)       GH₵60.00
− Driver payout (15% of order)        −GH₵45.00
− Payment processing                  −GH₵7.20
─────────────────────────────────────────────────
Nautica net per order                  GH₵97.80
```

- As a share of **buyer payment**: 27.2%
- As a share of **order value**: 32.6%
- As a multiple of **driver pay**: 2.17× (Nautica earns GH₵2.17 for every
  GH₵1 the driver earns)

## Contribution margin

The per-order contribution before fixed costs is **GH₵97.80**. Fixed monthly
costs (see [COST-STRUCTURE.md](./COST-STRUCTURE.md)) are covered once volume
passes the break-even point:

```
Break-even orders/month = fixed monthly cost ÷ GH₵97.80
```

At an estimated GH₵4,500/month fixed cost (infrastructure, support tooling,
admin), break-even is **~47 orders/month** — roughly 1.5 orders/day. That is a
low bar, which is the point: the model is contribution-positive from the first
week and does not depend on hypergrowth to survive.

## Volume scenarios (per month)

| Orders/mo | Orders/day | GMV (buyer pays) | Nautica net | Annualised net |
|---|---|---|---|---|
| 50 | ~1.7 | GH₵18,000 | GH₵4,890 | GH₵58,680 |
| 200 | ~6.7 | GH₵72,000 | GH₵19,560 | GH₵234,720 |
| 500 | ~16.7 | GH₵180,000 | GH₵48,900 | GH₵586,800 |
| 1,000 | ~33 | GH₵360,000 | GH₵97,800 | GH₵1,173,600 |
| 3,000 | ~100 | GH₵1,080,000 | GH₵293,400 | GH₵3,520,800 |

*Projected. Assumes the base order (GH₵300 value) and the 30%/20% split hold
across all volume. Real mix will vary — see [PRICING-STRATEGY.md](./PRICING-STRATEGY.md)
for volume-tier and institutional pricing.*

## Sensitivity per order

| Change | Nautica net | Δ |
|---|---|---|
| Base case | GH₵97.80 | — |
| No discount (order GH₵600) | GH₵195.60 | +GH₵97.80 |
| Deeper discount 60% (order GH₵240) | GH₵78.24 | −GH₵19.56 |
| Buyer fee 15% | GH₵82.80 | −GH₵15.00 |
| Buyer fee 25% | GH₵112.80 | +GH₵15.00 |
| Driver 20% (up from 15%) | GH₵88.80 | −GH₵9.00 |
| Add 2% refund/chargeback loss | GH₵90.60 | −GH₵7.20 |

The model stays contribution-positive across every plausible lever. The
dangerous move would be stacking a deep discount **and** a fee cut **and** a
driver raise simultaneously — see the guardrails in
[SUSTAINABILITY-PLAN.md](./SUSTAINABILITY-PLAN.md).

## Why these rates are defensible

- **Seller (30% commission):** Ghanaian informal water sellers lose 10–20% of
  revenue to bad debt and cash-on-delivery disputes alone. A guaranteed,
  same-week payout with zero chasing is worth 30% to a seller who currently
  eats that loss. The commission is framed as *debt elimination + volume*, not
  a tax.
- **Buyer (20% fee):** The alternative is an unregulated tanker with no
  quality guarantee, a 2–6 hour wait, and a coin-flip on price. 20% buys
  certified source, tracked delivery, and a receipt — the fee is the product.
- **Driver (15%):** Above the ~10% a driver nets informally after fuel and
  deadhead mileage, because Nautica's geo-dispatch cuts empty transit (see
  [PLATFORM.md](./PLATFORM.md)). The driver earns more per order *and* more
  orders per day.