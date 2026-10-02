// src/lib/lending-api.ts
// Typed client for the lending admin API. All calls go through /api/lending/*.

export type LoanStatus =
  | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED'
  | 'ACTIVE' | 'OVERDUE' | 'PAID' | 'DEFAULTED' | 'WRITTEN_OFF';

export interface Loan {
  id: string;
  loan_reference: string;
  status: LoanStatus;
  currency: string;
  principal_amount: string;
  interest_amount: string;
  fees_amount: string;
  penalty_amount: string;
  total_due: string;
  outstanding: {
    principal: string;
    interest: string;
    fees: string;
    penalty: string;
    total: string;
  };
  terms: {
    term_days: number;
    interest_rate: string;
    interest_period: string;
    repayment_frequency: string;
    penalty_rate_per_day: string;
    grace_period_days: number;
  };
  timeline: {
    requested_at: string;
    approved_at: string | null;
    disbursed_at: string | null;
    first_due_date: string | null;
    maturity_date: string | null;
    last_payment_at: string | null;
    closed_at: string | null;
  };
  external_customer_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoanScheduleRow {
  installment_no: number;
  due_date: string;
  principal_due: string;
  interest_due: string;
  fees_due: string;
  penalty_due: string;
  total_due: string;
  principal_paid: string;
  interest_paid: string;
  fees_paid: string;
  penalty_paid: string;
  total_paid: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'WAIVED';
  paid_at: string | null;
}

export interface PortfolioSummary {
  by_status: Array<{
    status: LoanStatus;
    count: number;
    principal_total: string;
    outstanding_total: string;
    at_risk_total: string;
  }>;
  totals: {
    count: number;
    principal_total: string;
    outstanding_total: string;
    at_risk_total: string;
  };
}

export interface LoanProduct {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  currency: string;
  min_amount: string;
  max_amount: string;
  min_term_days: number;
  max_term_days: number;
  default_term_days: number;
  interest_rate: string;
  interest_period: string;
  repayment_frequency: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  created_at: string;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  description?: string | null;
  event_types: string[];
  environment: 'production' | 'sandbox';
  is_active: boolean;
  last_success_at: string | null;
  last_failure_at: string | null;
  consecutive_failures: number;
  created_at: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  meta?: Record<string, unknown>;
  requestId?: string;
}

export class LendingApiError extends Error {
  code: string;
  meta?: Record<string, unknown>;
  requestId?: string;
  status?: number;

  constructor(payload: ApiErrorPayload, status?: number) {
    super(payload.message);
    this.name = 'LendingApiError';
    this.code = payload.code;
    this.meta = payload.meta;
    this.requestId = payload.requestId;
    this.status = status;
  }
}

async function call<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  options: { body?: unknown; idempotencyKey?: string } = {}
): Promise<T> {
  const url = '/api/lending' + (path.startsWith('/') ? path : '/' + path);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.idempotencyKey) headers['x-idempotency-key'] = options.idempotencyKey;

  const res = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    credentials: 'include',
    cache: 'no-store',
  });

  const raw = await res.json().catch(() => ({}));

  if (!res.ok) {
    const payload: ApiErrorPayload = (raw && raw.error) || {
      code: 'HTTP_' + res.status,
      message: res.statusText || 'Request failed',
    };
    throw new LendingApiError(payload, res.status);
  }

  return ((raw && raw.data) !== undefined ? raw.data : raw) as T;
}

export async function getPortfolio(): Promise<PortfolioSummary> {
  return call<PortfolioSummary>('GET', '/portfolio');
}

export interface ListLoansParams {
  status?: LoanStatus;
  borrower_id?: string;
  limit?: number;
  offset?: number;
}

export interface ListLoansResult {
  loans: Loan[];
  pagination: { count: number; limit: number; offset: number };
}

