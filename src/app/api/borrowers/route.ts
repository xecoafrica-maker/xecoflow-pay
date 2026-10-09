// src/app/api/borrowers/route.ts
// Handles the bare GET /api/borrowers (no subpath) — lists borrowers.
// The catch-all at [...path]/route.ts handles everything with a subpath.
//
// Next.js requires this to exist separately because [...path] only
// matches URLs with at least one segment after /borrowers.

import { NextRequest, NextResponse } from 'next/server';

const AUTH_ENGINE_URL =
  process.env.AUTH_ENGINE_URL ||
  process.env.LENDING_API_URL ||
  process.env.API_URL ||
  'http://localhost:3009';

const REQUEST_TIMEOUT_MS = 30_000;
const COOKIE_SESSION = 'xeco_session';

async function resolveMerchantId(request: NextRequest): Promise<number | null> {
  const cookieHeader = request.headers.get('cookie') || '';
  if (!cookieHeader.includes(COOKIE_SESSION + '=')) return null;

  try {
    const origin = request.nextUrl.origin;
    const res = await fetch(origin + '/api/auth/session', {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = await res.json();
    const id = body && body.user ? body.user.merchantId : null;
    return typeof id === 'number' ? id : Number(id) || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const t0 = Date.now();

  try {
    const merchantId = await resolveMerchantId(request);
    if (!merchantId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'No active merchant session' } },
        { status: 401 }
      );
    }

    const base = AUTH_ENGINE_URL.replace(/\/+$/, '');
    const target = `${base}/v1/imara/admin/borrowers${request.nextUrl.search}`;
    const cookieHeader = request.headers.get('cookie') || '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-merchant-id': String(merchantId),
      'x-request-id': requestId,
      cookie: cookieHeader,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const upstream = await fetch(target, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const contentType = upstream.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await upstream.json()
      : { raw: await upstream.text() };

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        JSON.stringify({
          event: 'borrowers.proxy_root',
          method: 'GET',
          merchantId,
          target,
          status: upstream.status,
          ms: Date.now() - t0,
        })
      );
    }

    return NextResponse.json(payload, { status: upstream.status });
  } catch (err: any) {
    const isTimeout = err && err.name === 'AbortError';
    console.error(
      JSON.stringify({
        event: 'borrowers.proxy_root_error',
        requestId,
        error: err ? err.message : 'unknown',
        isTimeout,
      })
    );
    return NextResponse.json(
      {
        error: {
          code: isTimeout ? 'GATEWAY_TIMEOUT' : 'INTERNAL_ERROR',
          message: isTimeout
            ? 'Borrower service timed out'
            : (err && err.message) || 'Proxy error',
        },
      },
      { status: isTimeout ? 504 : 500 }
    );
  }
}