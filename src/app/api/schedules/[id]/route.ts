import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL || 'https://xecoflow-2gen.onrender.com';

// ─── DELETE /api/schedules/:id ───────────────────────────────
// Forwards to DELETE /v1/schedules/:id on the backend.
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cookieHeader = request.headers.get('cookie') || '';
    const searchParams = request.nextUrl.searchParams;

    const url = `${BACKEND_URL}/v1/schedules/${id}?${searchParams.toString()}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
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