// src/app/api/auth/otp-context/route.ts
//
// Returns the masked email and expiry timestamp for the in-flight OTP
// session.
//
// Why this exists:
//   The xeco_otp cookie is HttpOnly — JavaScript cannot read it. So the
//   verify-otp page cannot know which email the code was sent to, or
//   when it expires. This BFF route reads the cookie server-side,
//   forwards it to the auth-engine, and returns only the two display
//   values the page needs.
//
// Contract:
//   Request:  GET, xeco_otp cookie sent automatically by the browser
//   Response (200): { maskedEmail: string, expiresAt: number }
//   Response (401): { success: false, code: 'OTP_NOT_FOUND' }
//   Response (500): { success: false, code: 'INVALID_REQUEST' }

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.AUTH_ENGINE_URL || 'https://xecoflow-2gen.onrender.com';
const REQUEST_TIMEOUT_MS = 5000;

const COOKIE_OTP = 'xeco_otp';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

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

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/otp-context`, {
      method: 'GET',
      headers: {
        'X-Request-ID': requestId,
        Cookie: `${COOKIE_OTP}=${otpCookie.value}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Any 4xx from the auth-engine means the OTP session is not usable.
    // Collapse to a single 401 for the browser so the page redirects
    // to /login regardless of the underlying reason.
    if (backendResponse.status >= 400 && backendResponse.status < 500) {
      return NextResponse.json(
        { success: false, code: 'OTP_NOT_FOUND' },
        { status: 401, headers: secureHeaders }
      );
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST' },
        { status: 500, headers: secureHeaders }
      );
    }

    const contentType = backendResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Expected JSON from backend, got ${contentType}`);
    }

    const raw = await backendResponse.json();

    // Only allow the two fields we expect. Everything else is dropped.
    const maskedEmail =
      typeof raw?.maskedEmail === 'string' ? raw.maskedEmail : null;
    const expiresAt = typeof raw?.expiresAt === 'number' ? raw.expiresAt : null;

    if (!maskedEmail || !expiresAt) {
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST' },
        { status: 500, headers: secureHeaders }
      );
    }

    return NextResponse.json(
      { maskedEmail, expiresAt },
      { status: 200, headers: secureHeaders }
    );
  } catch {
    return NextResponse.json(
      { success: false, code: 'INVALID_REQUEST' },
      { status: 500, headers: secureHeaders }
    );
  }
}