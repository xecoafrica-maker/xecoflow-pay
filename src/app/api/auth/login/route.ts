// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe = false } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Call backend
    const response = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(data, { status: response.status });
    }

    // Extract tokens
    const accessToken = data.data?.accessToken || data.accessToken;
    const refreshToken = data.data?.refreshToken || data.refreshToken;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'Authentication failed' },
        { status: 500 }
      );
    }

    // Create response WITHOUT tokens in body
    const nextResponse = NextResponse.json({
      success: true,
      message: 'Login successful',
      merchant: {
        merchantId: data.data?.merchantId || data.merchantId,
        businessName: data.data?.businessName || data.businessName,
        email: data.data?.email || email,
        phone: data.data?.phone || '',
        status: data.data?.status || 'ACTIVE',
        role: data.data?.role || 'merchant',
        emailVerified: data.data?.emailVerified || false,
      },
      sessionExpiry: rememberMe ? 7 * 24 * 60 * 60 : 30 * 60,
    });

    // ✅ SECURE COOKIE SETTINGS (Permanent)
    const cookieOptions = {
      httpOnly: true,
      secure: IS_PRODUCTION,          // true in production
      sameSite: 'lax' as const,       // Best balance of security + usability
      path: '/',
      maxAge: rememberMe 
        ? 7 * 24 * 60 * 60            // 7 days
        : 30 * 60,                    // 30 minutes
    };

    // Set Access Token
    nextResponse.cookies.set('auth_token', accessToken, cookieOptions);

    // Set Refresh Token (longer life)
    if (refreshToken) {
      nextResponse.cookies.set('refresh_token', refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });
    }

    return nextResponse;

  } catch (error: any) {
    console.error('[Login Proxy] Error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}