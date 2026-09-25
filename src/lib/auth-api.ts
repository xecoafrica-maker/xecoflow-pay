// src/lib/auth-api.ts

import { AuthApiError } from './errors';

// Re-export so existing imports from './auth-api' keep working.
export { AuthApiError };

// ─── Config ────────────────────────────────────────────────────────
// NEXT_PUBLIC_* values are inlined at build time and visible in the
// browser bundle. That's fine for the API base URL — but we fail hard
// if it's missing, because silently falling back to a stale URL is
// worse than refusing to start.
//
// This is being phased out. Functions that have migrated to the BFF
// (registerMerchant, resendVerification, security questions) use
// relative /api/* paths so the backend host is never exposed to the
// browser.
const AUTH_API_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL;

if (!AUTH_API_BASE) {
  throw new Error(
    'NEXT_PUBLIC_AUTH_API_URL is not set. Refusing to start with an unknown backend.'
  );
}

// ─── Session duration ──────────────────────────────────────────────
export const SESSION_DURATION_SECONDS = 5 * 60;
export const SESSION_DURATION_MS = 5 * 60 * 1000;

// ─── Shared auth constants ─────────────────────────────────────────
// Password rule — must match the backend regex in
// auth-engine/routes/auth.js. If the backend changes, change both.
// Used by signup, password reset, and change-password flows.
export const PASSWORD_RULE =
  /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

// Terms version — one source of truth. Bump when terms are reissued.
export const TERMS_VERSION = 'v1.0';

// ─── Country codes ─────────────────────────────────────────────────
// ISO 3166-1 alpha-2. Keep in sync with the backend allow-list.
export const SUPPORTED_COUNTRIES = [
  { code: 'KE', name: 'Kenya' },
  { code: 'UG', name: 'Uganda' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'ZA', name: 'South Africa' },
] as const;

export type CountryCode = (typeof SUPPORTED_COUNTRIES)[number]['code'];

// ─── Security questions ────────────────────────────────────────────
// The catalog — must match the backend's SECURITY_QUESTION_CATALOG
// in auth-engine/routes/auth.js. If the backend catalog changes,
// change both.
export const SECURITY_QUESTION_CATALOG = [
  'What was the name of your first primary school?',
  'What is your mother\u2019s maiden name?',
  'In which town or city were you born?',
  'What was the name of your first pet?',
  'What is your father\u2019s middle name?',
  'What was the first name of your best childhood friend?',
] as const;

export type SecurityQuestionText =
  (typeof SECURITY_QUESTION_CATALOG)[number];

export interface SecurityQuestionSetupInput {
  question: string;
  answer: string;
}

export interface SecurityQuestionChallenge {
  position: number;
  text: string;
}

// ─── Types ─────────────────────────────────────────────────────────
export interface RegisterRequest {
  email: string;
  password: string;
  businessName: string;
  firstName: string;
  lastName: string;
  country: CountryCode;
  // Legal evidence. Server records the acceptance timestamp.
  termsVersion: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    merchantId: number;
    businessName: string;
    email: string;
    status: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  requiresOTP?: boolean;
  requiresVerification?: boolean;
  locked?: boolean;
  lock_until?: string;
  email?: string;
  message?: string;
  attempts_remaining?: number;
  sessionDuration?: number;
  merchant?: {
    merchantId: number;
    merchant_id?: number;
    businessName: string;
    business_name?: string;
    email: string;
    phone?: string;
    status?: string;
    settlementPhone?: string;
  };
}

export interface MerchantProfile {
  merchant_id: number;
  business_name: string;
  email: string;
  settlement_phone: string;
  status: string;
  created_at: string;
  phone?: string;
  business_type?: string;
  updated_at?: string;
  email_verified?: boolean;
  first_name?: string;
  last_name?: string;
  role?: string;
  country?: string;
  business_location?: string;
  business_registration_number?: string;
  settlement_method?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  vat_registered?: boolean;
  vat_number?: string;
  filing_preference?: 'auto' | 'manual';
  tax_agent_name?: string;
  tax_agent_pin?: string;
  directors?: Array<{
    id: string;
    fullName: string;
    idNumber: string;
    role: string;
  }>;
  trading_name?: string;
  business_category?: string;
  description?: string;
  support_email?: string;
  support_phone?: string;
  whatsapp_number?: string;
  website?: string;
  county?: string;
  physical_address?: string;
  brand_color?: string;
  logo_url?: string;
  merchantId?: number;
}

// ─── Helpers ───────────────────────────────────────────────────────
// Parse a fetch Response into JSON, or throw a structured error if
// the backend sent non-JSON (e.g. an HTML 502 from the proxy).
async function parseResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new AuthApiError(
      'BAD_GATEWAY',
      'The service is temporarily unavailable. Please try again.',
      res.status
    );
  }
  return res.json();
}

