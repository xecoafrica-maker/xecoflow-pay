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
      throw new Error('Expected JSON from backend');
    }

    const raw = await backendResponse.json();

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