// xecoflow-pay/src/app/api/security-questions/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.AUTH_ENGINE_URL;
if (!BACKEND_URL) {
  throw new Error('AUTH_ENGINE_URL environment variable is not set');
}

const REQUEST_TIMEOUT_MS = 15000;

const responseSchema = z.object({
  success: z.boolean(),
  hasRecovery: z.boolean().optional(),
});

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (!xff) return 'unknown';
  return xff.split(',')[0]?.trim() || 'unknown';
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    'X-Request-ID': requestId,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const backendRes = await fetch(
      `${BACKEND_URL}/v1/auth/security-questions/status`,
      {
        method: 'GET',
        headers: {
          Cookie: request.headers.get('cookie') || '',
          'X-Request-ID': requestId,
          'X-Forwarded-For': getClientIp(request),
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    const raw = (await backendRes.json().catch(() => ({}))) as unknown;
    const safe = responseSchema.parse(raw);

    return NextResponse.json(safe, {
      status: backendRes.status,
      headers,
    });
  } catch (error: unknown) {
    const isTimeout =
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError');

    if (isTimeout) {
      return NextResponse.json(
        { success: false, hasRecovery: false },
        { status: 504, headers }
      );
    }

    return NextResponse.json(
      { success: false, hasRecovery: false },
      { status: 500, headers }
    );
  }
}