'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState('light');
  const [language, setLanguageState] = useState('en');
  const [currency, setCurrencyState] = useState('KES');
  const [notifications, setNotificationsState] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // ─── Load preferences from localStorage on mount ──────────────
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
  };

  if (!isLoaded) {
    return null; // or a loading spinner
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