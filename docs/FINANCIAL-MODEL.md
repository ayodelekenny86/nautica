# Financial Model

The master reference for every rate, formula, and assumption behind Nautica's
unit economics. All other financial documents derive from this one.

## 1. The two charges

Nautica earns from two sides of the same transaction:

| Charge | Who pays | Rate | Base |
|---|---|---|---|
| **Buyer service fee** | Buyer | **20%** | Order value (water price) |
| **Seller platform commission** | Seller (auto-deducted) | **30%** | Order value (water price) |

Both are percentages of the **order value** — the price of the water itself,
after any discount, before any fee. This keeps the arithmetic exact and the
split reconcilable to the pesewa.

## 2. The order value

The order value is what the water costs, set by the operator through the
pricing console:

```
listPrice          GH₵600.00   (the undiscounted shelf price)
discountPercent    50%         (operator-set promotion)
surgePercent       0%          (operator-set scarcity multiplier)
─────────────────────────────────────
orderValue         GH₵300.00   = listPrice × (1 − discount) × (1 + surge)
```

The order value is the number every percentage below is applied to. It is
stored on the order as `grossMinor` and is the only figure the split touches.

## 3. The water flow (who gets what)

```
                    ORDER VALUE  GH₵300.00
                    ┌─────────────────────────┐
                    │                         │
          seller 70%│                         │30% platform commission
          GH₵210.00 │                         │GH₵90.00
                    ▼                         ▼
              ┌──────────┐          ┌──────────────────┐
              │  SELLER  │          │  PLATFORM CUT     │
              │ GH₵210.00│          │  GH₵90.00         │
              └──────────┘          └────────┬─────────┘
                                             │
                              ┌──────────────┼──────────────┐
                              ▼              ▼              ▼
                        ┌──────────┐  ┌──────────┐  ┌────────────┐
                        │  DRIVER  │  │ PLATFORM │  │ (reserve)  │
                        │ GH₵45.00 │  │ GH₵45.00 │  │ GH₵0.00    │
                        └──────────┘  └──────────┘  └────────────┘
```

- **Seller receives 70%** of the order value. The 30% commission is deducted
  automatically at settlement — the seller never sees it as a bill.
- **Driver receives 15%** of the order value (GH₵45.00), paid from the
  platform commission.
- **Platform keeps the remainder** of the commission (GH₵45.00) plus the
  entire buyer service fee (see below).

## 4. The buyer fee (on top)

The buyer pays the order value **plus** the 20% service fee:

```
buyerPays = orderValue × (1 + 20%)
          = GH₵300.00 × 1.20
          = GH₵360.00
```

The GH₵60.00 fee goes entirely to the platform. It is shown on the receipt as
a separate "Service charge" line so the buyer sees exactly what they paid for
the water and what they paid for the service.

## 5. The platform's net take

```
Platform revenue per order:
  seller commission (30% of order)     GH₵90.00
+ buyer service fee (20% of order)     GH₵60.00
─────────────────────────────────────────────────
  gross platform revenue               GH₵150.00

Platform costs per order:
− driver payout (15% of order)         GH₵45.00
− payment processing (~2% of buyer pay) GH₵7.20
─────────────────────────────────────────────────
  net platform profit                  GH₵97.80
```

**Net take rate:** GH₵97.80 ÷ GH₵360.00 = **27.2%** of what the buyer pays,
or **32.6%** of the order value.

## 6. The formulas (reference)

All amounts in minor units (pesewas) in code; shown here in cedis for reading.

```
orderValue        = listPrice × (1 − discountPercent/100) × (1 + surgePercent/100)
buyerServiceFee   = orderValue × 0.20
buyerPays         = orderValue + buyerServiceFee
sellerReceives    = orderValue × 0.70
platformCommission= orderValue × 0.30
driverReceives    = orderValue × 0.15
platformGross     = platformCommission + buyerServiceFee − driverReceives
processingFee     = buyerPays × 0.02        (Paystack: 1.95% + GH₵0.50, rounded)
platformNet       = platformGross − processingFee
```

The code that enforces this lives in `src/lib/money.js`
(`DEFAULT_SPLIT`, `allocate`, `priceOrder`) and its server-side mirror in
`functions/lib/pricing.js`. The split object both copies store is:

```js
{
  buyerServiceCharge: 20,   // buyer fee, % of order value
  seller: 70,               // seller share, % of order value
  driver: 15,               // driver share, % of order value
  platformCommission: 15,   // platform net cut of order value
}
```

The three order-value shares (seller 70 + driver 15 + platform 15) sum to
100%, which `validateSplit` enforces. The "30% seller commission" in the
business model is the platform's 15% net plus the 15% driver payout — together
30% of the order value flows to the platform side, of which the driver takes
15%.

## 7. Sensitivity: what each lever does

| Lever | Effect on platform net (per GH₵300 order) |
|---|---|
| Buyer fee 20% → 15% | −GH₵15.00 (net GH₵82.80) |
| Buyer fee 20% → 25% | +GH₵15.00 (net GH₵112.80) |
| Seller commission 30% → 25% | −GH₵15.00 (net GH₵82.80) |
| Seller commission 30% → 35% | +GH₵15.00 (net GH₵112.80) |
| Driver 15% → 12% | +GH₵9.00 (net GH₵106.80) |
| Driver 15% → 18% | −GH₵9.00 (net GH₵88.80) |
| Discount 50% → 40% (order GH₵360) | +GH₵29.34 (net GH₵127.14) |

The model is most sensitive to the **discount depth** (it moves the order value
itself) and the **buyer fee** (it is pure platform revenue). See
[PRICING-STRATEGY.md](./PRICING-STRATEGY.md) for how to use these levers.

## 8. What is deliberately excluded

- **Taxes.** Ghana levies VAT (currently 15%) and levies on the platform's
  service fee; corporate income tax is 25%. These are modelled as a
  sensitivity in [COST-STRUCTURE.md](./COST-STRUCTURE.md), not netted into the
  per-order figures, because the applicable rate depends on VAT registration
  status and is an accountant's decision.
- **Chargebacks and refunds.** Modelled as a loss rate in
  [COST-STRUCTURE.md](./COST-STRUCTURE.md).
- **Working capital / float.** Paystack settles T+1; driver and seller payouts
  are batched. The float is a cash-flow item, not a P&L item.