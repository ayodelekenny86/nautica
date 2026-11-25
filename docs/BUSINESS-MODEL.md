# Business Model

The business model canvas for Nautica, in the structure the codebase already
implements. Each block names the code that enforces it.

## Customer segments

| Segment | Who | What they want | Code |
|---|---|---|---|
| **Buyers** | Accra households, offices | Water delivered fast, certified, fairly priced | `BuyerView`, `BuyerAccessGate` |
| **Sellers** | Tanker owners / water suppliers | Guaranteed volume, fast payout, no bad debt | `SellerDashboard`, `SellerAccessGate` |
| **Drivers** | Tanker drivers | More orders/day, above-market pay, fuel subsidy | `DriverDashboard` (auto-assigned, no driver app) |
| **Institutions** | Schools, hotels, hospitals | Standing re-orders, invoicing, quality certs | `InstitutionView` |
| **Operators** | Nautica ops team | Approve sellers, set pricing, watch network | `OpsView`, pricing console |

## Value propositions

- **Buyer:** certified source, tracked delivery, receipt, 30–45 min dispatch
  (vs 2–6h informal). The 15% fee buys this certainty.
- **Seller:** guaranteed weekly payout, buyer demand, fuel subsidy, free tank
  sanitisation. The 30% commission buys debt elimination + volume.
- **Driver:** above-informal pay (15% vs ~10%), more orders via geo-dispatch,
  fast MoMo payout.
- **Institution:** consolidated invoicing, consumption telemetry, certified
  quality, SLA (Enterprise).
- **Operator:** a priced, governed network they can steer.

## Channels

- **Buyer acquisition:** USSD `*920*#` (non-smartphone), WhatsApp, referral
  (+GH₵20, in `BuyerView`), social sign-in.
- **Seller acquisition:** application flow (`applyAsSeller`), operator approval
  queue (`SellerApprovalQueue`).
- **Institutional:** direct B2B sales, pilot → convert.

## Key activities

- Geo-dispatch (locality-based auto-assignment — `useBooking`).
- Quality certification (monthly GSA lab audits).
- Payment clearing (Paystack/Flutterwave, server-verified — `payments.js`).
- Seller reliability scoring (`src/lib/reliability.js`).
- Payout batching (weekly MoMo disbursement).

## Key resources

- The two-sided network (buyers + sellers + drivers).
- The float (working capital for fast payouts).
- The certification brand (the moat that justifies the fee).
- The pricing console (operator control of the model).

## Cost structure

See [COST-STRUCTURE.md](./COST-STRUCTURE.md). Variable: driver pay (15%),
processing (~2%), refunds (1%), SMS. Fixed: ~GH₵4,600/mo pre-seed.

## Revenue streams

See [REVENUE-MODEL.md](./REVENUE-MODEL.md). Live: buyer fee (15%), seller
commission (30%). Designed: SaaS, surge, featured placement, certification.

## The flywheel

```
More buyers → more seller volume → sellers earn more → more sellers join
    → faster dispatch + density → better buyer experience → more buyers
```

The 30%/15% model funds the flywheel's lubricant (fast pay, escrow, quality).
The SaaS stream keeps the flywheel turning through dry-season slowdowns.