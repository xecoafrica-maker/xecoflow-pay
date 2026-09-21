// src/hooks/useInactivityTimeout.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type UseInactivityTimeoutOptions = {
  /** Idle duration before logout, in milliseconds. Default: 15 min. */
  idleMs?: number;
  /** Warning duration before timeout, in milliseconds. Default: 60 sec. */
  warningMs?: number;
  /** Called when the idle timer expires (user has been inactive too long). */
  onTimeout?: () => void;
  /** Whether to show the pre-timeout warning. Default: true. */
  enableWarning?: boolean;
};

type UseInactivityTimeoutReturn = {
  /** True when the user is within `warningMs` of the timeout. */
  showWarning: boolean;
  /** Seconds until timeout (only meaningful while showWarning is true). */
  secondsRemaining: number;
  /** Reset the idle timer — call this when user clicks "Stay logged in". */
  extendSession: () => void;
  /** Immediately trigger the timeout callback. */
  logoutNow: () => void;
};

const DEFAULT_IDLE_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_WARNING_MS = 60 * 1000; // 60 seconds

export function useInactivityTimeout(
  options: UseInactivityTimeoutOptions = {}
): UseInactivityTimeoutReturn {
  const {
    idleMs = DEFAULT_IDLE_MS,
    warningMs = DEFAULT_WARNING_MS,
    onTimeout,
    enableWarning = true,
  } = options;

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // Refs hold mutable values without causing re-renders on every event.
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeoutRef = useRef(onTimeout);

  // Keep the latest onTimeout in a ref so the effect doesn't need to
  // re-run if the caller passes a new function on every render.
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

    // Schedule the warning (if enabled)
    if (enableWarning && warningMs > 0 && warningMs < idleMs) {
      warningTimerRef.current = setTimeout(() => {
        setShowWarning(true);
        setSecondsRemaining(Math.floor(warningMs / 1000));

        // 1-second countdown for the modal
        countdownRef.current = setInterval(() => {
          setSecondsRemaining((s) => (s > 0 ? s - 1 : 0));
        }, 1000);
      }, idleMs - warningMs);
    }

    // Schedule the actual timeout
    idleTimerRef.current = setTimeout(() => {
      clearAllTimers();
      setShowWarning(false);
      onTimeoutRef.current?.();
    }, idleMs);
  }, [clearAllTimers, enableWarning, idleMs, warningMs]);

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

  // Attach activity listeners and kick off timers on mount.
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
      // Any activity resets the timer (per design decision).
      // We do NOT reset if the warning modal is already showing —
      // the user must click "Stay logged in" for that.
      setShowWarning((current) => {
        if (current) {
          // Warning is showing — do not auto-extend.
          return current;
        }
        startTimers();
        return false;
      });
    };

    // Attach (passive for scroll/wheel performance)
    for (const eventName of activityEvents) {
      document.addEventListener(eventName, handleActivity, { passive: true });
    }

    // Start the initial timer
    startTimers();

    return () => {
      for (const eventName of activityEvents) {
        document.removeEventListener(eventName, handleActivity);
      }
      clearAllTimers();
    };
  }, [clearAllTimers, startTimers]);

  return { showWarning, secondsRemaining, extendSession, logoutNow };
}