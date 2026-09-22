// src/lib/auth-cookies.ts
import type { NextRequest } from 'next/server';

/** Cookie names issued by the auth engine that the BFF may forward. */
export const AUTH_COOKIE_NAMES = new Set([
  'xeco_session',
  'xeco_otp',
  'xeco_refresh',
]);

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const COOKIE_FLAGS: Record<string, string> = {
  xeco_session: `HttpOnly${IS_PRODUCTION ? '; Secure' : ''}; SameSite=Strict; Path=/`,
  xeco_otp: `HttpOnly${IS_PRODUCTION ? '; Secure' : ''}; SameSite=Lax; Path=/`,
  xeco_refresh: `HttpOnly${IS_PRODUCTION ? '; Secure' : ''}; SameSite=Strict; Path=/`,
};

/**
 * Normalizes a Set-Cookie header from the backend:
 * - Enforces HttpOnly / Secure / SameSite per cookie name.
 * - Keeps only Max-Age; drops Expires (locale-sensitive, redundant).
 */
export function normalizeAuthCookie(cookie: string, name: string): string {
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

  return [`${rawName}=${value}`, flags, maxAge].filter(Boolean).join('; ');
}

/**
 * Extracts the trusted client IP from X-Forwarded-For.
 * The last entry is set by the nearest trusted proxy (Render's edge);
 * earlier entries are client-supplied and can be spoofed.
 */
export function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (!xff) return 'unknown';
  const parts = xff.split(',').map((p) => p.trim());
  return parts[parts.length - 1] || 'unknown';
}

/** Known HTTP statuses from the auth engine; anything else maps to 500. */
const KNOWN_STATUSES = [200, 400, 401, 403, 410, 423, 429, 500, 502, 503, 504];

export function normalizeStatus(backendStatus: number): number {
  return KNOWN_STATUSES.includes(backendStatus) ? backendStatus : 500;
}

/** Standard headers applied to every BFF response. */
export function secureHeaders(requestId: string): Record<string, string> {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    'X-Request-ID': requestId,
  };
}

/** Reads BACKEND_URL from env; throws if missing. */
export function getBackendUrl(): string {
  const url = process.env.AUTH_ENGINE_URL;
  if (!url) {
    throw new Error('AUTH_ENGINE_URL environment variable is not set');
  }
  return url;
}