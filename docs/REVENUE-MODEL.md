# Revenue Model

Every way Nautica earns money, how each is charged, and what it contributes.
Two are live in the current model (buyer fee, seller commission); the rest are
designed extensions the business can switch on without re-architecting.

## Live revenue streams

### 1. Buyer service fee — 20% of order value

Charged to the buyer on top of the water price at checkout. Shown as a
separate "Service charge" line on the receipt (`buildReceipt` in
`src/lib/payments.js`). Pure platform revenue — no cost of goods attached.

- **Rate:** 20% of order value
- **Base:** GH₵300 → GH₵60.00 per order
- **Annualised at 500 orders/mo:** GH₵360,000

### 2. Seller platform commission — 30% of order value

Auto-deducted from the seller's payout at settlement. The seller never
receives the gross and never sees a bill; the commission is withheld before
the payout lands in their MoMo wallet.

- **Rate:** 30% of order value
- **Base:** GH₵300 → GH₵90.00 per order (of which GH₵45 pays the driver)
- **Annualised at 500 orders/mo:** GH₵540,000 gross commission

## Designed revenue streams (switch-on ready)

These require no new infrastructure — the hooks already exist in the codebase
(pricing console, seller approval, institutional accounts). They are sequenced
in [SUSTAINABILITY-PLAN.md](./SUSTAINABILITY-PLAN.md).

### 3. Institutional SaaS subscription

Monthly platform fee for schools, hotels, and hospitals on the B2B dashboard
(`InstitutionView`, standing re-orders, consumption telemetry).

| Tier | Monthly fee | Includes |
|---|---|---|
| Starter | GH₵300 | Up to 20 standing orders/mo, consolidated invoicing |
| Business | GH₵800 | Up to 80 orders/mo, priority dispatch, quality certificates |
| Enterprise | GH₵2,500 | Unlimited orders, dedicated account manager, SLA |

*Projected. 30 institutions on Business = GH₵24,000/mo recurring.*

### 4. Surge pricing (scarcity multiplier)

Operator-set multiplier during drought / dry-season scarcity. Applied to the
discounted price, so it raises the real charge rather than inflating the
discount back. 100% of surge is platform revenue.

- **Rate:** operator-set, 0–100%+
- **Use:** dry-season (Dec–Apr) demand spikes; capped to avoid gouging
  perception (see [PRICING-STRATEGY.md](./PRICING-STRATEGY.md))

### 5. Featured / priority seller placement

Sellers pay for top-of-list placement in their locality. Optional, never
pay-to-win on safety — a suspended seller cannot buy back visibility.

- **Rate:** GH₵2–5 per featured slot per day, locality-capped

### 6. Water-quality certification & lab testing

Per-test fee for the monthly microbial/chemical audit (Ghana Standards
Authority protocol), bundled into the seller commission for Gold-fleet
sellers and sold à la carte to others.

- **Rate:** cost-recovery + 20% margin per test

## Revenue mix at scale (projected, 500 orders/mo + 30 institutions)

| Stream | Monthly | Share |
|---|---|---|
| Buyer service fees | GH₵30,000 | 42% |
| Seller commissions (net of driver) | GH₵22,500 | 31% |
| Institutional SaaS | GH₵24,000 | 33% |
| Surge (dry season avg) | GH₵3,000 | 4% |
| Featured placement | GH₵1,500 | 2% |
| Certification | GH₵1,000 | 1% |
| **Total** | **GH₵82,000** | **100%** |

*Projected. The mix deliberately over-indexes on recurring SaaS so the
business is not hostage to transaction volume alone.*

## What is deliberately NOT a revenue stream

- **Selling buyer/seller data.** Not for sale at any price. The Data Privacy
  Policy in `LEGAL.md` commits to this and it is a core trust asset.
- **Pay-to-win safety ranking.** A seller's visibility is earned by
  reliability (`src/lib/reliability.js`), never bought.
- **Hidden fees.** Every charge is itemised on the receipt. The 20% buyer fee
  exists precisely so there are no surprise add-ons at delivery.