export async function listLoans(params: ListLoansParams = {}): Promise<ListLoansResult> {
  const qs = new URLSearchParams();
  if (params.status)      qs.set('status', params.status);
  if (params.borrower_id) qs.set('borrower_id', params.borrower_id);
  if (params.limit)       qs.set('limit',  String(params.limit));
  if (params.offset)      qs.set('offset', String(params.offset));
  const query = qs.toString() ? '?' + qs.toString() : '';

  const res = await fetch('/api/lending/loans' + query, {
    credentials: 'include',
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new LendingApiError(
      (body && body.error) || { code: 'HTTP_' + res.status, message: 'Failed to list loans' },
      res.status
    );
  }
  const loans = (body && body.data) || [];
  return {
    loans: loans as Loan[],
    pagination: (body && body.pagination) || { count: loans.length, limit: params.limit || 50, offset: params.offset || 0 },
  };
}

export async function getLoan(id: string) {
  return call<{ loan: Loan; schedule: LoanScheduleRow[] }>('GET', '/loans/' + id);
}

export async function approveLoan(id: string) {
  return call<Loan>('POST', '/loans/' + id + '/approve', { body: {} });
}

export async function rejectLoan(id: string, reason?: string) {
  return call<Loan>('POST', '/loans/' + id + '/reject', { body: { reason } });
}

export async function disburseLoan(id: string, idempotencyKey?: string) {
  return call<Loan>('POST', '/loans/' + id + '/disburse', {
    body: { idempotency_key: idempotencyKey },
    idempotencyKey,
  });
}

export async function activateLoan(id: string, disbursementTransactionId?: string) {
  return call<Loan>('POST', '/loans/' + id + '/activate', {
    body: { disbursement_transaction_id: disbursementTransactionId },
  });
}

export async function penalizeLoan(id: string, reason?: string) {
  return call<Loan>('POST', '/loans/' + id + '/penalize', { body: { reason } });
}

export async function listProducts(): Promise<LoanProduct[]> {
  const raw = await fetch('/api/lending/products', { credentials: 'include', cache: 'no-store' });
  const body = await raw.json().catch(() => ({}));
  if (!raw.ok) {
    throw new LendingApiError(
      (body && body.error) || { code: 'HTTP_' + raw.status, message: 'Failed to list products' },
      raw.status
    );
  }
  return ((body && body.data) || []) as LoanProduct[];
}

export async function createProduct(input: Record<string, unknown>) {
  return call<LoanProduct>('POST', '/products', { body: input });
}

export async function listWebhooks(): Promise<WebhookSubscription[]> {
  const raw = await fetch('/api/lending/webhooks', { credentials: 'include', cache: 'no-store' });
  const body = await raw.json().catch(() => ({}));
  if (!raw.ok) {
    throw new LendingApiError(
      (body && body.error) || { code: 'HTTP_' + raw.status, message: 'Failed to list webhooks' },
      raw.status
    );
  }
  return ((body && body.data) || []) as WebhookSubscription[];
}

export async function createWebhook(input: {
  url: string;
  description?: string;
  event_types?: string[];
  environment?: 'production' | 'sandbox';
}) {
  return call<{ data: WebhookSubscription; secret: string }>('POST', '/webhooks', { body: input });
}

export async function deleteWebhook(id: string) {
  return call<void>('DELETE', '/webhooks/' + id);
}

export async function testWebhook(id: string) {
  return call<{ eventId: string; queued: number }>('POST', '/webhooks/' + id + '/test');
}

export interface WebhookDelivery {
  id: string;
  event_type: string;
  status: string;
  attempt_count: number;
  http_status: number | null;
  duration_ms: number | null;
  created_at: string;
}

export async function listWebhookDeliveries(id: string): Promise<WebhookDelivery[]> {
  const raw = await fetch('/api/lending/webhooks/' + id + '/deliveries', {
    credentials: 'include',
    cache: 'no-store',
  });
  const body = await raw.json().catch(() => ({}));
  if (!raw.ok) {
    throw new LendingApiError(
      (body && body.error) || { code: 'HTTP_' + raw.status, message: 'Failed to fetch deliveries' },
      raw.status
    );
  }
  return ((body && body.data) || []) as WebhookDelivery[];
}

export function formatKES(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined) return 'KES 0';
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(n)) return 'KES 0';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}