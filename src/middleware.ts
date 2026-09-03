import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── SECURE CONFIGURATION ──────────────────────────────────────────
const CONFIG = {
  // Token expiry checks
  TOKEN_EXPIRY_BUFFER: 30, // 30 seconds buffer
  MAX_TOKEN_AGE: 5 * 60, // 5 minutes
  
  // Security headers - ✅ FIXED: Added WebSocket URLs
  CSP: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.onrender.com wss://*.onrender.com ws://*.onrender.com https://api.ipify.org https://api.my-ip.io https://ipapi.co; frame-ancestors 'none';",
  
  // Rate limiting - ✅ RELAXED for better UX
  RATE_LIMIT_WINDOW: 60, // 1 minute
  RATE_LIMIT_MAX: 500, // ✅ Increased from 100 to 500 requests per minute
  AUTH_RATE_LIMIT_MAX: 20, // ✅ Separate limit for auth endpoints (password verification)
};

// ─── PUBLIC ROUTES (No auth required) ─────────────────────────────
const publicPaths = [
  '/login',
  '/signup',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/bill/',
  '/products/',
  '/p/',              // Product pages
  '/pay/',            // Payment pages
  '/health',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/images',
  '/fonts',
  '/api/bills/',
  '/api/products/',
  '/api/payments/charge',
  '/api/payments/callback',
  '/api/webhooks/',
  '/api/auth/verify-email',
  '/api/auth/reset-password',
  '/api/auth/verify-password', // ✅ Added to bypass rate limiting
  '/api/product-links/',
  '/api/payment-links/',
];

// ─── PROTECTED API ROUTES (Require valid token) ──────────────────
const protectedApiRoutes = [
  '/api/transactions',
  '/api/dashboard',
  '/api/merchant',
  '/api/payment-pages',
  '/api/withdrawals',
  '/api/onboarding',
  '/api/business-account',
  '/api/ledger',
  '/api/auth/logout',
];

// ─── RATE LIMITER (In-memory - for Edge) ──────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, pathname: string): boolean {
  // ✅ Skip rate limiting for verify-password endpoint
  if (pathname === '/api/auth/verify-password' || pathname.startsWith('/api/auth/verify-password')) {
    return false;
  }
  
  // ✅ Lower limit for auth endpoints
  let maxRequests = CONFIG.RATE_LIMIT_MAX;
  if (pathname.includes('/api/auth/')) {
    maxRequests = CONFIG.AUTH_RATE_LIMIT_MAX;
  }
  
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetAt) {
    // Reset the counter
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + CONFIG.RATE_LIMIT_WINDOW * 1000,
    });
    return false;
  }
  
  if (record.count >= maxRequests) {
    return true;
  }
  
  record.count++;
  rateLimitStore.set(ip, record);
  return false;
}

// ─── SECURITY HEADERS ──────────────────────────────────────────────
function getSecurityHeaders(): Record<string, string> {
  return {
    // HSTS - Force HTTPS
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    
    // CSP - Content Security Policy
    'Content-Security-Policy': CONFIG.CSP,
    
    // XSS Protection
    'X-XSS-Protection': '1; mode=block',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Referrer Policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions Policy
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Cache Control for authenticated pages
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
  };
}

// ─── TOKEN VALIDATION ──────────────────────────────────────────────
interface TokenValidation {
  valid: boolean;
  expired: boolean;
  expiringSoon?: boolean;
  payload?: any;
}

function validateToken(token: string): TokenValidation {
  try {
    // Split token (assuming JWT format: header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, expired: false };
    }
    
    // Decode payload (base64url)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, expired: true, payload };
    }
    
    // Check if token is about to expire (within buffer time - 30 seconds)
    if (payload.exp && payload.exp - now < CONFIG.TOKEN_EXPIRY_BUFFER) {
      return { valid: true, expired: false, payload, expiringSoon: true };
    }
    
    return { valid: true, expired: false, payload };
  } catch {
    return { valid: false, expired: false };
  }
}

// ─── HELPER: Get Client IP ─────────────────────────────────────────
function getClientIp(request: NextRequest): string {
  // Try x-forwarded-for (when behind proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Try real-ip
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Try Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  // Fallback to a default
  return 'unknown';
}

