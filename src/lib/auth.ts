// src/lib/auth.ts

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('xecoflow_token');
}

export function setToken(token: string): void {
  localStorage.setItem('xecoflow_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('xecoflow_token');
  localStorage.removeItem('merchant');
}

export function getStoredMerchant(): any {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('merchant');
  return data ? JSON.parse(data) : null;
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