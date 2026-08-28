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
      // Backend returns: { success: true, data: { accessToken: '...', ... } }
      const responseData = data.data || {};
      
      // Get token from accessToken field (inside data)
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
      
      // ─── ✅ Return formatted response ──────────────────────────────
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        token: token,
        merchant: {
          merchantId: Number(responseData.merchantId || data.merchantId || 0),
          businessName: responseData.businessName || data.businessName || '',
          email: responseData.email || email,
        },
        sessionExpiry: 60 * 60 * 24 * 7,
      });
    }
    
    // ─── Handle errors ──────────────────────────────────────────────
    console.log('⚠️ [API] Login failed:', response.status, data);
    
    if (response.status === 401) {
      return NextResponse.json({
        success: false,
        error: data.message || 'Invalid email or password',
        attempts_remaining: data.attempts_remaining,
      }, { status: 401 });
    }
    
    if (response.status === 403) {
      return NextResponse.json({
        success: false,
        requiresVerification: true,
        error: data.message || 'Please verify your email before logging in.',
      }, { status: 403 });
    }
    
    if (response.status === 423) {
      return NextResponse.json({
        success: false,
        locked: true,
        error: data.message || 'Too many failed attempts. Please try again later.',
      }, { status: 423 });
    }
    
    return NextResponse.json({
      success: false,
      error: data.message || data.error || 'Login failed. Please try again.',
    }, { status: response.status || 500 });
    
  } catch (error: any) {
    console.error('❌ [API] Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred',
    }, { status: 500 });
  }
}