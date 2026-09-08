// src/app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';

const COMMS_URL = process.env.COMMUNICATIONS_URL || 'http://localhost:3005';
const AUTH_API_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, tempToken } = body;

    console.log('🔍 Verifying OTP for:', email);
    console.log('🔍 TempToken present:', !!tempToken);
    console.log('🔍 OTP:', otp);

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP required' },
        { status: 400 }
      );
    }

    // ─── 1. Verify OTP with Auth Engine ──────────────────────────
    // Auth Engine has the OTP verification logic and returns merchant data
    const authUrl = `${AUTH_API_BASE}/v1/auth/verify-otp`;
    console.log('📤 Calling Auth Engine at:', authUrl);
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, tempToken }),
    });

    const authData = await authResponse.json();
    console.log('📥 Auth Response:', JSON.stringify(authData, null, 2));

    if (!authResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: authData.message || 'Failed to verify OTP',
          attemptsRemaining: authData.attemptsRemaining 
        },
        { status: authResponse.status }
      );
    }

    // ─── 2. Extract merchant data from response ──────────────────
    // Auth Engine returns data in the 'data' field
    const merchantData = authData.data || authData.merchant || null;
    
    if (!merchantData) {
      console.error('❌ No merchant data in response:', authData);
      return NextResponse.json(
        { success: false, message: 'No merchant data received' },
        { status: 500 }
      );
    }

    console.log('✅ Merchant data received:', merchantData);

    // ─── 3. Get the token from cookies or response ──────────────
    // The token might be set as a cookie by Auth Engine
    // Or we can generate one here
    let token = authData.token || null;
    
    // If token is not in the body, try to get it from cookies
    if (!token) {
      const cookieHeader = authResponse.headers.get('set-cookie');
      if (cookieHeader) {
        const cookieMatch = cookieHeader.match(/auth_token=([^;]+)/);
        if (cookieMatch) {
          token = cookieMatch[1];
        }
      }
    }

    // ─── 4. Return success with token and merchant data ──────────
    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      token: token,
      merchant: merchantData,
      data: merchantData,
    });

  } catch (error: any) {
    console.error('❌ Verify OTP error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to verify OTP: ' + error.message },
      { status: 500 }
    );
  }
}