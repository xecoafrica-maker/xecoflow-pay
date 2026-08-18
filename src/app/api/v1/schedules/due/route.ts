/**
 * ============================================================================
 * XECOFLOW API
 * Schedules - Due Schedules
 * ============================================================================
 *
 * GET /api/v1/schedules/due          - Get schedules that are due for processing
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

    let query = supabase
      .from('schedules')
      .select('*')
      .eq('status', 'PENDING')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })
      .limit(limit);

    if (merchantId) {
      query = query.eq('merchant_id', parseInt(merchantId));
    }

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