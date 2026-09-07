// src/app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const merchantId = searchParams.get('merchantId');
    const limit = searchParams.get('limit') || '100';
    
    // ✅ Forward the cookie from the request
    const cookieHeader = request.headers.get('cookie') || '';
    
    console.log('📤 [Stats Proxy] Fetching dashboard stats for merchant:', merchantId);
    console.log('🍪 [Stats Proxy] Cookie present:', !!cookieHeader);
    
    // ✅ Forward to backend
    const response = await fetch(`${BACKEND_URL}/v1/dashboard/stats?merchantId=${merchantId}&limit=${limit}`, {
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('📥 [Stats Proxy] Response status:', response.status);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('❌ [Stats Proxy] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}