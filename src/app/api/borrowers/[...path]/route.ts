// src/app/api/borrowers/[...path]/route.ts
// Catch-all proxy for borrower admin endpoints on the auth engine.
//
// Paths on the auth engine:
//   GET  /v1/imara/admin/borrowers                              → list borrowers
//   POST /v1/imara/admin/borrowers/:id/reissue-credentials      → reissue temp password
//   POST /v1/imara/auth/admin/create-borrower                   → create borrower
//   POST /v1/imara/admin/loans                                  → create loan for borrower
//
// The proxy routes requests based on the subpath so the browser sees
// a single /api/borrowers/* namespace.

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

// Maps a /api/borrowers/* subpath to the correct auth-engine URL.
function buildTarget(path: string[], search: string): string {
  const base = AUTH_ENGINE_URL.replace(/\/+$/, '');
  const sub = path.join('/');
  const qs = search || '';

  // Special-case: /api/borrowers/create  →  auth-engine create-borrower
  if (sub === 'create') {
    return `${base}/v1/imara/auth/admin/create-borrower${qs}`;
  }

  // Special-case: /api/borrowers/loans  →  auth-engine merchant-init loan
  if (sub === 'loans') {
    return `${base}/v1/imara/admin/loans${qs}`;
  }

  // Default: everything else goes under /v1/imara/admin/borrowers/*
  return `${base}/v1/imara/admin/borrowers${sub ? '/' + sub : ''}${qs}`;
}

async function proxy(
  request: NextRequest,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string[]
) {
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

    const target = buildTarget(path, request.nextUrl.search);
    const cookieHeader = request.headers.get('cookie') || '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-merchant-id': String(merchantId),
      'x-request-id': requestId,
      cookie: cookieHeader,
    };

    const idem = request.headers.get('x-idempotency-key');
    if (idem) headers['x-idempotency-key'] = idem;

    let body: string | undefined;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        const json = await request.json();
        body = JSON.stringify(json);
      } catch {
        body = undefined;
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const upstream = await fetch(target, {
      method,
      headers,
      body,
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
          event: 'borrowers.proxy',
          method,
          path: path.join('/'),
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
        event: 'borrowers.proxy_error',
        requestId,
        method,
        path: path.join('/'),
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

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxy(request, 'GET', path || []);
}

export async function POST(request: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxy(request, 'POST', path || []);
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxy(request, 'PATCH', path || []);
}

export async function DELETE(request: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  return proxy(request, 'DELETE', path || []);
}