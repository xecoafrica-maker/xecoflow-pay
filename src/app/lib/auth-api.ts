// src/lib/auth.ts

/**
 * Get the stored JWT token from localStorage.
 * Returns null if not found or on server-side.
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('xecoflow_token');
}

/**
 * Get token from request headers (for API routes).
 * This is used in Next.js API routes where localStorage is not available.
 */
export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
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

/**
 * Store merchant data in localStorage.
 */
export function setStoredMerchant(merchant: any): void {
  localStorage.setItem('merchant', JSON.stringify(merchant));
}

/**
 * Verify a JWT token and return the user data.
 * This decodes the token locally to extract merchant information.
 */
export function verifyToken(token: string): any {
  try {
    // Decode the JWT token (split by . and decode the payload)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Base64 decode the payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if it has merchantId
    if (payload && payload.merchantId) {
      return {
        merchantId: payload.merchantId,
        email: payload.email,
        businessName: payload.businessName,
        role: payload.role || 'merchant',
        ...payload,
      };
    }

    return null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Check if user is authenticated (has a valid token).
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  const user = verifyToken(token);
  return user !== null;
}

/**
 * Get the current user from the stored token.
 */
export function getCurrentUser(): any {
  const token = getToken();
  if (!token) return null;
  return verifyToken(token);
}