// src/lib/server-auth.ts

import { jwtVerify, type JWTPayload } from 'jose';

interface AuthUser extends JWTPayload {
  merchantId: number;
  email?: string;
  businessName?: string;
  role?: string;
}

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not configured');
}

const secret = new TextEncoder().encode(JWT_SECRET);

/**
 * Extract Bearer token from an HTTP request.
 */
export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return null;
  }

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7).trim();

  return token || null;
}

/**
 * Cryptographically verify a JWT.
 *
 * Unlike the client-side auth.ts helper, this function
 * verifies the JWT signature and should only be used
 * on the server.
 */
export async function verifyToken(
  token: string
): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret);

    if (!payload.merchantId) {
      return null;
    }

    return {
      ...payload,
      merchantId: Number(payload.merchantId),
      email: payload.email as string | undefined,
      businessName: payload.businessName as string | undefined,
      role: payload.role as string | undefined,
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Authenticate a request.
 *
 * Returns the authenticated merchant or null.
 */
export async function authenticateRequest(
  req: Request
): Promise<AuthUser | null> {
  const token = getTokenFromRequest(req);

  if (!token) {
    return null;
  }

  return verifyToken(token);
}