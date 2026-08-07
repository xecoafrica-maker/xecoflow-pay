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
      .select('*') // Fetch all fields so we can check completion accurately
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
        label: 'Business Details',
        href: '/dashboard/onboarding/stage1',
        completed: merchant.business_type && merchant.business_location && merchant.business_registration_number,
      },
      {
        id: 2,
        label: 'Directors & Documents',
        href: '/dashboard/onboarding/stage2',
        completed: false, // This will be true once we query the KYC table
      },
      {
        id: 3,
        label: 'Tax & Compliance',
        href: '/dashboard/onboarding/stage3',
        completed: false, // Future KYC check
      },
      {
        id: 4,
        label: 'Settlement',
        href: '/dashboard/onboarding/stage4',
        completed: merchant.settlement_phone && merchant.settlement_phone.length > 0,
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