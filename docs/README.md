# Nautica Documentation

The complete business, financial, and platform documentation for Nautica — a
water-delivery marketplace for Ghana.

## Start here

| Document | What it answers |
|---|---|
| [PLATFORM.md](./PLATFORM.md) | What Nautica is, who uses it, and how the ecosystem fits together |
| [BUSINESS-MODEL.md](./BUSINESS-MODEL.md) | The business model canvas: customers, value, channels, key activities |
| [FINANCIAL-MODEL.md](./FINANCIAL-MODEL.md) | The master financial model — every rate, formula, and assumption in one place |
| [UNIT-ECONOMICS.md](./UNIT-ECONOMICS.md) | What one order earns and costs, broken down to the pesewa |
| [REVENUE-MODEL.md](./REVENUE-MODEL.md) | Every revenue stream and how each is charged |
| [COST-STRUCTURE.md](./COST-STRUCTURE.md) | Every cost the business carries and what drives it |
| [PRICING-STRATEGY.md](./PRICING-STRATEGY.md) | How prices are set, discounted, and surged |
| [FINANCIAL-PROJECTIONS.md](./FINANCIAL-PROJECTIONS.md) | Three-year projections at conservative, base, and growth scenarios |
| [SUSTAINABILITY-PLAN.md](./SUSTAINABILITY-PLAN.md) | What makes the business durable — recommendations and moats |
| [GLOSSARY.md](./GLOSSARY.md) | Plain-language definitions of every financial term used |

## The model in one paragraph

Nautica charges the **buyer a 20% service fee** on top of the water price and
**auto-charges the seller a 30% platform commission** on the order value. From
that commission the platform pays the driver, covers payment processing, and
keeps the remainder. On a GH₵300 order the buyer pays GH₵360, the seller
receives GH₵210, the driver earns GH₵45, and Nautica nets GH₵97.80 after
processing — a 27% net take rate on what the buyer pays. The full derivation
is in [UNIT-ECONOMICS.md](./UNIT-ECONOMICS.md).

## Conventions

- All money is Ghanaian cedi (GH₵), shown to two decimal places.
- All arithmetic is integer pesewas (100 pesewas = GH₵1.00); see
  `src/lib/money.js` for the allocation code that enforces this.
- Percentages are of the **order value** (the water price) unless a document
  says "of buyer payment" explicitly.
- Figures labelled *projected* are modelled, not measured. The codebase
  deliberately contains no invented figures — see the "Honest figures" section
  of the root `README.md`.