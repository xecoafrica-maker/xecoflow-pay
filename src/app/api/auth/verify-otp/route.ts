// src/app/api/auth/verify-otp/route.ts
//
// BFF proxy for OTP verification.
//
// Security model:
//   - The OTP temp token lives in an HttpOnly cookie (xeco_otp), set by the
//     login route. This route reads it server-side and forwards it to the
//     auth-engine. The client never sees it.
//   - On success, the auth-engine issues a session cookie (xeco_session).
//     We forward it with enforced HttpOnly/Secure/SameSite flags.
//   - The response body contains NO token and NO merchant data. The client
//     fetches its profile separately from /api/auth/session.
//   - Error responses use a fixed enum of `code` values. We never echo
//     server-provided messages to the client.
//
// Dependency on the auth-engine:
//   The auth-engine MUST use the cookie names xeco_otp and xeco_session,
//   and MUST return the `code` values in the AUTH_ERROR_CODES enum below.
//   If it uses different names or codes, we either rename in the engine or
//   add a translation layer here. Translation layers are debt; renaming is
//   preferred.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ─── Configuration ──────────────────────────────────────────────────
const BACKEND_URL =
  process.env.AUTH_ENGINE_URL || 'https://xecoflow-2gen.onrender.com';
const REQUEST_TIMEOUT_MS = 8000;

// Cookie names we own and are willing to rewrite. Anything else the
// auth-engine sets is dropped. See the login route for full reasoning.
const AUTH_COOKIE_NAMES = new Set(['xeco_session', 'xeco_otp']);

// Cookie flags per name. Session and OTP have different SameSite policies
// because the OTP cookie must survive cross-site top-level navigations
// (e.g. an email link), while the session cookie must not.
const COOKIE_FLAGS: Record<string, string> = {
  xeco_session: 'HttpOnly; Secure; SameSite=Strict; Path=/',
  xeco_otp:     'HttpOnly; Secure; SameSite=Lax; Path=/',
};

// Error codes the frontend knows how to render. The auth-engine must
// choose from this set. Anything else is mapped to a status-derived
// fallback by sanitizeBackendResponse.
const AUTH_ERROR_CODES = new Set([
  'INVALID_OTP',
  'OTP_EXPIRED',
  'OTP_ATTEMPTS_EXCEEDED',
  'OTP_NOT_FOUND',
  'RATE_LIMITED',
  'INVALID_REQUEST',
]);

// ─── Inbound Schema ─────────────────────────────────────────────────
// .strict() rejects unknown fields. A client cannot smuggle an email,
// a temp token, or any other parameter past this boundary.
const verifyOtpRequestSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
  })
  .strict();

// ─── Helpers ────────────────────────────────────────────────────────
function normalizeStatus(backendStatus: number): number {
  const KNOWN = [200, 400, 401, 403, 423, 429, 500, 502, 503, 504];
  return KNOWN.includes(backendStatus) ? backendStatus : 500;
}

/**
 * Rebuild a Set-Cookie string with enforced security flags.
 *
 * Splits on the FIRST '=' only. Cookie values (JWTs, base64) may contain
 * '=' as padding; a naive split would corrupt the value.
 */
function normalizeAuthCookie(cookie: string, name: string): string {
  const separatorIndex = cookie.indexOf('=');
  if (separatorIndex === -1) {
    throw new Error('Malformed Set-Cookie header: no = separator');
  }
  const rawName = cookie.slice(0, separatorIndex).trim();
  const value = cookie.slice(separatorIndex + 1).split(';')[0].trim();

  const attributes = cookie
    .split(';')
    .slice(1)
    .map((p) => p.trim().toLowerCase());

  const maxAge = attributes.find((p) => p.startsWith('max-age='));
  const expires = attributes.find((p) => p.startsWith('expires='));

  const flags = COOKIE_FLAGS[name] || COOKIE_FLAGS.xeco_session;

  return [`${rawName}=${value}`, flags, maxAge, expires]
    .filter(Boolean)
    .join('; ');
}

/**
 * Extract a trustworthy client IP.
 *
 * x-forwarded-for is client-supplied. We take the LAST entry, which is
 * the one appended by the proxy closest to us. Prefer a platform header
 * (CF-Connecting-IP, x-real-ip) when available.
 */
function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (!xff) return 'unknown';
  const parts = xff.split(',').map((p) => p.trim());
  return parts[parts.length - 1] || 'unknown';
}

/**
 * Extract the OTP session cookie and forward it to the auth-engine as a
 * Cookie header. Returns null if the cookie is absent.
 *
 * The auth-engine treats this cookie as the sole authority on which OTP
 * session to validate. The client cannot supply it via the body.
 */
function readOtpCookie(request: NextRequest): string | null {
  const cookie = request.cookies.get('xeco_otp');
  if (!cookie?.value) return null;
  return `xeco_otp=${cookie.value}`;
}

