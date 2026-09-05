// src/app/api/ledger/accounts/[accountNumber]/balance/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';

export async function GET(
  request: NextRequest,
  { params }: { params: { accountNumber: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const { accountNumber } = params;
    
    console.log('📤 [Balance Proxy] Fetching balance for account:', accountNumber);
    
    const response = await fetch(`${BACKEND_URL}/v1/ledger/accounts/${accountNumber}/balance`, {
      headers: {
        'Authorization': authHeader || '',
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