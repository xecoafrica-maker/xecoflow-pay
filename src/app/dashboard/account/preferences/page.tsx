'use client';

import { useState } from 'react';
import { Settings, Bell, Globe, Moon, Sun, Save, Check } from 'lucide-react';
import { usePreferences } from '@/context/PreferencesContext';

// ─── Translations ─────────────────────────────────────────────────
const translations = {
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
    changeLanguageNote: 'Changing language will reload the page',
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
    changeLanguageNote: 'Kubadilisha lugha kutapakia ukurasa upya',
  },
};

export default function PreferencesPage() {
  const {
    theme,
    language,
    currency,
    notifications,
    setTheme,
    setLanguage,
    setCurrency,
    setNotifications,
    toggleTheme,
  } = usePreferences();

  const [saved, setSaved] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(notifications);

  const t = translations[language as keyof typeof translations] || translations.en;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save all preferences
    setNotifications(localNotifications);
    setCurrency(currency);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

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
              {t.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.subtitle}
            </p>
          </div>
        </div>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">{t.saved}</span>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#0a2540] border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ─── Notifications ────────────────────────────────────── */}
          <div className="bg-gray-50 dark:bg-[#152a45] rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-500" />
              {t.notifications}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t.emailDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalNotifications({ 
                    ...localNotifications, 
                    email: !localNotifications.email 
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localNotifications.email ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localNotifications.email ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.sms}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t.smsDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalNotifications({ 
                    ...localNotifications, 
                    sms: !localNotifications.sms 
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localNotifications.sms ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localNotifications.sms ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.push}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t.pushDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalNotifications({ 
                    ...localNotifications, 
                    push: !localNotifications.push 
                  })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    localNotifications.push ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localNotifications.push ? 'translate-x-6' : 'translate-x-1'
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
              {t.theme}
            </h4>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  theme === 'light'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Sun className="w-4 h-4" />
                {t.light}
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <Moon className="w-4 h-4" />
                {t.dark}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Theme changes apply to all pages immediately
            </p>
          </div>

          {/* ─── Language & Region ────────────────────────────────── */}
          <div className="bg-gray-50 dark:bg-[#152a45] rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              {t.language}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.languageLabel}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-[#0a2540] border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                >
                  <option value="en">English (US)</option>
                  <option value="sw">Swahili</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  {t.changeLanguageNote}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.currencyLabel}
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
            {t.save}
          </button>
        </form>
      </div>
    </div>
  );
}