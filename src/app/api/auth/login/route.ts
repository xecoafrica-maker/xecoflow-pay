// xecoflow-pay/src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Force Node.js runtime for crypto.randomUUID and long fetches.
// Bypass the static cache so a POST never gets cached.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.AUTH_ENGINE_URL;

if (!BACKEND_URL) {
  throw new Error('AUTH_ENGINE_URL environment variable is not set');
}

const REQUEST_TIMEOUT_MS = 15000;
const MAX_IDEMPOTENCY_KEY_LENGTH = 100;

const AUTH_COOKIE_NAMES = new Set(['xeco_session', 'xeco_otp', 'xeco_refresh']);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const COOKIE_FLAGS: Record<string, string> = {
  xeco_session: `HttpOnly${IS_PRODUCTION ? '; Secure' : ''}; SameSite=Strict; Path=/`,
  xeco_otp: `HttpOnly${IS_PRODUCTION ? '; Secure' : ''}; SameSite=Lax; Path=/`,
  xeco_refresh: `HttpOnly${IS_PRODUCTION ? '; Secure' : ''}; SameSite=Strict; Path=/`,
};

const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

// Whitelist of fields the BFF will return to the browser. Anything not
// listed here is dropped, even if the backend sends it.
const safeLoginResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    requiresOTP: z.boolean().optional(),
  }),
  z.object({
    success: z.literal(false),
    code: z.enum([
      'INVALID_CREDENTIALS',
      'ACCOUNT_LOCKED',
      'ACCOUNT_NOT_VERIFIED',
      'RATE_LIMITED',
      'INVALID_REQUEST',
      'INVALID_EMAIL',
    ]),
    message: z.string().optional(),
    requiresVerification: z.boolean().optional(),
    retryAfter: z.number().int().min(0).max(3600).optional(),
  }),
]);

// Pass through backend status codes we know. Anything else collapses
// to 500 so we never leak odd backend statuses.
function normalizeStatus(backendStatus: number): number {
  const KNOWN = [200, 400, 401, 403, 423, 429, 500, 502, 503, 504];
  return KNOWN.includes(backendStatus) ? backendStatus : 500;
}

// Rewrite Set-Cookie from the backend into our fixed cookie policy.
// Keep only Max-Age; Expires is locale-sensitive and redundant.
function normalizeAuthCookie(cookie: string, name: string): string {
  const separatorIndex = cookie.indexOf('=');
  if (separatorIndex === -1) {
    throw new Error('Malformed Set-Cookie header');
  }
  const rawName = cookie.slice(0, separatorIndex).trim();
  const value = cookie.slice(separatorIndex + 1).split(';')[0].trim();

  const rawAttributes = cookie
    .split(';')
    .slice(1)
    .map((p) => p.trim())
    .filter(Boolean);

  const maxAge = rawAttributes.find((p) => {
    const eq = p.indexOf('=');
    if (eq === -1) return false;
    return p.slice(0, eq).trim().toLowerCase() === 'max-age';
  });

  const flags = COOKIE_FLAGS[name] || COOKIE_FLAGS.xeco_session;
  return [`${rawName}=${value}`, flags, maxAge].filter(Boolean).join('; ');
}

// Reads the client IP from X-Forwarded-For. Render (our ingress) puts
// the original client IP as the FIRST entry — the rest of the chain is
// proxies we don't trust.
function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (!xff) return 'unknown';
  const first = xff.split(',')[0]?.trim();
  return first || 'unknown';
}

function getIdempotencyKey(request: NextRequest, fallback: string): string {
  const raw = request.headers.get('idempotency-key');
  if (!raw) return fallback;
  return raw.slice(0, MAX_IDEMPOTENCY_KEY_LENGTH);
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const secureHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    'X-Request-ID': requestId,
  };

  try {
    const rawBody = await request.json();
    const validatedRequest = loginRequestSchema.parse(rawBody);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const idempotencyKey = getIdempotencyKey(request, requestId);

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'Idempotency-Key': idempotencyKey,
        'X-Forwarded-For': getClientIp(request),
      },
      body: JSON.stringify(validatedRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = backendResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_REQUEST',
          message: 'The service is temporarily unavailable. Please try again.',
          requestId,
        },
        { status: 502, headers: secureHeaders }
      );
    }

    const rawBackendData = (await backendResponse.json()) as unknown;

    // Normalize the backend response before whitelist parsing.
    // 1. ACCOUNT_NOT_VERIFIED → also set requiresVerification for the UI.
    // 2. Un-coded error responses → infer a code from HTTP status.
    const normalizedBackendData = (() => {
      if (
        rawBackendData &&
        typeof rawBackendData === 'object' &&
        (rawBackendData as { code?: unknown }).code === 'ACCOUNT_NOT_VERIFIED'
      ) {
        return { ...rawBackendData, requiresVerification: true };
      }

      if (
        rawBackendData &&
        typeof rawBackendData === 'object' &&
        'success' in rawBackendData &&
        (rawBackendData as { success: unknown }).success === false &&
        !('code' in rawBackendData)
      ) {
        const status = backendResponse.status;
        const code =
          status === 409
            ? 'INVALID_REQUEST'
            : status === 429
            ? 'RATE_LIMITED'
            : status === 403
            ? 'ACCOUNT_NOT_VERIFIED'
            : status === 400
            ? 'INVALID_REQUEST'
            : 'INVALID_CREDENTIALS';
        return { ...rawBackendData, code };
      }

      return rawBackendData;
    })();

    let sanitizedData: z.infer<typeof safeLoginResponseSchema>;
    try {
      sanitizedData = safeLoginResponseSchema.parse(normalizedBackendData);
    } catch {
      // Backend sent a shape we don't understand. Fail closed — do not
      // echo the backend body.
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_REQUEST',
          message: 'Login could not be completed. Please try again.',
          requestId,
        },
        { status: 502, headers: secureHeaders }
      );
    }

    const finalStatus = normalizeStatus(backendResponse.status);

    const nextResponse = NextResponse.json(sanitizedData, {
      status: finalStatus,
      headers: secureHeaders,
    });

    const setCookieHeaders = backendResponse.headers.getSetCookie?.() || [];

    for (const cookie of setCookieHeaders) {
      const eqIndex = cookie.indexOf('=');
      if (eqIndex === -1) continue;
      const name = cookie.slice(0, eqIndex).trim();
      if (!name || !AUTH_COOKIE_NAMES.has(name)) continue;
      nextResponse.headers.append('Set-Cookie', normalizeAuthCookie(cookie, name));
    }

    return nextResponse;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      // Never leak field names or expected types.
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST', requestId },
        { status: 400, headers: secureHeaders }
      );
    }

    const isTimeout =
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError');

    if (isTimeout) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_REQUEST',
          message: 'Request timed out. Please try again.',
          requestId,
        },
        { status: 504, headers: secureHeaders }
      );
    }

    console.error(
      JSON.stringify({
        event: 'auth.login.proxy_error',
        requestId,
        errorName: error instanceof Error ? error.name : 'unknown',
      })
    );

    return NextResponse.json(
      {
        success: false,
        code: 'INVALID_REQUEST',
        message: 'An unexpected error occurred. Please try again.',
        requestId,
      },
      { status: 500, headers: secureHeaders }
    );
  }
}