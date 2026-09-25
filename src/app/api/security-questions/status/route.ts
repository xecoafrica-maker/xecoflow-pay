// xecoflow-pay/src/app/api/security-questions/status/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RAW_BACKEND_URL = process.env.AUTH_ENGINE_URL;

if (!RAW_BACKEND_URL) {
  throw new Error('AUTH_ENGINE_URL environment variable is not set');
}

// Strip trailing slashes so concatenation never produces "//".
const BACKEND_URL = RAW_BACKEND_URL.replace(/\/+$/, '');

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

  const targetUrl = `${BACKEND_URL}/v1/auth/security-questions/status`;
  const incomingCookie = request.headers.get('cookie') || '';

  // ALWAYS log at start so we know the route ran.
  console.log(
    JSON.stringify({
      event: 'security_questions.status.enter',
      requestId,
      targetUrl,
      hasCookie: incomingCookie.length > 0,
      cookieLength: incomingCookie.length,
    })
  );

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const backendRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        Cookie: incomingCookie,
        'X-Request-ID': requestId,
        'X-Forwarded-For': getClientIp(request),
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const raw = (await backendRes.json().catch(() => ({}))) as unknown;

    console.log(
      JSON.stringify({
        event: 'security_questions.status.upstream_response',
        requestId,
        targetUrl,
        upstreamStatus: backendRes.status,
        upstreamBody: raw,
      })
    );

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, hasRecovery: false },
        { status: backendRes.status, headers }
      );
    }

    const safe = responseSchema.parse(raw);

    return NextResponse.json(safe, { status: 200, headers });
  } catch (error: unknown) {
    const isTimeout =
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError');

    console.error(
      JSON.stringify({
        event: 'security_questions.status.proxy_error',
        requestId,
        targetUrl,
        errorName: error instanceof Error ? error.name : 'unknown',
        errorMessage: error instanceof Error ? error.message : 'unknown',
        hasCookie: incomingCookie.length > 0,
      })
    );

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