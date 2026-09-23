// xecoflow-pay/src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BACKEND_URL = process.env.AUTH_ENGINE_URL;

if (!BACKEND_URL) {
  throw new Error('AUTH_ENGINE_URL environment variable is not set');
}

const REQUEST_TIMEOUT_MS = 15000;

// Keep in sync with backend allow-list. Reject unknown codes before
// they reach the backend.
const ALLOWED_COUNTRY_CODES = ['KE', 'UG', 'TZ', 'RW', 'NG', 'GH', 'ZA'] as const;

const registerRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]+$/,
      'Password must contain both letters and numbers'
    ),
  businessName: z.string().trim().min(1, 'Business name is required').max(200),
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  country: z.enum(ALLOWED_COUNTRY_CODES),
  termsVersion: z.string().min(1, 'Terms version is required'),
  termsAcceptedAt: z
    .string()
    .datetime({ message: 'termsAcceptedAt must be an ISO 8601 timestamp' }),
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
        businessName: z.string(),
        email: z.string(),
        status: z.string(),
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

function normalizeStatus(backendStatus: number): number {
  const KNOWN = [200, 201, 400, 401, 409, 422, 429, 500, 502, 503, 504];
  return KNOWN.includes(backendStatus) ? backendStatus : 500;
}

// Reads the client IP from X-Forwarded-For. Render (the ingress) puts
// the original client IP as the first entry. Trust only that.
function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (!xff) return 'unknown';
  const parts = xff.split(',').map((p) => p.trim());
  return parts[0] || 'unknown';
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

    const idempotencyKey = request.headers.get('idempotency-key') || requestId;

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
      throw new Error('Expected JSON from backend');
    }

    const rawBackendData = await backendResponse.json();

    // Map common backend errors to structured codes if the backend
    // doesn't already provide one.
    const normalizedBackendData = (() => {
      if (
        rawBackendData &&
        typeof rawBackendData === 'object' &&
        'success' in rawBackendData &&
        rawBackendData.success === false &&
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

    const sanitizedData = safeRegisterResponseSchema.parse(normalizedBackendData);
    const finalStatus = normalizeStatus(backendResponse.status);

    return NextResponse.json(sanitizedData, {
      status: finalStatus,
      headers: secureHeaders,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    if (error instanceof z.ZodError) {
      // Do NOT leak field names or expected types to the client.
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST', requestId },
        { status: 400, headers: secureHeaders }
      );
    }

    const isTimeout =
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError');

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

    console.error(
      JSON.stringify({
        event: 'auth.register.proxy_error',
        requestId,
        error: errorMessage,
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