'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Landmark, 
  Smartphone, 
  Save, 
  Loader2, 
  Phone, 
  CheckCircle,
  CreditCard,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { getToken } from '@/lib/auth';

const SETTLEMENT_METHODS = [
  { id: 'mpesa', label: 'M-PESA', icon: Smartphone },
  { id: 'airtel', label: 'Airtel Money', icon: Smartphone },
  { id: 'bank', label: 'Bank Transfer', icon: Landmark },
];

export default function OnboardingStage4() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    settlement_method: 'mpesa',
    settlement_phone: '',
    bank_name: '',
    bank_account_number: '',
    bank_account_holder: '',
  });

  // ─── Load Settlement Data from new API ──────────────────────────
  useEffect(() => {
    const fetchSettlement = async () => {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/v1/onboarding/settlement', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load settlement information');
        }

        setFormData({
          settlement_method: data.settlement_method || 'mpesa',
          settlement_phone: data.settlement_phone || '',
          bank_name: data.bank_name || '',
          bank_account_number: data.bank_account_number || '',
          bank_account_holder: data.bank_account_holder || '',
        });
      } catch (err: any) {
        console.error('❌ Failed to load Stage 4:', err);
        setError(err.message || 'Failed to load settlement information');
      } finally {
        setLoading(false);
      }
    };
    fetchSettlement();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleMethodChange = (methodId: string) => {
    setFormData(prev => ({ ...prev, settlement_method: methodId }));
    setSaved(false);
  };

  // ─── Save & Continue ──────────────────────────────────────────────
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
      const res = await fetch('/v1/onboarding/settlement/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          settlement_method: formData.settlement_method,
          settlement_phone: formData.settlement_phone.trim(),
          bank_name: formData.bank_name.trim(),
          bank_account_number: formData.bank_account_number.trim(),
          bank_account_holder: formData.bank_account_holder.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || 'Failed to save settlement preferences');
      }

      setSaved(true);
      // ✅ Redirect to Stage 5 (Review & Submit)
      setTimeout(() => {
        router.push('/dashboard/onboarding/stage5');
      }, 1500);
    } catch (err: any) {
      console.error('❌ Failed to save Stage 4:', err);
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
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <Landmark className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">04 — Settlement Preferences</h1>
          <p className="text-sm text-gray-500 mt-1">
            Choose how you want to receive your business payouts.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        
        <div className="flex flex-wrap gap-3 mb-2">
          {SETTLEMENT_METHODS.map((method) => {
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => handleMethodChange(method.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${
                  formData.settlement_method === method.id
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-500'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {method.label}
              </button>
            );
          })}
        </div>

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
          {(formData.settlement_method === 'mpesa' || formData.settlement_method === 'airtel') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.settlement_method === 'mpesa' ? 'M-PESA' : 'Airtel Money'} Number *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  name="settlement_phone"
                  value={formData.settlement_phone}
                  onChange={handleChange}
                  placeholder="0712345678"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                This is the number where we will send your business payouts via {formData.settlement_method === 'mpesa' ? 'M-PESA' : 'Airtel Money'}.
              </p>
            </div>
          )}

          {formData.settlement_method === 'bank' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                <div className="relative">
                  <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleChange}
                    placeholder="e.g. Equity Bank, KCB"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={handleChange}
                    placeholder="1234567890"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name *</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    name="bank_account_holder"
                    value={formData.bank_account_holder}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                We will send your business payouts to this bank account.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}
          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Settlement information saved. Moving to review...</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard/onboarding/stage3')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Stage 3
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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