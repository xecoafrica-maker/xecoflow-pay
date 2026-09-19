import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ─── Configuration ──────────────────────────────────────────────────
const BACKEND_URL = process.env.AUTH_ENGINE_URL || 'https://xecoflow-2gen.onrender.com';
const REQUEST_TIMEOUT_MS = 30000;

// Cookie names we own and are willing to rewrite.
// Any cookie the backend sets that is NOT in this set is dropped.
// This prevents us from accidentally breaking third-party cookies
// (e.g. Cloudflare's _cf_bm, or a CSRF cookie that needs to be JS-readable).
const AUTH_COOKIE_NAMES = new Set(['xeco_session', 'xeco_otp']);

// ─── Cookie flags per cookie name ───────────────────────────────────
//
// Why per-name flags differ:
//   - xeco_session uses SameSite=Strict (never should be sent cross-site).
//   - xeco_otp uses SameSite=Lax so it survives top-level navigations
//     from email clients (the "click this link" case).
//
// Why `Secure` is environment-gated:
//   Chrome (89+) rejects Secure cookies served over plain HTTP, and
//   localhost is plain HTTP. That rejection is silent — no console
//   error, no visible failure — the cookie just doesn't get stored.
//   So on localhost we must omit Secure, otherwise the entire OTP flow
//   dies with a mysterious 401 on /api/auth/otp-context.
//
//   In production, NODE_ENV is 'production', Secure applies, and the
//   cookie is only transmitted over HTTPS.
//
//   The auth-engine applies the same logic. If they disagreed, one
//   would overwrite the other's cookie with incompatible attributes.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const COOKIE_FLAGS: Record<string, string> = {
  xeco_session: `HttpOnly${
    IS_PRODUCTION ? '; Secure' : ''
  }; SameSite=Strict; Path=/`,
  xeco_otp: `HttpOnly${
    IS_PRODUCTION ? '; Secure' : ''
  }; SameSite=Lax; Path=/`,
};

// ─── Strict Schema Contracts ────────────────────────────────────────
const loginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

// Success and failure are discriminated unions — so the frontend can
// trust that if `success: false`, a `code` is always present.
//
// NOTE: z.object() strips unknown keys by default. We do NOT chain
// .strip() on the union because ZodDiscriminatedUnion does not expose
// that method — each child object already strips. This is intentional.
const safeLoginResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    requiresOTP: z.boolean().optional(),
  }),
  z.object({
    success: z.literal(false),
    code: z.enum([
      'INVALID_CREDENTIALS',
      'ACCOUNT_LOCKED',
      'MFA_REQUIRED',
      'SESSION_REVOKED',
      'RATE_LIMITED',
      'INVALID_REQUEST',
    ]),
    retryAfter: z.number().int().min(0).max(3600).optional(),
  }),
]);

// ─── Helpers ────────────────────────────────────────────────────────
function normalizeStatus(backendStatus: number): number {
  const KNOWN = [200, 400, 401, 403, 423, 429, 500, 502, 503, 504];
  return KNOWN.includes(backendStatus) ? backendStatus : 500;
}

/**
 * Rebuild a Set-Cookie string with enforced security flags.
 *
 * Why we rebuild rather than forward blindly:
 *   - We don't know (and don't trust) what flags the backend set.
 *   - A non-HttpOnly cookie is vulnerable to XSS, same as localStorage.
 *   - Rebuilding makes the BFF the last line of defense.
 *
 * What we preserve from the backend:
 *   - The cookie name and value (untouched)
 *   - Max-Age (integer seconds — the modern lifetime attribute)
 *
 * What we enforce ourselves:
 *   - HttpOnly, Secure (env-gated), SameSite (per COOKIE_FLAGS)
 *   - Path=/ (scoped to the whole origin)
 *
 * What we deliberately DROP from the backend's Set-Cookie:
 *   - Domain — forces the cookie to be scoped to our host.
 *   - Expires — the legacy date-based lifetime attribute. Its format
 *     is locale-sensitive and its parsing rules vary between browsers.
 *     Max-Age is unambiguous (integer seconds). Chrome uses Max-Age
 *     when both are present, so dropping Expires changes nothing —
 *     except it stops us from corrupting the date string.
 */
