// src/app/api/auth/login/route.ts (Complete Bank-Grade Version with All Fixes)
import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { cookies } from 'next/headers';
import { auditLogger } from '@/lib/audit-logger';
import { verifyCaptcha } from '@/lib/captcha';
import { v4 as uuidv4 } from 'uuid';

// ─── CONFIGURATION ──────────────────────────────────────────────────
const BACKEND_URL = process.env.API_URL;
const REQUEST_TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT || '10000');
const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
const CAPTCHA_THRESHOLD = parseInt(process.env.CAPTCHA_THRESHOLD || '3');

const LOCKOUT_DURATIONS = {
  1: 2 * 60,      // 2 minutes
  2: 5 * 60,      // 5 minutes
  3: 15 * 60,     // 15 minutes
  4: 60 * 60,     // 1 hour
  5: 24 * 60 * 60, // 24 hours
};

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

  if (!origin && !referer) return false;
  const checkOrigin = origin || new URL(referer || '').origin;
  return allowedOrigins.includes(checkOrigin);
}

function isValidHost(request: NextRequest): boolean {
  const host = request.headers.get('host');
  const allowedHosts = process.env.ALLOWED_HOSTS?.split(',') || [];

  if (!host) return false;
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) {
    return process.env.NODE_ENV === 'development';
  }
  return allowedHosts.includes(host);
}

function getLockoutDuration(attempts: number): number {
  if (attempts <= 5) return LOCKOUT_DURATIONS[1];
  if (attempts <= 10) return LOCKOUT_DURATIONS[2];
  if (attempts <= 20) return LOCKOUT_DURATIONS[3];
  if (attempts <= 50) return LOCKOUT_DURATIONS[4];
  return LOCKOUT_DURATIONS[5];
}

function redactLog(data: any): any {
  const safe = { ...data };
  if (safe.password) safe.password = '***REDACTED***';
  if (safe.token) safe.token = safe.token.substring(0, 10) + '...';
  if (safe.accessToken) safe.accessToken = safe.accessToken.substring(0, 10) + '...';
  return safe;
}

