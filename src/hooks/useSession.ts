'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_CONFIG } from '@/config/auth';

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
  /** Seconds until the access token expires. */
  remaining: number;
  /** Unix ms when the session absolutely ends, if known. */
  absoluteExpiresAt: number | null;
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
 * Fetches the current user from GET /api/auth/session and exposes
 * session metadata to the calling component. Relies entirely on the
 * HttpOnly xeco_session cookie — no client-side token storage.
 *
 * Redirects to /login on 401.
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
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
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
          remaining:
            typeof data.sessionInfo?.remaining === 'number'
              ? data.sessionInfo.remaining
              : AUTH_CONFIG.SESSION_DURATION_SECONDS,
          absoluteExpiresAt:
            typeof data.sessionInfo?.absoluteExpiresAt === 'number'
              ? data.sessionInfo.absoluteExpiresAt
              : null,
        });
      } else {
        setUser(null);
        setSessionInfo(null);
      }
    } catch {
      setError('Unable to load session. Please try again.');
      setUser(null);
      setSessionInfo(null);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [router]);

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