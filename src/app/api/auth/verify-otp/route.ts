import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BACKEND_URL =
  process.env.AUTH_ENGINE_URL || 'https://xecoflow-2gen.onrender.com';
const REQUEST_TIMEOUT_MS = 8000;

const AUTH_COOKIE_NAMES = new Set(['xeco_session', 'xeco_otp', 'xeco_refresh']);

const COOKIE_FLAGS: Record<string, string> = {
  xeco_session: 'HttpOnly; Secure; SameSite=Strict; Path=/',
  xeco_otp: 'HttpOnly; Secure; SameSite=Lax; Path=/',
  xeco_refresh: 'HttpOnly; Secure; SameSite=Strict; Path=/',
};

const AUTH_ERROR_CODES = new Set([
  'INVALID_OTP',
  'OTP_EXPIRED',
  'OTP_ATTEMPTS_EXCEEDED',
  'OTP_NOT_FOUND',
  'RATE_LIMITED',
  'INVALID_REQUEST',
]);

const verifyOtpRequestSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
  })
  .strict();

function normalizeStatus(backendStatus: number): number {
  const KNOWN = [200, 400, 401, 403, 423, 429, 500, 502, 503, 504];
  return KNOWN.includes(backendStatus) ? backendStatus : 500;
}

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

function readOtpCookie(request: NextRequest): string | null {
  const cookie = request.cookies.get('xeco_otp');
  if (!cookie?.value) return null;
  return `xeco_otp=${cookie.value}`;
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

function sanitizeBackendResponse(
  backendStatus: number,
  raw: unknown
): { success: true } | { success: false; code: string; retryAfter?: number } {
  const obj = (raw ?? {}) as Record<string, unknown>;

  if (backendStatus >= 200 && backendStatus < 300 && obj.success === true) {
    return { success: true };
  }

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

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

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
    const rawBody = await request.json();
    const { code } = verifyOtpRequestSchema.parse(rawBody);

    const otpCookie = readOtpCookie(request);
    if (!otpCookie) {
      return NextResponse.json(
        { success: false, code: 'OTP_NOT_FOUND' },
        { status: 401, headers: secureHeaders }
      );
    }

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

    const contentType = backendResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Expected JSON from backend');
    }

    const rawBackendData = await backendResponse.json();
    const sanitized = sanitizeBackendResponse(
      backendResponse.status,
      rawBackendData
    );
    const finalStatus = normalizeStatus(backendResponse.status);

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
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    const isTimeout =
      errorMessage.includes('AbortError') || errorMessage.includes('timeout');

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