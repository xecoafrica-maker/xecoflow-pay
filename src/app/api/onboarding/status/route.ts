// src/app/api/onboarding/status/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';

export async function GET(request: NextRequest) {
  try {
    // ✅ Forward the cookie from the request
    const cookieHeader = request.headers.get('cookie') || '';
    
    console.log('📤 [Onboarding Proxy] Fetching onboarding status');
    console.log('🍪 [Onboarding Proxy] Cookie present:', !!cookieHeader);
    
    const response = await fetch(`${BACKEND_URL}/v1/onboarding/status`, {
      headers: {
        'Cookie': cookieHeader,  // ✅ Forward the cookie!
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('📥 [Onboarding Proxy] Response status:', response.status);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('❌ [Onboarding Proxy] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}