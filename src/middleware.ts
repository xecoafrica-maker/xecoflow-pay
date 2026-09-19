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

// ─── COOKIE NAMES ──────────────────────────────────────────────────
// Must match the BFF and auth-engine. Two cookies exist:
//   xeco_session — the authenticated session (issued after OTP)
//   xeco_otp     — the short-lived OTP session (issued at login)
//
// The old `auth_token` cookie is deprecated. Never read it.
const COOKIE_SESSION = 'xeco_session';
const COOKIE_OTP = 'xeco_otp';

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
  '/api/auth/otp-context',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
  '/api/product-links/',
  '/api/payment-links/',
];

// ─── PROTECTED API ROUTES (Require session) ────────────────────────
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
    '/api/auth/otp-context',
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
    return `sensitive:${ip}`;
  }

  // ─── AUTH PATHS - Use IP ──────────────────────────────────────────
  if (pathname.includes('/api/auth/')) {
    return `auth:${ip}`;
  }

  // ─── AUTHENTICATED USERS - Use merchant ID ──────────────────────
  if (token) {
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
  if (key === 'exempt') {
    return Infinity;
  }

  const sensitivePaths = [
    '/api/auth/register',
    '/api/auth/resend-verification',
    '/api/auth/forgot-password',
  ];
  if (sensitivePaths.some(path => pathname.startsWith(path))) {
    return CONFIG.SENSITIVE_MAX;
  }

  if (pathname.includes('/api/auth/')) {
    return CONFIG.AUTH_MAX;
  }

  if (key.startsWith('merchant:') || key.startsWith('authenticated:')) {
    return CONFIG.AUTHENTICATED_MAX;
  }

  return CONFIG.PUBLIC_MAX;
}

function isRateLimited(ip: string, pathname: string, token: string | null): boolean {
  const key = getRateLimitKey(ip, pathname, token);

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
// Takes the LAST entry of x-forwarded-for (set by our proxy), not the
// first (client-supplied, spoofable). Prefer platform-specific headers
// when present.
function getClientIp(request: NextRequest): string {
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim());
    return parts[parts.length - 1] || 'unknown';
  }

  return 'unknown';
}

// ─── EXTRACT SESSION TOKEN ─────────────────────────────────────────
// Reads the xeco_session cookie (issued by the BFF after OTP success).
// The token's signature is NOT validated here — Edge middleware lacks
// the secret and the crypto libraries. The backend validates. This
// function only checks presence, so route guards can redirect early.
function extractSessionToken(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get(COOKIE_SESSION);
  if (sessionCookie?.value) return sessionCookie.value;
  return null;
}

// ─── MAIN MIDDLEWARE ───────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const startTime = Date.now();

  // ─── 1. RATE LIMITING ─────────────────────────────────────────────
  const ip = getClientIp(request);
  const token = extractSessionToken(request);

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
    // Login is public — no session yet.
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

  // ─── 5. LOGIN PAGE ──────────────────────────────────────────────
  // NOTE: We deliberately do NOT auto-redirect logged-in users away
  // from /login. Doing so caused infinite loops when session state was
  // ambiguous (e.g. an expired cookie the middleware still sees).
  // The login page component itself can show a "you're already signed
  // in" link if desired.
  if (pathname === '/login') {
    const response = NextResponse.next();
    Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // ─── 6. DEFAULT ────────────────────────────────────────────────
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