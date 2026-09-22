import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAMES,
  getBackendUrl,
  getClientIp,
  normalizeAuthCookie,
  secureHeaders,
} from '@/lib/auth-cookies';

const BACKEND_URL = getBackendUrl();
const REQUEST_TIMEOUT_MS = 8000;

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const headers = secureHeaders(requestId);

  try {
    // Forward all incoming cookies so the backend can identify which
    // session to revoke.
    const incomingCookies = request.headers.get('cookie') || '';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'X-Forwarded-For': getClientIp(request),
        Cookie: incomingCookies,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = backendResponse.headers.get('content-type') || '';
    const rawBackendData = contentType.includes('application/json')
      ? await backendResponse.json()
      : { success: true };

    const nextResponse = NextResponse.json(rawBackendData, {
      status: backendResponse.status,
      headers,
    });

    // Forward Set-Cookie headers from the backend. On logout these are
    // clearing instructions (`xeco_session=; Max-Age=0`).
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
        event: 'auth.logout.proxy_error',
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