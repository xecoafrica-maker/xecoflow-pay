// src/config/auth.ts

/**
 * Frontend authentication configuration.
 * Kept in sync with the backend's corresponding constants.
 */
export const AUTH_CONFIG = {
  /** Max failed attempts before the UI warns the merchant.
   *  Must match backend MAX_LOGIN_ATTEMPTS. */
  MAX_LOGIN_ATTEMPTS_UX: 5,

  /** Duration (ms) for toast notifications before auto-dismiss. */
  TOAST_DURATION_MS: 5000,

  /** Number of digits in an OTP code. */
  OTP_LENGTH: 6,

  /** Max resends per OTP session before forcing a re-login. */
  OTP_MAX_RESENDS_PER_SESSION: 5,

  /** Fallback OTP lifetime if the backend does not return expiresAt. */
  OTP_DEFAULT_EXPIRY_SECONDS: 300,

  /** Access-token lifetime in seconds.
   *  Must match backend SESSION_DURATION_MINUTES * 60. */
  SESSION_DURATION_SECONDS: 600,
} as const;

/**
 * Shape of a response from any /api/auth/* endpoint.
 * Fields are optional because different endpoints return different subsets.
 */
export interface AuthResponse {
  success?: boolean;
  requiresOTP?: boolean;
  message?: string;
  code?: string;
  retryAfter?: number;
  expiresAt?: number;
}

/**
 * Shape returned by GET /api/auth/otp-context.
 */
export interface OtpContext {
  maskedEmail: string;
  expiresAt: number;
}