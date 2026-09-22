// src/hooks/useSessionRefresh.ts
'use client';

import { useEffect, useRef } from 'react';

type Options = {
  /**
   * Trigger a refresh when the access token has less than this many
   * seconds left. Default: 120 (2 minutes).
   */
  refreshThresholdSeconds?: number;
  /**
   * How often to check the session endpoint. Default: 60 seconds.
   */
  pollIntervalMs?: number;
  /**
   * Called when a refresh attempt fails. The session is presumed dead;
   * the caller should redirect to /login.
   */
  onSessionExpired?: () => void;
  /**
   * Optional: known remaining seconds. If provided, the hook uses this
   * as its starting point and re-fetches on the next poll cycle.
   */
  initialRemainingSeconds?: number;
};

/**
 * Silently rotates the access token before it expires.
 *
 * Polls /api/auth/session periodically to learn how much time the
 * current access token has left. When the remaining time drops below
 * `refreshThresholdSeconds`, calls /api/auth/refresh. If the refresh
 * fails, invokes `onSessionExpired`.
 *
 * Does not touch cookies directly — the BFF handles Set-Cookie.
 */
export function useSessionRefresh(options: Options = {}): void {
  const {
    refreshThresholdSeconds = 120,
    pollIntervalMs = 60_000,
    onSessionExpired,
  } = options;

  const onSessionExpiredRef = useRef(onSessionExpired);
  const refreshingRef = useRef(false);

  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (cancelled || refreshingRef.current) return;

      try {
        const sessionRes = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (cancelled) return;

        if (sessionRes.status === 401) {
          // Session is dead — the layout's own 401 handling will
          // redirect. Nothing more to do here.
          return;
        }

        if (!sessionRes.ok) return;

        const data = await sessionRes.json();
        const remaining = data?.sessionInfo?.remaining;

        if (typeof remaining !== 'number') return;
        if (remaining >= refreshThresholdSeconds) return;

        // Time to refresh.
        refreshingRef.current = true;
        try {
          const refreshRes = await fetch('/api/auth/refresh', {
            method: 'POST',
            credentials: 'include',
          });

          if (!refreshRes.ok && !cancelled) {
            onSessionExpiredRef.current?.();
          }
        } finally {
          refreshingRef.current = false;
        }
      } catch {
        // Network error — retry on the next poll.
      }
    };

    // Kick off immediately, then on interval.
    void tick();
    const interval = setInterval(tick, pollIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [refreshThresholdSeconds, pollIntervalMs]);
}