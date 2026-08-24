import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, phone, email, customerName } = body;

    if (!productId || !phone) {
      return NextResponse.json(
        { success: false, error: 'Product ID and phone are required' },
        { status: 400 }
      );
    }

    // Forward to backend payment endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://xecoflow-2gen.onrender.com';
    
    const response = await fetch(`${backendUrl}/v1/product-links/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, phone, email, customerName }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}