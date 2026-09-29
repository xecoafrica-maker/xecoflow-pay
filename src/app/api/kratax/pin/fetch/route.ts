// xecoflow-pay/src/app/api/kratax/pin/fetch/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';
const KRATAX_API_KEY = process.env.KRATAX_INTERNAL_API_KEY;
const REQUEST_TIMEOUT = 30000;

const IP_BUCKETS = new Map<string, { count: number; resetAt: number }>();
const MAX_PER_HOUR = 20;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = IP_BUCKETS.get(ip);

  if (!bucket || bucket.resetAt < now) {
    IP_BUCKETS.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= MAX_PER_HOUR;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again in an hour.',
          code: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { taxpayerType, taxpayerId } = body;

    if (!taxpayerType || !taxpayerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'taxpayerType and taxpayerId are required',
          code: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    if (!KRATAX_API_KEY) {
      console.error('[kratax proxy] KRATAX_INTERNAL_API_KEY is not set');
      return NextResponse.json(
        {
          success: false,
          error: 'KRA service not configured',
          code: 'INTERNAL_ERROR',
        },
        { status: 500 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${BACKEND_URL}/v1/kratax/pin/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': KRATAX_API_KEY,
        },
        body: JSON.stringify({
          taxpayerType: String(taxpayerType).trim().toUpperCase(),
          taxpayerId: String(taxpayerId).trim(),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'Request timed out', code: 'KRA_TIMEOUT' },
          { status: 504 }
        );
      }

      console.error('[kratax proxy] fetch error:', error.message);
      return NextResponse.json(
        {
          success: false,
          error: 'An unexpected error occurred',
          code: 'INTERNAL_ERROR',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[kratax proxy] outer error:', error.message);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}