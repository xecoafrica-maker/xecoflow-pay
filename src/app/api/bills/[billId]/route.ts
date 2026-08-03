import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ billId: string }> }
) {
  try {
    // ✅ Await the params Promise
    const { billId } = await params;

    console.log('🔍 Fetching bill:', billId);

    if (!billId) {
      return NextResponse.json(
        { success: false, error: 'Bill ID required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('bill_id', billId)
      .single();

    if (error || !data) {
      console.error('❌ Bill not found:', error);
      return NextResponse.json(
        { success: false, error: 'Bill not found' },
        { status: 404 }
      );
    }

    // Check if bill is expired
    if (new Date(data.expiry_date) < new Date() && data.status === 'PENDING') {
      await supabase
        .from('bills')
        .update({ status: 'EXPIRED' })
        .eq('bill_id', billId);
      data.status = 'EXPIRED';
    }

    console.log('✅ Bill found:', billId);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
