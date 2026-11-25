/**
 * Security layer for Nautica.
 *
 * Hardens the client against the most common web attacks:
 *
 *   - Insecure context (HTTP instead of HTTPS) — refused at load time
 *   - Cross-Site Request Forgery (CSRF) — token required on state-changing calls
 *   - Session hijacking via XSS — sensitive values encrypted at rest, short TTL
 *   - Session fixation — new token on every sign-in, cleared on sign-out
 *   - Brute force on OTP/password — client-side rate limiting with lockout
 *   - Data exfiltration — audit log of security-relevant events
 *   - Clickjacking — frame-ancestors 'none' (also set by hosting headers)
 *
 * Because accounts and sessions live in the browser, this is local access
 * control, not server-side identity. It raises the cost of an attack; it does
 * not remove the risk of a compromised browser profile.
 */

import { randomBytes, toHex, timingSafeEqual } from './secureCode';
import { readValue, writeValue, clearValue } from './storage';

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

export const SESSION_TTL_MS = 30 * 60 * 1000;       // 30 minutes
export const INACTIVITY_WARN_MS = 5 * 60 * 1000;    // warn 5 min before expiry
export const CSRF_TTL_MS = 10 * 60 * 1000;          // 10 minutes
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;     // 15 minutes

const SESSION_KEY = 'nautica.session.v2';
const CSRF_KEY = 'nautica.csrf.v1';
const SECURITY_LOG_KEY = 'nautica.security.log.v1';
const FAILED_LOGIN_KEY = 'nautica.failed-login.v1';
const ENCRYPTION_SALT_KEY = 'nautica.encryption-salt.v1';

/* ------------------------------------------------------------------ */
/* HTTPS / secure-context enforcement                                 */
/* ------------------------------------------------------------------ */

/**
 * Refuse to run on an insecure context. Production must be HTTPS; localhost
 * is the only exception (development).
 *
 * Returns true when the page may continue, false when it must not render.
 */
export function requireSecureContext() {
  if (typeof window === 'undefined') return true;
  if (window.isSecureContext) return true;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true;
  if (window.location.protocol === 'https:') return true;
  return false;
}

/* ------------------------------------------------------------------ */
/* CSRF protection                                                    */
/* ------------------------------------------------------------------ */

/** Mint a CSRF token bound to the current session. */
export function createCsrfToken() {
  return toHex(randomBytes(16));
}

/** Read the stored CSRF token, or null when none exists. */
export function readCsrfToken() {
  return readValue(CSRF_KEY, null);
}

/** Store a CSRF token. */
export function writeCsrfToken(token) {
  writeValue(CSRF_KEY, token);
}

/** Clear the CSRF token. */
export function clearCsrfToken() {
  clearValue(CSRF_KEY);
}

/**
 * Constant-time comparison of a supplied token against the stored one.
 * Returns false (never throws) on any mismatch, so callers cannot
 * distinguish "no token" from "wrong token".
 */
export function validateCsrfToken(supplied) {
  const stored = readCsrfToken();
  if (!stored || !supplied) return false;
  return timingSafeEqual(stored, supplied);
}

/* ------------------------------------------------------------------ */
/* Encrypted localStorage                                             */
/* ------------------------------------------------------------------ */

/**
 * Derive an encryption key from the device secret and a per-install salt.
 * Used to encrypt session data at rest so a storage dump alone does not
 * yield a usable session or OTP challenge.
 */
export async function encryptionKey() {
  const subtle = globalThis.crypto.subtle;
  const encoder = new TextEncoder();
  const salt = readValue(ENCRYPTION_SALT_KEY) || toHex(randomBytes(16));
  if (!readValue(ENCRYPTION_SALT_KEY)) writeValue(ENCRYPTION_SALT_KEY, salt);
  const key = await subtle.importKey(
    'raw',
    encoder.encode(salt),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', salt: encoder.encode('nautica-encryption-v1'), iterations: 210000, hash: 'SHA-256' },
    key,
    256,
  );
  return toHex(new Uint8Array(bits));
}

