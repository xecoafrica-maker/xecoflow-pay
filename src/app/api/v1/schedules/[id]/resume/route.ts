/**
 * ============================================================================
 * XECOFLOW API
 * Schedule - Resume
 * ============================================================================
 *
 * POST /api/v1/schedules/:id/resume    - Resume a paused schedule
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
// POST /api/v1/schedules/:id/resume
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // ─── Verify schedule exists and belongs to merchant ─────────────

    const { data: existing, error: existingError } = await supabase
      .from('schedules')
      .select('*')
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

    // ─── Validate current status ────────────────────────────────────

    if (existing.status !== 'PAUSED') {
      return NextResponse.json(
        { success: false, error: 'Schedule is not paused' },
        { status: 400 }
      );
    }

    // ─── Check if schedule is still valid ──────────────────────────

    const now = new Date();
    const scheduledAt = new Date(existing.scheduled_at);

    let updatedScheduledAt = existing.scheduled_at;
    if (scheduledAt < now) {
      // If the schedule date has passed, recalculate the next date
      const nextDate = calculateNextDate(now, existing.frequency);
      updatedScheduledAt = nextDate.toISOString();
    }

    // ─── Build metadata with resume info ────────────────────────────

    const currentMetadata = existing.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      resumed_at: new Date().toISOString(),
      resumed_by: user.email || user.businessName || 'merchant',
    };

    // ─── Update status to PENDING ───────────────────────────────────

    const { data, error } = await supabase
      .from('schedules')
      .update({
        status: 'PENDING',
        scheduled_at: updatedScheduledAt,
        updated_at: new Date().toISOString(),
        metadata: updatedMetadata,
      })
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
      message: 'Schedule resumed successfully',
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
// HELPERS
// ============================================================================

/**
 * Calculate the next processing date based on frequency.
 */
function calculateNextDate(
  currentDate: Date,
  frequency: string
): Date {
  const next = new Date(currentDate);

  switch (frequency?.toLowerCase()) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    default:
      next.setDate(next.getDate() + 7);
  }

  return next;
}