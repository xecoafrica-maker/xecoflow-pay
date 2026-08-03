// src/app/api/products/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // 1. Parse the incoming form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const merchantId = formData.get('merchantId') as string | null;

    // 2. Validation
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // 3. Generate a safe, unique file name
    const fileExt = file.name.split('.').pop();
    const safeFileName = `${merchantId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.${fileExt}`;

    // 4. Convert file to Buffer for Supabase
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 5. Upload to Supabase Storage into the 'products' bucket
    const { data, error } = await supabase.storage
      .from('products') // Make sure you created this bucket in Supabase!
      .upload(safeFileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase storage upload error:', error);
      return NextResponse.json(
        { success: false, error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    // 6. Generate the public URL
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(safeFileName);

    const fileUrl = urlData.publicUrl;

    console.log('✅ File uploaded successfully to:', fileUrl);

    // 7. Return the URL to the frontend
    return NextResponse.json({
      success: true,
      fileUrl: fileUrl,
      fileName: safeFileName,
    });

  } catch (error: any) {
    console.error('❌ Upload API Internal Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during upload' },
      { status: 500 }
    );
  }
}