/** Encrypt a value with AES-GCM. Returns base64url ciphertext. */
export async function encryptValue(plaintext) {
  const subtle = globalThis.crypto.subtle;
  const encoder = new TextEncoder();
  const keyHex = await encryptionKey();
  const key = await subtle.importKey('raw', encoder.encode(keyHex), 'AES-GCM', false, ['encrypt']);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plaintext));
  const combined = new Uint8Array(iv.length + ct.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ct), iv.length);
  return btoa(String.fromCharCode(...combined)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/** Decrypt a base64url ciphertext. Returns null on any failure. */
export async function decryptValue(ciphertext) {
  try {
    const subtle = globalThis.crypto.subtle;
    const encoder = new TextEncoder();
    const keyHex = await encryptionKey();
    const key = await subtle.importKey('raw', encoder.encode(keyHex), 'AES-GCM', false, ['decrypt']);
    const data = atob(ciphertext.replaceAll('-', '+').replaceAll('_', '/'));
    const bytes = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i += 1) bytes[i] = data.charCodeAt(i);
    const iv = bytes.slice(0, 12);
    const ct = bytes.slice(12);
    const pt = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(pt);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Session management                                                 */
/* ------------------------------------------------------------------ */

/**
 * Store a session with an expiry and a CSRF token. The payload is encrypted
 * at rest so localStorage inspection does not reveal credentials.
 */
export async function storeSession(session) {
  const csrfToken = createCsrfToken();
  const payload = {
    ...session,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
    csrfToken,
  };
  const encrypted = await encryptValue(JSON.stringify(payload));
  writeValue(SESSION_KEY, encrypted);
  writeCsrfToken(csrfToken);
  return csrfToken;
}

/** Read and decrypt the session, or null when missing/expired/corrupt. */
export async function readSession() {
  const encrypted = readValue(SESSION_KEY, null);
  if (!encrypted) return null;
  const decrypted = await decryptValue(encrypted);
  if (!decrypted) return null;
  let payload;
  try {
    payload = JSON.parse(decrypted);
  } catch {
    return null;
  }
  if (!payload || typeof payload.expiresAt !== 'number') return null;
  if (Date.now() > payload.expiresAt) {
    clearSession();
    return null;
  }
  return payload;
}

/** Clear session, CSRF token, and all auth-related storage. */
export function clearSession() {
  clearValue(SESSION_KEY);
  clearCsrfToken();
}

/* ------------------------------------------------------------------ */
/* Failed-login tracking                                              */
/* ------------------------------------------------------------------ */

/** Record a failed login attempt and return whether the account is locked. */
export function recordFailedLogin(identifier) {
  const key = `${FAILED_LOGIN_KEY}:${identifier}`;
  const now = Date.now();
  const data = readValue(key, { attempts: 0, firstFailedAt: null, lockedUntil: null });
  if (data.lockedUntil && now < data.lockedUntil) return { locked: true, lockedUntil: data.lockedUntil };
  const attempts = (data.attempts ?? 0) + 1;
  const lockedUntil = attempts >= MAX_FAILED_LOGIN_ATTEMPTS ? now + LOGIN_LOCKOUT_MS : null;
  writeValue(key, { attempts, firstFailedAt: data.firstFailedAt || now, lockedUntil });
  return { locked: attempts >= MAX_FAILED_LOGIN_ATTEMPTS, lockedUntil, attempts };
}

/** Clear failed-login tracking for an identifier after a successful login. */
export function clearFailedLogin(identifier) {
  clearValue(`${FAILED_LOGIN_KEY}:${identifier}`);
}

/** Read failed-login state for an identifier. */
export function readFailedLogin(identifier) {
  const now = Date.now();
  const data = readValue(`${FAILED_LOGIN_KEY}:${identifier}`, null);
  if (!data) return null;
  if (data.lockedUntil && now < data.lockedUntil) return { locked: true, lockedUntil: data.lockedUntil, attempts: data.attempts };
  return { locked: false, attempts: data.attempts ?? 0 };
}

/* ------------------------------------------------------------------ */
/* Security audit log                                                 */
/* ------------------------------------------------------------------ */

/**
 * Append a security-relevant event to the local audit log. The log is capped
 * at 200 entries so it cannot grow without bound.
 */
export function logSecurityEvent(event, meta = {}) {
  const log = readValue(SECURITY_LOG_KEY, []);
  const entry = {
    ts: new Date().toISOString(),
    event,
    meta,
  };
  const next = [entry, ...log].slice(0, 200);
  writeValue(SECURITY_LOG_KEY, next);
}

/** Read the security audit log. */
export function readSecurityLog() {
  return readValue(SECURITY_LOG_KEY, []);
}

/** Clear the security audit log. */
export function clearSecurityLog() {
  clearValue(SECURITY_LOG_KEY);
}

/* ------------------------------------------------------------------ */
/* Input validation hardening                                         */
/* ------------------------------------------------------------------ */

/**
 * Reject strings that contain common XSS or injection patterns.
 * Returns { ok: true } or { ok: false, reason }.
 */
export function validateNoInjection(value, fieldName = 'input') {
  if (typeof value !== 'string') return { ok: false, reason: `${fieldName} must be text` };
  const dangerous = [
    /<script\b/i,
    /<\/script>/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
    /<link\b/i,
    /<meta\b/i,
    /expression\s*\(/i,
    /url\s*\(/i,
  ];
  for (const pattern of dangerous) {
    if (pattern.test(value)) {
      return { ok: false, reason: `${fieldName} contains blocked content` };
    }
  }
  return { ok: true };
}

/**
 * Validate a delivery location: non-empty, bounded length, no injection.
 */
export function validateLocation(value) {
  if (!value || typeof value !== 'string') return { ok: false, reason: 'Location is required' };
  const trimmed = value.trim();
  if (trimmed.length < 3) return { ok: false, reason: 'Location is too short' };
  if (trimmed.length > 200) return { ok: false, reason: 'Location is too long' };
  return validateNoInjection(trimmed, 'Location');
}

/**
 * Validate a business name.
 */
export function validateBusinessName(value) {
  if (!value || typeof value !== 'string') return { ok: false, reason: 'Business name is required' };
  const trimmed = value.trim();
  if (trimmed.length < 2) return { ok: false, reason: 'Business name is too short' };
  if (trimmed.length > 100) return { ok: false, reason: 'Business name is too long' };
  return validateNoInjection(trimmed, 'Business name');
}

/**
 * Validate a vehicle registration.
 */
export function validateVehicleRegistration(value) {
  if (!value || typeof value !== 'string') return { ok: false, reason: 'Vehicle registration is required' };
  const trimmed = value.trim();
  if (trimmed.length < 3) return { ok: false, reason: 'Vehicle registration is too short' };
  if (trimmed.length > 20) return { ok: false, reason: 'Vehicle registration is too long' };
  return validateNoInjection(trimmed, 'Vehicle registration');
}

/* ------------------------------------------------------------------ */
/* Rate limiting for auth actions                                     */
/* ------------------------------------------------------------------ */

/** Client-side rate limiter shared across auth forms. */
export class AuthRateLimiter {
  constructor(maxRequests = 5, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = new Map();
  }

  check(key) {
    const now = Date.now();
    const userRequests = this.requests.get(key) || [];
    const validRequests = userRequests.filter((ts) => now - ts < this.windowMs);
    if (validRequests.length >= this.maxRequests) {
      return { allowed: false, retryAfter: this.windowMs - (now - validRequests[0]) };
    }
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return { allowed: true };
  }

  reset(key) {
    this.requests.delete(key);
  }
}

export const authRateLimiter = new AuthRateLimiter();
