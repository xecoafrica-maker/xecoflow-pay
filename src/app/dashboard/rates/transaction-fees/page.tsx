// src/app/(dashboard)/transaction-fee/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Wallet } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────
interface FeeTier {
  range: string;
  fee: string;
  isFree?: boolean;
}

interface FeeGroup {
  title: string;
  tiers: FeeTier[];
}

// ─── Data ───────────────────────────────────────────────────────────
const B2C_FEES: FeeTier[] = [
  { range: 'KES 1 – 49', fee: 'KES 6' },
  { range: 'KES 50 – 499', fee: 'KES 12' },
  { range: 'KES 500 – 999', fee: 'KES 18' },
  { range: 'KES 1,000 – 1,499', fee: 'KES 23' },
  { range: 'KES 1,500 – 2,499', fee: 'KES 30' },
  { range: 'KES 2,500 – 3,499', fee: 'KES 33' },
  { range: 'KES 3,500 – 4,999', fee: 'KES 40' },
  { range: 'KES 5,000 – 7,499', fee: 'KES 50' },
  { range: 'KES 7,500 – 9,999', fee: 'KES 55' },
  { range: 'KES 10,000 – 14,999', fee: 'KES 65' },
  { range: 'KES 15,000 – 19,999', fee: 'KES 85' },
  { range: 'KES 20,000 – 34,999', fee: 'KES 110' },
  { range: 'KES 35,000 – 49,999', fee: 'KES 150' },
  { range: 'KES 50,000 – 149,999', fee: 'KES 170' },
  { range: 'KES 150,000 – 249,999', fee: 'KES 200' },
  { range: 'KES 250,000+', fee: '2%' },
];

// Bulk airtime — charged per top-up, tiered by the value of the batch.
const BULK_AIRTIME_FEES: FeeTier[] = [
  { range: 'KES 1 – 99', fee: '2.0%' },
  { range: 'KES 100 – 499', fee: '1.5%' },
  { range: 'KES 500 – 999', fee: '1.25%' },
  { range: 'KES 1,000 – 4,999', fee: '1.0%' },
  { range: 'KES 5,000 – 19,999', fee: '0.75%' },
  { range: 'KES 20,000 – 49,999', fee: '0.5%' },
  { range: 'KES 50,000+', fee: '0.4%' },
];

const STK_PUSH_FEES: FeeTier[] = [
  { range: 'KES 1 – 9', fee: 'Free', isFree: true },
  { range: 'KES 10+', fee: 'KES 3' },
];

const FEE_GROUPS: FeeGroup[] = [
  { title: 'B2C', tiers: B2C_FEES },
  { title: 'Bulk airtime', tiers: BULK_AIRTIME_FEES },
  { title: 'STK Push', tiers: STK_PUSH_FEES },
];

// ─── Main Page ──────────────────────────────────────────────────────
export default function TransactionFeePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  // Auth guard — read merchant from localStorage (same pattern as transactions page)
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
      console.warn('No merchant found in localStorage, redirecting to login');
      router.push('/login?session=expired');
      return;
    }

    setAuthChecked(true);
  }, [router]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0a1730]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a1730]">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            Transaction fee schedule
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Current rates for B2C payouts, bulk airtime, and STK Push.
          </p>
        </div>

        {/* One continuous list — B2C, then Bulk airtime, then STK Push */}
        <div>
          {FEE_GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className="mb-2 mt-8 text-xs font-semibold uppercase tracking-wide text-slate-400 first:mt-0 dark:text-slate-500">
                {group.title}
              </h2>
              {group.tiers.map((tier, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between border-b border-slate-100 py-3 dark:border-slate-800"
                >
                  <span className="text-sm text-sky-600 dark:text-sky-400">{tier.range}</span>
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      tier.isFree
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {tier.fee}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
          Failed transactions are not charged.
        </p>

        {/* Footer note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <Wallet className="h-3.5 w-3.5" />
          <span>All fees are in Kenyan Shillings (KES). Rates subject to change without notice.</span>
        </div>
      </div>
    </div>
  );
}