// src/app/api/bills/pay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

// Initialize Supabase (for fetching bill and merchant API keys)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { billId, phone } = body;

    if (!billId || !phone) {
      return NextResponse.json(
        { success: false, error: 'Bill ID and phone number are required' },
        { status: 400 }
      );
    }

    // ─── 1. Format Phone Number ──────────────────────────────────────
    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.slice(1);
    if (!formattedPhone.startsWith('254') && formattedPhone.length === 10) formattedPhone = '254' + formattedPhone;
    if (!formattedPhone.startsWith('254') && formattedPhone.length === 9) formattedPhone = '254' + formattedPhone;

    if (formattedPhone.length !== 12) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // ─── 2. Fetch Bill from Database ─────────────────────────────────
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('*')
      .eq('bill_id', billId)
      .single();

    if (billError || !bill) {
      console.error('❌ Bill not found:', billError);
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      );
    }

    // Check if bill is already paid or expired
    if (bill.status === 'PAID') {
      return NextResponse.json(
        { success: false, error: 'This bill has already been paid' },
        { status: 400 }
      );
    }

    if (new Date(bill.expiry_date) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This bill has expired' },
        { status: 400 }
      );
    }

    // ─── 3. Fetch Merchant API Credentials ──────────────────────────
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('api_key, api_secret')
      .eq('merchant_id', bill.merchant_id)
      .single();

    if (keysError || !apiKeys) {
      console.error('❌ Merchant API keys not found:', keysError);
      return NextResponse.json(
        { success: false, error: 'Merchant payment configuration not found' },
        { status: 500 }
      );
    }

    // ─── 4. Generate Signature and Call XecoFlow Payment Engine ──────
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = crypto.randomBytes(16).toString('hex');
    const idempotencyKey = 'key-' + crypto.randomBytes(8).toString('hex');
    const apiKey = apiKeys.api_key;
    const apiSecret = apiKeys.api_secret;

    // Build payment body (exactly as your working /charge endpoint)
    const paymentBody = {
      action: 'charge',
      method: 'mpesa',
      phone: formattedPhone,
      amount: Number(bill.amount),
      shortcode: bill.merchant_id,
      idempotencyKey: idempotencyKey,
      transactionDesc: bill.description || 'Smart Bill Payment',
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
    const data = await response.json();
    console.log('📥 XecoFlow response:', JSON.stringify(data, null, 2));

    // ─── 5. If successful, update bill to PROCESSING ─────────────────
    if (response.ok && data.success) {
      await supabase
        .from('bills')
        .update({
          status: 'PROCESSING',
          updated_at: new Date().toISOString(),
        })
        .eq('bill_id', billId);
    }

    // ─── 6. Return the exact response from XecoFlow to the frontend ──
    return NextResponse.json(data, { 
      status: response.status 
    });

  } catch (error: any) {
    console.error('❌ API Route error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
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