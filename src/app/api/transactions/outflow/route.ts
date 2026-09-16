// src/app/api/transactions/outflow/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const merchantId = searchParams.get('merchantId');
    const limit = searchParams.get('limit') || '500';
    const offset = searchParams.get('offset') || '0';

    const cookieHeader = request.headers.get('cookie') || '';

    console.log('📤 [Outflow Proxy] Fetching outflow for merchant:', merchantId);

    const params = new URLSearchParams();
    if (merchantId) params.append('merchantId', merchantId);
    if (limit) params.append('limit', limit);
    if (offset) params.append('offset', offset);

    const url = `${BACKEND_URL}/v1/transactions/outflow?${params.toString()}`;
    console.log('📤 [Outflow Proxy] Forwarding to:', url);

    const response = await fetch(url, {
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('📥 [Outflow Proxy] Response status:', response.status);
    console.log('📥 [Outflow Proxy] Found:', data.data?.length || 0, 'transactions');

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('❌ [Outflow Proxy] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}