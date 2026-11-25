# Financial Projections

Three-year projections at three scenarios. All figures are **modelled**, not
measured — they apply the unit economics in
[UNIT-ECONOMICS.md](./UNIT-ECONOMICS.md) to assumed order volumes. The
codebase deliberately contains no invented figures; these are planning tools,
clearly labelled projected.

## Assumptions

- Base order: GH₵300 value, GH₵345 buyer pays, GH₵83.10 Nautica net (30%/15%
  split, before refund provision; GH₵79.53 after).
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
| Transaction revenue (net) | GH₵118,890 | GH₵317,040 | GH₵634,080 |
| SaaS revenue | GH₵7,200 | GH₵28,800 | GH₵57,600 |
| **Total revenue** | **GH₵126,090** | **GH₵345,840** | **GH₵691,680** |
| Variable costs | GH₵99,846 | GH₵266,256 | GH₵532,512 |
| Fixed costs | GH₵55,200 | GH₵96,000 | GH₵156,000 |
| **EBITDA** | **−GH₵28,956** | **−GH₵16,416** | **GH₵3,168** |

*Conservative breaks even in year 3. Year 1–2 are planned losses — the
cost of acquiring the first buyers.*

## Base scenario

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Avg orders/mo | 400 | 1,000 | 2,500 |
| Transaction revenue (net) | GH₵317,040 | GH₵792,600 | GH₵1,981,500 |
| SaaS revenue | GH₵28,800 | GH₵86,400 | GH₵144,000 |
| Surge (dry season) | GH₵12,240 | GH₵24,480 | GH₵39,780 |
| **Total revenue** | **GH₵358,080** | **GH₵903,480** | **GH₵2,165,280** |
| Variable costs | GH₵266,256 | GH₵665,640 | GH₵1,664,100 |
| Fixed costs | GH₵72,000 | GH₵156,000 | GH₵300,000 |
| **EBITDA** | **GH₵19,824** | **GH₵81,840** | **GH₵201,180** |

*Base is EBITDA-positive from month 1 and reaches ~GH₵17k/month EBITDA by
year 3.*

## Growth scenario

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Avg orders/mo | 800 | 2,500 | 6,000 |
| Transaction revenue (net) | GH₵634,080 | GH₵1,981,500 | GH₵4,755,600 |
| SaaS revenue | GH₵57,600 | GH₵240,000 | GH₵480,000 |
| Surge (dry season) | GH₵24,480 | GH₵61,200 | GH₵102,000 |
| **Total revenue** | **GH₵716,160** | **GH₵2,282,700** | **GH₵5,337,600** |
| Variable costs | GH₵532,512 | GH₵1,664,100 | GH₵3,993,840 |
| Fixed costs | GH₵108,000 | GH₵300,000 | GH₵720,000 |
| **EBITDA** | **GH₵75,648** | **GH₵318,600** | **GH₵623,760** |

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
- **Payment processing** moving from 2% to 2.5% cuts ~GH₵1.73/order.
- **Refund provision** doubling to 2% cuts ~GH₵3.45/order.
- **VAT registration** (year 1 base) adds 15% to the buyer fee line as a
  pass-through, not a cost — but requires the fee to be re-displayed
  inclusive.

The model has enough buffer (net GH₵83.10 vs floor GH₵50) to absorb any two
of these simultaneously without going contribution-negative.