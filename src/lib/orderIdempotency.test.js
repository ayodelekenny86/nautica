import { afterEach, expect, test } from 'vitest';
import { createOrder } from './payments';
import { installFakeApi, teardownFakeApi } from '../testServer';

/**
 * A booking is a POST, so a request that times out after the server wrote the
 * order must not become a second order when the buyer retries. The client sends
 * an idempotency key that is reused for the same order; the server returns the
 * original row for a repeated key.
 */

afterEach(() => teardownFakeApi());

const base = {
  email: 'buyer@example.com',
  phone: '+233244000000',
  location: 'Osu, Accra',
  volumeLitres: 1000,
};

test('a retried create with the same key returns the original order', async () => {
  installFakeApi();
  const first = await createOrder({ ...base, idempotencyKey: 'key-1' });
  const second = await createOrder({ ...base, idempotencyKey: 'key-1' });
  expect(second.id).toBe(first.id);
});

test('a different key creates a distinct order', async () => {
  installFakeApi();
  const first = await createOrder({ ...base, idempotencyKey: 'key-a' });
  const second = await createOrder({ ...base, idempotencyKey: 'key-b' });
  expect(second.id).not.toBe(first.id);
});