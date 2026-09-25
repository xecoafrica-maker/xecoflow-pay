// xecoflow-pay/src/app/api/security-questions/setup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.AUTH_ENGINE_URL;
if (!BACKEND_URL) {
  throw new Error('AUTH_ENGINE_URL environment variable is not set');
}

const REQUEST_TIMEOUT_MS = 15000;

const requestSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(2).max(100),
      })
    )
    .length(3),
});

const responseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  code: z.string().optional(),
});

function getClientIp(request: NextRequest): string {
  const xff = request.headers.get('x-forwarded-for');
  if (!xff) return 'unknown';
  return xff.split(',')[0]?.trim() || 'unknown';
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    'X-Request-ID': requestId,
  };

  try {
    const body = requestSchema.parse(await request.json());

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const backendRes = await fetch(
      `${BACKEND_URL}/v1/auth/security-questions/setup`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || '',
          'X-Request-ID': requestId,
          'X-Forwarded-For': getClientIp(request),
        },
        body: JSON.stringify(body),
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, code: 'INVALID_REQUEST' },
        { status: 400, headers }
      );
    }

    const isTimeout =
      error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError');

    return NextResponse.json(
      {
        success: false,
        code: isTimeout ? 'SETUP_FAILED' : 'SETUP_FAILED',
        message: isTimeout
          ? 'Request timed out. Please try again.'
          : 'Could not save security questions.',
      },
      { status: isTimeout ? 504 : 500, headers }
    );
  }
}