// src/app/api/auth/session/route.ts
//
// Returns the current user's public profile, sourced from the
// xeco_session HttpOnly cookie.
//
// The client never sees the raw cookie value. The BFF reads it
// server-side, forwards it to the auth-engine, and returns only the
// fields the UI needs to render.
//
// Contract:
//   Request:  GET, xeco_session cookie sent automatically
//   Response (200): { user: {...}, sessionInfo: { remaining: number } }
//   Response (401): { success: false, code: 'UNAUTHORIZED' }

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.AUTH_ENGINE_URL || 'https://xecoflow-2gen.onrender.com';
const REQUEST_TIMEOUT_MS = 5000;

const COOKIE_SESSION = 'xeco_session';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const secureHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    'X-Request-ID': requestId,
  };

  try {
    const sessionCookie = request.cookies.get(COOKIE_SESSION);
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED' },
        { status: 401, headers: secureHeaders }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/me`, {
      method: 'GET',
      headers: {
        'X-Request-ID': requestId,
        Cookie: `${COOKIE_SESSION}=${sessionCookie.value}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (backendResponse.status === 401 || backendResponse.status === 403) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED' },
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

    // The auth-engine's /v1/auth/me returns { success, data, sessionInfo }.
    // We pass through only the display-safe fields.
    const user = raw?.data;
    const remaining = raw?.sessionInfo?.remaining ?? 1800;

    if (!user) {
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST' },
        { status: 500, headers: secureHeaders }
      );
    }

    return NextResponse.json(
      {
        user: {
          merchantId: user.merchant_id ?? user.merchantId,
          businessName: user.business_name ?? user.businessName,
          email: user.email,
          firstName: user.first_name ?? user.firstName,
          lastName: user.last_name ?? user.lastName,
          phone: user.phone,
          status: user.status,
          role: user.role,
          emailVerified: user.email_verified ?? user.emailVerified,
        },
        sessionInfo: { remaining },
      },
      { status: 200, headers: secureHeaders }
    );
  } catch {
    return NextResponse.json(
      { success: false, code: 'INVALID_REQUEST' },
      { status: 500, headers: secureHeaders }
    );
  }
}