// ─── REGISTER ──────────────────────────────────────────────────────
// Routed through the Next.js BFF at /api/auth/register. The BFF owns
// the backend URL, validates the request AND response, and enforces
// the field whitelist.
export async function registerMerchant(
  data: RegisterRequest
): Promise<RegisterResponse> {
  if (!data.email || !data.password || !data.businessName) {
    throw new AuthApiError(
      'INVALID_REQUEST',
      'Email, password, and business name are required',
      400
    );
  }

  const payload = {
    email: data.email.trim().toLowerCase(),
    password: data.password,
    businessName: data.businessName.trim(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    country: data.country,
    termsVersion: data.termsVersion,
  };

  let res: Response;
  try {
    res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new AuthApiError(
      'NETWORK_ERROR',
      'Unable to reach the server. Please check your connection.',
      0
    );
  }

  const body = (await parseResponse(res)) as {
    success?: boolean;
    message?: string;
    code?: string;
    data?: RegisterResponse['data'];
  };

  if (!res.ok) {
    const code =
      typeof body.code === 'string'
        ? body.code
        : res.status === 409
        ? 'EMAIL_ALREADY_EXISTS'
        : res.status === 429
        ? 'RATE_LIMITED'
        : 'REGISTER_FAILED';

    throw new AuthApiError(
      code,
      body.message || 'Registration failed',
      res.status
    );
  }

  return {
    success: true,
    message: body.message || 'Registration successful',
    data: body.data,
  };
}

// ─── RESEND VERIFICATION ───────────────────────────────────────────
// Routed through the BFF at /api/auth/resend-verification.
export async function resendVerification(email: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  } catch {
    throw new AuthApiError(
      'NETWORK_ERROR',
      'Unable to reach the server. Please check your connection.',
      0
    );
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      code?: string;
      message?: string;
    };
    throw new AuthApiError(
      typeof body.code === 'string' ? body.code : 'RESEND_FAILED',
      body.message || 'Could not resend the verification email.',
      res.status
    );
  }
}

// ─── LOGIN ─────────────────────────────────────────────────────────
// Still hits auth-engine directly. Will be migrated to the BFF in a
// later pass.
export async function loginMerchant(
  data: LoginRequest
): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_API_BASE}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      }),
    });
  } catch {
    return {
      success: false,
      message: 'Network error. Please check your connection.',
    };
  }

  const body = (await parseResponse(res)) as Record<string, unknown>;

  if (res.status === 401) {
    return {
      success: false,
      message: (body.message as string) || 'Invalid email or password',
      attempts_remaining: body.attempts_remaining as number | undefined,
    };
  }

  if (res.status === 423) {
    return {
      success: false,
      locked: true,
      message:
        (body.message as string) ||
        'Too many failed attempts. Please try again later.',
      lock_until: body.lock_until as string | undefined,
    };
  }

  if (res.status === 403) {
    return {
      success: false,
      requiresVerification: true,
      message:
        (body.message as string) ||
        'Please verify your email before logging in.',
    };
  }

  if (!res.ok) {
    return {
      success: false,
      message: (body.message as string) || 'Login failed',
    };
  }

  return {
    success: true,
    requiresOTP: (body.requiresOTP as boolean) || false,
    sessionDuration: SESSION_DURATION_SECONDS,
  };
}

