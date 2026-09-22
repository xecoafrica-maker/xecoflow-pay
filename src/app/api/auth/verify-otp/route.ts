import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  AUTH_COOKIE_NAMES,
  getBackendUrl,
  getClientIp,
  normalizeAuthCookie,
  normalizeStatus,
  secureHeaders,
} from '@/lib/auth-cookies';

const BACKEND_URL = getBackendUrl();
const REQUEST_TIMEOUT_MS = 8000;

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
  const headers = secureHeaders(requestId);

  try {
    const rawBody = await request.json();
    const { code } = verifyOtpRequestSchema.parse(rawBody);

    const otpCookie = readOtpCookie(request);
    if (!otpCookie) {
      return NextResponse.json(
        { success: false, code: 'OTP_NOT_FOUND' },
        { status: 401, headers }
      );
    }

    const idempotencyKey = request.headers.get('idempotency-key') || requestId;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'Idempotency-Key': idempotencyKey,
        'X-Forwarded-For': getClientIp(request),
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
      headers,
    });

    const setCookieHeaders = backendResponse.headers.getSetCookie?.() || [];
    for (const cookie of setCookieHeaders) {
      const eqIndex = cookie.indexOf('=');
      if (eqIndex === -1) continue;
      const name = cookie.slice(0, eqIndex).trim();
      if (!AUTH_COOKIE_NAMES.has(name)) continue;
      nextResponse.headers.append('Set-Cookie', normalizeAuthCookie(cookie, name));
    }

    return nextResponse;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST' },
        { status: 400, headers }
      );
    }

    const isTimeout =
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError');

    if (isTimeout) {
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST' },
        { status: 504, headers }
      );
    }

    console.error(
      JSON.stringify({
        event: 'auth.verify_otp.proxy_error',
        requestId,
        error: errorMessage,
      })
    );

    return NextResponse.json(
      { success: false, code: 'INVALID_REQUEST' },
      { status: 500, headers }
    );
  }
}