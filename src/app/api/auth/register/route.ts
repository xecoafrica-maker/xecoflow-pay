// xecoflow-pay/src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Force Node.js runtime — we use crypto.randomUUID and long fetches.
// Explicitly bypass the static cache so a POST never gets cached.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.AUTH_ENGINE_URL;

if (!BACKEND_URL) {
  throw new Error('AUTH_ENGINE_URL environment variable is not set');
}

const REQUEST_TIMEOUT_MS = 15000;
const MAX_IDEMPOTENCY_KEY_LENGTH = 100;

// Keep in sync with backend allow-list. Reject unknown codes before
// they reach the backend.
const ALLOWED_COUNTRY_CODES = ['KE', 'UG', 'TZ', 'RW', 'NG', 'GH', 'ZA'] as const;

// Password rule — MUST match:
//   - frontend: src/lib/auth-api.ts  → PASSWORD_RULE
//   - backend:  auth-engine/routes/auth.js → passwordRegex
// If either changes, change all three in the same PR.
// (Duplicated as a literal here because the BFF cannot import from
// the frontend source tree.)
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

const registerRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().regex(PASSWORD_REGEX),
  businessName: z.string().trim().min(1).max(200),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  country: z.enum(ALLOWED_COUNTRY_CODES),
  termsVersion: z.string().min(1).max(50),
  // termsAcceptedAt intentionally NOT accepted from the client —
  // the backend records the server timestamp as the authoritative
  // moment of acceptance.
});

// Whitelist of fields the BFF will return to the browser. Anything not
// listed here is dropped, even if the backend sends it.
//
// Deliberately excludes apiKey/apiSecret — a registration response
// must never contain credentials.
const safeRegisterResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    message: z.string().optional(),
    data: z
      .object({
        merchantId: z.number(),
        businessName: z.string().optional(),
        email: z.string().optional(),
        status: z.string().optional(),
      })
      .optional(),
  }),
  z.object({
    success: z.literal(false),
    code: z.enum([
      'EMAIL_ALREADY_EXISTS',
      'INVALID_EMAIL',
      'WEAK_PASSWORD',
      'INVALID_REQUEST',
      'RATE_LIMITED',
      'REGISTER_FAILED',
    ]),
    retryAfter: z.number().int().min(0).max(3600).optional(),
  }),
]);

// Status codes we pass through from the backend unchanged. Anything
// else is collapsed to 500 so we never leak odd backend statuses.
function normalizeStatus(backendStatus: number): number {
  const KNOWN = [200, 201, 400, 401, 409, 422, 429, 500, 502, 503, 504];
  return KNOWN.includes(backendStatus) ? backendStatus : 500;
}

// Reads the client IP from X-Forwarded-For. Render (our ingress) puts
// the original client IP as the first entry — the rest of the chain is
// proxies we don't trust.
function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (!xff) return 'unknown';
  const first = xff.split(',')[0]?.trim();
  return first || 'unknown';
}

function getIdempotencyKey(request: NextRequest, fallback: string): string {
  const raw = request.headers.get('idempotency-key');
  if (!raw) return fallback;
  return raw.slice(0, MAX_IDEMPOTENCY_KEY_LENGTH);
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  const secureHeaders = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    'X-Request-ID': requestId,
  };

  try {
    const rawBody = await request.json();
    const validatedRequest = registerRequestSchema.parse(rawBody);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const idempotencyKey = getIdempotencyKey(request, requestId);

    const backendResponse = await fetch(`${BACKEND_URL}/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        'Idempotency-Key': idempotencyKey,
        'X-Forwarded-For': getClientIp(request),
      },
      body: JSON.stringify(validatedRequest),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = backendResponse.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // Backend returned HTML (probably a proxy 502). Fail closed.
      return NextResponse.json(
        {
          success: false,
          code: 'REGISTER_FAILED',
          message: 'The service is temporarily unavailable. Please try again.',
          requestId,
        },
        { status: 502, headers: secureHeaders }
      );
    }

    const rawBackendData = (await backendResponse.json()) as unknown;

    // Compatibility shim: if the backend returned an error without a
    // structured code, map based on HTTP status. Delete this block once
    // the backend returns its own codes.
    const normalizedBackendData = (() => {
      if (
        rawBackendData &&
        typeof rawBackendData === 'object' &&
        'success' in rawBackendData &&
        (rawBackendData as { success: unknown }).success === false &&
        !('code' in rawBackendData)
      ) {
        const status = backendResponse.status;
        const code =
          status === 409
            ? 'EMAIL_ALREADY_EXISTS'
            : status === 429
            ? 'RATE_LIMITED'
            : status === 400
            ? 'INVALID_REQUEST'
            : 'REGISTER_FAILED';
        return { ...rawBackendData, code };
      }
      return rawBackendData;
    })();

    let sanitizedData: z.infer<typeof safeRegisterResponseSchema>;
    try {
      sanitizedData = safeRegisterResponseSchema.parse(normalizedBackendData);
    } catch {
      // Backend returned a shape we don't understand. Fail closed with
      // a generic message — never echo the backend body.
      return NextResponse.json(
        {
          success: false,
          code: 'REGISTER_FAILED',
          message: 'Registration could not be completed. Please try again.',
          requestId,
        },
        { status: 502, headers: secureHeaders }
      );
    }

    const finalStatus = normalizeStatus(backendResponse.status);

    return NextResponse.json(sanitizedData, {
      status: finalStatus,
      headers: secureHeaders,
    });
  } catch (error: unknown) {
    // ── Validation failure ────────────────────────────────────────
    if (error instanceof z.ZodError) {
      // Never leak field names or expected types — the client already
      // validated before sending, so a ZodError here means the request
      // was tampered with or the client is out of date.
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST', requestId },
        { status: 400, headers: secureHeaders }
      );
    }

    // ── Timeout ──────────────────────────────────────────────────
    const isTimeout =
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError');

    if (isTimeout) {
      return NextResponse.json(
        {
          success: false,
          code: 'REGISTER_FAILED',
          message: 'Request timed out. Please try again.',
          requestId,
        },
        { status: 504, headers: secureHeaders }
      );
    }

    // ── Unexpected ────────────────────────────────────────────────
    // Structured server log. Never log the request body (contains a
    // password). Never log the full error message (may contain
    // internal details).
    console.error(
      JSON.stringify({
        event: 'auth.register.proxy_error',
        requestId,
        errorName: error instanceof Error ? error.name : 'unknown',
      })
    );

    return NextResponse.json(
      {
        success: false,
        code: 'REGISTER_FAILED',
        message: 'An unexpected error occurred. Please try again.',
        requestId,
      },
      { status: 500, headers: secureHeaders }
    );
  }
}