// ─── REFRESH ───────────────────────────────────────────────────────
export async function refreshToken(
  token: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const res = await fetch(`${AUTH_API_BASE}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: token }),
  });
  if (!res.ok) {
    throw new AuthApiError(
      'REFRESH_FAILED',
      'Your session has expired. Please log in again.',
      res.status
    );
  }
  const body = (await res.json()) as {
    data: { accessToken: string; refreshToken: string };
  };
  return body.data;
}

// ─── LOGOUT ────────────────────────────────────────────────────────
export async function logoutMerchant(token: string): Promise<void> {
  await fetch(`${AUTH_API_BASE}/v1/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ─── PROFILE ───────────────────────────────────────────────────────
export async function getMerchantProfile(
  token: string
): Promise<MerchantProfile> {
  const res = await fetch(`${AUTH_API_BASE}/v1/auth/account/details`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new AuthApiError(
      'PROFILE_FETCH_FAILED',
      'Failed to fetch profile',
      res.status
    );
  }
  const json = (await res.json()) as {
    success?: boolean;
    data?: MerchantProfile;
  } & Partial<MerchantProfile>;
  if (json.success && json.data) return json.data;
  return json as MerchantProfile;
}

// ─── API CREDENTIALS ───────────────────────────────────────────────
export interface ApiCredentials {
  apiKey: string;
}

export interface RotateCredentialsResponse {
  message: string;
  apiKey: string;
  rawSecret: string;
}

export async function getApiCredentials(
  token: string
): Promise<ApiCredentials> {
  const res = await fetch(`${AUTH_API_BASE}/v1/keys/credentials`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new AuthApiError(
      'CREDENTIALS_FETCH_FAILED',
      'Failed to fetch API credentials',
      res.status
    );
  }
  return res.json();
}

export async function rotateApiCredentials(
  token: string
): Promise<RotateCredentialsResponse> {
  const res = await fetch(`${AUTH_API_BASE}/v1/keys/credentials/rotate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    throw new AuthApiError(
      'CREDENTIALS_ROTATE_FAILED',
      'Failed to rotate API credentials',
      res.status
    );
  }
  return res.json();
}

export async function getApiSecret(
  token: string,
  password: string
): Promise<{ secret: string }> {
  const res = await fetch(`${AUTH_API_BASE}/v1/keys/secret`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    throw new AuthApiError(
      'SECRET_FETCH_FAILED',
      'Failed to retrieve secret',
      res.status
    );
  }
  return res.json();
}

// ─── SECURITY QUESTIONS ────────────────────────────────────────────
// All routed through the Next.js BFF at /api/security-questions/*.
// The BFF owns the backend URL and validates request/response shapes.

// Status check for the dashboard banner. Never throws — returns a
// safe default if the endpoint is unreachable, because the banner
// is a non-critical UX hint.
export async function getSecurityQuestionStatus(): Promise<{
  hasRecovery: boolean;
}> {
  try {
    const res = await fetch('/api/security-questions/status', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      return { hasRecovery: false };
    }

    const body = (await res.json()) as {
      success?: boolean;
      hasRecovery?: boolean;
    };

    return { hasRecovery: body.hasRecovery === true };
  } catch {
    return { hasRecovery: false };
  }
}

// Save (or replace) the merchant's 3 security questions. Throws
// AuthApiError on any failure.
export async function setupSecurityQuestions(
  questions: SecurityQuestionSetupInput[]
): Promise<void> {
  let res: Response;
  try {
    res = await fetch('/api/security-questions/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ questions }),
    });
  } catch {
    throw new AuthApiError(
      'NETWORK_ERROR',
      'Unable to reach the server. Please check your connection.',
      0
    );
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      code?: string;
      message?: string;
    };
    throw new AuthApiError(
      typeof body.code === 'string' ? body.code : 'SETUP_FAILED',
      body.message || 'Could not save security questions.',
      res.status
    );
  }
}

// Step 1 of password reset. Given merchantId + email, returns the
// question texts if the merchant has them. Never throws for a bad
// pair — the API deliberately returns the same shape for "no
// questions" and "wrong details" so email enumeration is blocked.
export async function checkSecurityQuestions(
  merchantId: string | number,
  email: string
): Promise<{
  hasQuestions: boolean;
  challengeId: string | null;
  questions: SecurityQuestionChallenge[];
}> {
  let res: Response;
  try {
    res = await fetch('/api/security-questions/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId, email: email.trim().toLowerCase() }),
    });
  } catch {
    throw new AuthApiError(
      'NETWORK_ERROR',
      'Unable to reach the server. Please check your connection.',
      0
    );
  }

  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    hasQuestions?: boolean;
    challengeId?: string | null;
    questions?: SecurityQuestionChallenge[];
    code?: string;
    message?: string;
  };

  if (!res.ok) {
    throw new AuthApiError(
      typeof body.code === 'string' ? body.code : 'CHECK_FAILED',
      body.message || 'Could not check your security questions.',
      res.status
    );
  }

  return {
    hasQuestions: body.hasQuestions === true,
    challengeId: body.challengeId ?? null,
    questions: Array.isArray(body.questions) ? body.questions : [],
  };
}

// Step 2 of password reset. Given a challengeId + 3 answers, verifies
// them and returns a short-lived reset token. Throws on any failure.
export async function verifySecurityAnswers(
  challengeId: string,
  answers: { position: number; answer: string }[]
): Promise<{ resetToken: string }> {
  let res: Response;
  try {
    res = await fetch('/api/security-questions/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, answers }),
    });
  } catch {
    throw new AuthApiError(
      'NETWORK_ERROR',
      'Unable to reach the server. Please check your connection.',
      0
    );
  }

  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    resetToken?: string;
    code?: string;
    message?: string;
  };

  if (!res.ok || !body.resetToken) {
    throw new AuthApiError(
      typeof body.code === 'string' ? body.code : 'VERIFY_FAILED',
      body.message || 'One or more answers are incorrect.',
      res.status
    );
  }

  return { resetToken: body.resetToken };
}

// Step 3. Given the resetToken from verify, ask the backend to
// generate and email the reset link.
export async function sendResetEmail(resetToken: string): Promise<void> {
  let res: Response;
  try {
    res = await fetch('/api/security-questions/send-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resetToken }),
    });
  } catch {
    throw new AuthApiError(
      'NETWORK_ERROR',
      'Unable to reach the server. Please check your connection.',
      0
    );
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      code?: string;
      message?: string;
    };
    throw new AuthApiError(
      typeof body.code === 'string' ? body.code : 'SEND_FAILED',
      body.message || 'Could not send the reset email.',
      res.status
    );
  }
}