import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    console.log('🔍 Fetching dashboard stats for merchant:', merchantId);

    // Build the query
    let query = supabase.from('payment_transactions').select('*');

    if (merchantId) {
      query = query.eq('user_id', merchantId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const transactions = data || [];
    const totalTransactions = transactions.length;

    // Calculate total amount
    const totalAmount = transactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    // Calculate pending transactions
    const pendingTransactions = transactions.filter((t: any) => 
      t.status === 'AWAITING_CUSTOMER_PIN' || t.payment_status === 'PENDING'
    ).length;

    // Calculate completed transactions
    const completedTransactions = transactions.filter((t: any) => 
      t.status === 'COMPLETED' || t.payment_status === 'SUCCESS'
    ).length;

    // Calculate failed transactions
    const failedTransactions = transactions.filter((t: any) => 
      t.status === 'FAILED' || t.status === 'ERROR' || t.payment_status === 'FAILED'
    ).length;

    // Calculate today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = transactions.filter((t: any) => new Date(t.created_at) >= today);
    const todayAmount = todayTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    // Group by status
    const statusCounts = transactions.reduce((acc: Record<string, number>, t: any) => {
      const status = t.status || t.payment_status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    console.log('✅ Stats calculated');

    return NextResponse.json({
      success: true,
      stats: {
        totalTransactions,
        totalAmount,
        pendingTransactions,
        completedTransactions,
        failedTransactions,
        todayTransactions: todayTransactions.length,
        todayAmount,
        statusCounts,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
