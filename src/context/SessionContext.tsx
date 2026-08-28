// src/context/SessionContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getRemainingSessionTime, clearAllAuthData, isAuthenticated } from '@/lib/auth';

interface SessionContextType {
  isAuthenticated: boolean;
  sessionTimeLeft: number;
  isExpiring: boolean;
  refreshSession: () => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const SESSION_WARNING_THRESHOLD = 30; // 30 seconds warning (was 5 minutes)
const SESSION_CHECK_INTERVAL = 5000; // Check every 5 seconds (was 30 seconds)

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [isExpiring, setIsExpiring] = useState(false);

  const checkSession = () => {
    const token = getToken();
    const authenticated = isAuthenticated();
    
    setIsAuthenticatedState(authenticated);
    
    if (authenticated) {
      const remaining = getRemainingSessionTime();
      setSessionTimeLeft(remaining);
      setIsExpiring(remaining > 0 && remaining < SESSION_WARNING_THRESHOLD);
      
      // Auto-logout if session expired
      if (remaining <= 0) {
        clearAllAuthData();
        router.push('/login?session=expired');
      }
    }
  };

  useEffect(() => {
    // Initial check
    checkSession();

    // Periodic check - every 5 seconds for 5-minute session
    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);

  const refreshSession = () => {
    // Refresh the session by reloading the page
    window.location.reload();
  };

  const logout = () => {
    clearAllAuthData();
    router.push('/login');
  };

  return (
    <SessionContext.Provider
      value={{
        isAuthenticated: isAuthenticatedState,
        sessionTimeLeft,
        isExpiring,
        refreshSession,
        logout,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}