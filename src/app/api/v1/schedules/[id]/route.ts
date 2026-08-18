/**
 * ============================================================================
 * XECOFLOW API
 * Schedule - Get, Update, Delete
 * ============================================================================
 *
 * GET    /api/v1/schedules/:id          - Get a single schedule
 * PUT    /api/v1/schedules/:id          - Update a schedule
 * DELETE /api/v1/schedules/:id          - Delete a schedule
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
// GET /api/v1/schedules/:id
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = await params;
    const merchantId = user.merchantId;

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .eq('merchant_id', merchantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Schedule not found' },
          { status: 404 }
        );
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const transformedData = {
      id: data.id,
      name: data.schedule_type || 'Scheduled Withdrawal',
      description: `${data.schedule_type} of ${data.amount} ${data.currency}`,
      amount: Number(data.amount),
      frequency: data.frequency || 'weekly',
      method: data.destination_type === 'MPESA_PHONE' ? 'M-PESA' : 'Bank Transfer',
      status: data.status || 'PENDING',
      recipient: data.destination_reference || data.destination_account_number || 'N/A',
      startDate: data.created_at,
      nextDate: data.scheduled_at,
      time: data.scheduled_at ? new Date(data.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '08:00',
      created_at: data.created_at,
      updated_at: data.updated_at,
      source_account_number: data.source_account_number,
      destination_type: data.destination_type,
      destination_reference: data.destination_reference,
      schedule_type: data.schedule_type,
      action: data.action,
      currency: data.currency,
      max_attempts: data.max_attempts,
      attempts: data.attempts,
      metadata: data.metadata,
    };

    return NextResponse.json({
      success: true,
      data: transformedData,
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
// PUT /api/v1/schedules/:id
// ============================================================================

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = await params;
    const merchantId = user.merchantId;
    const body = await req.json();

    const { data: existing, error: existingError } = await supabase
      .from('schedules')
      .select('id, status')
      .eq('id', id)
      .eq('merchant_id', merchantId)
      .single();

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Schedule not found' },
          { status: 404 }
        );
      }
      console.error('Supabase error:', existingError);
      return NextResponse.json(
        { success: false, error: existingError.message },
        { status: 500 }
      );
    }

    if (existing.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Cannot update a completed schedule' },
        { status: 400 }
      );
    }

    if (existing.status === 'FAILED') {
      return NextResponse.json(
        { success: false, error: 'Cannot update a failed schedule. Please delete and recreate.' },
        { status: 400 }
      );
    }

    const {
      frequency,
      amount,
      nextDate,
      time,
      destination_type,
      destination_reference,
    } = body;

    const updateData: Record<string, any> = {};

    if (frequency) updateData.frequency = frequency.toLowerCase();
    if (amount) updateData.amount = Number(amount);
    if (nextDate && time) {
      updateData.scheduled_at = new Date(`${nextDate}T${time || '08:00:00'}`).toISOString();
    } else if (nextDate) {
      updateData.scheduled_at = new Date(`${nextDate}T08:00:00`).toISOString();
    }
    if (destination_type) updateData.destination_type = destination_type;
    if (destination_reference) updateData.destination_reference = destination_reference;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('schedules')
      .update(updateData)
      .eq('id', id)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
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

// ============================================================================
// DELETE /api/v1/schedules/:id
// ============================================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = await params;
    const merchantId = user.merchantId;

    const { data: existing, error: existingError } = await supabase
      .from('schedules')
      .select('id, status')
      .eq('id', id)
      .eq('merchant_id', merchantId)
      .single();

    if (existingError) {
      if (existingError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Schedule not found' },
          { status: 404 }
        );
      }
      console.error('Supabase error:', existingError);
      return NextResponse.json(
        { success: false, error: existingError.message },
        { status: 500 }
      );
    }

    if (existing.status === 'PROCESSING') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete a schedule that is currently processing' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
      .eq('merchant_id', merchantId);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule deleted successfully',
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}