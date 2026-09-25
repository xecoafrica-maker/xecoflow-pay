// src/lib/errors.ts
//
// Central error mapping for all auth flows. Never surface raw backend
// messages — map by structured code so users only ever see safe copy.

export class AuthApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'AuthApiError';
    this.code = code;
    this.status = status;
  }
}

// Map a thrown error (of any shape) to user-facing copy. Never returns
// raw backend text; always returns a safe, generic message fallback.
export function friendlyError(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string'
  ) {
    const code = (err as { code: string }).code;

    switch (code) {
      // ── Registration ───────────────────────────────────────────
      case 'EMAIL_ALREADY_EXISTS':
        return 'This email is already registered. Try signing in instead.';
      case 'INVALID_EMAIL':
        return 'Please enter a valid email address.';
      case 'WEAK_PASSWORD':
        return 'Password must be 8+ characters with letters and numbers.';
      case 'INVALID_REQUEST':
        return 'Please check your details and try again.';
      case 'RATE_LIMITED':
        return 'Too many attempts. Please wait a moment and try again.';
      case 'NETWORK_ERROR':
        return 'Unable to reach the server. Please check your connection.';
      case 'BAD_GATEWAY':
        return 'The service is temporarily unavailable. Please try again.';

      // ── Login ─────────────────────────────────────────────────
      case 'INVALID_CREDENTIALS':
        return 'Invalid email or password.';
      case 'ACCOUNT_LOCKED':
        return 'Too many failed attempts. Please try again later.';
      case 'ACCOUNT_NOT_VERIFIED':
        return 'Please verify your email before signing in.';

      // ── Session / tokens ──────────────────────────────────────
      case 'TOKEN_REVOKED':
        return 'Your session has been ended. Please sign in again.';
      case 'TOKEN_REUSE_DETECTED':
        return 'Security check failed. Please sign in again.';
      case 'SESSION_EXPIRED':
        return 'Your session has expired. Please sign in again.';

      // ── Password reset ────────────────────────────────────────
      case 'RESET_TOKEN_INVALID':
        return 'This reset link is invalid or has expired. Request a new one.';
      case 'RESET_TOKEN_EXPIRED':
        return 'This reset link has expired. Please request a new one.';

      // ── Generic fallbacks ─────────────────────────────────────
      default:
        break;
    }
  }

  return 'Something went wrong. Please try again.';
}

// Returns a short headline for the error banner, based on the code.
// Used by pages that show a form-level error card.
export function friendlyErrorHeadline(err: unknown): string {
  if (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    typeof (err as { code: unknown }).code === 'string'
  ) {
    const code = (err as { code: string }).code;
    switch (code) {
      case 'EMAIL_ALREADY_EXISTS':
        return 'Email already in use';
      case 'RATE_LIMITED':
        return 'Too many attempts';
      case 'NETWORK_ERROR':
        return 'Connection problem';
      case 'BAD_GATEWAY':
        return 'Service unavailable';
      case 'INVALID_EMAIL':
      case 'WEAK_PASSWORD':
      case 'INVALID_REQUEST':
        return 'Check your details';
      default:
        return 'Could not create your account';
    }
  }
  return 'Could not create your account';
}