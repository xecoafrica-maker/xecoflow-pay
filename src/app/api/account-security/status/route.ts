import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cookieHeader = request.headers.get('cookie') || '';

    const params = new URLSearchParams();
    for (const [k, v] of searchParams.entries()) {
      params.append(k, v);
    }

    const url = `${BACKEND_URL}/v1/security-questions/status?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}