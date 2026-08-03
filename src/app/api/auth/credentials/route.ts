// src/app/api/auth/credentials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the correct environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || '';

console.log('🔑 SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('🔑 SUPABASE_SECRET_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');

// Only create client if we have both values
let supabase: any = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');
} else {
    console.log('❌ Supabase client NOT created - missing environment variables');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    console.log('🔍 Fetching credentials for merchant:', merchantId);

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID required' },
        { status: 400 }
      );
    }

    // Check if supabase is initialized
    if (!supabase) {
      console.error('❌ Supabase not initialized');
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Query the api_keys table
    const { data, error } = await supabase
      .from('api_keys')
      .select('api_key, api_secret, merchant_id')
      .eq('merchant_id', merchantId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Credentials not found: ' + error.message },
        { status: 404 }
      );
    }

    if (!data) {
      console.log('❌ No credentials found for merchant:', merchantId);
      return NextResponse.json(
        { success: false, error: 'No credentials found' },
        { status: 404 }
      );
    }

    console.log('✅ Credentials found for merchant:', merchantId);

    return NextResponse.json({
      success: true,
      data: {
        apiKey: data.api_key,
        apiSecret: data.api_secret,
        merchantId: data.merchant_id,
      }
    });
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}