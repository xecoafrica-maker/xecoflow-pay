'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ──────────────────────────────────────────────────────────
export interface SessionUser {
  merchantId: string;
  businessName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  status?: string;
  role?: string;
  emailVerified?: boolean;
}

export interface SessionInfo {
  remaining: number; // seconds left in the session
}

interface UseSessionReturn {
  user: SessionUser | null;
  sessionInfo: SessionInfo | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// ─── Hook ───────────────────────────────────────────────────────────
/**
 * Secure session hook for dashboard pages.
 *
 * - Fetches the current user from GET /api/auth/session
 * - Relies entirely on the HttpOnly cookie (xeco_session)
 * - Never touches localStorage or client-side tokens
 * - Redirects to /login on 401
 */
export function useSession(): UseSessionReturn {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prevent multiple simultaneous fetches
  const fetchingRef = useRef(false);
  // Prevent redirect loops
  const redirectedRef = useRef(false);

  const fetchSession = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setError(null);

      const res = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include', // critical: sends the HttpOnly cookie
        cache: 'no-store',
      });

      if (res.status === 401) {
        // Session is missing or expired
        setUser(null);
        setSessionInfo(null);

        if (!redirectedRef.current) {
          redirectedRef.current = true;
          router.replace('/login?session=expired');
        }
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to load session');
      }

      const data = await res.json();

      if (data.user) {
        setUser({
          merchantId: String(data.user.merchantId ?? ''),
          businessName: data.user.businessName ?? '',
          email: data.user.email ?? '',
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          phone: data.user.phone,
          status: data.user.status,
          role: data.user.role,
          emailVerified: data.user.emailVerified,
        });
        setSessionInfo({
          remaining: data.sessionInfo?.remaining ?? 1800,
        });
      } else {
        setUser(null);
        setSessionInfo(null);
      }
    } catch (err) {
      setError('Unable to load session. Please try again.');
      setUser(null);
      setSessionInfo(null);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [router]);

  // Load session on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    user,
    sessionInfo,
    loading,
    error,
    refresh: fetchSession,
  };
}