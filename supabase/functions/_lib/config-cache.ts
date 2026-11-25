import { DEFAULT_PRICING, DEFAULT_SPLIT } from './pricing.ts';

/**
 * The pricing config, cached in memory for a short window.
 *
 * The config changes only when an operator edits it, but every quote and every
 * order creation reads it. Without a cache that is a database round-trip per
 * request, and under a booking spike the functions spend their time waiting on
 * the database instead of serving. Caching per instance turns that into one read
 * per instance per TTL. A stale window of up to CACHE_TTL_MS after an edit is an
 * acceptable trade for the throughput it buys; the alternative is a hard ceiling
 * set by database latency.
 */
const CACHE_TTL_MS = 30_000;

type PricingConfig = {
  pricing: typeof DEFAULT_PRICING;
  split: typeof DEFAULT_SPLIT;
};

let cached: PricingConfig | null = null;
let cachedAt = 0;

// `db` is a Supabase client; typed loosely so this module stays independent of
// the exact client construction each function uses.
export async function getPricingConfig(db: any): Promise<PricingConfig> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;

  const { data, error } = await db
    .from('config')
    .select('pricing,split')
    .eq('key', 'pricing')
    .single();

  const config: PricingConfig = error
    ? { pricing: { ...DEFAULT_PRICING }, split: { ...DEFAULT_SPLIT } }
    : {
        pricing: { ...DEFAULT_PRICING, ...(data?.pricing ?? {}) },
        split: { ...DEFAULT_SPLIT, ...(data?.split ?? {}) },
      };

  cached = config;
  cachedAt = now;
  return config;
}