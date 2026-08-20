// src/app/api/merchant/onboarding/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const searchParams = req.nextUrl.searchParams;
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('kyc')
      .select('onboarding_status, stage1_status, stage2_status, stage3_status, stage4_status')
      .eq('merchant_id', parseInt(merchantId))
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // ✅ FIX: Check if onboarding is COMPLETED OR SUBMITTED
    const status = data?.onboarding_status;
    const isComplete = status === 'COMPLETED' || status === 'SUBMITTED';

    return NextResponse.json({
      success: true,
      data: {
        isComplete,
        onboardingStatus: status,
        stages: {
          stage1: data?.stage1_status,
          stage2: data?.stage2_status,
          stage3: data?.stage3_status,
          stage4: data?.stage4_status,
        }
      }
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}