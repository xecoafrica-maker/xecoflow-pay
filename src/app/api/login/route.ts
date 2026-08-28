// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';

// ─── CONFIGURATION ──────────────────────────────────────────────────
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xecoflow-2gen.onrender.com';

// ─── MAIN POST HANDLER ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // ─── 1. Parse Request Body ──────────────────────────────────────
    const body = await request.json();
    const { email, password } = body;
    
    console.log('📤 [API] Login request for:', email);
    
    // ─── 2. Validate Input ──────────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required',
          code: 'MISSING_CREDENTIALS',
        },
        { status: 400 }
      );
    }
    
    // ─── 3. Forward to Backend ──────────────────────────────────────
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
    
    // ─── 4. Handle Backend Response ─────────────────────────────────
    
    // ✅ Handle successful login (200 OK)
    if (response.ok && data.success) {
      console.log('✅ [API] Backend login successful');
      
      // ─── ✅ FIX: Extract token from nested data object ──────────────
      // The backend returns: { success: true, data: { accessToken: '...', ... } }
      const responseData = data.data || data;
      
      // Get token from accessToken field (inside data)
      const token = responseData.accessToken || responseData.token || data.token;
      
      if (!token) {
        console.error('❌ [API] No token in backend response');
        return NextResponse.json(
          {
            success: false,
            error: 'No token received from authentication server',
            code: 'NO_TOKEN',
          },
          { status: 500 }
        );
      }
      
      // Extract merchant data from the nested data object
      const merchantData = data.data || data.merchant || data;
      
      // ─── Return the backend token directly ────────────────────────
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        token: token,  // ← Now using the correct token from data.accessToken
        merchant: {
          merchantId: Number(merchantData.merchantId || merchantData.merchant_id || 0),
          businessName: merchantData.businessName || merchantData.business_name || '',
          email: merchantData.email || email,
        },
        sessionExpiry: 60 * 60 * 24 * 7,
      });
    }
    
    // ─── Handle Email not verified (403) ────────────────────────────
    if (response.status === 403) {
      return NextResponse.json({
        success: false,
        requiresVerification: true,
        error: data.message || 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
      }, { status: 403 });
    }
    
    // ─── Handle Account locked (423) ─────────────────────────────────
    if (response.status === 423) {
      return NextResponse.json({
        success: false,
        locked: true,
        error: data.message || 'Too many failed attempts. Please try again later.',
        code: 'ACCOUNT_LOCKED',
        lock_until: data.lock_until,
      }, { status: 423 });
    }
    
    // ─── Handle Invalid credentials (401) ────────────────────────────
    if (response.status === 401) {
      return NextResponse.json({
        success: false,
        error: data.message || 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
        attempts_remaining: data.attempts_remaining,
      }, { status: 401 });
    }
    
    // ─── Handle other errors ────────────────────────────────────────
    console.log('⚠️ [API] Other error:', response.status, data);
    return NextResponse.json({
      success: false,
      error: data.message || data.error || 'Login failed. Please try again.',
      code: 'LOGIN_FAILED',
    }, { status: response.status || 500 });
    
  } catch (error: any) {
    console.error('❌ [API] Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    }, { status: 500 });
  }
}