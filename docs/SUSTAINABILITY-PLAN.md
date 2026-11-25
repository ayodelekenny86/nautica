# Sustainability Plan

What makes Nautica durable — not just profitable for a quarter, but defensible
for a decade. These are my recommendations as the architect of the model,
layered on top of the 30%/15% structure.

The thesis: **Nautica's moat is not the 30% commission or the 15% fee — those
are the *price* of the moat. The moat is trust, liquidity, and
disintermediation resistance.** The rates are set to fund that moat while
staying contribution-positive from order one.

## 1. The disintermediation problem (the real enemy)

Every marketplace in an informal economy faces the same death spiral: a driver
meets a buyer, they exchange numbers, and the next three orders happen offline.
The platform loses the transaction but keeps the cost of having acquired both
sides. At 30% commission the temptation to go offline is *highest* — which is
why the commission must be paired with value the seller cannot get offline.

**Recommendation — make offline strictly worse:**

| Offline seller loses | Why it matters |
|---|---|
| Guaranteed weekly payout | Informal buyers default; the seller eats 10–20% bad debt |
| Volume (Nautica's buyer demand) | One platform vs. the seller's own phone |
| Fuel subsidy (GOIL/Star Oil tie-up) | 3–5% diesel discount, Gold-fleet only |
| Free tank sanitisation | GH₵200+ per wash, subsidised |
| Priority dispatch in scarcity | Dry-season allocation goes to platform sellers first |

The 30% commission is justified only if the seller's *effective* take-home
(70% of order, guaranteed, plus subsidies) beats the informal alternative
(80–90% of order, minus 15% bad debt, minus fuel, minus idle time). Model it
explicitly and review quarterly — if the gap narrows, the commission is too
high and churn follows.

## 2. Liquidity is the product

In a market where the informal alternative is "pay cash on arrival, hope the
tanker shows," Nautica's real product is **certainty**. The financial model
must fund certainty:

- **Driver fast-pay:** 12–24h MoMo payout (already specified in
  [PLATFORM.md](./PLATFORM.md)). Funded from the float, not from the driver's
  share.
- **Buyer escrow:** payment held until delivery confirmed (server-enforced,
  see `supabaseWrites.test.jsx` — a refused write is never reported as done).
- **Seller guaranteed volume:** a minimum order allocation for Gold-fleet
  sellers, subsidised by the platform commission in slow periods.

**Recommendation:** treat the float as a strategic asset. At base year 3 the
weekly float is ~GH₵48k — enough to guarantee payouts without external
financing. Do not let anyone "optimise" it away.

## 3. Revenue diversification (don't be hostage to transactions)

The 30%/15% model is excellent but transaction-dependent. A dry-season
demand dip or a Paystack outage would hit revenue hard. The SaaS and
certification streams in [REVENUE-MODEL.md](./REVENUE-MODEL.md) exist to
smooth this.

**Recommendation — sequence the switch-ons:**

1. **Month 1–3:** Launch institutional pilot (5 schools/hotels) at GH₵300/mo
   Starter. Goal: prove standing re-orders work, not revenue.
2. **Month 4–6:** Convert 10 institutions to Business (GH₵800/mo). This is
   GH₵8k/mo recurring — covers fixed costs alone.
3. **Month 7–12:** Certification à la carte + featured placement. Small but
   high-margin.
4. **Year 2:** Enterprise tier with SLA. This is where the GH₵2.5k/mo
   contracts live.

By month 6 the business should cover fixed costs from SaaS *alone*, so
transaction revenue is pure profit. That is the sustainability inflection
point.

## 4. Quality as a financial moat

The informal tanker has no quality guarantee. Nautica's monthly lab audits
(Ghana Standards Authority protocol) are a *cost* that becomes a *moat*:

- Sellers who pass get Gold-fleet status → priority dispatch + subsidies.
- Buyers pay the 15% fee *because* the water is certified — the fee is the
  product, not a tax.
- A single quality failure that goes viral would destroy the premium; the
  audit cadence is insurance.

**Recommendation:** never cut the audit cadence to save cost. It is the thing
that justifies the 15% buyer fee. If cost pressure demands cuts, cut
featured-placement revenue, not certification.

## 5. The guardrails (financial)

Hard rules that protect the model from well-meaning "growth" decisions:

1. **Net floor GH₵50/order.** The pricing console rejects any split/discount
   combination that breaches it (`validateSplit` + operator governance).
2. **Never cut the buyer fee to fund a discount.** Discounts come from list
   price or SaaS mix. Cutting the fee compounds revenue loss.
3. **Driver share floor 12%.** Below this, churn spikes. The 15% default has
   a 3-point buffer; do not spend it casually.
4. **Surge cap 100% without founder approval.** Visible notice above 50%.
5. **Split changes need 30-day seller notice.** Payout changes are
   contractual, not unilateral.

## 6. Unit-economics discipline

Review these monthly, in this order:

| Metric | Healthy | Action if breached |
|---|---|---|
| Net per order | ≥ GH₵75 | Check discount depth + fee |
| Driver churn (annualised) | < 25% | Raise driver share or subsidies |
| Seller churn (annualised) | < 40% | Check effective take-home vs informal |
| Repeat buyer rate | > 40% | Loyalty / SaaS push |
| Refund provision vs actual | < 1% | Tighten delivery confirmation |
| Fixed cost / net revenue | < 15% | Delay hires, cut tooling |

## 7. What would make me change the rates

- If **seller churn > 50%** despite subsidies → commission too high, drop to
  25% and make up on SaaS.
- If **buyer repeat < 30%** → the 15% fee is felt as a tax; either raise
  perceived value (faster delivery, quality) or introduce a loyalty rebate.
- If **driver churn > 35%** → 15% is below market; raise to 18% and cut
  platform commission to 27% to hold net.
- If **Paystack fees rise > 2.5%** → route to Flutterwave (already wired) or
  pass a fraction to the buyer fee.

The model is designed to flex on these levers without breaking contribution
positivity. That flex *is* the sustainability.

## 8. The one-sentence version

Charge enough to fund trust (30% seller / 15% buyer), spend it on certainty
(fast pay, escrow, quality), diversify into recurring SaaS so no single dry
season can kill you, and never let a growth decision breach the GH₵50 net
floor.