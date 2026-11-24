# Financial Projections

Three-year projections at three scenarios. All figures are **modelled**, not
measured — they apply the unit economics in
[UNIT-ECONOMICS.md](./UNIT-ECONOMICS.md) to assumed order volumes. The
codebase deliberately contains no invented figures; these are planning tools,
clearly labelled projected.

## Assumptions

- Base order: GH₵300 value, GH₵360 buyer pays, GH₵97.80 Nautica net (30%/20%
  split, before refund provision; GH₵94.08 after).
- Fixed cost grows with headcount and infrastructure (see
  [COST-STRUCTURE.md](./COST-STRUCTURE.md)).
- Institutional SaaS ramps from year 1 (see [REVENUE-MODEL.md](./REVENUE-MODEL.md)).
- No tax netted (25% corporate, 15% VAT — see cost doc sensitivity).
- Dry-season surge adds ~4% to revenue in years 1–2, normalising after.

## Scenario definitions

| Scenario | Year 1 orders/mo (avg) | Year 2 | Year 3 | Character |
|---|---|---|---|---|
| **Conservative** | 150 | 400 | 800 | Slow buyer acquisition, few institutions |
| **Base** | 400 | 1,000 | 2,500 | Steady growth, 30 institutions by Y2 |
| **Growth** | 800 | 2,500 | 6,000 | Aggressive, 100+ institutions, dry-season surge |

## Conservative scenario

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Avg orders/mo | 150 | 400 | 800 |
| Transaction revenue (net) | GH₵140,040 | GH₵373,440 | GH₵746,880 |
| SaaS revenue | GH₵7,200 | GH₵28,800 | GH₵57,600 |
| **Total revenue** | **GH₵147,240** | **GH₵402,240** | **GH₵804,480** |
| Variable costs | GH₵100,656 | GH₵268,416 | GH₵536,832 |
| Fixed costs | GH₵55,200 | GH₵96,000 | GH₵156,000 |
| **EBITDA** | **−GH₵8,616** | **GH₵37,824** | **GH₵111,648** |

*Conservative breaks even in year 2. Year 1 is a small planned loss — the
cost of acquiring the first buyers.*

## Base scenario

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Avg orders/mo | 400 | 1,000 | 2,500 |
| Transaction revenue (net) | GH₵373,440 | GH₵933,600 | GH₵2,334,000 |
| SaaS revenue | GH₵28,800 | GH₵86,400 | GH₵144,000 |
| Surge (dry season) | GH₵14,400 | GH₵28,800 | GH₵46,800 |
| **Total revenue** | **GH₵416,640** | **GH₵1,048,800** | **GH₵2,524,800** |
| Variable costs | GH₵268,416 | GH₵671,040 | GH₵1,677,600 |
| Fixed costs | GH₵72,000 | GH₵156,000 | GH₵300,000 |
| **EBITDA** | **GH₵76,224** | **GH₵221,760** | **GH₵547,200** |

*Base is EBITDA-positive from month 1 and reaches ~GH₵45k/month EBITDA by
year 3.*

## Growth scenario

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Avg orders/mo | 800 | 2,500 | 6,000 |
| Transaction revenue (net) | GH₵746,880 | GH₵2,334,000 | GH₵5,601,600 |
| SaaS revenue | GH₵57,600 | GH₵240,000 | GH₵480,000 |
| Surge (dry season) | GH₵28,800 | GH₵72,000 | GH₵120,000 |
| **Total revenue** | **GH₵833,280** | **GH₵2,646,000** | **GH₵6,201,600** |
| Variable costs | GH₵536,832 | GH₵1,677,600 | GH₵4,026,240 |
| Fixed costs | GH₵108,000 | GH₵300,000 | GH₵720,000 |
| **EBITDA** | **GH₵188,448** | **GH₵668,400** | **GH₵1,455,360** |

*Growth requires the institutional channel to land early and dry-season surge
to be accepted by buyers. Execution risk is highest here.*

## Cash-flow note

Paystack settles T+1; driver and seller payouts are batched weekly. The
business carries ~1 week of float = ~1 week of GMV. At base year 3
(GH₵2.5M/yr GMV) that is ~GH₵48k of working capital — manageable from
operating cash, no external financing needed.

## What would change these numbers

- **Driver payout** moving from 15% to 20% cuts net GH₵9/order (~GH₵27k/yr at
  base Y2).
- **Payment processing** moving from 2% to 2.5% cuts ~GH₵1.80/order.
- **Refund provision** doubling to 2% cuts ~GH₵3.60/order.
- **VAT registration** (year 1 base) adds 15% to the buyer fee line as a
  pass-through, not a cost — but requires the fee to be re-displayed
  inclusive.

The model has enough buffer (net GH₵97.80 vs floor GH₵60) to absorb any two
of these simultaneously without going contribution-negative.