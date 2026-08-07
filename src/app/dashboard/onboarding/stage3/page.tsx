'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Save, 
  Loader2, 
  CheckCircle,
  Landmark,
  Shield,
  AlertCircle,
  ArrowLeft // ✅ Added Back Button Icon
} from 'lucide-react';
import { getStoredMerchant, getToken } from '@/lib/auth';
import { getMerchantProfile } from '@/lib/auth-api';

export default function OnboardingStage3() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // ─── Form Data ────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    kra_pin: '',
    vat_registered: false,
    vat_number: '',
    filing_preference: 'auto',
    tax_agent_name: '',
    tax_agent_pin: '',
  });

  // ─── Load Profile Data ────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }
      setLoading(true);
      try {
        const profile = await getMerchantProfile(token);
        if (profile) {
          setFormData(prev => ({
            ...prev,
            kra_pin: profile.business_registration_number || prev.kra_pin,
            vat_registered: profile.vat_registered || false,
            vat_number: profile.vat_number || '',
            filing_preference: profile.filing_preference || 'auto',
            tax_agent_name: profile.tax_agent_name || '',
            tax_agent_pin: profile.tax_agent_pin || '',
          }));
        }
        console.log('📥 Stage 3 loaded for:', profile?.business_name);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  // ─── Handle Input Changes ────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
      const res = await fetch('/v1/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          vat_registered: formData.vat_registered,
          vat_number: formData.vat_number,
          filing_preference: formData.filing_preference,
          tax_agent_name: formData.tax_agent_name,
          tax_agent_pin: formData.tax_agent_pin,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSaved(true);
        setTimeout(() => router.replace('/dashboard/onboarding/stage4'), 2000);
      } else {
        setError(data.message || 'Failed to save tax details');
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <Landmark className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">03 — Tax & Compliance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure your tax settings for automated filings.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-8">
        
        {/* ─── Section 1: KRA PIN ───────────────────────────────────── */}
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">KRA PIN</h3>
          <p className="text-xs text-gray-500 mb-3">Your KRA PIN is used for tax reporting and compliance.</p>
          
          <input
            type="text"
            value={formData.kra_pin}
            disabled={true}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">You can update this in your Business Profile settings.</p>
        </div>

        {/* ─── Section 2: VAT Registration ──────────────────────────── */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">VAT Registration</h3>
          <p className="text-xs text-gray-500 mb-3">Indicate if your business is registered for Value Added Tax (VAT).</p>

          <div className="flex items-center gap-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="vat_registered"
                checked={formData.vat_registered}
                onChange={handleChange}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">I am VAT registered</span>
            </label>
          </div>

          {formData.vat_registered && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">VAT Number *</label>
              <input
                type="text"
                name="vat_number"
                value={formData.vat_number}
                onChange={handleChange}
                placeholder="e.g. VAT-12345678"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Provide your official VAT registration number.</p>
            </div>
          )}
        </div>

        {/* ─── Section 3: Filing Preference ──────────────────────────── */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Tax Filing Preferences</h3>
          <p className="text-xs text-gray-500 mb-3">Choose how you want to file your tax returns.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${formData.filing_preference === 'auto' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}>
              <input
                type="radio"
                name="filing_preference"
                value="auto"
                checked={formData.filing_preference === 'auto'}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">Auto-Filing (Recommended)</p>
                <p className="text-xs text-gray-500">XecoFlow automatically files your tax returns on your behalf.</p>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${formData.filing_preference === 'manual' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-200'}`}>
              <input
                type="radio"
                name="filing_preference"
                value="manual"
                checked={formData.filing_preference === 'manual'}
                onChange={handleChange}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">Manual Filing</p>
                <p className="text-xs text-gray-500">I want to file my own tax returns.</p>
              </div>
            </label>
          </div>
        </div>

        {/* ─── Section 4: Tax Agent (Optional) ──────────────────────── */}
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Tax Agent Details (Optional)</h3>
          <p className="text-xs text-gray-500 mb-3">If you use a tax agent, enter their details below.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
              <input
                type="text"
                name="tax_agent_name"
                value={formData.tax_agent_name}
                onChange={handleChange}
                placeholder="e.g. Tax Masters Ltd"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agent KRA PIN</label>
              <input
                type="text"
                name="tax_agent_pin"
                value={formData.tax_agent_pin}
                onChange={handleChange}
                placeholder="e.g. P051234567K"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* ─── Actions ────────────────────────────────────────────────── */}
        <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* ✅ LEFT: Back Button - Uses router.push() to go to Stage 2 */}
          <button
            type="button"
            onClick={() => router.push('/dashboard/onboarding/stage2')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Stage 2
          </button>

          {/* ✅ RIGHT: Save & Continue */}
          <div className="flex-1 sm:flex-none space-y-3">
            {saved && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Tax details saved! Moving to Stage 4...</span>
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
        </div>
      </form>
    </div>
  );
}