// src/app/dashboard/layout.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { clearAllAuthData } from '@/lib/auth';

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
      // ✅ Read merchant data from localStorage (NOT token!)
      let merchant = null;
      try {
        const stored = localStorage.getItem('merchant');
        if (stored) {
          merchant = JSON.parse(stored);
        }
      } catch (e) {
        console.error('Failed to parse merchant data', e);
      }

      // ❌ If no merchant data, redirect to login
      if (!merchant || !merchant.merchantId) {
        console.warn('⚠️ No merchant found in localStorage, redirecting to login');
        clearAllAuthData();
        router.push('/login?session=expired');
        return;
      }

      // ✅ Merchant data found, session is valid
      console.log('✅ Merchant data found:', merchant.businessName);
      setIsLoading(false);

      // ─── Optional: Check session expiry via API ──────────────────
      // You can call a protected API endpoint to check if the session is still valid
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          // Session expired on backend
          console.warn('⚠️ Session expired, redirecting to login');
          clearAllAuthData();
          router.push('/login?session=expired');
          return;
        }
        
        // Get session info from response
        const data = await response.json();
        if (data.sessionInfo?.remaining) {
          const remaining = data.sessionInfo.remaining;
          setSessionTimeLeft(remaining);
          if (remaining < 60) {
            setSessionExpiring(true);
          }
        }
      } catch (error) {
        console.error('Failed to check session:', error);
      }
      
      setIsLoading(false);
    };

    checkAuth();

    // ─── Session expiry checker (every 30 seconds) ──────────────────
    const interval = setInterval(() => {
      // Check if merchant data still exists
      const merchant = localStorage.getItem('merchant');
      if (!merchant) {
        clearAllAuthData();
        router.push('/login?session=expired');
        return;
      }

      // ─── Optional: Check session via API ──────────────────────────
      fetch('/api/auth/me', {
        credentials: 'include',
      })
        .then((response) => {
          if (!response.ok) {
            clearAllAuthData();
            router.push('/login?session=expired');
            return;
          }
          return response.json();
        })
        .then((data) => {
          if (data?.sessionInfo?.remaining) {
            const remaining = data.sessionInfo.remaining;
            setSessionTimeLeft(remaining);
            if (remaining < 60) {
              setSessionExpiring(true);
            } else {
              setSessionExpiring(false);
            }
          }
        })
        .catch(() => {
          // Network error, don't redirect
        });
    }, 30000); // Check every 30 seconds

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