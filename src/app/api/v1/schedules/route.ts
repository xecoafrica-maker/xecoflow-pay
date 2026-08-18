/**
 * ============================================================================
 * XECOFLOW API
 * Schedules - List & Create
 * ============================================================================
 *
 * GET  /api/v1/schedules          - List schedules for merchant
 * POST /api/v1/schedules          - Create a new schedule
 *
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// GET /api/v1/schedules
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user || !user.merchantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const merchantId = user.merchantId;
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const frequency = searchParams.get('frequency');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('schedules')
      .select('*', { count: 'exact' })
      .eq('merchant_id', merchantId)
      .order('scheduled_at', { ascending: true });

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    if (frequency && frequency !== 'All') {
      query = query.eq('frequency', frequency.toLowerCase());
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Transform data to match frontend type
    const transformedData = (data || []).map((item: any) => ({
      id: item.id,
      name: item.schedule_type || 'Scheduled Withdrawal',
      description: `${item.schedule_type} of ${item.amount} ${item.currency}`,
      amount: Number(item.amount),
      frequency: item.frequency || 'weekly',
      method: item.destination_type === 'MPESA_PHONE' ? 'M-PESA' : 'Bank Transfer',
      status: item.status || 'PENDING',
      recipient: item.destination_reference || item.destination_account_number || 'N/A',
      startDate: item.created_at,
      nextDate: item.scheduled_at,
      time: item.scheduled_at ? new Date(item.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '08:00',
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/v1/schedules
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = verifyToken(token);
    if (!user || !user.merchantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    const {
      amount,
      frequency,
      nextDate,
      time,
      method,
      destination_reference,
      destination_type,
    } = body;

    if (!amount || !frequency || !nextDate) {
      return NextResponse.json(
        { success: false, error: 'Amount, frequency, and next date are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be greater than zero' },
        { status: 400 }
      );
    }

    const merchantId = user.merchantId;
    const paddedId = String(merchantId).padStart(8, '0');
    const sourceAccountNumber = `1-1001-${paddedId}`;

    let destinationType = destination_type || 'MPESA_PHONE';
    let destinationReference = destination_reference || '';

    if (method === 'M-PESA' && !destinationReference) {
      destinationReference = '254712071385';
    }

    const scheduleData = {
      merchant_id: merchantId,
      source_account_number: sourceAccountNumber,
      destination_type: destinationType,
      destination_reference: destinationReference,
      schedule_type: 'WITHDRAWAL',
      action: 'EXECUTE_WITHDRAWAL',
      amount: Number(amount),
      scheduled_at: new Date(`${nextDate}T${time || '08:00:00'}`).toISOString(),
      frequency: frequency.toLowerCase(),
      status: 'PENDING',
      max_attempts: 3,
      metadata: {
        source: 'dashboard',
        created_by: 'merchant',
        method: method || 'M-PESA',
      },
    };

    const { data, error } = await supabase
      .from('schedules')
      .insert(scheduleData)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}