function normalizeAuthCookie(cookie: string, name: string): string {
  // Split on the FIRST '=' only. JWT/base64 values may contain '=' as
  // padding, so a naive split('=') truncates the value.
  const separatorIndex = cookie.indexOf('=');
  if (separatorIndex === -1) {
    throw new Error(`Malformed Set-Cookie header: no '=' separator`);
  }
  const rawName = cookie.slice(0, separatorIndex).trim();
  const value = cookie.slice(separatorIndex + 1).split(';')[0].trim();

  // Parse remaining attributes WITHOUT lowercasing their values.
  //
  // Bug we're fixing: a previous version did `.map((p) => p.trim().toLowerCase())`
  // on every attribute. That corrupted date attributes like
  //   Expires=Fri, 18 Sep 2026 14:31:51 GMT
  // into
  //   expires=fri, 18 sep 2026 14:31:51 gmt
  // which strict cookie parsers (Chrome) reject. When the parser fails
  // on `Expires`, some Chrome versions drop the entire Set-Cookie
  // header — the cookie is never stored, and every subsequent request
  // to /api/auth/otp-context returns 401.
  //
  // Fix: preserve only Max-Age. Drop Expires entirely.
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

  return [
    `${rawName}=${value}`,
    flags,
    maxAge,
  ].filter(Boolean).join('; ');
}

/**
 * Extract a trustworthy client IP.
 *
 * x-forwarded-for is a client-supplied header. An attacker can prepend
 * their own value. We take the LAST entry, which is the one set by the
 * proxy closest to us (i.e. the one we trust).
 *
 * If your platform provides a dedicated header (CF-Connecting-IP,
 * x-real-ip), prefer that. Check Render's docs.
 */
function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (!xff) return 'unknown';
  const parts = xff.split(',').map((p) => p.trim());
  return parts[parts.length - 1] || 'unknown';
}

