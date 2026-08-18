/**
 * ============================================================================
 * XECOFLOW API
 * Schedule - Pause
 * ============================================================================
 *
 * POST /api/v1/schedules/:id/pause     - Pause a schedule
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
// POST /api/v1/schedules/:id/pause
// ============================================================================

export async function POST(
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

    if (existing.status === 'PAUSED') {
      return NextResponse.json(
        { success: false, error: 'Schedule is already paused' },
        { status: 400 }
      );
    }

    if (existing.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Cannot pause a completed schedule' },
        { status: 400 }
      );
    }

    if (existing.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Cannot pause a cancelled schedule' },
        { status: 400 }
      );
    }

    if (existing.status === 'FAILED') {
      return NextResponse.json(
        { success: false, error: 'Cannot pause a failed schedule' },
        { status: 400 }
      );
    }

    // ─── Build metadata with pause info ─────────────────────────────

    const currentMetadata = existing.metadata || {};
    const updatedMetadata = {
      ...currentMetadata,
      paused_at: new Date().toISOString(),
      paused_by: user.email || user.businessName || 'merchant',
    };

    // ─── Update status to PAUSED ────────────────────────────────────

    const { data, error } = await supabase
      .from('schedules')
      .update({
        status: 'PAUSED',
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
      message: 'Schedule paused successfully',
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}