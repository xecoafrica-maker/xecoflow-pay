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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    console.log('🔍 Fetching transactions for merchant:', merchantId);

    // Build the query
    let query = supabase
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by merchant ID if provided
    if (merchantId) {
      query = query.eq('user_id', merchantId);
    }

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Search by phone number or transaction ID
    if (search) {
      // Use multiple ilike conditions
      query = query.or('phone_number.ilike.%' + search + '%,id.ilike.%' + search + '%,checkout_id.ilike.%' + search + '%');
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('payment_transactions')
      .select('*', { count: 'exact', head: true });

    if (merchantId) {
      countQuery = countQuery.eq('user_id', merchantId);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('❌ Count error:', countError);
    }

    console.log('✅ Found ' + (data?.length || 0) + ' transactions');

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        total: count || 0,
        limit: limit,
        offset: offset,
      },
    });
  } catch (error: any) {
    console.error('❌ Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
