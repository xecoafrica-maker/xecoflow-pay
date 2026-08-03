// src/app/api/auth/resend-otp/route.ts
import { NextRequest, NextResponse } from 'next/server';

const COMMS_URL = process.env.COMMUNICATIONS_URL || 'http://localhost:3005';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    console.log('🔄 Resending OTP for:', email);

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email required' },
        { status: 400 }
      );
    }

    const response = await fetch(COMMS_URL + '/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: 'Merchant' }),
    });

    const data = await response.json();
    console.log('📥 Communications Engine response:', data);

    if (data.success) {
      return NextResponse.json({
        success: true,
        message: 'OTP resent successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to resend OTP' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Resend OTP error:', error.message);
    return NextResponse.json(
      { success: false, message: 'Failed to connect: ' + error.message },
      { status: 500 }
    );
  }
}
