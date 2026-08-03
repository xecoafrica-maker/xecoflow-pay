// src/app/api/merchant/onboarding/route.ts
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
      .select('email_verified, settlement_phone, business_type, business_location')
      .eq('merchant_id', merchantId)
      .single();

    if (merchError || !merchant) {
      console.error('❌ Onboarding: Merchant not found:', merchError);
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // 2. Build the steps array (ONLY 2 STEPS)
    const steps = [
      {
        id: 1,
        label: 'Verify Business',
        href: '/dashboard/settings/verify',
        completed: merchant.email_verified === true,
      },
      {
        id: 2,
        label: 'Settlement Details',
        href: '/dashboard/settings/business', // 👈 We will create this page next
        completed: merchant.settlement_phone && 
                    merchant.settlement_phone.length > 0 &&
                    merchant.business_type &&
                    merchant.business_location,
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