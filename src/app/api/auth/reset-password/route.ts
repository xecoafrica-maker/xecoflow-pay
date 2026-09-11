// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';
const REQUEST_TIMEOUT = 30000; // 30 seconds

export async function POST(request: NextRequest) {
  console.log('🔐 [Proxy] Reset Password API called');

  try {
    const body = await request.json();
    const { token, email, newPassword } = body;

    // ─── Validate input ────────────────────────────────────────────
    if (!token || !email || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Token, email, and new password are required' },
        { status: 400 }
      );
    }

    console.log('📤 [Proxy] Forwarding reset-password for:', email);

    // ─── Forward to backend ────────────────────────────────────────
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${BACKEND_URL}/v1/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: String(token).trim(),
          email: String(email).trim().toLowerCase(),
          newPassword: String(newPassword),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      console.log('📥 [Proxy] Backend status:', response.status);
      console.log('📥 [Proxy] Backend response:', JSON.stringify(data, null, 2));

      // ─── Forward response ───────────────────────────────────────
      return NextResponse.json(data, {
        status: response.status,
      });

    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('❌ [Proxy] Error:', error.message);
      console.error('❌ [Proxy] Stack:', error.stack);

      if (error.name === 'AbortError') {
        return NextResponse.json(
          { success: false, message: 'Request timed out. Please try again.' },
          { status: 504 }
        );
      }

      return NextResponse.json(
        { success: false, message: 'An unexpected error occurred. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ [Proxy] Error:', error.message);
    console.error('❌ [Proxy] Stack:', error.stack);

    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}