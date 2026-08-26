import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// ─── Supabase Client Setup ───────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Use service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ─── GET /api/payment-pages ────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || !user.merchantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const merchantId = user.merchantId;

    const { data, error } = await supabaseAdmin
      .from('payment_pages')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── POST /api/payment-pages ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || !user.merchantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const merchantId = user.merchantId;

    const {
      name,
      description,
      amountType,
      amount,
      currency,
      customFields,
      brandColor,
      logoUrl,
      successUrl,
      cancelUrl,
      collectName,
      collectEmail,
      collectPhone,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: 'Page name is required' }, { status: 400 });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substring(2, 6);

    const { data, error } = await supabaseAdmin
      .from('payment_pages')
      .insert({
        merchant_id: merchantId,
        name: name.trim(),
        description: description || '',
        slug,
        amount_type: amountType || 'fixed',
        amount: amount || null,
        currency: currency || 'KES',
        custom_fields: customFields || [],
        brand_color: brandColor || '#635bff',
        logo_url: logoUrl || '',
        success_url: successUrl || '',
        cancel_url: cancelUrl || '',
        collect_name: collectName !== undefined ? collectName : true,
        collect_email: collectEmail !== undefined ? collectEmail : true,
        collect_phone: collectPhone !== undefined ? collectPhone : true,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}