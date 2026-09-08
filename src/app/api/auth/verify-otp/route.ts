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

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP required' },
        { status: 400 }
      );
    }

    // ─── 1. Verify OTP with Communications Engine ──────────────────
    console.log('📤 Calling Communications Engine OTP verify...');
    const otpResponse = await fetch(COMMS_URL + '/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });

    const otpData = await otpResponse.json();
    console.log('📥 OTP Verification response:', otpData);

    if (!otpData.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: otpData.message || 'Invalid OTP',
          attemptsRemaining: otpData.attemptsRemaining 
        },
        { status: 401 }
      );
    }

    // ─── 2. Get the merchant token from Auth Engine ──────────────────
    const authUrl = AUTH_API_BASE + '/v1/auth/login-with-otp';
    console.log('📤 Calling Auth Engine at:', authUrl);
    
    const authResponse = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const authData = await authResponse.json();
    console.log('📥 Auth Response:', authData);

    if (!authResponse.ok || !authData.token) {
      return NextResponse.json(
        { success: false, message: authData.error || 'Failed to generate session token' },
        { status: 500 }
      );
    }

    // ─── 3. Return success with token ──────────────────────────────────
    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      token: authData.token,
      merchant: authData.merchant,
      data: authData.merchant,
    });
  } catch (error: any) {
    console.error('❌ Verify OTP error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to verify OTP: ' + error.message },
      { status: 500 }
    );
  }
}