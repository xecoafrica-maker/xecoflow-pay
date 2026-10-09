// src/app/api/kyc/route.ts
// Bare /api/kyc route. All meaningful endpoints live under
// /api/kyc/admin/* and are handled by [...path]/route.ts. This
// file exists so Next.js has a resolver for the parent path and
// returns a helpful response instead of a raw 404.

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'Specify a KYC subpath, e.g. /api/kyc/admin/pending',
      },
    },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'Specify a KYC subpath, e.g. /api/kyc/admin/123/verify',
      },
    },
    { status: 404 }
  );
}