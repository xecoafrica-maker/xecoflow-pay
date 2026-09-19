import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BACKEND_URL =
  process.env.AUTH_ENGINE_URL || 'https://xecoflow-2gen.onrender.com';
const REQUEST_TIMEOUT_MS = 8000;

const AUTH_COOKIE_NAMES = new Set(['xeco_session', 'xeco_otp']);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const COOKIE_FLAGS: Record<string, string> = {
  xeco_session: `HttpOnly${
    IS_PRODUCTION ? '; Secure' : ''
  }; SameSite=Strict; Path=/`,
  xeco_otp: `HttpOnly${
    IS_PRODUCTION ? '; Secure' : ''
  }; SameSite=Lax; Path=/`,
};

const resendResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    expiresAt: z.number().int().positive(),
  }),
  z.object({
    success: z.literal(false),
    code: z.enum([
      'OTP_NOT_FOUND',
      'RATE_LIMITED',
      'OTP_ATTEMPTS_EXCEEDED',
      'INVALID_REQUEST',
    ]),
    retryAfter: z.number().int().min(0).max(3600).optional(),
  }),
]);

const COOKIE_OTP = 'xeco_otp';

function normalizeAuthCookie(cookie: string, name: string): string {
  // Split on the first '=' only — JWT values contain '=' as base64 padding.
  const separatorIndex = cookie.indexOf('=');
  if (separatorIndex === -1) {
    throw new Error('Malformed Set-Cookie header');
  }
  const rawName = cookie.slice(0, separatorIndex).trim();
  const value = cookie.slice(separatorIndex + 1).split(';')[0].trim();

  // Preserve only Max-Age. Expires is dropped because its locale-sensitive
  // format is easy to corrupt, and browsers use Max-Age when both are
  // present anyway.
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

  return [`${rawName}=${value}`, flags, maxAge]
    .filter(Boolean)
    .join('; ');
}

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (!xff) return 'unknown';
  const parts = xff.split(',').map((p) => p.trim());
  return parts[parts.length - 1] || 'unknown';
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  console.log(
    JSON.stringify({
      event: 'auth.resend_otp.attempt',
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
    const otpCookie = request.cookies.get(COOKIE_OTP);
    if (!otpCookie?.value) {
      return NextResponse.json(
        { success: false, code: 'OTP_NOT_FOUND' },
        { status: 401, headers: secureHeaders }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        Cookie: `${COOKIE_OTP}=${otpCookie.value}`,
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = backendResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Expected JSON from backend');
    }

    const rawBackendData = await backendResponse.json();

    const parsed = resendResponseSchema.safeParse(rawBackendData);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST' },
        { status: 500, headers: secureHeaders }
      );
    }

    const sanitized = parsed.data;
    const finalStatus =
      backendResponse.status >= 200 && backendResponse.status < 300
        ? 200
        : backendResponse.status;

    const nextResponse = NextResponse.json(sanitized, {
      status: finalStatus,
      headers: secureHeaders,
    });

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
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout =
      message.includes('AbortError') || message.includes('timeout');

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