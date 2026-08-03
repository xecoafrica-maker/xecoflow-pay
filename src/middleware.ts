import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes that are PUBLIC (No onboarding or auth required)
const publicPaths = [
  '/login',
  '/signup',
  '/bill/',      // Public bill payment page
  '/products/',  // Public product download page
  '/api/bills/',
  '/api/products/',
  '/api/payments/charge',
  '/health',
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/images',
  '/fonts'
];

// Define routes that are ALWAYS ALLOWED inside the dashboard
const alwaysAllowedDashboardPaths = [
  '/dashboard',
  '/dashboard/settings/business',
  '/dashboard/settings/settlement',
  '/dashboard/logout',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow all public paths instantly
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 2. Check if trying to access the dashboard
  if (pathname.startsWith('/dashboard')) {
    // 2a. Always allow the dashboard home and onboarding pages
    if (alwaysAllowedDashboardPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // 2b. Simply check if user is logged in (basic auth check)
    // We will let the OnboardingGuard component handle the detailed check.
    const token = request.cookies.get('next-auth.session-token')?.value || 
                  request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)',
  ],
};