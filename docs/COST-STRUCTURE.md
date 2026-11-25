# Cost Structure

Every cost the business carries, what drives it, and how it scales with
volume. Split into **variable** (per-order) and **fixed** (monthly) costs.

## Variable costs (per order)

### 1. Driver payout — 15% of order value

The largest variable cost. Paid to the driver from the platform commission at
settlement.

- **Base:** GH₵45.00 per GH₵300 order
- **Driver:** GH₵45.00

### 2. Payment processing — ~2% of buyer payment

Paystack Ghana charges **1.95% + GH₵0.50** per transaction (local cards and
MoMo). Flutterwave is comparable. Modelled at 2% for simplicity.

- **Base:** GH₵345.00 × 2% = GH₵6.90 per order
- **Note:** the GH₵0.50 fixed component makes small orders proportionally
  more expensive to process — a reason to favour fewer, larger institutional
  orders.

### 3. Refunds & chargebacks — 1% of GMV (loss provision)

A provision for failed deliveries, disputes, and MoMo reversals. Ghana's MoMo
rails have occasional reversal lag; a 1% provision covers it.

- **Base:** GH₵345.00 × 1% = GH₵3.45 per order (averaged)

### 4. SMS / OTP delivery — GH₵0.05–0.10 per message

Phone verification and delivery codes. ~1.5 messages per order.

- **Base:** ~GH₵0.12 per order

### Total variable cost per order

```
Driver payout                GH₵45.00
Payment processing            GH₵6.90
Refund provision              GH₵3.45
SMS / OTP                     GH₵0.12
────────────────────────────────────
Total variable               GH₵55.47
```

Against GH₵135.00 gross platform revenue (commission + buyer fee), the
**contribution margin is GH₵79.53 per order** before fixed costs. (The
GH₵83.10 figure in [UNIT-ECONOMICS.md](./UNIT-ECONOMICS.md) excludes the
refund provision; including it gives the more conservative GH₵79.53.)

## Fixed costs (monthly)

| Cost | Monthly (GH₵) | Notes |
|---|---|---|
| Hosting (Firebase + Vercel) | 350 | Current deploy target; scales with traffic |
| Supabase (DB + Edge Functions) | 1,000 | Free tier → Pro at scale |
| Paystack/Flutterwave base | 0 | Per-transaction only |
| SMS gateway base | 200 | Bulk rate commit |
| Support tooling (WhatsApp Business, helpdesk) | 600 | Customer support channel |
| Admin & ops (part-time, pre-seed) | 1,500 | Founder-operated until seed |
| Accounting & legal retainer | 500 | Ghana VAT/corporate filing |
| Contingency (10%) | 450 | Buffer |
| **Total fixed** | **~4,600** | |

*Projected. Founder-operated keeps fixed cost low; the first hire is a
logistics ops lead, not engineering.*

## Break-even

```
Break-even orders/month = 4,600 ÷ 79.53 ≈ 58 orders/month
                       ≈ 1.9 orders/day
```

The business is contribution-positive from the first week and covers fixed
costs at under two orders a day. This is the single most important number in
the model: **Nautica does not need hypergrowth to survive, only to thrive.**

## Cost at scale (projected, 500 orders/mo)

| Category | Monthly (GH₵) |
|---|---|
| Variable (500 × GH₵55.47) | 27,735 |
| Fixed | 4,600 |
| **Total cost** | **32,335** |
| Revenue (500 × GH₵135) | 67,500 |
| **EBITDA** | **35,165** |

At 500 orders/month the business generates ~GH₵35k/month EBITDA before tax —
a 52% EBITDA margin, healthy for a marketplace in its first year.

## Tax (sensitivity, not netted)

Ghana corporate tax is 25% on profit; VAT at 15% applies to the service fee
once registered (threshold ~GH₵200k turnover). At 500 orders/mo the business
crosses the VAT threshold in year 1 and should register. After 25% corporate
tax, the GH₵35,165 EBITDA becomes ~GH₵26,374 net. An accountant confirms the
exact treatment — this is a planning figure, not a filing position.

## Cost risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Paystack fee increase | −GH₵0.50/order | Multi-provider (Flutterwave already wired); route by cost |
| MoMo reversal spike | Refund provision overrun | Escrow-style confirm-before-release already enforced server-side |
| Driver churn (pay too low) | Supply shortfall | 15% is above informal ~10%; volume rebates at 50+ orders/mo |
| FX / fuel inflation | Seller cost push → price pressure | Surge lever; institutional fixed-price contracts hedge |