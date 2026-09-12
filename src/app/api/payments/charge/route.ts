import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

// ─── Stable stringify (MUST match backend stk.middleware) ──────────
function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(stableStringify).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
  const parts: string[] = [];
  for (const key of sortedKeys) {
    if (key === 'signature' || key === 'x-signature') continue;
    parts.push(
      JSON.stringify(key) + ':' + stableStringify((obj as Record<string, unknown>)[key])
    );
  }
  return '{' + parts.join(',') + '}';
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    console.log('📡 Payment request received:', {
      phone: body.phone,
      amount: body.amount,
      shortcode: body.shortcode,
      hasApiKey: !!body.apiKey,
      hasApiSecret: !!body.apiSecret,
    });

    const {
      phone,
      amount,
      method,
      action,
      shortcode,
      transactionDesc,
      apiKey,
      apiSecret,
    } = body;

    // Validate required fields
    const missingFields: string[] = [];
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
          missing: missingFields,
        },
        { status: 400 }
      );
    }

    // Generate fresh values
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');
    const idempotencyKey = 'key-' + crypto.randomBytes(8).toString('hex');

    // Build payment body — this is what gets sent AND signed
    const paymentBody = {
      action: action || 'charge',
      method: method || 'mpesa',
      phone: phone,
      amount: Number(amount),
      shortcode: shortcode,
      idempotencyKey: idempotencyKey,
      transactionDesc: transactionDesc || 'Payment',
    };

    // ✅ Canonical body — matches backend's stableStringify exactly
    const bodyString = stableStringify(paymentBody);
    console.log('📝 Canonical body for signature:', bodyString);

    // ✅ Canonical string — MUST match backend stk.middleware format:
    //    `${timestamp}.${nonce}.${METHOD}.${PATH}.${bodyString}`
    const requestPath = '/v1/payments';
    const requestMethod = 'POST';
    const canonicalString = `${timestamp}.${nonce}.${requestMethod}.${requestPath}.${bodyString}`;
    console.log('📝 Canonical string for signature:', canonicalString);

    // Generate HMAC-SHA256 signature over the canonical string
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(canonicalString)
      .digest('hex');

    console.log('🔑 Generated signature:', signature.substring(0, 20) + '...');

    // Make request to XecoFlow payment engine
    const xecoflowUrl =
      process.env.XECOFLOW_API_URL ||
      'https://xecoflow-2gen.onrender.com/v1/payments';
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
      body: bodyString, // ✅ Send the EXACT string that was signed
    });

    console.log('📥 XecoFlow response status:', response.status);

    // Parse response
    const data = await response.json();
    console.log('📥 XecoFlow response:', JSON.stringify(data, null, 2));

    // Return the response
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error: any) {
    console.error('❌ API Route error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
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
      'Access-Control-Allow-Headers':
        'Content-Type, x-api-key, x-signature, x-timestamp, x-nonce',
    },
  });
}