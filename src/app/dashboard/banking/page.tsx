'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Landmark, Save, Loader2 } from 'lucide-react';
import { getStoredMerchant } from '@/lib/auth';

export default function BankingPage() {
  const router = useRouter();
  const [settlementPhone, setSettlementPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const merchant = getStoredMerchant();
    if (merchant?.settlement_phone) {
      setSettlementPhone(merchant.settlement_phone);
    }
  }, []);

  const handleSave = async () => {
    if (!settlementPhone || settlementPhone.length < 10) {
      setError('Please enter a valid phone number (e.g., 0712345678)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const merchant = getStoredMerchant();
      const merchantId = merchant?.merchantId || merchant?.merchant_id;

      const res = await fetch('/api/merchant/update-settlement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, settlementPhone }),
      });

      const data = await res.json();

      if (data.success) {
        setSaved(true);
        // Update local storage to reflect changes
        const updatedMerchant = { ...merchant, settlement_phone: settlementPhone };
        localStorage.setItem('merchant', JSON.stringify(updatedMerchant));
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setError(data.error || 'Failed to save banking details');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
          <Landmark className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banking Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            Set up your settlement account to receive payouts.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Settlement Phone Number (M-PESA) *
            </label>
            <input
              type="tel"
              value={settlementPhone}
              onChange={(e) => setSettlementPhone(e.target.value)}
              placeholder="0712345678"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              This is the phone number where we will send your payouts.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          {saved && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm p-3 rounded-xl flex items-center gap-2">
              <span>✅ Banking details saved successfully!</span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settlement Phone
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}