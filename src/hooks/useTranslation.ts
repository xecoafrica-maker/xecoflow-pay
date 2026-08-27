'use client';

import { usePreferences } from '@/context/PreferencesContext';

// ─── Translations ─────────────────────────────────────────────────
const translations = {
  en: {
    // Dashboard
    dashboard: 'Dashboard',
    payments: 'Payments',
    products: 'Products',
    disbursement: 'Disbursement',
    finance: 'Finance',
    system: 'System',
    developerHub: 'Developer Hub',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    create: 'Create',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    
    // Add more translations as needed
  },
  sw: {
    // Dashboard
    dashboard: 'Dashibodi',
    payments: 'Malipo',
    products: 'Bidhaa',
    disbursement: 'Usambazaji',
    finance: 'Fedha',
    system: 'Mfumo',
    developerHub: 'Kitovu cha Wasanidi',
    
    // Common
    save: 'Hifadhi',
    cancel: 'Ghairi',
    edit: 'Hariri',
    delete: 'Futa',
    create: 'Unda',
    search: 'Tafuta',
    loading: 'Inapakia...',
    error: 'Hitilafu',
    success: 'Imefanikiwa',
    confirm: 'Thibitisha',
  },
};

export function useTranslation() {
  const { language } = usePreferences();
  
  const t = (key: keyof typeof translations.en): string => {
    const lang = language as keyof typeof translations;
    return translations[lang]?.[key] || translations.en[key] || key;
  };
  
  return { t, language };
}