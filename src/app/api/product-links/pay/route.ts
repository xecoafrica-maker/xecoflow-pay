import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, phone, email, customerName, linkType } = body;

    if (!productId || !phone) {
      return NextResponse.json(
        { success: false, error: 'Product ID and phone are required' },
        { status: 400 }
      );
    }

    // Forward to backend payment endpoint
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://xecoflow-2gen.onrender.com';
    
    // Determine which endpoint to call based on linkType
    let endpoint = `${backendUrl}/v1/product-links/pay`;
    
    // If it's a payment link (no file), use the payment initiate endpoint
    if (linkType === 'payment') {
      endpoint = `${backendUrl}/v1/payments/initiate`;
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        productId, 
        phone, 
        email, 
        customerName,
        linkType // Pass through so backend knows
      }),
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