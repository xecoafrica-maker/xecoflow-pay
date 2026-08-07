'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Save, 
  Loader2, 
  CheckCircle,
  Landmark,
  ArrowLeft
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
          setFormData({
            kra_pin: profile.business_registration_number || '',
          });
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
      // We send the KRA PIN again just to make sure it's synced
      const res = await fetch('/v1/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          business_registration_number: formData.kra_pin,
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
            Confirm your KRA PIN for tax reporting and compliance.
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
          <p className="text-xs text-gray-500 mb-3">Your KRA PIN is used for tax reporting and compliance. If this is incorrect, go back to Stage 1 to update it.</p>
          
          <input
            type="text"
            value={formData.kra_pin}
            disabled={true}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">You can update this in your Business Profile settings later.</p>
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
                <span>KRA PIN confirmed! Moving to Stage 4...</span>
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