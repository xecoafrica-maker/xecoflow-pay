// src/app/api/kyc/[...path]/route.ts
// Catch-all proxy for merchant-side KYC endpoints on the auth engine.
//
// Paths on the auth engine:
//   GET  /v1/imara/kyc/admin/pending                → list submissions
//   GET  /v1/imara/kyc/admin/:borrowerId            → full detail
//   POST /v1/imara/kyc/admin/:borrowerId/verify     → mark VERIFIED
//   POST /v1/imara/kyc/admin/:borrowerId/reject     → mark REJECTED
//
// The browser sees a single /api/kyc/* namespace. The proxy maps
// every subpath 1:1 onto /v1/imara/kyc/* on the auth engine and
// forwards the merchant session cookie.

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
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'No active merchant session',
          },
        },
        { status: 401 }
      );
    }

    const base = AUTH_ENGINE_URL.replace(/\/+$/, '');
    const sub = path.join('/');
    const target = `${base}/v1/imara/kyc/${sub}${request.nextUrl.search}`;
    const cookieHeader = request.headers.get('cookie') || '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-merchant-id': String(merchantId),
      'x-request-id': requestId,
      cookie: cookieHeader,
    };

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
          event: 'kyc.proxy',
          method,
          path: sub,
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
        event: 'kyc.proxy_error',
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
            ? 'KYC service timed out'
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