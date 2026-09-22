// src/hooks/useInactivityTimeout.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type UseInactivityTimeoutOptions = {
  /** Idle duration before logout, in milliseconds. Default: 15 min. */
  idleMs?: number;
  /** Warning duration before timeout, in milliseconds. Default: 60 sec. */
  warningMs?: number;
  /**
   * Absolute session end time (Unix ms). When this moment is reached,
   * the session is terminated regardless of user activity.
   * If omitted or null, no absolute ceiling is enforced client-side
   * (the server still enforces it).
   */
  absoluteExpiresAt?: number | null;
  /** Called when the idle timer expires or the absolute ceiling is reached. */
  onTimeout?: () => void;
  /** Whether to show the pre-timeout warning. Default: true. */
  enableWarning?: boolean;
};

type UseInactivityTimeoutReturn = {
  /** True when the user is within `warningMs` of the idle timeout. */
  showWarning: boolean;
  /** Seconds until the idle timeout (only meaningful while showWarning is true). */
  secondsRemaining: number;
  /** True when the absolute session ceiling has been reached. */
  isAbsoluteExpired: boolean;
  /** Reset the idle timer — call this when the user clicks "Stay logged in". */
  extendSession: () => void;
  /** Immediately trigger the timeout callback. */
  logoutNow: () => void;
};

const DEFAULT_IDLE_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_WARNING_MS = 60 * 1000; // 60 seconds

// setTimeout accepts a signed 32-bit int; clamp to avoid overflow.
const MAX_TIMEOUT_MS = 2_147_483_647;

export function useInactivityTimeout(
  options: UseInactivityTimeoutOptions = {}
): UseInactivityTimeoutReturn {
  const {
    idleMs = DEFAULT_IDLE_MS,
    warningMs = DEFAULT_WARNING_MS,
    absoluteExpiresAt = null,
    onTimeout,
    enableWarning = true,
  } = options;

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isAbsoluteExpired, setIsAbsoluteExpired] = useState(false);

  // Refs hold mutable values without causing re-renders on every event.
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const absoluteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  // Keep the latest onTimeout in a ref so the effect doesn't need to
  // re-run when the caller passes a new function on every render.
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const startTimers = useCallback(() => {
    clearAllTimers();

    // Pre-timeout warning (optional)
    if (enableWarning && warningMs > 0 && warningMs < idleMs) {
      warningTimerRef.current = setTimeout(() => {
        setShowWarning(true);
        setSecondsRemaining(Math.floor(warningMs / 1000));

        countdownRef.current = setInterval(() => {
          setSecondsRemaining((s) => (s > 0 ? s - 1 : 0));
        }, 1000);
      }, idleMs - warningMs);
    }

    // Idle timeout
    idleTimerRef.current = setTimeout(() => {
      clearAllTimers();
      setShowWarning(false);
      onTimeoutRef.current?.();
    }, idleMs);
  }, [clearAllTimers, enableWarning, idleMs, warningMs]);

  // ─── Absolute session ceiling ────────────────────────────────────
  // Independent of user activity. Set once when `absoluteExpiresAt`
  // changes; never reset by activity.
  useEffect(() => {
    if (absoluteTimerRef.current) {
      clearTimeout(absoluteTimerRef.current);
      absoluteTimerRef.current = null;
    }

    if (!absoluteExpiresAt) {
      setIsAbsoluteExpired(false);
      return;
    }

    const msUntilExpiry = absoluteExpiresAt - Date.now();

    if (msUntilExpiry <= 0) {
      setIsAbsoluteExpired(true);
      onTimeoutRef.current?.();
      return;
    }

    const delay = Math.min(msUntilExpiry, MAX_TIMEOUT_MS);

    absoluteTimerRef.current = setTimeout(() => {
      setIsAbsoluteExpired(true);
      onTimeoutRef.current?.();
    }, delay);

    return () => {
      if (absoluteTimerRef.current) {
        clearTimeout(absoluteTimerRef.current);
        absoluteTimerRef.current = null;
      }
    };
  }, [absoluteExpiresAt]);

  const extendSession = useCallback(() => {
    setShowWarning(false);
    setSecondsRemaining(0);
    startTimers();
  }, [startTimers]);

  const logoutNow = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    onTimeoutRef.current?.();
  }, [clearAllTimers]);

  // ─── Activity listeners ──────────────────────────────────────────
  useEffect(() => {
    const activityEvents: (keyof DocumentEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'wheel',
    ];

    const handleActivity = () => {
      // Any activity resets the idle timer. We do NOT auto-extend if
      // the warning modal is showing — the user must click "Stay
      // logged in" explicitly.
      setShowWarning((current) => {
        if (current) return current;
        startTimers();
        return false;
      });
    };

    for (const eventName of activityEvents) {
      document.addEventListener(eventName, handleActivity, { passive: true });
    }

    startTimers();

    return () => {
      for (const eventName of activityEvents) {
        document.removeEventListener(eventName, handleActivity);
      }
      clearAllTimers();
    };
  }, [clearAllTimers, startTimers]);

  return {
    showWarning,
    secondsRemaining,
    isAbsoluteExpired,
    extendSession,
    logoutNow,
  };
}