// ─── Route Handler ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Structured log for correlation. No PII (email/password) here.
  // NOTE: console.log is temporary. Replace with a real log sink
  // (SIEM, Datadog, CloudWatch, or your auth-engine's audit endpoint)
  // Bank-grade audit logs must be immutable and retained.
  console.log(JSON.stringify({
    event: 'auth.login.attempt',
    requestId,
    ts: new Date().toISOString(),
    ip,
    userAgent,
  }));

  const secureHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'X-Request-ID': requestId,
  };

  try {
    const rawBody = await request.json();
    const validatedRequest = loginRequestSchema.parse(rawBody);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // Forward Idempotency-Key from the client if present, otherwise use requestId.
    // When the frontend is updated to generate its own key per form submission,
    // retries will reuse the same key and the backend can deduplicate.
    const idempotencyKey =
      request.headers.get('idempotency-key') || requestId;

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(validatedRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Assert JSON content type before parsing. Prevents crashes when a
    // proxy returns an HTML error page with a 200 or 5xx status.
    const contentType = backendResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Expected JSON from backend, got ${contentType}`);
    }

    const rawBackendData = await backendResponse.json();

    // ═══ TEMPORARY DEBUG — REMOVE AFTER DIAGNOSING ═══
    console.error('=== [Auth Proxy] BACKEND RESPONSE DEBUG ===');
    console.error('Backend status:', backendResponse.status);
    console.error('Backend content-type:', contentType);
    console.error('Backend body:', JSON.stringify(rawBackendData, null, 2));
    console.error('=== END BACKEND DEBUG ===');
    // ═══ END TEMPORARY DEBUG ═══

    // Validate and sanitize. Throws ZodError on shape mismatch.
    const sanitizedData = safeLoginResponseSchema.parse(rawBackendData);
    const finalStatus = normalizeStatus(backendResponse.status);

    // ═══ TEMPORARY DEBUG — REMOVE AFTER DIAGNOSING ═══
    console.error('=== [Auth Proxy] AFTER ZOD PARSE ===');
    console.error('Sanitized data:', JSON.stringify(sanitizedData, null, 2));
    console.error('Final status:', finalStatus);
    console.error('=== END AFTER ZOD ===');
    // ═══ END TEMPORARY DEBUG ═══

    const nextResponse = NextResponse.json(sanitizedData, {
      status: finalStatus,
      headers: secureHeaders,
    });

    // Rewrite cookies with enforced flags. Drop any cookie we don't own.
    const setCookieHeaders = backendResponse.headers.getSetCookie?.() || [];

    // ═══ TEMPORARY DEBUG — REMOVE AFTER DIAGNOSING ═══
    console.error('=== [Auth Proxy] COOKIE FORWARDING DEBUG ===');
    console.error('Number of Set-Cookie headers:', setCookieHeaders.length);
    console.error('Set-Cookie headers:', JSON.stringify(setCookieHeaders, null, 2));
    console.error('AUTH_COOKIE_NAMES:', Array.from(AUTH_COOKIE_NAMES));
    console.error('COOKIE_FLAGS:', JSON.stringify(COOKIE_FLAGS, null, 2));
    console.error('=== END COOKIE DEBUG ===');
    // ═══ END TEMPORARY DEBUG ═══

    for (const cookie of setCookieHeaders) {
      // Use indexOf, not split('=')[0].
      // Same JWT/base64-padding reasoning as in normalizeAuthCookie.
      const eqIndex = cookie.indexOf('=');
      if (eqIndex === -1) continue;
      const name = cookie.slice(0, eqIndex).trim();
      if (!name || !AUTH_COOKIE_NAMES.has(name)) {
        // ═══ TEMPORARY DEBUG — REMOVE AFTER DIAGNOSING ═══
        console.error(`[Auth Proxy] Dropping unrecognized cookie: ${name}`);
        // ═══ END TEMPORARY DEBUG ═══
        continue;
      }

      // ═══ TEMPORARY DEBUG — REMOVE AFTER DIAGNOSING ═══
      console.error(`[Auth Proxy] Processing cookie: ${name}`);
      console.error(`[Auth Proxy] Raw cookie: ${cookie}`);
      // ═══ END TEMPORARY DEBUG ═══

      const safeCookie = normalizeAuthCookie(cookie, name);

      // ═══ TEMPORARY DEBUG — REMOVE AFTER DIAGNOSING ═══
      console.error(`[Auth Proxy] Normalized cookie: ${safeCookie}`);
      // ═══ END TEMPORARY DEBUG ═══

      nextResponse.headers.append('Set-Cookie', safeCookie);
    }

    // ═══ TEMPORARY DEBUG — REMOVE AFTER DIAGNOSING ═══
    console.error('=== [Auth Proxy] FINAL RESPONSE HEADERS ===');
    console.error('All Set-Cookie headers being sent to browser:');
    console.error(JSON.stringify(nextResponse.headers.getSetCookie?.(), null, 2));
    console.error('=== END FINAL HEADERS ===');
    // ═══ END TEMPORARY DEBUG ═══

    return nextResponse;

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout =
      errorMessage.includes('AbortError') || errorMessage.includes('timeout');

    // ═══ TEMPORARY DEBUG — REMOVE AFTER DIAGNOSING ═══
    console.error('═══════════════════════════════════════════════════');
    console.error('=== [Auth Proxy] LOGIN ERROR DEBUG ===');
    console.error('Request ID:', requestId);
    console.error('Error message:', errorMessage);
    console.error('Error stack:', (error as Error)?.stack);
    console.error('Full error object:', error);
    console.error('Error type:', (error as Error)?.constructor?.name);
    console.error('Is ZodError:', error instanceof z.ZodError);
    if (error instanceof z.ZodError) {
      console.error('Zod issues:');
      console.error(JSON.stringify(error.issues, null, 2));
    }
    console.error('=== END LOGIN ERROR DEBUG ===');
    console.error('═══════════════════════════════════════════════════');
    // ═══ END TEMPORARY DEBUG ═══

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_REQUEST',
          requestId,
        },
        { status: 400, headers: secureHeaders }
      );
    }

    if (isTimeout) {
      return NextResponse.json(
        {
          success: false,
          code: 'INVALID_REQUEST',
          message: 'Request timed out. Please try again.',
          requestId,
        },
        { status: 504, headers: secureHeaders }
      );
    }

    return NextResponse.json(
      {
        success: false,
        code: 'INVALID_REQUEST',
        message: 'An unexpected error occurred. Please try again.',
        requestId,
      },
      { status: 500, headers: secureHeaders }
    );
  }
}