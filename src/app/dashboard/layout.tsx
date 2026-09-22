// src/app/dashboard/layout.tsx
'use client';

import { ReactNode, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import SecurityBanner from '@/components/dashboard/SecurityBanner';
import SessionWarningModal from '@/components/SessionWarningModal';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { useSession } from '@/hooks/useSession';
import { useSessionRefresh } from '@/hooks/useSessionRefresh';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, sessionInfo, loading, refresh } = useSession();

  // Silently rotate the access token before it expires.
  useSessionRefresh({
    refreshThresholdSeconds: 120,
    pollIntervalMs: 60_000,
    onSessionExpired: () => router.replace('/login?session=expired'),
  });

  // Handles both idle timeout and absolute ceiling.
  const handleSessionEnd = useCallback(
    async (reason: 'idle' | 'absolute') => {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch {
        // Ignore — the user is being logged out regardless.
      }

      router.replace(`/login?session=${reason}`);
    },
    [router]
  );

  const {
    showWarning,
    secondsRemaining,
    isAbsoluteExpired,
    extendSession,
    logoutNow,
  } = useInactivityTimeout({
    idleMs: 15 * 60 * 1000,
    warningMs: 60 * 1000,
    absoluteExpiresAt: sessionInfo?.absoluteExpiresAt ?? null,
    onTimeout: () =>
      handleSessionEnd(isAbsoluteExpired ? 'absolute' : 'idle'),
    enableWarning: true,
  });

  // Keep sessionInfo fresh so the idle hook and refresh hook both see
  // the current state. Runs every 30 s while the user is logged in.
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      void refresh();
    }, 30_000);
    return () => clearInterval(interval);
  }, [user, refresh]);

  // Do not show the idle warning while the absolute ceiling is firing.
  const showAnyWarning = showWarning && !isAbsoluteExpired;

  if (loading) {
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

  if (!user) return null; // useSession is redirecting to /login

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a2540]">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden">
        <SecurityBanner />
        <div className="p-6">{children}</div>
      </main>

      <SessionWarningModal
        open={showAnyWarning}
        secondsRemaining={secondsRemaining}
        onStayLoggedIn={extendSession}
        onLogout={logoutNow}
      />
    </div>
  );
}