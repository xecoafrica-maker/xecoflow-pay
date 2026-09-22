import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BACKEND_URL = process.env.AUTH_ENGINE_URL;

if (!BACKEND_URL) {
  throw new Error('AUTH_ENGINE_URL environment variable is not set');
}

const REQUEST_TIMEOUT_MS = 15000;

const AUTH_COOKIE_NAMES = new Set(['xeco_session', 'xeco_otp', 'xeco_refresh']);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const COOKIE_FLAGS: Record<string, string> = {
  xeco_session: `HttpOnly${IS_PRODUCTION ? '; Secure' : ''}; SameSite=Strict; Path=/`,
  xeco_otp: `HttpOnly${IS_PRODUCTION ? '; Secure' : ''}; SameSite=Lax; Path=/`,
  xeco_refresh: `HttpOnly${IS_PRODUCTION ? '; Secure' : ''}; SameSite=Strict; Path=/`,
};

const loginRequestSchema = z.object({
  email: z.string().trim().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

// Error codes are kept in sync with the auth engine's /login endpoint.
// parse will fail and the proxy will return 500 to the client.
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
      'RATE_LIMITED',
      'INVALID_REQUEST',
    ]),
    retryAfter: z.number().int().min(0).max(3600).optional(),
  }),
]);

function normalizeStatus(backendStatus: number): number {
  const KNOWN = [200, 400, 401, 403, 423, 429, 500, 502, 503, 504];
  return KNOWN.includes(backendStatus) ? backendStatus : 500;
}

function normalizeAuthCookie(cookie: string, name: string): string {
  // Split on first '=' — JWT values contain '=' as base64 padding.
  const separatorIndex = cookie.indexOf('=');
  if (separatorIndex === -1) {
    throw new Error('Malformed Set-Cookie header');
  }
  const rawName = cookie.slice(0, separatorIndex).trim();
  const value = cookie.slice(separatorIndex + 1).split(';')[0].trim();

  // Keep only Max-Age; Expires is locale-sensitive and redundant.
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

// Reads the client IP from X-Forwarded-For. The trusted value is the
// LAST entry — that's the IP recorded by the nearest upstream proxy
function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (!xff) return 'unknown';
  const parts = xff.split(',').map((p) => p.trim());
  return parts[parts.length - 1] || 'unknown';
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

    const idempotencyKey = request.headers.get('idempotency-key') || requestId;

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
      throw new Error('Expected JSON from backend');
    }

    const rawBackendData = await backendResponse.json();
    const sanitizedData = safeLoginResponseSchema.parse(rawBackendData);
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
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (error instanceof z.ZodError) {
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
        error: errorMessage,
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