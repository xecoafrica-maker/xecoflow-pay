'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Loader2,
  CheckCircle,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';

export default function OnboardingStage3() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    kra_pin: '',
  });

  // ─── Load Stage 3 Data (after session resolves) ───────────────────
  useEffect(() => {
    if (sessionLoading) return;
    if (!user) return; // useSession handles the redirect

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/onboarding/tax-compliance', {
          credentials: 'include',
          cache: 'no-store',
        });

        if (res.status === 401) {
          // useSession will redirect on next tick
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data.error ||
              data.message ||
              'Failed to load tax compliance information'
          );
        }

        if (cancelled) return;

        setFormData({
          kra_pin: data.kra_pin || '',
        });
      } catch (err: any) {
        if (cancelled) return;
        console.error('Failed to load Stage 3:', err);
        setError(err.message || 'Failed to load tax information');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionLoading, user]);

  // ─── Input Handler ────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/\s/g, '');
    setFormData({ kra_pin: value });
    setSaved(false);
    setError('');
  };

  // ─── Save & Continue ──────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');

    // Frontend format validation
    const kraPin = formData.kra_pin.trim().toUpperCase();
    if (!/^P\d{9}[A-Z]$/.test(kraPin)) {
      setError('Please enter a valid KRA PIN, e.g. P051234567A.');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/onboarding/tax-compliance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          kra_pin: kraPin,
        }),
      });

      if (res.status === 401) {
        // useSession handles redirect
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error || data.message || 'Failed to save tax details'
        );
      }

      setSaved(true);

      const nextStep = data.onboarding?.currentStep || 4;
      setTimeout(() => {
        router.replace(`/dashboard/onboarding/stage${nextStep}`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to save Stage 3:', err);
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading gate ─────────────────────────────────────────────────
  if (sessionLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-indigo-600 mb-2">
          <FileText className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Stage 3
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Tax &amp; Compliance</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter the KRA PIN associated with this business. We&apos;ll use it for tax
          reporting and compliance verification.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-8"
      >
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">
            KRA PIN
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Enter the KRA PIN issued by the Kenya Revenue Authority for this
            business.
          </p>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            KRA PIN <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="kra_pin"
            value={formData.kra_pin}
            onChange={handleChange}
            placeholder="e.g. P051234567A"
            maxLength={11}
            required
            autoComplete="off"
            spellCheck={false}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Your KRA PIN should match the PIN issued by the Kenya Revenue
            Authority.
          </p>
        </div>

        <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push('/dashboard/onboarding/stage2')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Stage 2
          </button>
          <div className="flex-1 sm:flex-none space-y-3">
            {saved && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>KRA PIN saved! Moving to Stage 4...</span>
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
                  Save &amp; Continue
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}