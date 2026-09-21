// src/app/dashboard/layout.tsx
'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import SecurityBanner from '@/components/dashboard/SecurityBanner';
import SessionWarningModal from '@/components/SessionWarningModal';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiring, setSessionExpiring] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);

  // ─── Handles the automatic logout after idle timeout ──────────────
  const handleIdleTimeout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore — we're logging out anyway.
    }

    // Best-effort: clear any client-side state
    try {
      localStorage.removeItem('xecoflow_token');
      localStorage.removeItem('merchant');
      sessionStorage.clear();
    } catch {
      // Storage may be unavailable in some contexts; ignore.
    }

    router.replace('/login?session=idle');
  }, [router]);

  // ─── Idle timeout hook (15 min idle, 60 s warning) ────────────────
  const {
    showWarning: showIdleWarning,
    secondsRemaining: idleSecondsRemaining,
    extendSession,
    logoutNow,
  } = useInactivityTimeout({
    idleMs: 15 * 60 * 1000, // 15 minutes
    warningMs: 60 * 1000, // 60 seconds
    onTimeout: handleIdleTimeout,
    enableWarning: true,
  });

  // ─── Existing: session validity check every 30 s ──────────────────
  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (cancelled) return;

        if (!response.ok) {
          router.replace('/login?session=expired');
          return;
        }

        const data = await response.json();
        if (data?.sessionInfo?.remaining) {
          setSessionTimeLeft(data.sessionInfo.remaining);
          setSessionExpiring(data.sessionInfo.remaining < 60);
        }
      } catch {
        // Network error — keep the current view, retry on next interval.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    checkSession();

    const interval = setInterval(checkSession, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0a2540]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a2540]">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <SecurityBanner />

        <div className="p-6">
          {sessionExpiring && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-amber-500">⚠️</span>
                <span className="text-sm text-amber-700 dark:text-amber-400">
                  Your session will expire in {Math.floor(sessionTimeLeft / 60)}m{' '}
                  {sessionTimeLeft % 60}s
                </span>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
              >
                Refresh Session
              </button>
            </div>
          )}

          {children}
        </div>
      </main>

      {/* ─── Idle timeout warning modal ──────────────────────────── */}
      <SessionWarningModal
        open={showIdleWarning}
        secondsRemaining={idleSecondsRemaining}
        onStayLoggedIn={extendSession}
        onLogout={logoutNow}
      />
    </div>
  );
}