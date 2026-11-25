import { readValue, writeValue } from './storage';

/**
 * Terms acceptance audit trail.
 *
 * A checkbox that is not recorded is not consent — it is a UI element. For the
 * acceptance to be legally defensible there must be a record of who agreed, to
 * which version of the terms, and when. The payment flow redirects to the
 * provider and back, so React state does not survive; the acceptance is
 * persisted here, keyed by order, and read back when the receipt is built.
 */

/** Bump when LEGAL.md changes materially, so old acceptances are distinguishable. */
export const TERMS_VERSION = '2026-11-01';

const KEY = 'terms.acceptances';

function all() {
  const rows = readValue(KEY, []);
  return Array.isArray(rows) ? rows : [];
}

/**
 * Record that `orderId` accepted the current terms. Idempotent per order: a
 * repeat call (e.g. a retried payment) keeps the first acceptance time rather
 * than silently re-stamping it.
 */
export function recordTermsAcceptance(orderId) {
  if (!orderId) return null;
  const rows = all();
  const existing = rows.find((r) => r.orderId === orderId);
  if (existing) return existing;

  const record = {
    orderId,
    version: TERMS_VERSION,
    acceptedAt: new Date().toISOString(),
  };
  writeValue(KEY, [record, ...rows]);
  return record;
}

/** Read back the acceptance for an order, or null if none was recorded. */
export function getTermsAcceptance(orderId) {
  if (!orderId) return null;
  return all().find((r) => r.orderId === orderId) ?? null;
}