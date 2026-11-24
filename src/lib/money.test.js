import { describe, expect, test } from 'vitest';
import {
  DEFAULT_PRICING,
  DEFAULT_SPLIT,
  allocate,
  effectiveTakeRate,
  formatCedi,
  grossFromBuyerCharge,
  quotePrice,
  toMajor,
  toMinor,
  validateSplit,
} from './money';

describe('minor units', () => {
  test('converts to and from pesewas without floating point drift', () => {
    expect(toMinor(250)).toBe(25000);
    expect(toMinor('250.50')).toBe(25050);
    expect(toMajor(25050)).toBe(250.5);
  });

  test('rounds half away from zero so money is never silently truncated', () => {
    expect(toMinor(0.005)).toBe(1);
    expect(toMinor(-0.005)).toBe(-1);
  });

  test('rejects values that are not numbers', () => {
    expect(() => toMinor('free')).toThrow(TypeError);
  });

  test('formats as a fixed 2dp cedi string', () => {
    expect(formatCedi(25050)).toBe('GH₵250.50');
    expect(formatCedi(5)).toBe('GH₵0.05');
    expect(formatCedi(123456789)).toBe('GH₵1,234,567.89');
    expect(formatCedi(0)).toBe('GH₵0.00');
  });

  // `Math.abs(undefined)` is NaN and `NaN.toLocaleString()` is "NaN", so a
  // missing amount used to render as the literal string "GH₵NaN.NaN" in the
  // order list — to the buyer, the driver and the operator.
  test('never renders NaN for a missing amount', () => {
    expect(formatCedi(undefined)).toBe('GH₵—');
    expect(formatCedi(null)).toBe('GH₵—');
    expect(formatCedi(Number.NaN)).toBe('GH₵—');
    expect(formatCedi('30000')).toBe('GH₵—');
    for (const bad of [undefined, null, Number.NaN, Infinity, 'x', {}]) {
      expect(formatCedi(bad)).not.toMatch(/NaN/);
    }
  });
});

describe('split validation', () => {
  test('accepts the default plan', () => {
    expect(validateSplit(DEFAULT_SPLIT)).toBe(true);
  });

  test('rejects shares that do not total 100%', () => {
    // The literal plan in the brief: 10 + 70 + 5 + 35 = 120%.
    expect(() => validateSplit({ buyerServiceCharge: 10, seller: 70, driver: 5, platformCommission: 35 }))
      .toThrow(/must total 100%/);
  });

  test('rejects negative shares', () => {
    expect(() => validateSplit({ buyerServiceCharge: 10, seller: 70, driver: -5, platformCommission: 35 }))
      .toThrow(/non-negative/);
  });

  test('allocate refuses to pay out an invalid split', () => {
    expect(() => allocate(10000, { buyerServiceCharge: 10, seller: 70, driver: 5, platformCommission: 35 }))
      .toThrow(/Invalid revenue split/);
  });
});

describe('allocation', () => {
  test('splits a 100 cedi order per the default plan', () => {
    // The default plan: buyer pays GH₵120 (GH₵100 water + 20% fee), seller
    // gets GH₵70, driver GH₵15, platform GH₵15 + the GH₵20 fee.
    const result = allocate(toMinor(100));
    expect(result.gross).toBe(10000);
    expect(result.buyerPays).toBe(12000);
    expect(result.sellerReceives).toBe(7000);
    expect(result.driverReceives).toBe(1500);
    expect(result.buyerServiceCharge).toBe(2000);
    expect(result.platformCommission).toBe(1500);
    expect(result.companyTake).toBe(3500);
  });

  test('the company take is the platform commission plus the buyer fee', () => {
    const result = allocate(toMinor(100));
    expect(result.companyTake).toBe(result.platformCommission + result.buyerServiceCharge);
  });

  test('a configured charge is added on top of the gross', () => {
    // Keeps the arithmetic honest for an operator who sets a different charge,
    // so the field is not quietly broken.
    const withFee = { buyerServiceCharge: 10, seller: 45, driver: 15, platformCommission: 40 };
    for (const amount of [1, 99, 250, 980, 12345]) {
      const result = allocate(toMinor(amount), withFee);
      expect(result.buyerPays).toBe(result.gross + result.buyerServiceCharge);
      expect(result.companyTake).toBe(result.platformCommission + result.buyerServiceCharge);
    }
  });

  test('the default plan charges the buyer the gross plus 20%', () => {
    for (const amount of [1, 99, 250, 980, 12345]) {
      const result = allocate(toMinor(amount));
      expect(result.buyerPays).toBe(result.gross + result.buyerServiceCharge);
    }
  });

  test('every party is paid exactly once, with nothing created or lost', () => {
    for (const amount of [0.01, 0.07, 1, 3, 7, 33.33, 250, 999.99]) {
      const result = allocate(toMinor(amount));
      const paid = result.sellerReceives + result.driverReceives + result.platformCommission;
      expect(paid).toBe(result.gross);
      expect(result.sellerReceives + result.driverReceives + result.companyTake).toBe(result.buyerPays);
    }
  });

  test('largest remainder keeps a repeating split exact', () => {
    // GH₵10.00 at 70/5/25 needs 7000/500/2500; this checks a case that does not divide.
    const result = allocate(toMinor(10));
    expect(result.sellerReceives + result.driverReceives + result.platformCommission).toBe(1000);
  });

  test('is deterministic for the same input', () => {
    expect(allocate(toMinor(33.33))).toEqual(allocate(toMinor(33.33)));
  });

  test('rejects a negative order amount', () => {
    expect(() => allocate(-100)).toThrow(RangeError);
  });

  test('handles a zero-value order without producing NaN', () => {
    const result = allocate(0);
    expect(result.companyTake).toBe(0);
    expect(result.buyerPays).toBe(0);
  });
});

