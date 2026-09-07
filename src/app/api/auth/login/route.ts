// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';
const REQUEST_TIMEOUT = 10000;

export async function POST(request: NextRequest) {
  console.log('🚀 [Proxy] Login API called');

  try {
    const body = await request.json();
    const { email, password, rememberMe = false } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('📤 [Proxy] Forwarding login for:', email);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(`${BACKEND_URL}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, rememberMe }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // ─── ✅ Get raw response first ──────────────────────────────────
    const rawText = await response.text();
    console.log('📥 [Proxy] Raw response (first 200 chars):', rawText.substring(0, 200));

    // ─── ✅ Handle 429 Rate Limiting ──────────────────────────────
    if (response.status === 429) {
      console.log('📥 [Proxy] Rate limit hit (429)');
      
      // Try to parse as JSON, fallback to plain text
      let errorMessage = 'Too many login attempts. Please wait a moment.';
      let retryAfter = 30;
      
      try {
        const errorData = JSON.parse(rawText);
        errorMessage = errorData.message || errorData.error || errorMessage;
        retryAfter = errorData.retryAfter || 30;
      } catch {
        // If not JSON, use the text
        errorMessage = rawText || errorMessage;
        const retryHeader = response.headers.get('retry-after');
        if (retryHeader) {
          retryAfter = parseInt(retryHeader) || 30;
        }
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage,
          retryAfter: retryAfter
        },
        { status: 429 }
      );
    }

    // ─── ✅ Parse JSON for other responses ──────────────────────────
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error('❌ [Proxy] Failed to parse JSON:', parseError);
      console.error('❌ [Proxy] Raw response:', rawText);
      
      // Return the raw text as an error message
      return NextResponse.json(
        { 
          success: false, 
          message: rawText || 'Invalid response from server' 
        },
        { status: response.status || 500 }
      );
    }

    console.log('📥 [Proxy] Backend status:', response.status);
    console.log('📥 [Proxy] Parsed data:', JSON.stringify(data, null, 2));

    const nextResponse = NextResponse.json(data, {
      status: response.status,
    });

    // ─── ✅ Forward cookies ──────────────────────────────────────────
    const setCookieHeaders = response.headers.getSetCookie?.() || [];

    if (setCookieHeaders.length > 0) {
      console.log(`🍪 [Proxy] Forwarding ${setCookieHeaders.length} cookie(s)`);

      setCookieHeaders.forEach((cookie) => {
        // Remove Domain attribute so it works on frontend domain
        let cleanedCookie = cookie
          .split(';')
          .filter((part) => {
            const trimmed = part.trim().toLowerCase();
            // Remove Domain attribute
            if (trimmed.startsWith('domain=')) return false;
            return true;
          })
          .join(';');

        nextResponse.headers.append('Set-Cookie', cleanedCookie);
      });
    } else {
      console.log('⚠️ [Proxy] No Set-Cookie headers received from backend');
    }

    return nextResponse;

  } catch (error: any) {
    console.error('❌ [Proxy] Error:', error.message);
    console.error('❌ [Proxy] Stack:', error.stack);

    if (error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, message: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}