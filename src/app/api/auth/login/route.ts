// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';

export async function POST(request: NextRequest) {
  console.log('🚀 [Proxy] API route called!');
  
  try {
    const body = await request.json();
    console.log('📤 [Proxy] Login request for:', body.email);

    // Forward to backend
    const response = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // ✅ Get the response as text first
    const rawText = await response.text();
    console.log('📥 [Proxy] Raw response (first 200 chars):', rawText.substring(0, 200));

    // ✅ Parse JSON
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error('❌ [Proxy] Failed to parse JSON:', parseError);
      return NextResponse.json(
        { success: false, message: 'Invalid response from server' },
        { status: 500 }
      );
    }

    console.log('📥 [Proxy] Parsed data:', JSON.stringify(data, null, 2));

    // ✅ Create response
    const nextResponse = NextResponse.json(data, { 
      status: response.status 
    });

    // ✅ Forward cookie
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      console.log('🍪 [Proxy] Forwarding cookie');
      nextResponse.headers.set('Set-Cookie', setCookie);
    } else {
      console.log('⚠️ [Proxy] No cookie received');
    }

    return nextResponse;

  } catch (error: any) {
    console.error('❌ [Proxy] Error:', error.message);
    console.error('❌ [Proxy] Stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}