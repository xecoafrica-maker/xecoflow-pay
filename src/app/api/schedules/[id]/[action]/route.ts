import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';

// ─── POST /api/schedules/:id/:action ─────────────────────────
// Forwards to POST /v1/schedules/:id/:action on the backend.
// Used for pause / resume actions.
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const { id, action } = await context.params;
    const cookieHeader = request.headers.get('cookie') || '';
    const body = await request.text();

    const url = `${BACKEND_URL}/v1/schedules/${id}/${action}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      body: body || undefined,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}