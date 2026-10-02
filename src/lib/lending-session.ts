// src/lib/lending-session.ts
// Read-only consumer of the existing merchant session.

import { cookies } from 'next/headers';

export interface MerchantSession {
  merchantId: number;
  businessName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status: string;
  role: string;
  emailVerified: boolean;
}

export async function getLendingSession(): Promise<MerchantSession | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const res = await fetch(origin + '/api/auth/session', {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!res.ok) return null;
    const body = await res.json();
    const user = body && body.user;
    if (!user) return null;

    return {
      merchantId: user.merchantId,
      businessName: user.businessName,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      status: user.status,
      role: user.role,
      emailVerified: user.emailVerified,
    };
  } catch {
    return null;
  }
}