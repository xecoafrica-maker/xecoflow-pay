import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      merchantId, 
      businessName,
      customerName, 
      customerEmail, 
      customerPhone, 
      items,
      subtotal,
      tax,
      total,
      currency,
      taxRate,
      expiryDays,
      description,
      
      // ✅ NEW FIELDS FOR PRODUCTS
      returnUrl,
      fileUrl,
      billType = 'ONE_TIME' 
    } = body;

    console.log('📡 Creating bill for merchant:', merchantId);
    console.log('📁 File attached:', fileUrl ? 'Yes' : 'No');

    if (!merchantId || !customerName || !total) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate unique bill ID
    const billId = 'BILL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + (expiryDays || 7));

    // Insert bill into database (with the new columns)
    const { data, error } = await supabase
      .from('bills')
      .insert({
        bill_id: billId,
        merchant_id: merchantId,
        business_name: businessName || '',
        customer_name: customerName,
        customer_email: customerEmail || '',
        customer_phone: customerPhone || '',
        amount: total,
        currency: currency || 'KES',
        description: description || '',
        items: items || [],
        subtotal: subtotal || 0,
        tax: tax || 0,
        tax_rate: taxRate || 0,
        expiry_date: expiryDate.toISOString(),
        status: 'PENDING',
        
        // ✅ SAVING THE NEW FIELDS
        return_url: returnUrl || null,
        file_url: fileUrl || null
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating bill:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Get the base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Use the correct bill view path
    const paymentLink = baseUrl + '/bill/' + billId;

    console.log('✅ Bill created:', billId);
    console.log('🔗 Payment link:', paymentLink);

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        bill_id: billId,
        payment_link: paymentLink,
      }
    });
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}