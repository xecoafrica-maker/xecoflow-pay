import { NextRequest, NextResponse } from 'next/server';
import {
  getBackendUrl,
  getClientIp,
  secureHeaders,
} from '@/lib/auth-cookies';
import { AUTH_CONFIG } from '@/config/auth';

const BACKEND_URL = getBackendUrl();
const REQUEST_TIMEOUT_MS = 5000;

const COOKIE_SESSION = 'xeco_session';

const DEFAULT_REMAINING_SECONDS = AUTH_CONFIG.SESSION_DURATION_SECONDS;

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const headers = secureHeaders(requestId);

  try {
    const sessionCookie = request.cookies.get(COOKIE_SESSION);
    if (!sessionCookie?.value) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED' },
        { status: 401, headers }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/me`, {
      method: 'GET',
      headers: {
        'X-Request-ID': requestId,
        'X-Forwarded-For': getClientIp(request),
        Cookie: `${COOKIE_SESSION}=${sessionCookie.value}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 401 and 403 are equivalent from the client's perspective:
    // the session is not usable. Normalize both to 401 UNAUTHORIZED.
    if (backendResponse.status === 401 || backendResponse.status === 403) {
      return NextResponse.json(
        { success: false, code: 'UNAUTHORIZED' },
        { status: 401, headers }
      );
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST' },
        { status: 500, headers }
      );
    }

    const contentType = backendResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Expected JSON from backend');
    }

    const raw = await backendResponse.json();

    const user = raw?.data;
    const remaining =
      typeof raw?.sessionInfo?.remaining === 'number'
        ? raw.sessionInfo.remaining
        : DEFAULT_REMAINING_SECONDS;

    if (!user) {
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST' },
        { status: 500, headers }
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
      { status: 200, headers }
    );
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
        event: 'auth.session.proxy_error',
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