// src/lib/lending-api.ts
// Typed client for the lending admin API. All calls go through /api/lending/*.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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
  merchant_id?: number;
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
  interest_method?: string;
  origination_fee_type?: string;
  origination_fee_value?: string;
  service_fee_type?: string;
  service_fee_value?: string;
  penalty_rate_per_day?: string;
  grace_period_days?: number;
  max_penalty_percent?: string;
  repayment_frequency: string;
  allow_partial_prepay?: boolean;
  allow_early_settlement?: boolean;
  min_credit_score?: number;
  requires_kyc?: boolean;
  first_loan_max_amount?: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  effective_from?: string | null;
  effective_to?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateProductInput {
  code: string;
  name: string;
  description?: string;
  currency?: string;
  min_amount: string;
  max_amount: string;
  min_term_days: number;
  max_term_days: number;
  default_term_days: number;
  interest_rate: string;
  interest_period: 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'ANNUAL';
  interest_method?: 'DECLINING' | 'FLAT' | 'COMPOUND';
  origination_fee_type?: 'PERCENT' | 'FLAT';
  origination_fee_value?: string;
  service_fee_type?: 'PERCENT' | 'FLAT';
  service_fee_value?: string;
  penalty_rate_per_day?: string;
  grace_period_days?: number;
  max_penalty_percent?: string;
  repayment_frequency: 'BULLET' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  allow_partial_prepay?: boolean;
  allow_early_settlement?: boolean;
  min_credit_score?: number;
  requires_kyc?: boolean;
  first_loan_max_amount?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
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

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Portfolio
// ---------------------------------------------------------------------------
export async function getPortfolio(): Promise<PortfolioSummary> {
  return call<PortfolioSummary>('GET', '/portfolio');
}

// ---------------------------------------------------------------------------
// Loans
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
export interface ListProductsParams {
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  limit?: number;
  offset?: number;
}

export interface ListProductsResult {
  products: LoanProduct[];
  pagination: { count: number; limit: number; offset: number };
}

export async function listProducts(params: ListProductsParams = {}): Promise<ListProductsResult> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.limit)  qs.set('limit',  String(params.limit));
  if (params.offset) qs.set('offset', String(params.offset));
  const query = qs.toString() ? '?' + qs.toString() : '';

  const res = await fetch('/api/lending/products' + query, {
    credentials: 'include',
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new LendingApiError(
      (body && body.error) || { code: 'HTTP_' + res.status, message: 'Failed to list products' },
      res.status
    );
  }
  const products = (body && body.data) || [];
  return {
    products: products as LoanProduct[],
    pagination: (body && body.pagination) || { count: products.length, limit: 100, offset: 0 },
  };
}

export async function createProduct(input: CreateProductInput) {
  return call<LoanProduct>('POST', '/products', {
    body: input,
    idempotencyKey: 'prod-' + input.code + '-' + Date.now(),
  });
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Applications (extension — merge into lending-api.ts)
// ---------------------------------------------------------------------------

export interface ApplicationWithBorrower extends Loan {
  borrower_name?: string | null;
  borrower_phone?: string | null;
  borrower_kyc_status?: string | null;
  product_name?: string | null;
}

/**
 * Fetch only pending applications for the merchant.
 * Uses the existing /loans endpoint with status=PENDING.
 */
export async function listApplications(params: {
  limit?: number;
  offset?: number;
} = {}): Promise<ListLoansResult> {
  return listLoans({ status: 'PENDING', ...params });
}

/**
 * Count pending applications (fast — uses the portfolio endpoint).
 */
export async function countPendingApplications(): Promise<number> {
  const portfolio = await getPortfolio();
  return (
    portfolio.by_status.find((s) => s.status === 'PENDING')?.count ?? 0
  );
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
export function formatKES(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined) return 'KES 0.00';
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(n)) return 'KES 0.00';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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