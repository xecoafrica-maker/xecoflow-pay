// src/app/api/auth/login/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ─── CONFIGURATION ──────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-this';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xecoflow-2gen.onrender.com';

// ─── HELPER: Generate JWT Token ────────────────────────────────────
function generateJWT(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payloadStr}`)
    .digest('base64url');
  
  return `${header}.${payloadStr}.${signature}`;
}

// ─── MAIN POST HANDLER ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // ─── 1. Parse Request Body ──────────────────────────────────────
    const body = await request.json();
    const { email, password } = body;
    
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
    console.log('📤 Forwarding login to backend:', BACKEND_URL + '/v1/auth/login');
    console.log('📤 Email:', email);
    
    const response = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    console.log('📥 Backend response status:', response.status);
    console.log('📥 Backend response body:', JSON.stringify(data, null, 2));
    
    // ─── 4. Handle Backend Response ─────────────────────────────────
    
    // ✅ Handle successful login (200 OK)
    if (response.ok && data.success) {
      console.log('✅ Backend login successful');
      
      // Extract merchant data
      let merchantData = data.data || data.merchant || data;
      
      if (!merchantData.merchantId && !merchantData.merchant_id) {
        merchantData = {
          merchantId: data.merchantId || data.merchant_id || '',
          businessName: data.businessName || data.business_name || '',
          email: data.email || email,
        };
      }
      
      const token = data.token || data.accessToken || data.data?.token;
      
      if (!token) {
        console.error('❌ No token in response');
        return NextResponse.json(
          {
            success: false,
            error: 'No token received from authentication server',
            code: 'NO_TOKEN',
          },
          { status: 500 }
        );
      }
      
      // ─── Generate our own token ──────────────────────────────────
      const ourToken = generateJWT({
        merchantId: String(merchantData.merchantId || merchantData.merchant_id || ''),
        email: merchantData.email || email,
        businessName: merchantData.businessName || merchantData.business_name || '',
        role: 'admin',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
        iat: Math.floor(Date.now() / 1000),
      });
      
      // ─── Return Success Response ──────────────────────────────────
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        token: ourToken,
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
    console.log('⚠️ Other error:', response.status, data);
    return NextResponse.json({
      success: false,
      error: data.message || data.error || 'Login failed. Please try again.',
      code: 'LOGIN_FAILED',
    }, { status: response.status || 500 });
    
  } catch (error: any) {
    console.error('❌ Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    }, { status: 500 });
  }
}