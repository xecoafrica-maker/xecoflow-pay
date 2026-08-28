// src/lib/auth.ts

// ─── CONFIGURATION ──────────────────────────────────────────────────
const TOKEN_EXPIRY = '7d'; // 7 days

// ─── TYPES ──────────────────────────────────────────────────────────
export interface MerchantAuth {
  merchantId: string;
  email: string;
  businessName: string;
  role?: 'admin' | 'user';
  exp?: number;
  iat?: number;
}

// ─── TOKEN MANAGEMENT ──────────────────────────────────────────────

/**
 * Get token from localStorage (Client-side only)
 * JOB: Retrieves the stored JWT token from the browser's localStorage
 * Used for: Making authenticated API calls from the client
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('xecoflow_token');
}

/**
 * Set token in localStorage
 * JOB: Stores the JWT token in the browser's localStorage
 * Used for: Persisting login session across page refreshes
 */
export function setToken(token: string): void {
  localStorage.setItem('xecoflow_token', token);
}

/**
 * Remove token and merchant data from localStorage
 * JOB: Clears all authentication data from the browser
 * Used for: Logout functionality
 */
export function removeToken(): void {
  localStorage.removeItem('xecoflow_token');
  localStorage.removeItem('merchant');
  localStorage.removeItem('auth_token'); // Also clear any other auth tokens
}

/**
 * Get stored merchant data from localStorage
 * JOB: Retrieves the merchant profile data from localStorage
 * Used for: Displaying merchant info without re-fetching from API
 */
export function getStoredMerchant(): any {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem('merchant');
  return data ? JSON.parse(data) : null;
}

/**
 * Store merchant data in localStorage
 * JOB: Saves merchant profile data to localStorage for quick access
 * Used for: Caching merchant info after login or profile update
 */
export function setStoredMerchant(merchant: any): void {
  localStorage.setItem('merchant', JSON.stringify(merchant));
}

/**
 * Get token from request headers (for API routes)
 * JOB: Extracts the Bearer token from the Authorization header
 * Used for: Server-side API routes (Next.js API endpoints)
 */
export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

/**
 * Verify a JWT token and return the user data
 * JOB: Decodes and validates the JWT token locally (without calling the backend)
 * SECURITY: Checks token format, decodes payload, validates structure and expiration
 * Used for: Quick client-side token validation before API calls
 */
export function verifyToken(token: string): MerchantAuth | null {
  try {
    // Decode the JWT token (split by . and decode the payload)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Base64 decode the payload (handles both atob and Buffer for Node)
    let payloadStr: string;
    try {
      // Client-side
      payloadStr = atob(parts[1]);
    } catch {
      // Server-side (Node)
      payloadStr = Buffer.from(parts[1], 'base64').toString();
    }
    
    const payload = JSON.parse(payloadStr);
    
    // ─── SECURITY: Check if token is expired ──────────────────────
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('⏰ Token expired');
      return null;
    }
    
    // ─── SECURITY: Check if it has required fields ────────────────
    if (payload && payload.merchantId) {
      return {
        merchantId: payload.merchantId,
        email: payload.email || '',
        businessName: payload.businessName || payload.business_name || '',
        role: payload.role || 'merchant',
        exp: payload.exp,
        iat: payload.iat,
      };
    }

    return null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Check if user is authenticated (client-side)
 * JOB: Quick check to see if the user has a valid token
 * Used for: Conditional rendering, route guards in components
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  
  const decoded = verifyToken(token);
  return decoded !== null;
}

/**
 * Get token expiry time (client-side)
 * JOB: Calculates remaining time before token expires
 * Used for: Showing session expiry warnings, auto-logout
 */
export function getTokenExpiry(): number | null {
  const token = getToken();
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded || !decoded.exp) return null;
  
  return decoded.exp;
}

/**
 * Get remaining session time in seconds
 * JOB: Calculates how many seconds are left before token expiry
 * Used for: Session timer display, auto-logout countdown
 */
export function getRemainingSessionTime(): number {
  const exp = getTokenExpiry();
  if (!exp) return 0;
  
  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, exp - now);
}

/**
 * Check if token is about to expire (within 5 minutes)
 * JOB: Warns when session is about to expire
 * Used for: Showing "Session expiring soon" notifications
 */
export function isTokenExpiringSoon(): boolean {
  const remaining = getRemainingSessionTime();
  return remaining > 0 && remaining < 300; // 5 minutes
}

/**
 * Get authorization header for API calls
 * JOB: Creates the Authorization header with Bearer token
 * Used for: Making authenticated API calls
 */
export function getAuthHeader(): Record<string, string> | null {
  const token = getToken();
  if (!token) return null;
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Clear all auth data (advanced logout)
 * JOB: Comprehensive cleanup of all auth-related data
 * Used for: Complete logout, account deletion, security breaches
 */
export function clearAllAuthData(): void {
  // Clear localStorage
  localStorage.removeItem('xecoflow_token');
  localStorage.removeItem('merchant');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('session_id');
  
  // Clear sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('xecoflow_token');
    sessionStorage.removeItem('merchant');
  }
  
  // Clear cookies (if any)
  if (typeof document !== 'undefined') {
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }
}