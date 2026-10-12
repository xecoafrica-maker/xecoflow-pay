// src/app/api/lending/[...path]/route.ts
// Catch-all proxy to credit-service-engine.
// Next.js 16+ — params is a Promise and must be awaited.
//
// The credit engine returns loans in a flat shape (dates at the top
// level). The dashboard's components expect a nested shape with
// `outstanding`, `terms`, and `timeline` sub-objects. We normalize
// here, once, at the BFF boundary, so no component has to care.
//
// Normalization is scoped to /loans/* paths only. Products, webhooks,
// portfolio, and every other resource pass through untouched.

import { NextRequest, NextResponse } from 'next/server';

const LENDING_API_URL =
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

function buildTarget(path: string[], search: string): string {
  const base = LENDING_API_URL.replace(/\/+$/, '');
  const sub = path.join('/');
  return base + '/api/v1/admin/lending/' + sub + (search || '');
}

// ─── Loan shape normalizer ──────────────────────────────────────
// Translates the credit engine's flat loan row into the nested shape
// the dashboard components use. Leaves already-nested objects alone.
// ONLY applied on /loans/* requests.
function normalizeLoan(raw: any): any {
  if (!raw || typeof raw !== 'object') return raw;

  // Already nested? Leave it alone.
  if (raw.timeline && raw.terms && raw.outstanding) return raw;

  return {
    id: raw.id,
    loan_reference: raw.loan_reference,
    status: raw.status,
    currency: raw.currency,

    principal_amount: raw.principal_amount,
    interest_amount: raw.interest_amount,
    fees_amount: raw.fees_amount,
    penalty_amount: raw.penalty_amount,
    total_due: raw.total_due,

    outstanding: {
      principal: raw.outstanding_principal ?? '0',
      interest: raw.outstanding_interest ?? '0',
      fees: raw.outstanding_fees ?? '0',
      penalty: raw.outstanding_penalty ?? '0',
      total: raw.outstanding_total ?? '0',
    },

    terms: {
      term_days: raw.term_days ?? 0,
      interest_rate: raw.interest_rate ?? '0',
      interest_period: raw.interest_period ?? '',
      repayment_frequency: raw.repayment_frequency ?? '',
      penalty_rate_per_day: raw.penalty_rate_per_day ?? '0',
      grace_period_days: raw.grace_period_days ?? 0,
    },

    timeline: {
      requested_at: raw.requested_at ?? null,
      approved_at: raw.approved_at ?? null,
      disbursed_at: raw.disbursed_at ?? null,
      first_due_date: raw.first_due_date ?? null,
      maturity_date: raw.maturity_date ?? null,
      last_payment_at: raw.last_payment_at ?? null,
      closed_at: raw.closed_at ?? null,
    },

    external_customer_id: raw.external_customer_id ?? null,

    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

// Applies normalizeLoan only when the request targets a loan endpoint.
// Products, webhooks, portfolio, and everything else pass through as-is.
function normalizePayload(payload: any, path: string[]): any {
  if (!payload || typeof payload !== 'object') return payload;

  // Path gate: only touch loan endpoints. `loans` is the first segment
  // after the BFF prefix — e.g. GET /api/lending/loans,
  // /api/lending/loans/:id, /api/lending/loans/:id/approve, etc.
  const isLoansPath = path[0] === 'loans';
  if (!isLoansPath) return payload;

  // List response: { data: [...], pagination }
  if (Array.isArray(payload.data)) {
    return { ...payload, data: payload.data.map(normalizeLoan) };
  }

  // Single loan wrapped: { data: { loan: {...}, schedule: [...] } }
  if (payload.data && typeof payload.data === 'object' && payload.data.loan) {
    return {
      ...payload,
      data: {
        ...payload.data,
        loan: normalizeLoan(payload.data.loan),
      },
    };
  }

  // Single loan flat: { data: { id, loan_reference, ... } }
  if (
    payload.data &&
    typeof payload.data === 'object' &&
    payload.data.id &&
    payload.data.loan_reference
  ) {
    return { ...payload, data: normalizeLoan(payload.data) };
  }

  // Loan wrapped in nested data: { data: { data: {...} } }
  if (
    payload.data &&
    typeof payload.data === 'object' &&
    payload.data.data &&
    typeof payload.data.data === 'object' &&
    payload.data.data.id
  ) {
    return {
      ...payload,
      data: {
        ...payload.data,
        data: normalizeLoan(payload.data.data),
      },
    };
  }

  // Anything else on a /loans path: no change.
  return payload;
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
    const rawPayload = contentType.includes('application/json')
      ? await upstream.json()
      : { raw: await upstream.text() };

    // Normalize the loan shape before returning to the browser.
    // Scoped to /loans/* — everything else passes through untouched.
    const payload = normalizePayload(rawPayload, path);

    if (process.env.NODE_ENV !== 'production') {
      console.log(JSON.stringify({
        event: 'lending.proxy',
        method,
        path: path.join('/'),
        merchantId,
        status: upstream.status,
        ms: Date.now() - t0,
      }));
    }

    return NextResponse.json(payload, { status: upstream.status });
  } catch (err: any) {
    const isTimeout = err && err.name === 'AbortError';
    console.error(JSON.stringify({
      event: 'lending.proxy_error',
      requestId,
      method,
      path: path.join('/'),
      error: err ? err.message : 'unknown',
      isTimeout,
    }));
    return NextResponse.json(
      {
        error: {
          code: isTimeout ? 'GATEWAY_TIMEOUT' : 'INTERNAL_ERROR',
          message: isTimeout ? 'Lending service timed out' : (err && err.message) || 'Proxy error',
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