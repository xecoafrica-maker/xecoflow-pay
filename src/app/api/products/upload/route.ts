// src/app/api/products/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

// ✅ Only initialize Supabase if we have the required keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ✅ Don't throw during build - check at runtime
let supabase: any = null;
let supabaseInitialized = false;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    supabaseInitialized = true;
    console.log('✅ Supabase client initialized for upload API');
  } catch (error) {
    console.warn('⚠️ Supabase client initialization failed:', error);
  }
} else {
  console.warn('⚠️ Supabase credentials not available for upload API');
}

// ─── Configuration ──────────────────────────────────────────────
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'webp', 'txt'];

export async function POST(request: NextRequest) {
  try {
    // ─── 1. Authentication ──────────────────────────────────────────
    const token = getTokenFromRequest(request);
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

    // ─── 2. Check Supabase is initialized ──────────────────────────
    if (!supabaseInitialized || !supabase) {
      return NextResponse.json(
        { success: false, error: 'Storage service is not available. Please check configuration.' },
        { status: 503 }
      );
    }

    const merchantId = user.merchantId;

    // ─── 3. Parse Form Data ─────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const productId = formData.get('productId') as string | null;

    // ─── 4. Validate File ────────────────────────────────────────────
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          maxSize: MAX_FILE_SIZE,
        },
        { status: 400 }
      );
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
            allowedTypes: ALLOWED_EXTENSIONS,
          },
          { status: 400 }
        );
      }
    }

    // ─── 5. Generate Safe File Name ─────────────────────────────────
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const safeFileName = productId 
      ? `product_${productId}_${timestamp}_${random}.${fileExt}`
      : `merchant_${merchantId}_${timestamp}_${random}.${fileExt}`;

    // ─── 6. Upload to Supabase Storage ──────────────────────────────
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { data, error } = await supabase.storage
      .from('products')
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

    // ─── 7. Get Public URL ──────────────────────────────────────────
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(safeFileName);

    const fileUrl = urlData.publicUrl;

    console.log(`✅ File uploaded successfully for merchant ${merchantId}:`, fileUrl);

    // ─── 8. Return Response ─────────────────────────────────────────
    return NextResponse.json({
      success: true,
      data: {
        fileUrl: fileUrl,
        fileName: safeFileName,
        originalName: file.name,
        fileSize: file.size,
        fileType: file.type,
        merchantId: merchantId,
        uploadedAt: new Date().toISOString(),
      },
    });

  } catch (error: any) {
    console.error('❌ Upload API Internal Error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during upload' },
      { status: 500 }
    );
  }
}