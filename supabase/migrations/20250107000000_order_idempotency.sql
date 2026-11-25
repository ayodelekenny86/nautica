-- Idempotency for order creation.
--
-- A booking is a POST. Under load the client can time out waiting for the answer
-- while the server has already written the order; the buyer retries and a second
-- order is created, so the same delivery is charged twice. A client-generated key,
-- unique per order attempt and reused when the buyer retries the same order, lets
-- the server recognise the repeat and return the original instead of inserting a
-- duplicate.
--
-- Additive and backward-compatible: the column is nullable, the unique index is
-- partial (only over rows that have a key), so existing rows and older clients
-- that send no key are unaffected.

alter table public.orders
  add column if not exists idempotency_key text;

create unique index if not exists orders_idempotency_key_uniq
  on public.orders (idempotency_key)
  where idempotency_key is not null;