// ─── MAIN POST HANDLER ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const correlationId = uuidv4();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    // ─── 1. Host & Origin Validation ────────────────────────────────
    if (!isValidHost(request)) {
      await auditLogger.log({
        eventType: 'LOGIN_ATTEMPT',
        email: 'unknown',
        ip: clientIP,
        userAgent,
        status: 'failure',
        reason: 'Invalid host',
        correlationId,
        durationMs: Date.now() - startTime,
      });
      return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
    }

    if (!isValidOrigin(request)) {
      await auditLogger.log({
        eventType: 'LOGIN_ATTEMPT',
        email: 'unknown',
        ip: clientIP,
        userAgent,
        status: 'failure',
        reason: 'Invalid origin',
        correlationId,
        durationMs: Date.now() - startTime,
      });
      return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
    }

    // ─── 2. Parse & Validate Request ─────────────────────────────────
    const body = await request.json();
    const { email, password, captchaToken } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter both email and password.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    // ─── 3. Get Attempt Counts ────────────────────────────────────────
    const emailKey = `login:email:${email.toLowerCase()}`;
    const ipKey = `login:ip:${clientIP}`;
    const lockKey = `login:lock:${email.toLowerCase()}`;

    // Check lock
    const lockData = await redis.get(lockKey);
    if (lockData) {
      const parsed = JSON.parse(lockData);
      const remainingSeconds = Math.ceil((parsed.lockedUntil - Date.now()) / 1000);

      if (remainingSeconds > 0) {
        await auditLogger.log({
          eventType: 'ACCOUNT_LOCKED',
          email: email.toLowerCase(),
          ip: clientIP,
          userAgent,
          status: 'locked',
          reason: 'Too many failed attempts',
          attempts: parsed.attempts,
          correlationId,
          durationMs: Date.now() - startTime,
        });

        return NextResponse.json(
          {
            error: `Too many failed attempts. Please try again in ${remainingSeconds} seconds.`,
            retryAfter: remainingSeconds,
            locked: true,
          },
          { status: 429 }
        );
      }
      await redis.del(lockKey);
    }

    const emailAttempts = parseInt(await redis.get(emailKey) || '0');
    const ipAttempts = parseInt(await redis.get(ipKey) || '0');

    // ─── 4. CAPTCHA Check ────────────────────────────────────────────
    if (emailAttempts >= CAPTCHA_THRESHOLD || ipAttempts >= CAPTCHA_THRESHOLD * 2) {
      if (!captchaToken) {
        return NextResponse.json(
          {
            error: 'CAPTCHA required',
            requiresCaptcha: true,
            attempts_remaining: Math.max(0, MAX_ATTEMPTS - emailAttempts),
          },
          { status: 428 } // Precondition Required
        );
      }

      // Verify CAPTCHA
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        return NextResponse.json(
          { error: 'Invalid CAPTCHA. Please try again.' },
          { status: 400 }
        );
      }
    }

    // ─── 5. Forward to Backend with Timeout ──────────────────────────
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    console.log('📤 [Login] Forwarding request:', {
      email: email.toLowerCase(),
      emailAttempts,
      ipAttempts,
      ip: clientIP,
      correlationId,
    });

    const response = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    // ─── 6. Handle Response ──────────────────────────────────────────

    // ✅ SUCCESS
    if (response.ok && data.success) {
      const token = data.data?.accessToken || data.accessToken;

      if (!token) {
        console.error('❌ No token in response:', redactLog(data));
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 500 }
        );
      }

      // Clear attempts
      await Promise.all([
        redis.del(emailKey),
        redis.del(ipKey),
        redis.del(lockKey),
      ]);

      // Audit log - success
      await auditLogger.log({
        eventType: 'LOGIN_SUCCESS',
        email: email.toLowerCase(),
        userId: data.data?.userId || data.userId,
        ip: clientIP,
        userAgent,
        status: 'success',
        correlationId,
        durationMs: Date.now() - startTime,
      });

      console.log('✅ [Login] Success:', {
        email: email.toLowerCase(),
        ip: clientIP,
        duration: Date.now() - startTime,
        correlationId,
      });

      // Set httpOnly cookie
      const cookieStore = await cookies();
      cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        domain: process.env.COOKIE_DOMAIN,
      });

      // Return (token removed from body for web clients)
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        merchant: {
          merchantId: Number(data.data?.merchantId || data.merchantId || 0),
          businessName: data.data?.businessName || data.businessName || '',
          email: data.data?.email || email,
        },
        sessionExpiry: 60 * 60 * 24 * 7,
        // ⚠️ Token only in cookie for web, body for mobile apps
        ...(process.env.ALLOW_TOKEN_IN_BODY === 'true' && { token }),
      });
    }

    // ─── 7. Failed Attempt Handling ──────────────────────────────────
    const newEmailAttempts = emailAttempts + 1;
    const newIpAttempts = ipAttempts + 1;

    await Promise.all([
      redis.set(emailKey, String(newEmailAttempts), 'EX', 24 * 60 * 60),
      redis.set(ipKey, String(newIpAttempts), 'EX', 24 * 60 * 60),
    ]);

    // Audit log - failure
    await auditLogger.log({
      eventType: 'LOGIN_FAILURE',
      email: email.toLowerCase(),
      ip: clientIP,
      userAgent,
      status: 'failure',
      reason: response.status === 401 ? 'Invalid credentials' : 'Unknown error',
      attempts: newEmailAttempts,
      correlationId,
      durationMs: Date.now() - startTime,
    });

    // Check for lockout
    const shouldLock = newEmailAttempts >= MAX_ATTEMPTS ||
                      newIpAttempts >= MAX_ATTEMPTS * 2;

    if (shouldLock) {
      const lockDuration = getLockoutDuration(newEmailAttempts);
      const lockedUntil = Date.now() + lockDuration * 1000;

      await redis.set(
        lockKey,
        JSON.stringify({
          attempts: newEmailAttempts,
          lockedUntil,
          reason: 'Too many failed attempts',
        }),
        'EX',
        lockDuration
      );

      console.warn('🔒 [Login] Account locked:', {
        email: email.toLowerCase(),
        ip: clientIP,
        attempts: newEmailAttempts,
        duration: lockDuration / 60,
        correlationId,
      });

      return NextResponse.json(
        {
          error: `Too many failed attempts. Please try again in ${lockDuration / 60} minutes.`,
          locked: true,
          retryAfter: lockDuration,
        },
        { status: 429 }
      );
    }

    // Handle specific error codes
    if (response.status === 401) {
      return NextResponse.json(
        {
          error: 'Invalid email or password. Please check your credentials.',
          attempts_remaining: Math.max(0, MAX_ATTEMPTS - newEmailAttempts),
          requiresCaptcha: newEmailAttempts >= CAPTCHA_THRESHOLD,
        },
        { status: 401 }
      );
    }

    if (response.status === 403) {
      return NextResponse.json(
        {
          error: 'Please verify your email before logging in.',
          requiresVerification: true,
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: response.status || 500 }
    );

  } catch (error: any) {
    // ─── 8. Error Handling ──────────────────────────────────────────

    const errorMessage = error.name === 'AbortError'
      ? 'Request timed out. Please try again.'
      : 'An unexpected error occurred. Please try again.';

    console.error('❌ [Login] Error:', {
      error: error.message,
      stack: error.stack,
      ip: clientIP,
      userAgent,
      correlationId,
      duration: Date.now() - startTime,
    });

    // Audit log - error
    await auditLogger.log({
      eventType: 'LOGIN_ATTEMPT',
      email: 'unknown',
      ip: clientIP,
      userAgent,
      status: 'failure',
      reason: error.message,
      correlationId,
      durationMs: Date.now() - startTime,
    });

    return NextResponse.json(
      { error: errorMessage },
      { status: error.name === 'AbortError' ? 504 : 500 }
    );
  }
}