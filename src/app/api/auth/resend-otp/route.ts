import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  AUTH_COOKIE_NAMES,
  getBackendUrl,
  getClientIp,
  normalizeAuthCookie,
  secureHeaders,
} from '@/lib/auth-cookies';

const BACKEND_URL = getBackendUrl();
const REQUEST_TIMEOUT_MS = 8000;

const COOKIE_OTP = 'xeco_otp';

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

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const headers = secureHeaders(requestId);

  try {
    const otpCookie = request.cookies.get(COOKIE_OTP);
    if (!otpCookie?.value) {
      return NextResponse.json(
        { success: false, code: 'OTP_NOT_FOUND' },
        { status: 401, headers }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Forwarded-For': getClientIp(request),
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
        { status: 500, headers }
      );
    }

    const sanitized = parsed.data;
    const finalStatus =
      backendResponse.status >= 200 && backendResponse.status < 300
        ? 200
        : backendResponse.status;

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
        event: 'auth.resend_otp.proxy_error',
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