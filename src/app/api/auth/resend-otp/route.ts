// src/app/api/auth/resend-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';

const COMMS_URL = process.env.COMMUNICATIONS_URL || 'http://localhost:3005';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    console.log('📤 Resending OTP for:', email);

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // ─── Call Communications Engine to resend OTP ──────────────────
    const response = await fetch(COMMS_URL + '/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    console.log('📥 Resend OTP response:', data);

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('❌ Resend OTP error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to resend OTP: ' + error.message },
      { status: 500 }
    );
  }
}