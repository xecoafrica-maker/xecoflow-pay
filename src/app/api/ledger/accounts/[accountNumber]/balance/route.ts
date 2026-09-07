// src/app/api/ledger/accounts/[accountNumber]/balance/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountNumber: string }> }
) {
  try {
    const { accountNumber } = await params;
    // ✅ Forward the cookie from the request
    const cookieHeader = request.headers.get('cookie') || '';
    
    console.log('📤 [Balance Proxy] Fetching balance for account:', accountNumber);
    console.log('🍪 [Balance Proxy] Cookie present:', !!cookieHeader);
    
    const response = await fetch(`${BACKEND_URL}/v1/ledger/accounts/${accountNumber}/balance`, {
      headers: {
        'Cookie': cookieHeader,  // ✅ Forward the cookie!
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('📥 [Balance Proxy] Response status:', response.status);
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('❌ [Balance Proxy] Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}