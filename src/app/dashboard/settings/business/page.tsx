'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Save, 
  Loader2, 
  MapPin, 
  FileText, 
  CheckCircle,
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';
import { getMerchantProfile } from '@/lib/auth-api';

export default function BusinessSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // ─── Form Data ────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    business_name: '',
    first_name: '',
    last_name: '',
    business_type: '',
    business_location: '',
    business_registration_number: '',
  });

  // ─── Load Profile Data ────────────────────────────────────────────
  const fetchProfile = async () => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const profile = await getMerchantProfile(token);
      if (profile) {
        setFormData({
          business_name: profile.business_name || '',
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          business_type: profile.business_type || '',
          business_location: profile.business_location || '',
          business_registration_number: profile.business_registration_number || '',
        });
      }
    } catch (err) {
      // ✅ Silently log the error to the console. Do not show it to the user.
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [router]);

  // ─── Handle Input Changes ────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  // ─── Save Data ────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/v1/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          business_type: formData.business_type,
          business_location: formData.business_location,
          business_registration_number: formData.business_registration_number,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSaved(true);
        const cached = getStoredMerchant();
        if (cached) {
          localStorage.setItem('merchant', JSON.stringify({
            ...cached,
            business_type: formData.business_type,
          }));
        }
        setTimeout(() => router.push('/dashboard/settings/settlement'), 2000);
      } else {
        setError(data.message || 'Failed to save business details');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Business Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your business information.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        
        {/* ─── Read-Only Section ─────────────────────────────────────── */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Account Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Business Name</label>
              <p className="text-sm font-medium text-gray-900">{formData.business_name}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Full Name</label>
              <p className="text-sm font-medium text-gray-900">
                {formData.first_name} {formData.last_name}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Business Details Section ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Business Type */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
            <select
              name="business_type"
              value={formData.business_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            >
              <option value="">Select Business Type</option>
              <option value="Sole Proprietorship">Sole Proprietorship</option>
              <option value="Partnership">Partnership</option>
              <option value="LLC">Limited Liability Company (LLC)</option>
              <option value="Corporation">Corporation</option>
              <option value="Non-Profit">Non-Profit</option>
            </select>
          </div>

          {/* Location */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Location *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="business_location"
                value={formData.business_location}
                onChange={handleChange}
                placeholder="Nairobi, Kenya"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Registration Number */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">KRA PIN / Registration Number *</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                name="business_registration_number"
                value={formData.business_registration_number}
                onChange={handleChange}
                placeholder="e.g. P051234567K"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
          </div>

        </div>

        {/* ─── Messages & Actions ────────────────────────────────────── */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Business details saved! Redirecting to Settlement...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Continue
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}