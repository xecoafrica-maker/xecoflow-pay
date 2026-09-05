// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';

export async function POST(request: NextRequest) {
  try {
    // ─── 1. Parse Request ───────────────────────────────────────────
    const body = await request.json();
    
    console.log('📤 [Proxy] Login request for:', body.email);

    // ─── 2. Validate Required Fields ───────────────────────────────
    if (!body.email || !body.password) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Email and password are required' 
        },
        { status: 400 }
      );
    }

    // ─── 3. Forward to Backend ──────────────────────────────────────
    const response = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // ─── 4. Get Response ────────────────────────────────────────────
    const data = await response.json();

    console.log('📥 [Proxy] Backend response status:', response.status);

    // ─── 5. Create Response ─────────────────────────────────────────
    const nextResponse = NextResponse.json(data, { 
      status: response.status 
    });

    // ─── 6. ✅ CRITICAL: Forward the Cookie! ────────────────────────
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      console.log('🍪 [Proxy] Forwarding cookie to frontend');
      nextResponse.headers.set('Set-Cookie', setCookie);
    }

    return nextResponse;

  } catch (error: any) {
    console.error('❌ [Proxy] Error:', error.message);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}