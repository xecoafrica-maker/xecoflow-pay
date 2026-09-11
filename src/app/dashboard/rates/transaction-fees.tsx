// src/app/(dashboard)/transaction-fee/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Send, Wallet, Info, Loader2 } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────
interface FeeTier {
  range: string;
  fee: string;
  isFree?: boolean;
}

// ─── Data ───────────────────────────────────────────────────────────
const STK_PUSH_FEES: FeeTier[] = [
  { range: 'KES 1 - KES 9', fee: 'Free', isFree: true },
  { range: 'KES 10+', fee: 'KES 3' },
];

const B2C_FEES: FeeTier[] = [
  { range: 'KES 1 - KES 49', fee: 'KES 6' },
  { range: 'KES 50 - KES 499', fee: 'KES 12' },
  { range: 'KES 500 - KES 999', fee: 'KES 18' },
  { range: 'KES 1,000 - KES 1,499', fee: 'KES 23' },
  { range: 'KES 1,500 - KES 2,499', fee: 'KES 30' },
  { range: 'KES 2,500 - KES 3,499', fee: 'KES 33' },
  { range: 'KES 3,500 - KES 4,999', fee: 'KES 40' },
  { range: 'KES 5,000 - KES 7,499', fee: 'KES 50' },
  { range: 'KES 7,500 - KES 9,999', fee: 'KES 55' },
  { range: 'KES 10,000 - KES 14,999', fee: 'KES 65' },
  { range: 'KES 15,000 - KES 19,999', fee: 'KES 85' },
  { range: 'KES 20,000 - KES 34,999', fee: 'KES 110' },
  { range: 'KES 35,000 - KES 49,999', fee: 'KES 150' },
  { range: 'KES 50,000 - KES 149,999', fee: 'KES 170' },
  { range: 'KES 150,000 - KES 249,999', fee: 'KES 200' },
  { range: 'KES 250,000+', fee: '2%' },
];

// ─── Components ─────────────────────────────────────────────────────
function FeeTable({ 
  title, 
  subtitle, 
  icon: Icon, 
  fees 
}: { 
  title: string; 
  subtitle: string; 
  icon: React.ElementType; 
  fees: FeeTier[];
}) {
  return (
    <div className="bg-white dark:bg-[#0f1f3a] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-50 dark:bg-[#1a2a4a] rounded-lg">
            <Icon className="w-5 h-5 text-[#0a2540] dark:text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-2 px-6 py-4 bg-gray-50/50 dark:bg-[#0a2540]/50 border-b border-gray-100 dark:border-gray-800">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Amount
        </span>
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
          Fee
        </span>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto">
        {fees.map((tier, idx) => (
          <div
            key={idx}
            className="grid grid-cols-2 px-6 py-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-[#1a2a4a]/30 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {tier.range}
            </span>
            <span
              className={`text-sm font-semibold text-right ${
                tier.isFree
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {tier.fee}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function TransactionFeePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'stk' | 'b2c'>('all');
  const [authChecked, setAuthChecked] = useState(false);

  // ✅ Auth guard — read merchant from localStorage (same pattern as transactions page)
  useEffect(() => {
    let storedMerchant: any = null;
    let id = '';

    try {
      const stored = localStorage.getItem('merchant');
      if (stored) {
        storedMerchant = JSON.parse(stored);
        id = String(storedMerchant.merchant_id || storedMerchant.merchantId || '');
      }
    } catch (e) {
      console.error('Failed to parse merchant data', e);
    }

    if (!storedMerchant || !id) {
      console.warn('⚠️ No merchant found in localStorage, redirecting to login');
      router.push('/login?session=expired');
      return;
    }

    setAuthChecked(true);
  }, [router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a2540] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a2540] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Bar / Tabs */}
        <div className="flex items-center gap-2 bg-white dark:bg-[#0f1f3a] p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-[#0a2540] text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a2a4a]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('stk')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'stk'
                ? 'bg-[#0a2540] text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a2a4a]'
            }`}
          >
            STK Push
          </button>
          <button
            onClick={() => setActiveTab('b2c')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'b2c'
                ? 'bg-[#0a2540] text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a2a4a]'
            }`}
          >
            B2C
          </button>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Transaction fees are deducted from your settlement balance. Fees shown are inclusive of all applicable taxes. 
            Contact support for custom enterprise pricing.
          </p>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(activeTab === 'all' || activeTab === 'stk') && (
            <FeeTable
              title="STK Push"
              subtitle="Customer-initiated M-Pesa payments"
              icon={Smartphone}
              fees={STK_PUSH_FEES}
            />
          )}

          {(activeTab === 'all' || activeTab === 'b2c') && (
            <FeeTable
              title="B2C Payments"
              subtitle="Payouts to customer wallets"
              icon={Send}
              fees={B2C_FEES}
            />
          )}
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500 pt-4">
          <Wallet className="w-3.5 h-3.5" />
          <span>All fees are in Kenyan Shillings (KES). Rates subject to change.</span>
        </div>
      </div>
    </div>
  );
}