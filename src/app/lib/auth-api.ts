// products/xecoflow-pay/src/lib/auth.ts

/**
 * Get the stored JWT token from localStorage.
 * Returns null if not found or on server-side.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('xecoflow_token');
}

/**
 * Store the JWT token in localStorage.
 */
export function setToken(token: string): void {
  localStorage.setItem('xecoflow_token', token);
}

/**
 * Remove the JWT token and any cached merchant data.
 */
export function removeToken(): void {
  localStorage.removeItem('xecoflow_token');
  localStorage.removeItem('merchant');
}

/**
 * Get the cached merchant profile from localStorage.
 * Returns null if not found or on server-side.
 */
export function getStoredMerchant(): any {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('merchant');
  return data ? JSON.parse(data) : null;
}