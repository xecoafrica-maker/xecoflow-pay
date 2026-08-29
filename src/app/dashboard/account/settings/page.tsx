// src/app/dashboard/account/settings/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Building2,
  Palette,
  Bell,
  Shield,
  Globe,
  Smartphone,
  Mail,
  Phone,
  Save,
  X,
  Upload,
  Camera,
  Check,
  AlertCircle,
  Loader2,
  Image,
} from 'lucide-react';
import { getToken, getStoredMerchant } from '@/lib/auth';

interface BusinessSettings {
  business_name: string;
  phone: string;
  email: string;
  trading_name: string;
  country: string;
  currency: string;
  timezone: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Business Settings State ──────────────────────────────────────
  const [settings, setSettings] = useState<BusinessSettings>({
    business_name: '',
    phone: '',
    email: '',
    trading_name: '',
    country: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
  });

  // ─── Appearance State ─────────────────────────────────────────────
  const [appearance, setAppearance] = useState({
    theme: 'light',
    sidebarCollapsed: false,
    fontSize: 'medium',
  });

  // ─── Notification Preferences ─────────────────────────────────────
  const [notifications, setNotifications] = useState({
    email_payments: true,
    email_security: true,
    sms_payments: false,
    sms_security: true,
    marketing: false,
  });

  // ─── Fetch Settings ──────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const token = getToken();
      const merchant = getStoredMerchant();

      if (merchant) {
        setSettings({
          business_name: merchant.business_name || merchant.businessName || '',
          phone: merchant.phone || '',
          email: merchant.email || '',
          trading_name: merchant.trading_name || merchant.business_name || '',
          country: merchant.country || 'Kenya',
          currency: 'KES',
          timezone: 'Africa/Nairobi',
        });
      }

      const response = await fetch('/v1/auth/account/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings(prev => ({
            ...prev,
            ...data.data,
          }));
        }
      }

      const savedPhoto = localStorage.getItem('profile_photo');
      if (savedPhoto) {
        setProfilePhoto(savedPhoto);
      }

    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Save Settings ────────────────────────────────────────────────
  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/v1/auth/account/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (error: any) {
      setError(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // ─── Handle Photo Upload ──────────────────────────────────────────
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB.');
      return;
    }

    setUploadingPhoto(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setProfilePhoto(base64String);
      localStorage.setItem('profile_photo', base64String);
      setUploadingPhoto(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // ─── Loading State ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* ─── Success / Error Messages ──────────────────────────────── */}
      {success && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Profile Section ────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-500" />
            Profile
          </h2>
          <p className="text-sm text-gray-500">Click the avatar to upload a new photo (JPEG, PNG, WebP — max 5 MB)</p>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            <div 
              className="relative cursor-pointer group"
              onClick={triggerFileInput}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                {profilePhoto ? (
                  <img 
                    src={profilePhoto} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  settings.business_name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div>
              <p className="text-sm text-gray-600">
                Upload a new photo
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG or WebP. Max 5 MB.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Business Information ───────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            Business Information
          </h2>
          <p className="text-sm text-gray-500">Update your business name, phone, and trading name</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Business Name <span className="text-red-500">*</span>
            </label>
            <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900">
              {settings.business_name || 'XECO DEVELOPERS'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone Number
            </label>
            <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900">
              {settings.phone || '254708050827'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Trading Name
            </label>
            <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900">
              {settings.trading_name || 'Acme Shop'}
            </div>
          </div>

          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <span>Requires an existing KYC profile</span>
          </div>
        </div>
      </div>

      {/* ─── Appearance ─────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-500" />
            Appearance
          </h2>
          <p className="text-sm text-gray-500">Customize your dashboard appearance</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Theme</label>
            <select
              value={appearance.theme}
              onChange={(e) => setAppearance({ ...appearance, theme: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Font Size</label>
            <select
              value={appearance.fontSize}
              onChange={(e) => setAppearance({ ...appearance, fontSize: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Save Button ────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
}