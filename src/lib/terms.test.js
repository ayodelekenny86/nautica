import { afterEach, describe, expect, test } from 'vitest';
import { clearAll } from './storage';
import { TERMS_VERSION, recordTermsAcceptance, getTermsAcceptance } from './terms';

afterEach(() => {
  clearAll();
});

describe('terms acceptance audit trail', () => {
  test('records who accepted which version and when', () => {
    const record = recordTermsAcceptance('NAUT-1');
    expect(record.orderId).toBe('NAUT-1');
    expect(record.version).toBe(TERMS_VERSION);
    expect(Number.isNaN(Date.parse(record.acceptedAt))).toBe(false);
  });

  test('reads the acceptance back for the order', () => {
    recordTermsAcceptance('NAUT-2');
    const read = getTermsAcceptance('NAUT-2');
    expect(read.orderId).toBe('NAUT-2');
    expect(read.version).toBe(TERMS_VERSION);
  });

  test('returns null for an order that never accepted', () => {
    expect(getTermsAcceptance('NAUT-unknown')).toBeNull();
  });

  test('is idempotent per order: a retry keeps the first acceptance time', () => {
    const first = recordTermsAcceptance('NAUT-3');
    const second = recordTermsAcceptance('NAUT-3');
    expect(second.acceptedAt).toBe(first.acceptedAt);
  });

  test('refuses to record without an order id', () => {
    expect(recordTermsAcceptance('')).toBeNull();
    expect(getTermsAcceptance(undefined)).toBeNull();
  });

  test('keeps acceptances for different orders separate', () => {
    recordTermsAcceptance('NAUT-A');
    recordTermsAcceptance('NAUT-B');
    expect(getTermsAcceptance('NAUT-A').orderId).toBe('NAUT-A');
    expect(getTermsAcceptance('NAUT-B').orderId).toBe('NAUT-B');
  });
});