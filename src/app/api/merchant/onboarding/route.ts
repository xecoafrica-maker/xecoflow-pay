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
    // 1. Fetch Merchant details from 'merchants' table
    const { data: merchant, error: merchError } = await supabase
      .from('merchants')
      .select('*')
      .eq('merchant_id', merchantId)
      .single();

    if (merchError || !merchant) {
      console.error('❌ Onboarding: Merchant not found:', merchError);
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // 2. Fetch KYC details from 'kyc' table (Stage 2, 3, 4 live here)
    const { data: kyc, error: kycError } = await supabase
      .from('kyc')
      .select('*')
      .eq('merchant_id', merchantId)
      .single();

    // If KYC table doesn't exist yet, that's fine, just treat as empty
    if (kycError && kycError.code !== 'PGRST116') {
      console.error('❌ Error fetching KYC:', kycError);
    }

    // 3. Build the 4-step Onboarding Array
    const steps = [
      {
        id: 1,
        label: '01 — Business Profile',
        href: '/dashboard/onboarding/stage1',
        // Stage 1 checks 'merchants' table fields
        completed: !!(
          merchant.business_type && 
          merchant.business_location && 
          merchant.business_registration_number &&
          merchant.country &&
          merchant.phone
        ),
      },
      {
        id: 2,
        label: '02 — Owners & Documents',
        href: '/dashboard/onboarding/stage2',
        // ✅ Stage 2 checks if 'directors' array exists and has data
        completed: !!(kyc && kyc.directors && Array.isArray(kyc.directors) && kyc.directors.length > 0),
      },
      {
        id: 3,
        label: '03 — Tax & Compliance',
        href: '/dashboard/onboarding/stage3',
        // ✅ Stage 3 checks if tax fields are filled
        completed: !!(kyc && (kyc.vat_number || kyc.filing_preference)),
      },
      {
        id: 4,
        label: '04 — Settlement',
        href: '/dashboard/onboarding/stage4',
        // ✅ Stage 4 checks if settlement details exist
        completed: !!(kyc && kyc.settlement_method && (kyc.settlement_phone || kyc.bank_name)),
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