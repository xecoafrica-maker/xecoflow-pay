/**
 * ============================================================================
 * XECOFLOW API
 * Schedules - Due Schedules
 * ============================================================================
 *
 * GET /api/v1/schedules/due          - Get schedules that are due for processing
 *
 * This endpoint is used by the scheduler worker to find schedules that
 * are ready to be executed.
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
// GET /api/v1/schedules/due
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // ─── Optional authentication for internal use ──────────────────
    // For scheduler worker, can skip auth or use internal token
    const isInternal = req.headers.get('x-internal-key') === process.env.INTERNAL_SERVICE_TOKEN;
    
    if (!isInternal) {
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
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '100');
    const merchantId = searchParams.get('merchantId');

    // ─── Build query ─────────────────────────────────────────────────

    let query = supabase
      .from('schedules')
      .select('*')
      .eq('status', 'PENDING')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    // If merchantId provided, filter by merchant
    if (merchantId) {
      query = query.eq('merchant_id', parseInt(merchantId));
    }

    // ─── Execute query ──────────────────────────────────────────────

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}