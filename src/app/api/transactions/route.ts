// src/app/api/transactions/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const merchantId = searchParams.get('merchantId');
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    // ✅ Forward the cookie from the request
    const cookieHeader = request.headers.get('cookie') || '';
    
    console.log('📤 [Transactions Proxy] Fetching transactions for merchant:', merchantId);
    console.log('🍪 [Transactions Proxy] Cookie present:', !!cookieHeader);
    
    // Build query string
    const params = new URLSearchParams();
    if (merchantId) params.append('merchantId', merchantId);
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    
    const queryString = params.toString();
    const url = `${BACKEND_URL}/v1/transactions${queryString ? `?${queryString}` : ''}`;
    
    console.log('📤 [Transactions Proxy] Forwarding to:', url);
    
    // ✅ Forward to backend
    const response = await fetch(url, {
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('📥 [Transactions Proxy] Response status:', response.status);
    console.log('📥 [Transactions Proxy] Found:', data.data?.length || 0, 'transactions');
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('❌ [Transactions Proxy] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}