describe('round trips and take rate', () => {
  test('recovers the gross from what the buyer was charged, with the 20% fee', () => {
    // The default plan charges 20% on top, so GH₵360 charged = GH₵300 gross.
    expect(grossFromBuyerCharge(36000)).toBe(30000);
  });

  test('recovers the gross when a service charge is configured', () => {
    const withFee = { buyerServiceCharge: 10, seller: 45, driver: 15, platformCommission: 40 };
    expect(grossFromBuyerCharge(11000, withFee)).toBe(10000);
    expect(grossFromBuyerCharge(27500, withFee)).toBe(25000);
  });

  test('the company take rate against what the buyer pays is ~29.2% on the default plan', () => {
    // Platform keeps GH₵35 of every GH₵120 the buyer pays (GH₵15 commission +
    // GH₵20 fee), so 35/120 = 29.17%.
    expect(effectiveTakeRate()).toBeCloseTo(29.1667, 3);
  });

  test('a fee plan still reports the take against the larger amount', () => {
    // 50 of every 110 the buyer hands over = 45.45%.
    const withFee = { buyerServiceCharge: 10, seller: 45, driver: 15, platformCommission: 40 };
    expect(effectiveTakeRate(withFee)).toBeCloseTo(45.4545, 3);
  });
});

describe('price formation', () => {
  test('a 50% discount turns a 600 cedi list price into a 300 cedi order', () => {
    const quote = quotePrice({ listPrice: 600, discountPercent: 50, surgePercent: 0 });
    expect(quote.listMinor).toBe(60000);
    expect(quote.discounted).toBe(30000);
    expect(quote.totalMinor).toBe(30000);
  });

  test('surge is applied to the discounted price, not the list price', () => {
    // 300 discounted + 20% surge = 360, not 600 + 20% = 720.
    const quote = quotePrice({ listPrice: 600, discountPercent: 50, surgePercent: 20 });
    expect(quote.surgeMinor).toBe(6000);
    expect(quote.totalMinor).toBe(36000);
  });

  test('a 100% discount is a free order rather than a negative one', () => {
    const quote = quotePrice({ listPrice: 600, discountPercent: 100, surgePercent: 0 });
    expect(quote.totalMinor).toBe(0);
  });

  test('rejects a discount outside 0-100%', () => {
    expect(() => quotePrice({ listPrice: 600, discountPercent: 120 })).toThrow(RangeError);
    expect(() => quotePrice({ listPrice: 600, discountPercent: -5 })).toThrow(RangeError);
  });

  test('rejects a negative list price or surge', () => {
    expect(() => quotePrice({ listPrice: -1 })).toThrow(RangeError);
    expect(() => quotePrice({ listPrice: 600, surgePercent: -10 })).toThrow(RangeError);
  });

  test('the business rule: the customer pays GH₵360 (GH₵300 water + 20% fee)', () => {
    // A GH₵600 list price less 50% is GH₵300 water. The buyer pays GH₵360
    // (GH₵300 + 20% service fee). The seller is auto-charged 30% (GH₵90),
    // receiving GH₵210; the driver gets GH₵45; the platform keeps GH₵45 + fee.
    const quote = quotePrice(DEFAULT_PRICING);
    const money = allocate(quote.totalMinor, DEFAULT_SPLIT);

    expect(formatCedi(quote.listMinor)).toBe('GH₵600.00');
    expect(formatCedi(quote.discounted)).toBe('GH₵300.00');
    expect(formatCedi(money.buyerServiceCharge)).toBe('GH₵60.00');
    expect(money.buyerPays).toBe(36000);
    expect(formatCedi(money.buyerPays)).toBe('GH₵360.00');
  });

  test('the shares plus the fee equal what the buyer paid, with nothing unaccounted for', () => {
    const { buyerPays, sellerReceives, driverReceives, platformCommission, buyerServiceCharge } = allocate(30000, DEFAULT_SPLIT);

    expect(sellerReceives).toBe(21000);
    expect(driverReceives).toBe(4500);
    expect(platformCommission).toBe(4500);
    expect(buyerServiceCharge).toBe(6000);
    expect(sellerReceives + driverReceives + platformCommission + buyerServiceCharge).toBe(buyerPays);
  });

  test('a configured service charge still works and is added on top', () => {
    // The field is kept as a real lever, so this proves it is not broken: with a
    // charge set, the buyer pays order value plus the fee.
    const withFee = { buyerServiceCharge: 10, seller: 45, driver: 15, platformCommission: 40 };
    const money = allocate(30000, withFee);

    expect(money.buyerServiceCharge).toBe(3000);
    expect(money.buyerPays).toBe(33000);
    expect(money.companyTake).toBe(money.platformCommission + money.buyerServiceCharge);
  });

  test('the default plan has a 20% service charge configured', () => {
    // Guards the rule at its source. If someone removes the fee here, the
    // customer stops paying GH₵360 and this fails before it reaches a customer.
    expect(DEFAULT_SPLIT.buyerServiceCharge).toBe(20);
    expect(DEFAULT_SPLIT.seller).toBe(70);
    expect(DEFAULT_PRICING.listPrice).toBe(600);
    expect(DEFAULT_PRICING.discountPercent).toBe(50);
  });
});
