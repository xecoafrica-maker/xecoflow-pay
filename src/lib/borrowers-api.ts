// src/lib/borrowers-api.ts
// Typed client for the borrower admin API. All calls go through
// /api/borrowers/* which proxies to the auth engine.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface BorrowerIdentity {
  id: string;
  externalCustomerId: string;
  accountNumber: string;
  kycStatus: string;
}

export interface CreditLimit {
  id: string;
  maxLimit: number;
  availableLimit: number;
  currency: string;
  status: string;
  issuedAt: string;
  expiresAt: string | null;
}

export interface Borrower {
  borrowerId: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  phone: string | null;
  idNumber: string | null;
  status: string;
  emailVerified: boolean;
  mustChangePassword: boolean;
  tempPasswordExpiresAt: string | null;
  tempPasswordExpired: boolean;
  lastLogin: string | null;
  createdAt: string;
  identity: BorrowerIdentity | null;
  creditLimit: CreditLimit | null;
}

export interface CreateBorrowerInput {
  email: string;
  first_name: string;
  last_name?: string;
  phone: string;
  id_number?: string;
  credit_limit: number;
}

export type TargetStatus = 'PENDING' | 'APPROVED' | 'DISBURSED' | 'ACTIVE';

export interface CreateLoanForBorrowerInput {
  borrower_identity_id: string;
  product_id: string;
  principal: number;
  term_days: number;
  target_status: TargetStatus;
}

export interface ChainStep {
  step: 'create' | 'approve' | 'disburse' | 'activate';
  status: 'PENDING' | 'APPROVED' | 'DISBURSED' | 'ACTIVE';
  ok: boolean;
  at: string;
  loanId?: string;
}

export interface CreateLoanResult {
  loan: any;
  identity: {
    id: string;
    externalCustomerId: string;
    accountNumber: string;
    borrowerId: number;
  };
  chain: ChainStep[];
  finalStatus: string;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------
export class BorrowersApiError extends Error {
  code: string;
  status?: number;
  details?: any;

  constructor(message: string, code: string, status?: number, details?: any) {
    super(message);
    this.name = 'BorrowersApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------
async function call<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown
): Promise<T> {
  const url = '/api/borrowers' + (path.startsWith('/') ? path : '/' + path);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
    cache: 'no-store',
  });

  const raw = await res.json().catch(() => ({}));

  if (!res.ok) {
    const code =
      (raw && raw.code) ||
      (raw && raw.error && raw.error.code) ||
      'HTTP_' + res.status;
    const message =
      (raw && raw.message) ||
      (raw && raw.error && raw.error.message) ||
      res.statusText ||
      'Request failed';
    throw new BorrowersApiError(message, code, res.status, raw);
  }

  return raw as T;
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------
export interface ListBorrowersParams {
  limit?: number;
  offset?: number;
  status?: string;
}

export interface ListBorrowersResult {
  borrowers: Borrower[];
  total: number;
}

export async function listBorrowers(
  params: ListBorrowersParams = {}
): Promise<ListBorrowersResult> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.offset) qs.set('offset', String(params.offset));
  if (params.status) qs.set('status', params.status);
  const query = qs.toString() ? '?' + qs.toString() : '';

  const res = await fetch('/api/borrowers' + query, {
    credentials: 'include',
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new BorrowersApiError(
      (body && body.message) || 'Failed to list borrowers',
      (body && body.code) || 'HTTP_' + res.status,
      res.status
    );
  }

  return {
    borrowers: (body && body.data) || [],
    total: (body && body.pagination && body.pagination.total) || 0,
  };
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------
export async function createBorrower(input: CreateBorrowerInput) {
  return call<{
    success: boolean;
    message: string;
    data: {
      borrowerId: number;
      email: string;
      firstName: string | null;
      lastName: string | null;
      status: string;
      merchantId: number;
      tempPasswordExpiresAt: string;
      borrowerIdentityId: string;
      externalCustomerId: string;
      accountNumber: string;
      creditLimit: CreditLimit | null;
    };
  }>('POST', '/create', input);
}

// ---------------------------------------------------------------------------
// Reissue credentials
// ---------------------------------------------------------------------------
export async function reissueCredentials(borrowerId: number) {
  return call<{
    success: boolean;
    message: string;
    data: {
      borrowerId: number;
      email: string;
      tempPasswordExpiresAt: string;
    };
  }>('POST', `/${borrowerId}/reissue-credentials`, {});
}

// ---------------------------------------------------------------------------
// Create loan for borrower
// ---------------------------------------------------------------------------
export async function createLoanForBorrower(input: CreateLoanForBorrowerInput) {
  const raw = await call<{
    success: boolean;
    data?: CreateLoanResult;
    code?: string;
    message?: string;
    stage?: string;
    chain?: ChainStep[];
    finalStatus?: string;
    loanId?: string;
  }>('POST', '/loans', input);

  // The endpoint can return success:false with a partial chain. We
  // surface that as an error the caller can inspect.
  if (raw && raw.success === false) {
    throw new BorrowersApiError(
      raw.message || 'Loan creation failed',
      raw.code || 'LOAN_CREATE_FAILED',
      undefined,
      raw
    );
  }

  return raw;
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
export function formatKES(amount: number | string | null | undefined): string {
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
  return d.toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}