// lib/krataxErrors.ts

export const KRA_ERROR_MESSAGES: Record<string, string> = {
  INVALID_REQUEST: 'Please check your input and try again.',
  MISSING_TAXPAYER_ID: 'Please enter your ID or Passport Number.',
  INVALID_TAXPAYER_ID: 'That ID format looks incorrect. Please check and try again.',
  INVALID_TAXPAYER_TYPE: 'The selected taxpayer type is not valid.',
  KRA_INVALID_ID: 'This ID number was not found in KRA records.',
  KRA_MISSING_PARAMETER: 'Some required details are missing. Please try again.',
  KRA_AUTH_FAILED: 'We are having trouble connecting to KRA. Please try again shortly.',
  KRA_TIMEOUT: 'KRA is taking too long to respond. Please try again.',
  KRA_UPSTREAM_ERROR: 'KRA services are currently unavailable. Please try again later.',
  KRA_UNKNOWN_ERROR: 'We could not retrieve your KRA PIN. Please try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  UNAUTHORIZED: 'Your session has expired. Please refresh the page.',
  INTERNAL_ERROR: 'Something went wrong on our end. Please try again.',
};

export function getKraErrorMessage(
  data: any,
  httpStatus?: number,
  fallback = 'Something went wrong. Please try again.'
): string {
  // 1. Network outage → highest priority
  if (httpStatus === 503 || httpStatus === 504) {
    return 'Our services are temporarily unavailable. Please try again in a few minutes.';
  }

  const code = data?.error?.code || data?.code;
  const message = data?.error?.message || data?.error;

  // 2. ✅ Prefer the backend's contextual message
  //    (e.g. "No Non-Resident record found for this ID...")
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }

  // 3. Fallback: static map by error code
  if (code && KRA_ERROR_MESSAGES[code]) {
    return KRA_ERROR_MESSAGES[code];
  }

  // 4. Absolute fallback
  return fallback;
}