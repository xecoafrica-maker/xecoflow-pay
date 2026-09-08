// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';
const REQUEST_TIMEOUT = 10000;

export async function POST(request: NextRequest) {
  console.log('🚀 [Proxy] Login API called');

  try {
    const body = await request.json();
    const { email, password, rememberMe = false } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('📤 [Proxy] Forwarding login for:', email);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    console.log('📥 [Proxy] Backend status:', response.status);
    console.log('📥 [Proxy] Backend response:', JSON.stringify(data, null, 2));

    // ─── ✅ Check for OTP requirement ──────────────────────────────
    if (data.success && data.requiresOTP) {
      console.log('🔐 [Proxy] OTP required for:', email);
      console.log('🔐 [Proxy] TempToken present:', !!data.tempToken);
      
      // Return OTP response without setting cookies
      return NextResponse.json(data, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Origin': 'https://xecoflow-pay.onrender.com',
        },
      });
    }

    // ─── ✅ Normal login flow - forward the cookie ──────────────────
    const nextResponse = NextResponse.json(data, {
      status: response.status,
    });

    const setCookieHeaders = response.headers.getSetCookie?.() || [];

    if (setCookieHeaders.length > 0) {
      console.log(`🍪 [Proxy] Forwarding ${setCookieHeaders.length} cookie(s)`);

      setCookieHeaders.forEach((cookie) => {
        // Remove Domain attribute so it works on frontend domain
        let cleanedCookie = cookie
          .split(';')
          .filter((part) => {
            const trimmed = part.trim().toLowerCase();
            if (trimmed.startsWith('domain=')) return false;
            return true;
          })
          .join(';');

        console.log(`🍪 [Proxy] Forwarding cookie: ${cleanedCookie.substring(0, 100)}...`);
        nextResponse.headers.append('Set-Cookie', cleanedCookie);
      });
    } else {
      console.log('⚠️ [Proxy] No Set-Cookie headers received from backend');
    }

    // ✅ Add CORS headers to ensure cookie is accepted
    nextResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    nextResponse.headers.set('Access-Control-Allow-Origin', 'https://xecoflow-pay.onrender.com');

    return nextResponse;

  } catch (error: any) {
    console.error('❌ [Proxy] Error:', error.message);
    console.error('❌ [Proxy] Stack:', error.stack);

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, message: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}