// src/lib/kyc-api.ts
// Typed client for the merchant-side KYC admin API.
// All calls go through /api/kyc/* which proxies to the auth engine.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type KycStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export type EmploymentStatus =
  | 'EMPLOYED'
  | 'SELF_EMPLOYED'
  | 'BUSINESS_OWNER'
  | 'STUDENT'
  | 'RETIRED'
  | 'UNEMPLOYED';

export type IncomeRange = 'BELOW_5000' | 'ABOVE_5000';

export interface KycBorrowerSummary {
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  phone: string | null;
  idNumber: string | null;
}

export interface KycSubmittedFields {
  dateOfBirth: string | null;
  county: string | null;
  town: string | null;
  streetAddress: string | null;
  employmentStatus: EmploymentStatus | null;
  monthlyIncomeRange: IncomeRange | null;
  nextOfKinName: string | null;
  nextOfKinPhone: string | null;
  nextOfKinRelationship: string | null;
}

export interface KycSubmission {
  identityId: string;
  borrowerId: number;
  externalCustomerId: string;
  accountNumber: string;
  kycStatus: KycStatus;
  submittedAt: string | null;
  borrower: KycBorrowerSummary;
  submitted: KycSubmittedFields;
}

export interface KycDetailResponse {
  borrower: {
    borrowerId: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    phone: string | null;
    idNumber: string | null;
    status: string;
    createdAt: string;
  };
  identity: {
    id: string;
    externalCustomerId: string;
    accountNumber: string;
    kycStatus: KycStatus;
    kycSubmittedAt: string | null;
    kycVerifiedAt: string | null;
    kycRejectionReason: string | null;
  };
  kyc: KycSubmittedFields;
  creditLimit: {
    maxLimit: number;
    availableLimit: number;
    currency: string;
    status: string;
    issuedAt: string;
  } | null;
}

export interface ListPendingResult {
  submissions: KycSubmission[];
  total: number;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------
export class KycApiError extends Error {
  code: string;
  status?: number;
  details?: any;

  constructor(message: string, code: string, status?: number, details?: any) {
    super(message);
    this.name = 'KycApiError';
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
  const url = '/api/kyc' + (path.startsWith('/') ? path : '/' + path);

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
    throw new KycApiError(message, code, res.status, raw);
  }

  return raw as T;
}

// ---------------------------------------------------------------------------
// List pending submissions
// ---------------------------------------------------------------------------
export interface ListPendingParams {
  limit?: number;
  offset?: number;
}

export async function listPending(
  params: ListPendingParams = {}
): Promise<ListPendingResult> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.offset) qs.set('offset', String(params.offset));
  const query = qs.toString() ? '?' + qs.toString() : '';

  const res = await fetch('/api/kyc/admin/pending' + query, {
    credentials: 'include',
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new KycApiError(
      (body && body.message) || 'Failed to load pending KYC submissions',
      (body && body.code) || 'HTTP_' + res.status,
      res.status
    );
  }

  return {
    submissions: (body && body.data) || [],
    total: (body && body.pagination && body.pagination.total) || 0,
  };
}

// ---------------------------------------------------------------------------
// Fetch full detail of one borrower's KYC
// ---------------------------------------------------------------------------
export async function getKycDetail(
  borrowerId: number
): Promise<KycDetailResponse> {
  const raw = await call<{ success: boolean; data: KycDetailResponse }>(
    'GET',
    `/admin/${borrowerId}`
  );
  return raw.data;
}

// ---------------------------------------------------------------------------
// Verify
// ---------------------------------------------------------------------------
export async function verifyKyc(borrowerId: number) {
  return call<{
    success: boolean;
    message: string;
    data: { borrowerId: number; kycStatus: KycStatus };
  }>('POST', `/admin/${borrowerId}/verify`, {});
}

// ---------------------------------------------------------------------------
// Reject
// ---------------------------------------------------------------------------
export async function rejectKyc(borrowerId: number, reason: string) {
  return call<{
    success: boolean;
    message: string;
    data: { borrowerId: number; kycStatus: KycStatus; reason: string };
  }>('POST', `/admin/${borrowerId}/reject`, { reason });
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
const EMPLOYMENT_LABELS: Record<EmploymentStatus, string> = {
  EMPLOYED: 'Employed',
  SELF_EMPLOYED: 'Self-employed',
  BUSINESS_OWNER: 'Business owner',
  STUDENT: 'Student',
  RETIRED: 'Retired',
  UNEMPLOYED: 'Unemployed',
};

const INCOME_LABELS: Record<IncomeRange, string> = {
  BELOW_5000: 'Below KES 5,000',
  ABOVE_5000: 'KES 5,000 and above',
};

export function employmentLabel(value: EmploymentStatus | string | null): string {
  if (!value) return '—';
  return EMPLOYMENT_LABELS[value as EmploymentStatus] || value;
}

export function incomeLabel(value: IncomeRange | string | null): string {
  if (!value) return '—';
  return INCOME_LABELS[value as IncomeRange] || value;
}

export function formatKes(amount: number | string | null | undefined): string {
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

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-KE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}