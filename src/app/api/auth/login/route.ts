// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';

// ─── CONFIGURATION ──────────────────────────────────────────────────
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xecoflow-2gen.onrender.com';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 2 * 60 * 1000; // 2 minutes

// ─── IN-MEMORY ATTEMPT STORE ──────────────────────────────────────
// ⚠️ For production, use Redis or database
const attemptStore = new Map<string, { count: number; lockedUntil?: number }>();

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────
function getAttemptKey(email: string): string {
  return `login_attempts_${email.toLowerCase().trim()}`;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0];
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function cleanExpiredAttempts(): void {
  const now = Date.now();
  for (const [key, data] of attemptStore) {
    if (data.lockedUntil && data.lockedUntil < now) {
      attemptStore.delete(key);
    }
  }
}

// ─── MAIN POST HANDLER ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // ─── 1. Clean expired attempts ──
    cleanExpiredAttempts();

    // ─── 2. Parse Request Body ──────────────────────────────────────
    const body = await request.json();
    const { email, password } = body;

    console.log('📤 [API] Login request for:', email);

    // ─── 3. Validate Input ──────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter both email and password.',
        },
        { status: 400 }
      );
    }

    // ─── 4. Validate Email Format ──────────────────────────────────
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password. Please check your credentials.',
        },
        { status: 401 }
      );
    }

    // ─── 5. Check Rate Limiting (Client-Side) ──────────────────────
    // Note: This is client-side rate limiting.
    // For production, implement server-side with Redis.
    const clientIP = getClientIP(request);
    const attemptKey = getAttemptKey(email);
    const existingAttempts = attemptStore.get(attemptKey);

    if (existingAttempts?.lockedUntil && existingAttempts.lockedUntil > Date.now()) {
      const remainingSeconds = Math.ceil(
        (existingAttempts.lockedUntil - Date.now()) / 1000
      );
      return NextResponse.json(
        {
          success: false,
          locked: true,
          error: `Too many failed attempts. Please try again in ${remainingSeconds} seconds.`,
          retryAfter: remainingSeconds,
        },
        { status: 429 }
      );
    }

    // ─── 6. Forward to Backend ──────────────────────────────────────
    console.log('📤 [API] Forwarding to backend:', BACKEND_URL + '/v1/auth/login');

    const response = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    console.log('📥 [API] Backend status:', response.status);
    console.log('📥 [API] Backend response:', JSON.stringify(data, null, 2));

    // ─── 7. Handle Backend Response ─────────────────────────────────

    // ✅ Handle successful login (200 OK)
    if (response.ok && data.success) {
      console.log('✅ [API] Backend login successful');

      // ─── Extract token from nested data object ────────────────────
      const responseData = data.data || {};
      const token = responseData.accessToken || data.accessToken || null;

      console.log('🔑 [API] Extracted token:', token ? token.substring(0, 30) + '...' : 'NO TOKEN');

      if (!token) {
        console.error('❌ [API] No token in backend response');
        return NextResponse.json(
          {
            success: false,
            error: 'No token received from authentication server',
          },
          { status: 500 }
        );
      }

      // ─── Clear failed attempts on success ─────────────────────────
      attemptStore.delete(attemptKey);

      // ─── Return formatted response ────────────────────────────────
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        token: token,
        merchant: {
          merchantId: Number(responseData.merchantId || data.merchantId || 0),
          businessName: responseData.businessName || data.businessName || '',
          email: responseData.email || email,
        },
        sessionExpiry: 60 * 60 * 24 * 7, // 7 days
      });
    }

    // ─── 8. Handle Error Responses ──────────────────────────────────
    console.log('⚠️ [API] Login failed:', response.status, data);

    // 401: Unauthorized (Generic for security)
    if (response.status === 401) {
      // Track failed attempt
      const attempts = attemptStore.get(attemptKey) || { count: 0 };
      attempts.count += 1;

      if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        attempts.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
        attemptStore.set(attemptKey, attempts);

        return NextResponse.json(
          {
            success: false,
            locked: true,
            error: 'Too many failed attempts. Please try again in 2 minutes.',
          },
          { status: 429 }
        );
      }

      attemptStore.set(attemptKey, attempts);

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password. Please check your credentials.',
          attempts_remaining: MAX_LOGIN_ATTEMPTS - attempts.count,
        },
        { status: 401 }
      );
    }

    // 403: Verification Required
    if (response.status === 403) {
      return NextResponse.json(
        {
          success: false,
          requiresVerification: true,
          error: data.message || 'Please verify your email before logging in.',
        },
        { status: 403 }
      );
    }

    // 423: Account Locked (Backend level)
    if (response.status === 423) {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          error: data.message || 'Too many failed attempts. Please try again later.',
        },
        { status: 423 }
      );
    }

    // ─── 9. Default Error Response ──────────────────────────────────
    return NextResponse.json(
      {
        success: false,
        error: data.message || data.error || 'Login failed. Please try again.',
      },
      { status: response.status || 500 }
    );
  } catch (error: any) {
    console.error('❌ [API] Login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}