# Glossary

Plain-language definitions of every financial and business term used in these
docs.

| Term | Meaning |
|---|---|
| **Order value** | The price of the water itself, after discount, before any fee. The base every percentage is applied to. Stored as `grossMinor`. |
| **Buyer pays** | Order value + the 15% buyer service fee. What the customer is actually charged. |
| **Buyer service fee** | 15% of order value, charged to the buyer on top of the water price. Pure platform revenue. |
| **Seller commission** | 30% of order value, auto-deducted from the seller's payout. Funds the driver and the platform. |
| **Driver share** | 15% of order value, paid to the driver from the commission. |
| **Platform net** | What Nautica keeps per order after driver pay and processing. GH₵83.10 on a GH₵300 order. |
| **Contribution margin** | Revenue minus variable costs, before fixed costs. GH₵79.53/order here. |
| **GMV** | Gross Merchandise Value — total buyer payments across all orders. |
| **Take rate** | Platform net as a % of buyer payment (24.1%) or order value (27.7%). |
| **Break-even** | Orders/month needed to cover fixed costs. ~58/month. |
| **Float** | Working capital held between collecting from buyers and paying sellers/drivers. ~1 week of GMV. |
| **Surge** | Operator-set scarcity multiplier on the discounted price. 100% platform revenue. |
| **Discount** | Promotion off the list price. The most powerful lever (moves order value). |
| **List price** | Undiscounted shelf price of the water. GH₵600 base. |
| **Split** | The {seller, driver, platformCommission, buyerServiceCharge} percentages. Governed, not casual. |
| **Disintermediation** | Buyers/drivers transacting offline to avoid the commission. The primary business risk. |
| **Escrow** | Payment held until delivery is confirmed. Server-enforced. |
| **MoMo** | Mobile Money (MTN MoMo, Telecel Cash, AT Money). The payout rail. |
| **GWCL** | Ghana Water Company Limited — the bulk water source. |
| **FDA** | Food & Drugs Authority — water quality regulator. |
| **GSA** | Ghana Standards Authority — runs the lab audit protocol. |
| **Gold-fleet** | Sellers who pass quality audits; get priority dispatch + subsidies. |
| **EBITDA** | Earnings before interest, tax, depreciation, amortisation. The operating profit line. |
| **Pesewa** | 1/100th of a cedi. All money arithmetic is integer pesewas to avoid float drift. |
| **Largest-remainder** | The rounding method `allocate()` uses so splits sum exactly to the input. |
| **VAT** | Value Added Tax (15% in Ghana). Applies to the service fee once registered. |
| **Corporate tax** | 25% on profit in Ghana. |