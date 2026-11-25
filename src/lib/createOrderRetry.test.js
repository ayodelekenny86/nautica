import { afterEach, expect, test, vi } from 'vitest';
import { createOrder } from './payments';

/**
 * A cold start or load spike can answer the order POST with a 5xx. Because the
 * idempotency key makes a repeat return the original order, createOrder retries a
 * transient failure instead of surfacing it. A 4xx is final and not retried.
 */

afterEach(() => vi.unstubAllGlobals());

const base = {
  email: 'buyer@example.com',
  phone: '+233244000000',
  location: 'Osu, Accra',
  volumeLitres: 1000,
  idempotencyKey: 'key-1',
};

const transient = () => ({ ok: false, status: 503, headers: { get: () => null }, text: async () => 'busy' });
const success = (id) => ({ ok: true, status: 200, headers: { get: () => null }, text: async () => JSON.stringify({ order: { id, charged_minor: 100 } }) });

test('a transient 5xx is retried and the order still comes back', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(transient()).mockResolvedValueOnce(success('NAUT-RETRY'));
  vi.stubGlobal('fetch', fetchMock);
  const order = await createOrder(base);
  expect(order.id).toBe('NAUT-RETRY');
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('a 4xx is final and not retried', async () => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status: 400,
    headers: { get: () => null },
    text: async () => JSON.stringify({ code: 'invalid_email', message: 'A valid email address is required.' }),
  });
  vi.stubGlobal('fetch', fetchMock);
  await expect(createOrder(base)).rejects.toThrow(/valid email/i);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});