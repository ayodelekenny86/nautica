import { expect, test } from "vitest";
import { readFile } from "node:fs/promises";

const checker = await readFile("scripts/verify-live.mjs", "utf8");

test("every origin this project serves from is probed", () => {
  expect(checker).toMatch(/viviluxy-assistant\.web\.app/);
  expect(checker).toMatch(/nautica\.web\.app/);
  expect(checker).not.toMatch(/nauticalgh1\.vercel\.app/);
});

test("the check is about what is served, not just that it answers", () => {
  for (const check of [
    "the live build matches this checkout",
    "the served bundle contains no fabricated claims",
    "the served bundle is built against the server",
    "a CSP is set",
  ]) {
    expect(checker).toContain(check);
  }
});

test("the fabricated claims it hunts for are ones the app removed", async () => {
  const honesty = (await readFile("src/honesty.test.jsx", "utf8")).replace(/^\uFEFF/, "");
  expect(honesty).toMatch(/GH\\u20b58,420/);
  expect(honesty).toMatch(/in escrow/i);

  expect(checker).toMatch(/this demo workspace/);
  expect(checker).toMatch(/18,540/);
  expect(checker).toMatch(/4,820/);
  expect(checker).toMatch(/Alex K\\./);
});

test("both hosting configs set the same security headers", async () => {
  const [firebase, vercel] = await Promise.all([
    readFile("firebase.json", "utf8").then((t) => JSON.parse(t.replace(/^\uFEFF/, ""))),
    readFile("vercel.json", "utf8").then((t) => JSON.parse(t.replace(/^\uFEFF/, ""))),
  ]);

  const getFirebaseHeaders = () => {
    const hosting = firebase.hosting;
    if (Array.isArray(hosting)) {
      return hosting[0]?.headers || [];
    }
    return hosting?.headers || [];
  };

  const getVercelHeaders = () => vercel.headers || [];

  const headerValue = (headers, key) => headers
    .flatMap((entry) => entry.headers || [])
    .find((header) => header.key === key)?.value;

  const firebaseHeaders = getFirebaseHeaders();
  const vercelHeaders = getVercelHeaders();

  for (const key of [
    "Content-Security-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Strict-Transport-Security",
  ]) {
    expect(`${key}: ${headerValue(vercelHeaders, key)}`).toBe(`${key}: ${headerValue(firebaseHeaders, key)}`);
  }

  expect(headerValue(vercelHeaders, "Content-Security-Policy")).toMatch(/connect-src[^;]*\.supabase\.co/);
});

test("the Vercel config rewrites unknown paths to the app shell", async () => {
  const vercel = JSON.parse((await readFile("vercel.json", "utf8")).replace(/^\uFEFF/, ""));
  expect(vercel.rewrites.at(-1).destination).toBe("/index.html");
});

test("the route list is read from the app, not copied beside it", async () => {
  const api = (await readFile("src/lib/api.js", "utf8")).replace(/^\uFEFF/, "");
  const routes = api.match(/ROUTES\s*=\s*\{[\s\S]*?\n\};/)?.[0];
  expect(routes).toBeTruthy();
  expect(checker).toContain(routes);
});

test("the verify script probes both hosts against live requirements", () => {
  expect(checker).toMatch(/nautica\.web\.app/);
  expect(checker).toMatch(/viviluxy-assistant\.web\.app/);
  expect(checker).toMatch(/Content-Security-Policy/);
  expect(checker).toMatch(/X-Content-Type-Options/);
  expect(checker).toMatch(/build hash/);
  expect(checker).toMatch(/supabase\.co/);
});

test("the verify script fails closed on a missing build", () => {
  const index = checker.indexOf("readFileSync");
  expect(index).toBeGreaterThan(-1);
  const snippet = checker.slice(index, index + 400);
  expect(snippet).toMatch(/catch|exit|process\.exit|throw/i);
});

test("the verify script uses the tracked HEAD hash", () => {
  expect(checker).toMatch(/git/);
  expect(checker).toMatch(/rev-parse|HEAD/);
});
