// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';
const REQUEST_TIMEOUT = 10000; // 10 seconds

// ─── Validation Helpers ──────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export async function POST(request: NextRequest) {
  console.log('🚀 [Proxy] Login API called');

  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // ─── 1. Validate Required Fields ──────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // ─── 2. Validate Email Format ──────────────────────────────────
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // ─── 3. Validate Password Strength ─────────────────────────────
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    console.log('📤 [Proxy] Forwarding login for:', email);

    // ─── 4. Forward with Timeout ────────────────────────────────────
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, rememberMe }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    console.log('📥 [Proxy] Backend status:', response.status);

    // ─── 5. Create Response ──────────────────────────────────────────
    const nextResponse = NextResponse.json(data, {
      status: response.status,
    });

    // ─── 6. Forward ALL Cookies ─────────────────────────────────────
    const setCookieHeaders = response.headers.getSetCookie?.() || [];

    if (setCookieHeaders.length > 0) {
      console.log(`🍪 [Proxy] Forwarding ${setCookieHeaders.length} cookie(s)`);

      setCookieHeaders.forEach((cookie) => {
        // Clean the cookie for the frontend domain
        // Remove Domain attribute so it defaults to current domain
        // Remove Secure flag for local development
        let cleanedCookie = cookie
          .split(';')
          .filter((part) => {
            const trimmed = part.trim().toLowerCase();
            // Remove Domain attribute
            if (trimmed.startsWith('domain=')) return false;
            // Remove Secure flag in development
            if (trimmed === 'secure' && process.env.NODE_ENV !== 'production') return false;
            return true;
          })
          .join(';');

        // Add SameSite=None and Secure for cross-domain in production
        if (process.env.NODE_ENV === 'production') {
          // Only if it's not already present
          if (!cleanedCookie.toLowerCase().includes('samesite')) {
            cleanedCookie += '; SameSite=None';
          }
          if (!cleanedCookie.toLowerCase().includes('secure')) {
            cleanedCookie += '; Secure';
          }
        }

        nextResponse.headers.append('Set-Cookie', cleanedCookie);
      });
    } else {
      console.log('⚠️ [Proxy] No Set-Cookie headers received from backend');
    }

    // ─── 7. Add Security Headers ────────────────────────────────────
    nextResponse.headers.set('X-Content-Type-Options', 'nosniff');
    nextResponse.headers.set('X-Frame-Options', 'DENY');

    return nextResponse;

  } catch (error: any) {
    console.error('❌ [Proxy] Error:', error.message);

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, message: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }

    // Don't expose internal errors to client
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}