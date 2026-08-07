import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const merchantId = searchParams.get('merchantId');

  if (!merchantId) {
    return NextResponse.json(
      { success: false, error: 'Merchant ID is required' },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch Merchant details
    const { data: merchant, error: merchError } = await supabase
      .from('merchants')
      .select('*') // Fetch all fields
      .eq('merchant_id', merchantId)
      .single();

    if (merchError || !merchant) {
      console.error('❌ Onboarding: Merchant not found:', merchError);
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // 2. Build the 4-step Onboarding Array
    const steps = [
      {
        id: 1,
        label: '01 — Business Profile',
        href: '/dashboard/onboarding/stage1',
        // ✅ FIXED: Checks ALL Stage 1 required fields collected in the form
        completed: !!(
          merchant.business_type && 
          merchant.business_location && 
          merchant.business_registration_number &&
          merchant.country &&
          merchant.phone
          // Note: 'phone' in merchants table corresponds to 'business_phone' in Stage 1 form
        ),
      },
      {
        id: 2,
        label: '02 — Owners & Documents',
        href: '/dashboard/onboarding/stage2',
        completed: false, // Future KYC table check
      },
      {
        id: 3,
        label: '03 — Tax & Compliance',
        href: '/dashboard/onboarding/stage3',
        completed: false,
      },
      {
        id: 4,
        label: '04 — Settlement',
        href: '/dashboard/onboarding/stage4',
        completed: !!(merchant.settlement_phone && merchant.settlement_phone.length > 0),
      },
    ];

    const completedSteps = steps.filter(s => s.completed).length;
    const totalSteps = steps.length;

    console.log(`✅ Onboarding check for ${merchantId}: ${completedSteps}/${totalSteps}`);

    return NextResponse.json({
      success: true,
      data: {
        steps,
        completedSteps,
        totalSteps,
        isComplete: completedSteps === totalSteps,
      }
    });
  } catch (error: any) {
    console.error('❌ Onboarding API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}