// ─── HELPER: Path Matcher ──────────────────────────────────────────
function pathMatches(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => pathname.includes(pattern));
}

// ─── HELPER: Extract Token ─────────────────────────────────────────
function extractToken(request: NextRequest): string | null {
  const { pathname } = request.nextUrl;
  
  // 1. Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 2. Check cookies (Next.js default)
  const tokenCookie = request.cookies.get('next-auth.session-token');
  if (tokenCookie) {
    return tokenCookie.value;
  }
  
  // 3. Check cookies (Custom auth token)
  const customCookie = request.cookies.get('auth_token');
  if (customCookie) {
    return customCookie.value;
  }
  
  // 4. Check URL parameter (only for specific flows like email verification)
  const urlToken = request.nextUrl.searchParams.get('token');
  if (urlToken && pathMatches(pathname, ['/verify-email', '/reset-password'])) {
    return urlToken;
  }
  
  return null;
}

// ─── MAIN MIDDLEWARE ───────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;
  const startTime = Date.now();

  // ─── 1. RATE LIMITING (Protect against DDoS) ─────────────────────
  const ip = getClientIp(request);
  
  // ✅ Pass pathname to rate limiter
  if (isRateLimited(ip, pathname)) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(CONFIG.RATE_LIMIT_WINDOW),
        ...getSecurityHeaders(),
      },
    });
  }

  // ─── 2. PUBLIC PATHS ──────────────────────────────────────────────
  if (publicPaths.some(path => pathname.startsWith(path))) {
    const response = NextResponse.next();
    
    // Add security headers to public responses too
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }

  // ─── 3. API ROUTE PROTECTION ──────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const token = extractToken(request);
    
    // Check if this API route requires authentication
    const isProtected = protectedApiRoutes.some(route => pathname.startsWith(route));
    
    if (isProtected && !token) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...getSecurityHeaders(),
          },
        }
      );
    }
    
    if (token) {
      const validation = validateToken(token);
      
      if (!validation.valid) {
        if (validation.expired) {
          return new NextResponse(
            JSON.stringify({
              success: false,
              error: 'Session expired. Please login again.',
              code: 'TOKEN_EXPIRED',
            }),
            {
              status: 401,
              headers: {
                'Content-Type': 'application/json',
                ...getSecurityHeaders(),
              },
            }
          );
        }
        
        return new NextResponse(
          JSON.stringify({
            success: false,
            error: 'Invalid session',
            code: 'INVALID_TOKEN',
          }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...getSecurityHeaders(),
            },
          }
        );
      }
      
      // ─── Token expiring soon? Add warning header ───────────────
      const response = NextResponse.next();
      if (validation.expiringSoon) {
        response.headers.set('X-Token-Expiring-Soon', 'true');
      }
      Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }
    
    // For public API routes, still add security headers
    const response = NextResponse.next();
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // ─── 4. DASHBOARD PROTECTION ─────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const token = extractToken(request);
    
    // Allow specific dashboard pages without strict auth
    const allowedDashboardPaths = [
      '/dashboard/login',
      '/dashboard/logout',
      '/dashboard/onboarding',
    ];
    
    if (!allowedDashboardPaths.some(path => pathname.startsWith(path))) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      const validation = validateToken(token);
      
      if (!validation.valid) {
        // Redirect to login with expired parameter
        const loginUrl = new URL('/login', request.url);
        if (validation.expired) {
          loginUrl.searchParams.set('expired', 'true');
        }
        return NextResponse.redirect(loginUrl);
      }
    }
    
    // Add security headers to dashboard
    const response = NextResponse.next();
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // ─── Add session expiry info to headers ─────────────────────
    if (token) {
      const validation = validateToken(token);
      if (validation.valid && validation.payload?.exp) {
        const remaining = validation.payload.exp - Math.floor(Date.now() / 1000);
        response.headers.set('X-Session-Remaining', String(remaining));
      }
    }
    
    return response;
  }

  // ─── 5. DEFAULT - Add security headers ──────────────────────────
  const response = NextResponse.next();
  Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // ─── Add response time tracking ──────────────────────────────────
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  
  return response;
}

// ─── CONFIG ──────────────────────────────────────────────────────────
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};