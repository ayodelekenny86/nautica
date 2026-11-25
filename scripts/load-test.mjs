/**
 * Real concurrent load test against the live Nautica API.
 *
 * Simulates many customers arriving at once by ramping concurrency against the
 * two read endpoints every session hits (config + pricing quote), then reports
 * throughput and latency percentiles and the error rate at each step. The point
 * is to find where the shared backend starts to queue, slow down, or reject.
 *
 * Usage: node scripts/load-test.mjs [maxConcurrency] [durationMs]
 * Reads the public anon key from .env (never a secret).
 */
import { readFileSync } from 'node:fs';

function loadEnv() {
  try {
    const text = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    const env = {};
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
    return env;
  } catch {
    return {};
  }
}

const env = loadEnv();
const url = (env.VITE_SUPABASE_URL || `https://${env.VITE_SUPABASE_PROJECT_REF}.supabase.co`).replace(/\/$/, '');
const anon = env.VITE_SUPABASE_ANON_KEY || '';
if (!anon) {
  console.error('No VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const maxConcurrency = Number(process.argv[2] || 2000);
const durationMs = Number(process.argv[3] || 4000);
const BASE = `${url}/functions/v1`;

// The two endpoints hit on essentially every session.
const TARGETS = [
  { name: 'config/get', path: `${BASE}/config/get` },
  { name: 'pricing/price', path: `${BASE}/pricing/price?volume=500` },
];

const headers = { apikey: anon, 'Content-Type': 'application/json' };

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function oneRequest(target) {
  const start = performance.now();
  try {
    const res = await fetch(target.path, { headers });
    const ms = performance.now() - start;
    return { ok: res.ok, status: res.status, ms };
  } catch (e) {
    return { ok: false, status: 0, ms: performance.now() - start, error: e.message };
  }
}

async function runLevel(concurrency, levelDuration) {
  const latencies = [];
  let ok = 0;
  let fail = 0;
  const statusCounts = {};
  const start = performance.now();
  let i = 0;

  // Keep `concurrency` requests in flight for the whole level window.
  async function worker() {
    while (performance.now() - start < levelDuration) {
      const target = TARGETS[i % TARGETS.length];
      i += 1;
      const r = await oneRequest(target);
      latencies.push(r.ms);
      if (r.ok) ok += 1;
      else {
        fail += 1;
        statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  const elapsed = (performance.now() - start) / 1000;
  const total = ok + fail;
  const sorted = [...latencies].sort((a, b) => a - b);

  return {
    concurrency,
    total,
    rps: Math.round(total / elapsed),
    ok,
    fail,
    errorRate: total ? ((fail / total) * 100).toFixed(2) : '0.00',
    p50: Math.round(percentile(sorted, 50)),
    p95: Math.round(percentile(sorted, 95)),
    p99: Math.round(percentile(sorted, 99)),
    max: Math.round(sorted[sorted.length - 1] || 0),
    statusCounts,
  };
}

console.log(`Target: ${url}`);
console.log(`Ramping to ${maxConcurrency} concurrent, ${durationMs}ms per level\n`);
console.log('conc |   rps |  ok  | fail | err%  |  p50 |  p95 |  p99 |  max | statuses');

const levels = [];
for (let c = 100; c <= maxConcurrency; c *= 2) levels.push(c);
if (levels[levels.length - 1] !== maxConcurrency) levels.push(maxConcurrency);

const results = [];
for (const c of levels) {
  const r = await runLevel(c, durationMs);
  results.push(r);
  const statuses = Object.entries(r.statusCounts).map(([k, v]) => `${k}:${v}`).join(',') || '-';
  console.log(
    `${String(c).padStart(4)} | ${String(r.rps).padStart(5)} | ${String(r.ok).padStart(4)} | ${String(r.fail).padStart(4)} | ${String(r.errorRate).padStart(5)} | ${String(r.p50).padStart(3)} | ${String(r.p95).padStart(4)} | ${String(r.p99).padStart(4)} | ${String(r.max).padStart(4)} | ${statuses}`,
  );
  // Stop early if the backend is clearly rejecting (server errors / rate limits).
  const hardFail = Object.entries(r.statusCounts).some(([k]) => Number(k) >= 500 || Number(k) === 429);
  if (hardFail && r.errorRate > 5) {
    console.log('\nBackend shedding load (5xx/429). Stopping ramp.');
    break;
  }
  await new Promise((r) => setTimeout(r, 500));
}

const peak = results.reduce((a, b) => (b.rps > a.rps ? b : a), results[0]);
console.log(`\nPeak throughput: ${peak.rps} rps at ${peak.concurrency} concurrent (p95 ${peak.p95}ms, err ${peak.errorRate}%)`);
console.log(`Extrapolated ceiling for 1,000,000 customers: ~${Math.round((peak.rps / peak.concurrency) * 1_000_000).toLocaleString()} concurrent capacity needed vs ${peak.concurrency} tested.`);