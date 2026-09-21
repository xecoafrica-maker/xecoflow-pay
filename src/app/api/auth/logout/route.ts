import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.AUTH_ENGINE_URL || 'https://xecoflow-2gen.onrender.com';
const REQUEST_TIMEOUT_MS = 8000;

// Cookie names the backend is allowed to set or clear. Must match the
// cookies issued by the auth engine (login, verify-otp, refresh).
const AUTH_COOKIE_NAMES = new Set([
  'xeco_session',
  'xeco_otp',
  'xeco_refresh',
]);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const COOKIE_FLAGS: Record<string, string> = {
  xeco_session: `HttpOnly${
    IS_PRODUCTION ? '; Secure' : ''
  }; SameSite=Strict; Path=/`,
  xeco_otp: `HttpOnly${
    IS_PRODUCTION ? '; Secure' : ''
  }; SameSite=Lax; Path=/`,
  xeco_refresh: `HttpOnly${
    IS_PRODUCTION ? '; Secure' : ''
  }; SameSite=Strict; Path=/`,
};

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (!xff) return 'unknown';
  const parts = xff.split(',').map((p) => p.trim());
  return parts[parts.length - 1] || 'unknown';
}

/**
 * Normalize a Set-Cookie header coming from the backend so that:
 *  - HttpOnly / Secure / SameSite / Path are enforced per our policy
 *  - Only Max-Age is preserved (Expires is dropped)
 *  - Clearing cookies (Max-Age=0 or expired value) still clear properly
 */
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

  return [`${rawName}=${value}`, flags, maxAge]
    .filter(Boolean)
    .join('; ');
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  console.log(
    JSON.stringify({
      event: 'auth.logout.attempt',
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
    // Forward all cookies from the browser to the backend so it can
    // identify which session to revoke.
    const incomingCookies = request.headers.get('cookie') || '';

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        Cookie: incomingCookies,
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = backendResponse.headers.get('content-type') || '';
    const rawBackendData = contentType.includes('application/json')
      ? await backendResponse.json()
      : { success: true };

    const nextResponse = NextResponse.json(rawBackendData, {
      status: backendResponse.status,
      headers: secureHeaders,
    });

    // Forward Set-Cookie headers from the backend (which will include
    // clearing instructions like `xeco_session=; Max-Age=0`).
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

    console.error(
      JSON.stringify({
        event: 'auth.logout.proxy_error',
        requestId,
        error: message,
      })
    );

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