import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    console.log('📡 Payment request received:', {
      phone: body.phone,
      amount: body.amount,
      shortcode: body.shortcode,
      hasApiKey: !!body.apiKey,
      hasApiSecret: !!body.apiSecret
    });

    const { phone, amount, method, action, shortcode, transactionDesc, apiKey, apiSecret } = body;

    // Validate required fields
    const missingFields = [];
    if (!phone) missingFields.push('phone');
    if (!amount) missingFields.push('amount');
    if (!shortcode) missingFields.push('shortcode');
    if (!apiKey) missingFields.push('apiKey');
    if (!apiSecret) missingFields.push('apiSecret');

    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields.join(', '));
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: ' + missingFields.join(', '),
          missing: missingFields
        },
        { status: 400 }
      );
    }

    // Generate fresh values
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');
    const idempotencyKey = 'key-' + crypto.randomBytes(8).toString('hex');

    // Build payment body
    const paymentBody = {
      action: action || 'charge',
      method: method || 'mpesa',
      phone: phone,
      amount: Number(amount),
      shortcode: shortcode,
      idempotencyKey: idempotencyKey,
      transactionDesc: transactionDesc || 'Payment',
    };

    // Sort keys alphabetically (required for signature)
    const sortedKeys = Object.keys(paymentBody).sort();
    const sortedBody: Record<string, any> = {};
    sortedKeys.forEach((key) => {
      sortedBody[key] = paymentBody[key as keyof typeof paymentBody];
    });

    const bodyString = JSON.stringify(sortedBody);
    console.log('📝 Body for signature:', bodyString);

    // Generate HMAC-SHA256 signature
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(bodyString)
      .digest('hex');

    console.log('🔑 Generated signature:', signature.substring(0, 20) + '...');

    // Make request to XecoFlow payment engine
    const xecoflowUrl = process.env.XECOFLOW_API_URL || 'https://xecofLow-2gen.onrender.com/v1/payments';
    console.log('🌐 Calling XecoFlow:', xecoflowUrl);

    const response = await fetch(xecoflowUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-signature': signature,
        'x-timestamp': String(timestamp),
        'x-nonce': nonce,
      },
      body: JSON.stringify(paymentBody),
    });

    console.log('📥 XecoFlow response status:', response.status);

    // Parse response
    const data = await response.json();
    console.log('📥 XecoFlow response:', JSON.stringify(data, null, 2));

    // Return the response
    return NextResponse.json(data, { 
      status: response.status 
    });
  } catch (error: any) {
    console.error('❌ API Route error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, x-signature, x-timestamp, x-nonce',
    },
  });
}
