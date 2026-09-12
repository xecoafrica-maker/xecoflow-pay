// src/app/(dashboard)/transaction-fee/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Send, Wallet, Info, Loader2, Radio } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────
interface FeeTier {
  range: string;
  fee: string;
  isFree?: boolean;
}

interface FeeSchedule {
  key: 'stk' | 'b2c' | 'airtime';
  title: string;
  subtitle: string;
  icon: React.ElementType;
  unit: string;
  tiers: FeeTier[];
}

// ─── Data ───────────────────────────────────────────────────────────
const STK_PUSH_FEES: FeeTier[] = [
  { range: 'KES 1 – 9', fee: 'Free', isFree: true },
  { range: 'KES 10+', fee: 'KES 3' },
];

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

// Bulk airtime — charged per top-up, tiered by volume of the batch.
const BULK_AIRTIME_FEES: FeeTier[] = [
  { range: 'KES 1 – 99', fee: '2.0%' },
  { range: 'KES 100 – 499', fee: '1.5%' },
  { range: 'KES 500 – 999', fee: '1.25%' },
  { range: 'KES 1,000 – 4,999', fee: '1.0%' },
  { range: 'KES 5,000 – 19,999', fee: '0.75%' },
  { range: 'KES 20,000 – 49,999', fee: '0.5%' },
  { range: 'KES 50,000+', fee: '0.4%' },
];

const SCHEDULES: FeeSchedule[] = [
  {
    key: 'stk',
    title: 'STK Push',
    subtitle: 'Customer-initiated collections',
    icon: Smartphone,
    unit: 'Per transaction',
    tiers: STK_PUSH_FEES,
  },
  {
    key: 'b2c',
    title: 'B2C payouts',
    subtitle: 'Disbursements to customer wallets',
    icon: Send,
    unit: 'Per transaction',
    tiers: B2C_FEES,
  },
  {
    key: 'airtime',
    title: 'Bulk airtime',
    subtitle: 'Batch top-ups across networks',
    icon: Radio,
    unit: 'Per top-up, % of value',
    tiers: BULK_AIRTIME_FEES,
  },
];

// ─── Components ─────────────────────────────────────────────────────
function FeeCard({ schedule }: { schedule: FeeSchedule }) {
  const Icon = schedule.icon;
  return (
    <section className="flex flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0d1b32]">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-900 dark:bg-white/10">
            <Icon className="h-4 w-4 text-white" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold leading-tight text-slate-900 dark:text-white">
              {schedule.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{schedule.subtitle}</p>
          </div>
        </div>
        <span className="hidden shrink-0 rounded border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 sm:block dark:border-slate-700 dark:text-slate-400">
          {schedule.unit}
        </span>
      </header>

      {/* Tier grid — two columns so the schedule reads wide rather than tall */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-0 p-3">
        {schedule.tiers.map((tier, idx) => (
          <div
            key={idx}
            className="flex items-baseline justify-between gap-3 border-b border-slate-50 px-2 py-2.5 last:border-b-0 dark:border-slate-800/60"
          >
            <span className="text-[13px] text-slate-600 dark:text-slate-400">{tier.range}</span>
            <span
              className={`text-[13px] font-semibold tabular-nums ${
                tier.isFree ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
              }`}
            >
              {tier.fee}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function TransactionFeePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'stk' | 'b2c' | 'airtime'>('all');
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0a1730]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const visibleSchedules =
    activeTab === 'all' ? SCHEDULES : SCHEDULES.filter((s) => s.key === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a1730]">
      {/* Landscape-oriented shell: wide max-width, content spans in rows rather than a tall stack */}
      <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
        {/* Title bar */}
        <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Pricing</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              Transaction fee schedule
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Current rates across collections, payouts, and bulk airtime.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-[#0d1b32]">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'stk', label: 'STK Push' },
                { id: 'b2c', label: 'B2C' },
                { id: 'airtime', label: 'Bulk airtime' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Info banner */}
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-[#0d1b32]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Fees are deducted from your settlement balance and are inclusive of applicable taxes.
            Bulk airtime is billed per top-up as a percentage of the recharge value. Contact support
            for negotiated enterprise pricing.
          </p>
        </div>

        {/* Fee schedules — landscape grid, up to three across */}
        <div
          className={`grid grid-cols-1 gap-5 ${
            visibleSchedules.length > 1 ? 'lg:grid-cols-3' : 'lg:grid-cols-1'
          }`}
        >
          {visibleSchedules.map((schedule) => (
            <FeeCard key={schedule.key} schedule={schedule} />
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <Wallet className="h-3.5 w-3.5" />
          <span>All fees are in Kenyan Shillings (KES). Rates subject to change without notice.</span>
        </div>
      </div>
    </div>
  );
}