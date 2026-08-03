import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { merchantId, settlementPhone } = await request.json();

    if (!merchantId || !settlementPhone) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID and phone number are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('merchants')
      .update({ settlement_phone: settlementPhone })
      .eq('merchant_id', merchantId);

    if (error) {
      console.error('❌ Error updating settlement phone:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}