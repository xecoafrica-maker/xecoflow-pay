'use client';

import { useState, useEffect } from 'react';
import { Settings, Bell, Globe, Moon, Sun, Save, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PreferencesPage() {
  const router = useRouter();
  
  // ─── Load saved preferences ──────────────────────────────────────
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('KES');
  const [saved, setSaved] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedLanguage = localStorage.getItem('language') || 'en';
    const savedCurrency = localStorage.getItem('currency') || 'KES';
    const savedNotifications = localStorage.getItem('notifications');

    setTheme(savedTheme);
    setLanguage(savedLanguage);
    setCurrency(savedCurrency);

    if (savedNotifications) {
      try {
        setNotifications(JSON.parse(savedNotifications));
      } catch (e) {
        // Use defaults
      }
    }

    // Apply saved theme
    applyTheme(savedTheme);
  }, []);

  // ─── Apply Theme ──────────────────────────────────────────────────
  const applyTheme = (newTheme: string) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      // You can also add custom dark mode styles here
      root.style.setProperty('--bg-primary', '#0a2540');
      root.style.setProperty('--bg-secondary', '#152a45');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#94a3b8');
    } else {
      root.classList.remove('dark');
      root.style.setProperty('--bg-primary', '#ffffff');
      root.style.setProperty('--bg-secondary', '#f8fafc');
      root.style.setProperty('--text-primary', '#0a2540');
      root.style.setProperty('--text-secondary', '#64748b');
    }
    localStorage.setItem('theme', newTheme);
  };

  // ─── Change Language ──────────────────────────────────────────────
  const changeLanguage = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    
    // If using i18n, you would call something like:
    // i18n.changeLanguage(newLanguage);
    
    // For demo, we'll reload with a param
    // In production, use a proper i18n library like next-i18next
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // ─── Handle Submit ────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save all preferences
    localStorage.setItem('theme', theme);
    localStorage.setItem('language', language);
    localStorage.setItem('currency', currency);
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    // Apply theme immediately
    applyTheme(theme);
    
    // Show success
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);

    // Reload to apply language changes (if using i18n)
    // router.refresh();
  };

  // ─── Translations ─────────────────────────────────────────────────
  const t = {
    en: {
      title: 'Preferences',
      subtitle: 'Customize your personal preferences',
      notifications: 'Notification Preferences',
      email: 'Email Notifications',
      emailDesc: 'Receive transaction alerts via email',
      sms: 'SMS Notifications',
      smsDesc: 'Receive transaction alerts via SMS',
      push: 'Push Notifications',
      pushDesc: 'Receive alerts in-app',
      theme: 'Theme Preference',
      light: 'Light',
      dark: 'Dark',
      language: 'Language & Region',
      languageLabel: 'Language',
      currencyLabel: 'Currency',
      save: 'Save Preferences',
      saved: 'Preferences saved successfully!',
    },
    sw: {
      title: 'Mapendekezo',
      subtitle: 'Geuza mapendeleo yako binafsi',
      notifications: 'Mapendeleo ya Arifa',
      email: 'Arifa za Barua Pepe',
      emailDesc: 'Pokea arifa za miamala kupitia barua pepe',
      sms: 'Arifa za SMS',
      smsDesc: 'Pokea arifa za miamala kupitia SMS',
      push: 'Arifa za Programu',
      pushDesc: 'Pokea arifa ndani ya programu',
      theme: 'Mapendeleo ya Mandhari',
      light: 'Nyepesi',
      dark: 'Nzito',
      language: 'Lugha na Mkoa',
      languageLabel: 'Lugha',
      currencyLabel: 'Sarafu',
      save: 'Hifadhi Mapendeleo',
      saved: 'Mapendeleo yamehifadhiwa!',
    },
  };

  const currentLang = t[language as keyof typeof t] || t.en;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentLang.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentLang.subtitle}
            </p>
          </div>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">{currentLang.saved}</span>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#0a2540] border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ─── Notifications ────────────────────────────────────── */}
          <div className="bg-gray-50 dark:bg-[#152a45] rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              {currentLang.notifications}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentLang.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentLang.emailDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.email ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentLang.sms}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentLang.smsDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifications({ ...notifications, sms: !notifications.sms })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.sms ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.sms ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {currentLang.push}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentLang.pushDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifications({ ...notifications, push: !notifications.push })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications.push ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.push ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* ─── Theme ────────────────────────────────────────────── */}
          <div className="bg-gray-50 dark:bg-[#152a45] rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              {theme === 'light' ? 
                <Sun className="w-4 h-4 text-indigo-500" /> : 
                <Moon className="w-4 h-4 text-indigo-500" />
              }
              {currentLang.theme}
            </h4>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  applyTheme('light');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  theme === 'light'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Sun className="w-4 h-4" />
                {currentLang.light}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  applyTheme('dark');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Moon className="w-4 h-4" />
                {currentLang.dark}
              </button>
            </div>
          </div>

          {/* ─── Language & Region ────────────────────────────────── */}
          <div className="bg-gray-50 dark:bg-[#152a45] rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              {currentLang.language}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {currentLang.languageLabel}
                </label>
                <select
                  value={language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-[#0a2540] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                >
                  <option value="en">English (US)</option>
                  <option value="sw">Swahili</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  {language === 'en' ? 'Changing language will reload the page' : 'Kubadilisha lugha kutapakia ukurasa upya'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {currentLang.currencyLabel}
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-[#0a2540] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                >
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>
            </div>
          </div>

          {/* ─── Submit ────────────────────────────────────────────── */}
          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {currentLang.save}
          </button>
        </form>
      </div>
    </div>
  );
}