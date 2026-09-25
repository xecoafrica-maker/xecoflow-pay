// src/app/api/security-questions/list/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RAW_BACKEND_URL = process.env.AUTH_ENGINE_URL;
if (!RAW_BACKEND_URL) {
  throw new Error('AUTH_ENGINE_URL environment variable is not set');
}
const BACKEND_URL = RAW_BACKEND_URL.replace(/\/+$/, '');
const REQUEST_TIMEOUT_MS = 15000;

const responseSchema = z.object({
  success: z.boolean(),
  data: z
    .array(
      z.object({
        id: z.string().optional(),
        position: z.number().optional(),
        question: z.string(),
        created_at: z.string().optional(),
        updated_at: z.string().optional(),
      })
    )
    .optional(),
  code: z.string().optional(),
  message: z.string().optional(),
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
      `${BACKEND_URL}/v1/auth/security-questions/list`,
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

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, data: [] },
        { status: backendRes.status, headers }
      );
    }

    const safe = responseSchema.parse(raw);
    return NextResponse.json(safe, { status: 200, headers });
  } catch {
    return NextResponse.json(
      { success: false, data: [] },
      { status: 500, headers }
    );
  }
}