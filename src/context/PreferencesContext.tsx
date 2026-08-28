'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, isAuthenticated, getRemainingSessionTime } from '@/lib/auth';

interface PreferencesContextType {
  theme: string;
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  setTheme: (theme: string) => void;
  setLanguage: (language: string) => void;
  setCurrency: (currency: string) => void;
  setNotifications: (notifications: any) => void;
  toggleTheme: () => void;
  applyTheme: (theme: string) => void;
  // ─── Session Management ──────────────────────────────────────────
  isAuthenticated: boolean;
  sessionTimeLeft: number;
  isSessionExpiring: boolean;
  refreshSession: () => void;
  logout: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const SESSION_WARNING_THRESHOLD = 60; // 1 minute warning
const SESSION_CHECK_INTERVAL = 10000; // Check every 10 seconds

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  
  // ─── Preferences State ────────────────────────────────────────────
  const [theme, setThemeState] = useState('light');
  const [language, setLanguageState] = useState('en');
  const [currency, setCurrencyState] = useState('KES');
  const [notifications, setNotificationsState] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const [isLoaded, setIsLoaded] = useState(false);
  
  // ─── Session State ────────────────────────────────────────────────
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(0);
  const [isSessionExpiring, setIsSessionExpiring] = useState(false);

  // ─── Check Session ─────────────────────────────────────────────────
  const checkSession = () => {
    const authenticated = isAuthenticated();
    setIsAuthenticatedState(authenticated);
    
    if (authenticated) {
      const remaining = getRemainingSessionTime();
      setSessionTimeLeft(remaining);
      setIsSessionExpiring(remaining > 0 && remaining < SESSION_WARNING_THRESHOLD);
      
      // Auto-logout if session expired
      if (remaining <= 0) {
        logout();
      }
    }
  };

  // ─── Refresh Session ──────────────────────────────────────────────
  const refreshSession = () => {
    // Get current token and refresh it
    const token = getToken();
    if (token) {
      // Refresh the page to renew session
      window.location.reload();
    }
  };

  // ─── Logout ────────────────────────────────────────────────────────
  const logout = () => {
    // Clear all auth data
    localStorage.removeItem('xecoflow_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('session_start');
    localStorage.removeItem('merchant');
    
    // Clear cookies
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    // Reset session state
    setIsAuthenticatedState(false);
    setSessionTimeLeft(0);
    setIsSessionExpiring(false);
    
    // Redirect to login
    router.push('/login?session=expired');
  };

  // ─── Load preferences from localStorage ──────────────────────────
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedLanguage = localStorage.getItem('language') || 'en';
    const savedCurrency = localStorage.getItem('currency') || 'KES';
    const savedNotifications = localStorage.getItem('notifications');

    setThemeState(savedTheme);
    setLanguageState(savedLanguage);
    setCurrencyState(savedCurrency);

    if (savedNotifications) {
      try {
        setNotificationsState(JSON.parse(savedNotifications));
      } catch (e) {
        // Use defaults
      }
    }

    // Apply theme
    applyTheme(savedTheme);
    setIsLoaded(true);
  }, []);

  // ─── Session Monitoring ───────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;

    // Initial check
    checkSession();

    // Periodic check
    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL);
    
    return () => clearInterval(interval);
  }, [isLoaded]);

  // ─── Apply Theme ──────────────────────────────────────────────────
  const applyTheme = (newTheme: string) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

  // ─── Set Theme ────────────────────────────────────────────────────
  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // ─── Toggle Theme ─────────────────────────────────────────────────
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // ─── Set Language ─────────────────────────────────────────────────
  const setLanguage = (newLanguage: string) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
    // Trigger a page reload to apply language changes across all pages
    window.location.reload();
  };

  // ─── Set Currency ─────────────────────────────────────────────────
  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  // ─── Set Notifications ────────────────────────────────────────────
  const setNotifications = (newNotifications: any) => {
    setNotificationsState(newNotifications);
    localStorage.setItem('notifications', JSON.stringify(newNotifications));
  };

  const value = {
    theme,
    language,
    currency,
    notifications,
    setTheme,
    setLanguage,
    setCurrency,
    setNotifications,
    toggleTheme,
    applyTheme,
    // ─── Session Management ──────────────────────────────────────────
    isAuthenticated: isAuthenticatedState,
    sessionTimeLeft,
    isSessionExpiring,
    refreshSession,
    logout,
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}