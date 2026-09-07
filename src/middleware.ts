// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─── SECURE CONFIGURATION ──────────────────────────────────────────
const CONFIG = {
  CSP: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.onrender.com wss://*.onrender.com ws://*.onrender.com https://api.ipify.org https://api.my-ip.io https://ipapi.co; frame-ancestors 'none';",
  RATE_LIMIT_WINDOW: 60, // 1 minute
  
  // ─── RATE LIMITS ──────────────────────────────────────────────────
  // Authenticated merchants (per merchant)
  AUTHENTICATED_MAX: 500,     // 500 requests per minute
  
  // Anonymous users (per IP)
  PUBLIC_MAX: 100,            // 100 requests per minute
  
  // Auth endpoints (per IP/email)
  AUTH_MAX: 20,               // 20 auth attempts per minute
  
  // Sensitive operations (per IP/email)
  SENSITIVE_MAX: 5,           // 5 attempts per minute
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

// ─── PROTECTED API ROUTES (Require token) ──────────────────────────
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

function getRateLimitKey(ip: string, pathname: string, token: string | null): string {
  // ─── EXEMPT PATHS - No rate limiting ─────────────────────────────
  const exemptPaths = [
    '/api/auth/login',
    '/api/auth/verify-password',
    '/api/health',
    '/api/webhooks/',
  ];
  if (exemptPaths.some(path => pathname.startsWith(path))) {
    return 'exempt';
  }

  // ─── SENSITIVE PATHS - Use email or IP ──────────────────────────
  const sensitivePaths = [
    '/api/auth/register',
    '/api/auth/resend-verification',
    '/api/auth/forgot-password',
  ];
  if (sensitivePaths.some(path => pathname.startsWith(path))) {
    // Use email from body if available, otherwise IP
    return `sensitive:${ip}`;
  }

  // ─── AUTH PATHS - Use IP ──────────────────────────────────────────
  if (pathname.includes('/api/auth/')) {
    return `auth:${ip}`;
  }

  // ─── AUTHENTICATED USERS - Use merchant ID ──────────────────────
  if (token) {
    // Try to extract merchant ID from token
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.merchantId) {
        return `merchant:${payload.merchantId}`;
      }
    } catch {
      // If token parsing fails, use IP
    }
    return `authenticated:${ip}`;
  }

  // ─── PUBLIC USERS - Use IP ──────────────────────────────────────
  return `public:${ip}`;
}

function getMaxRequests(pathname: string, key: string): number {
  // ─── EXEMPT - No limit ────────────────────────────────────────────
  if (key === 'exempt') {
    return Infinity;
  }

  // ─── SENSITIVE PATHS - Strict limit ──────────────────────────────
  const sensitivePaths = [
    '/api/auth/register',
    '/api/auth/resend-verification',
    '/api/auth/forgot-password',
  ];
  if (sensitivePaths.some(path => pathname.startsWith(path))) {
    return CONFIG.SENSITIVE_MAX;
  }

  // ─── AUTH PATHS - Medium limit ────────────────────────────────────
  if (pathname.includes('/api/auth/')) {
    return CONFIG.AUTH_MAX;
  }

  // ─── AUTHENTICATED USERS - High limit ────────────────────────────
  if (key.startsWith('merchant:') || key.startsWith('authenticated:')) {
    return CONFIG.AUTHENTICATED_MAX;
  }

  // ─── PUBLIC USERS - Low limit ────────────────────────────────────
  return CONFIG.PUBLIC_MAX;
}

function isRateLimited(ip: string, pathname: string, token: string | null): boolean {
  const key = getRateLimitKey(ip, pathname, token);
  
  // ─── EXEMPT - No rate limiting ────────────────────────────────────
  if (key === 'exempt') {
    return false;
  }

  const maxRequests = getMaxRequests(pathname, key);
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + CONFIG.RATE_LIMIT_WINDOW * 1000,
    });
    return false;
  }
  
  if (record.count >= maxRequests) {
    return true;
  }
  
  record.count++;
  rateLimitStore.set(key, record);
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

// ─── ✅ SIMPLIFIED: Extract Token - NO JWT VALIDATION ──────────────
function extractToken(request: NextRequest): string | null {
  // 1. Check Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 2. Check cookie
  const authCookie = request.cookies.get('auth_token');
  if (authCookie) {
    return authCookie.value;
  }
  
  return null;
}

// ─── MAIN MIDDLEWARE ───────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();

  // ─── 1. RATE LIMITING ─────────────────────────────────────────────
  const ip = getClientIp(request);
  const token = extractToken(request);
  
  if (isRateLimited(ip, pathname, token)) {
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
    // Login API is public - skip auth check
    if (pathname === '/api/auth/login') {
      const response = NextResponse.next();
      Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

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
    
    // ✅ Pass through - backend will validate token signature
    const response = NextResponse.next();
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // ─── 4. DASHBOARD PROTECTION ─────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const allowedDashboardPaths = [
      '/dashboard/login',
      '/dashboard/logout',
      '/dashboard/onboarding',
    ];
    
    if (!allowedDashboardPaths.some(path => pathname.startsWith(path))) {
      if (!token) {
        return NextResponse.redirect(new URL('/login?session=expired', request.url));
      }
    }
    
    const response = NextResponse.next();
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // ─── 5. LOGIN PAGE WITH SESSION CHECK ────────────────────────────
  if (pathname === '/login') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
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