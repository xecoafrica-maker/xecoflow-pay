'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { getToken, verifyToken, clearAllAuthData, getRemainingSessionTime } from '@/lib/auth';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiring, setSessionExpiring] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);

  // ─── Check authentication ──────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      
      if (!token) {
        clearAllAuthData();
        router.push('/login?session=expired');
        return;
      }

      // Verify token validity
      const decoded = verifyToken(token);
      if (!decoded) {
        // Token is invalid or expired
        clearAllAuthData();
        router.push('/login?session=expired');
        return;
      }

      // Check if token is about to expire (30 seconds)
      const remaining = getRemainingSessionTime();
      if (remaining > 0 && remaining < 30) { // ← Changed from 300 to 30
        setSessionExpiring(true);
        setSessionTimeLeft(remaining);
      }

      setIsLoading(false);
    };

    checkAuth();

    // ─── Session expiry checker (every 5 seconds) ──────────────────
    const interval = setInterval(() => {
      const token = getToken();
      if (!token) {
        clearAllAuthData();
        router.push('/login?session=expired');
        return;
      }

      const remaining = getRemainingSessionTime();
      if (remaining <= 0) {
        clearAllAuthData();
        router.push('/login?session=expired');
        return;
      }

      if (remaining < 30) { // ← Changed from 300 to 30
        setSessionExpiring(true);
        setSessionTimeLeft(remaining);
      } else {
        setSessionExpiring(false);
      }
    }, 5000); // ← Changed from 30000 to 5000 (check every 5 seconds)

    return () => clearInterval(interval);
  }, [router]);

  // ─── Show loading state ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0a2540]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a2540]">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden p-6">
        {/* ─── Session Expiry Warning ───────────────────────────────── */}
        {sessionExpiring && (
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">⚠️</span>
              <span className="text-sm text-amber-700 dark:text-amber-400">
                Your session will expire in {Math.floor(sessionTimeLeft / 60)}m {sessionTimeLeft % 60}s
              </span>
            </div>
            <button
              onClick={() => {
                // Refresh token logic
                window.location.reload();
              }}
              className="px-3 py-1 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
            >
              Refresh Session
            </button>
          </div>
        )}
        
        {children}
      </main>
    </div>
  );
}