/**
 * Validate the auth-engine's response against our sanitization contract.
 *
 * Two responsibilities:
 *   1. If the backend said "success", ensure the response body does not
 *      smuggle tokens or PII to the client. The output is always exactly
 *      `{ success: true }`, regardless of what else was sent.
 *   2. If the backend said "failure", map its error shape to our fixed
 *      `code` enum so the frontend can render a safe message.
 *
 * Contradictory responses: if the auth-engine sends `success: true`
 * alongside an error `code`, `success` wins and the code is dropped.
 * The auth-engine's contract must be internally consistent; this
 * function does not attempt to reconcile contradictions.
 *
 * Any backend field not in this contract is silently dropped.
 */
function sanitizeBackendResponse(
  backendStatus: number,
  raw: unknown
): { success: true } | { success: false; code: string; retryAfter?: number } {
  const obj = (raw ?? {}) as Record<string, unknown>;

  // Success path
  if (backendStatus >= 200 && backendStatus < 300 && obj.success === true) {
    return { success: true };
  }

  // Failure path
  const rawCode = typeof obj.code === 'string' ? obj.code : undefined;
  const code: string =
    rawCode && AUTH_ERROR_CODES.has(rawCode)
      ? rawCode
      : statusToFallbackCode(backendStatus);

  const result: { success: false; code: string; retryAfter?: number } = {
    success: false,
    code,
  };

  if (typeof obj.retryAfter === 'number' && obj.retryAfter >= 0) {
    result.retryAfter = Math.min(Math.floor(obj.retryAfter), 3600);
  }

  return result;
}

function statusToFallbackCode(status: number): string {
  if (status === 400) return 'INVALID_REQUEST';
  if (status === 401) return 'INVALID_OTP';
  if (status === 404) return 'OTP_NOT_FOUND';
  if (status === 410) return 'OTP_EXPIRED';
  if (status === 423) return 'OTP_ATTEMPTS_EXCEEDED';
  if (status === 429) return 'RATE_LIMITED';
  return 'INVALID_REQUEST';
}

// ─── Route Handler ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Structured log for correlation. No PII, no OTP, no token.
  // NOTE: console.log is temporary. Replace with a real log sink
  // (SIEM, Datadog, CloudWatch, or your auth-engine's audit endpoint)
  // before going live.
  console.log(
    JSON.stringify({
      event: 'auth.verify_otp.attempt',
      requestId,
      ts: new Date().toISOString(),
      ip,
      userAgent,
    })
  );

  const secureHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    'X-Request-ID': requestId,
  };

  try {
    // ─── Validate inbound body ──────────────────────────────────────
    const rawBody = await request.json();
    const { code } = verifyOtpRequestSchema.parse(rawBody);

    // ─── Read the OTP cookie ────────────────────────────────────────
    const otpCookie = readOtpCookie(request);
    if (!otpCookie) {
      return NextResponse.json(
        { success: false, code: 'OTP_NOT_FOUND' },
        { status: 401, headers: secureHeaders }
      );
    }

    // ─── Forward to auth-engine ─────────────────────────────────────
    const idempotencyKey =
      request.headers.get('idempotency-key') || requestId;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'Idempotency-Key': idempotencyKey,
        Cookie: otpCookie,
      },
      body: JSON.stringify({ code }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // ─── Assert JSON response ───────────────────────────────────────
    const contentType = backendResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Expected JSON from backend, got ${contentType}`);
    }

    const rawBackendData = await backendResponse.json();

    // ─── Sanitize response ──────────────────────────────────────────
    const sanitized = sanitizeBackendResponse(
      backendResponse.status,
      rawBackendData
    );

    const finalStatus = normalizeStatus(backendResponse.status);

    const nextResponse = NextResponse.json(sanitized, {
      status: finalStatus,
      headers: secureHeaders,
    });

    // ─── Forward cookies with enforced flags ────────────────────────
    const setCookieHeaders = backendResponse.headers.getSetCookie?.() || [];
    for (const cookie of setCookieHeaders) {
      const eqIndex = cookie.indexOf('=');
      if (eqIndex === -1) continue;
      const name = cookie.slice(0, eqIndex).trim();
      if (!AUTH_COOKIE_NAMES.has(name)) continue;
      nextResponse.headers.append(
        'Set-Cookie',
        normalizeAuthCookie(cookie, name)
      );
    }

    return nextResponse;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const isTimeout =
      errorMessage.includes('AbortError') || errorMessage.includes('timeout');

    if (process.env.NODE_ENV !== 'production') {
      console.error(
        `[Auth Proxy] Verify OTP failed (Request ID: ${requestId}):`,
        errorMessage
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST' },
        { status: 400, headers: secureHeaders }
      );
    }

    if (isTimeout) {
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST' },
        { status: 504, headers: secureHeaders }
      );
    }

    return NextResponse.json(
      { success: false, code: 'INVALID_REQUEST' },
      { status: 500, headers: secureHeaders }
    );
  }
}