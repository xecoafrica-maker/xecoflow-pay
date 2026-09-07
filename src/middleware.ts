// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── SECURE CONFIGURATION ──────────────────────────────────────────
const CONFIG = {
  // Token expiry checks
  TOKEN_EXPIRY_BUFFER: 30, // 30 seconds buffer
  MAX_TOKEN_AGE: 5 * 60, // 5 minutes
  
  // Security headers
  CSP: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.onrender.com wss://*.onrender.com ws://*.onrender.com https://api.ipify.org https://api.my-ip.io https://ipapi.co; frame-ancestors 'none';",
  
  // Rate limiting
  RATE_LIMIT_WINDOW: 60, // 1 minute
  RATE_LIMIT_MAX: 500, // 500 requests per minute
  AUTH_RATE_LIMIT_MAX: 20, // 20 requests per minute for auth endpoints
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
  '/api/auth/verify-password',
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
  if (pathname === '/api/auth/verify-password' || pathname.startsWith('/api/auth/verify-password')) {
    return false;
  }
  
  let maxRequests = CONFIG.RATE_LIMIT_MAX;
  if (pathname.includes('/api/auth/')) {
    maxRequests = CONFIG.AUTH_RATE_LIMIT_MAX;
  }
  
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetAt) {
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
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': CONFIG.CSP,
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
    'X-Frame-Options': 'DENY',
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
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, expired: false };
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      return { valid: false, expired: true, payload };
    }
    
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
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  return 'unknown';
}

// ─── HELPER: Path Matcher ──────────────────────────────────────────
function pathMatches(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => pathname.includes(pattern));
}

// ─── ✅ UPDATED: Extract Token with Debug Logging ─────────────────
function extractToken(request: NextRequest): string | null {
  const { pathname } = request.nextUrl;
  
  // ─── DEBUG: Log all cookies ──────────────────────────────────────
  const allCookies = request.cookies.getAll();
  console.log('🍪 [Middleware] All cookie names:', allCookies.map(c => c.name));
  
  // 1. Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    console.log('🔑 [Middleware] Token found in Authorization header');
    return authHeader.substring(7);
  }
  
  // 2. ✅ Check custom auth token cookie (YOUR COOKIE)
  const authCookie = request.cookies.get('auth_token');
  if (authCookie) {
    console.log('🍪 [Middleware] Found auth_token cookie:', authCookie.value.substring(0, 20) + '...');
    return authCookie.value;
  }
  
  // 3. Check URL parameter (only for specific flows)
  const urlToken = request.nextUrl.searchParams.get('token');
  if (urlToken && pathMatches(pathname, ['/verify-email', '/reset-password'])) {
    console.log('🔑 [Middleware] Token found in URL parameter');
    return urlToken;
  }
  
  console.log('❌ [Middleware] No token found in cookies or headers');
  return null;
}

// ─── MAIN MIDDLEWARE ───────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();

  // ─── 1. RATE LIMITING ─────────────────────────────────────────────
  const ip = getClientIp(request);
  
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
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // ─── 3. API ROUTE PROTECTION ──────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const token = extractToken(request);
    
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
      
      const response = NextResponse.next();
      if (validation.expiringSoon) {
        response.headers.set('X-Token-Expiring-Soon', 'true');
      }
      Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }
    
    const response = NextResponse.next();
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // ─── 4. DASHBOARD PROTECTION ─────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const token = extractToken(request);
    
    const allowedDashboardPaths = [
      '/dashboard/login',
      '/dashboard/logout',
      '/dashboard/onboarding',
    ];
    
    if (!allowedDashboardPaths.some(path => pathname.startsWith(path))) {
      if (!token) {
        console.log('🔴 [Middleware] No token for dashboard, redirecting to login');
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      const validation = validateToken(token);
      
      if (!validation.valid) {
        const loginUrl = new URL('/login', request.url);
        if (validation.expired) {
          loginUrl.searchParams.set('expired', 'true');
        }
        console.log('🔴 [Middleware] Invalid token for dashboard, redirecting to login');
        return NextResponse.redirect(loginUrl);
      }
    }
    
    const response = NextResponse.next();
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    if (token) {
      const validation = validateToken(token);
      if (validation.valid && validation.payload?.exp) {
        const remaining = validation.payload.exp - Math.floor(Date.now() / 1000);
        response.headers.set('X-Session-Remaining', String(remaining));
      }
    }
    
    return response;
  }

  // ─── 5. LOGIN PAGE WITH SESSION ──────────────────────────────────
  if (pathname === '/login') {
    const token = extractToken(request);
    
    if (token) {
      const validation = validateToken(token);
      if (validation.valid) {
        console.log('✅ [Middleware] User already logged in, redirecting to dashboard');
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    
    const response = NextResponse.next();
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // ─── 6. DEFAULT - Add security headers ──────────────────────────
  const response = NextResponse.next();
  Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  
  return response;
}

// ─── CONFIG ──────────────────────────────────────────────────────────
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};