-- Ratings: buyer-submitted scores for a completed delivery.
--
-- The client (src/lib/ratings.js) reads and writes this table with camelCase
-- keys (orderId, buyerId, overall, createdAt, ...) and no snake_case mapping,
-- so the columns are quoted camelCase to match the payload PostgREST receives.
-- Unquoted identifiers would fold to lowercase and every insert would fail with
-- "column does not exist" — which is exactly the schema-cache error the test
-- suite was reporting, because the table did not exist at all.

create table if not exists public.ratings (
  id              text primary key,
  "orderId"       text not null,
  "buyerId"       text not null,
  "sellerId"      text not null,
  "driverId"      text not null,
  overall         integer not null check (overall between 1 and 5),
  timeliness      integer check (timeliness between 1 and 5),
  communication   integer check (communication between 1 and 5),
  water_quality   integer check (water_quality between 1 and 5),
  professionalism integer check (professionalism between 1 and 5),
  comment         text,
  "createdAt"     timestamptz not null default now(),
  "updatedAt"     timestamptz not null default now()
);

create index if not exists ratings_order_idx on public.ratings ("orderId");
create index if not exists ratings_buyer_idx on public.ratings ("buyerId");
create index if not exists ratings_seller_idx on public.ratings ("sellerId");
create index if not exists ratings_driver_idx on public.ratings ("driverId");

-- -------------------------------------------------------------------------
-- Config seed: bring a fresh deployment onto the current commercial model
-- (15% buyer fee, 30% seller commission = 15% platform + 15% driver).
--
-- The init migration seeded the old split (0% fee, 45/40/15). This updates the
-- row only if it still holds that exact old default, so an operator who has
-- already set custom pricing through the console is never clobbered.
update public.config
  set split = '{"buyerServiceCharge":15,"seller":70,"driver":15,"platformCommission":15}',
      updated_at = now()
  where key = 'pricing'
    and split = '{"buyerServiceCharge":0,"seller":45,"driver":15,"platformCommission":40}';