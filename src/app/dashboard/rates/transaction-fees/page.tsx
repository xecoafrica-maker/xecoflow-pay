// src/app/(dashboard)/transaction-fee/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Send, Wallet, Info, Loader2, Radio, TrendingUp, Shield, ArrowRight, FileText, Download, Clock, CheckCircle2 } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────
interface FeeTier {
  range: string;
  fee: string;
  isFree?: boolean;
  highlight?: boolean;
}

// ─── Data ───────────────────────────────────────────────────────────
const STK_PUSH_FEES: FeeTier[] = [
  { range: 'KES 1 — KES 9', fee: 'Free', isFree: true },
  { range: 'KES 10 — KES 49', fee: 'KES 3' },
  { range: 'KES 50 — KES 100', fee: 'KES 5' },
  { range: 'KES 101 — KES 500', fee: 'KES 7' },
  { range: 'KES 501 — KES 2,000', fee: 'KES 10' },
  { range: 'KES 2,001 — KES 5,000', fee: 'KES 12' },
  { range: 'KES 5,001 — KES 10,000', fee: 'KES 15' },
  { range: 'KES 10,001 — KES 35,000', fee: 'KES 20' },
  { range: 'KES 35,001 — KES 50,000', fee: 'KES 25' },
  { range: 'KES 50,001 — KES 70,000', fee: 'KES 30' },
  { range: 'KES 70,001+', fee: 'KES 35' },
];

const B2C_FEES: FeeTier[] = [
  { range: 'KES 1 — KES 49', fee: 'KES 6' },
  { range: 'KES 50 — KES 499', fee: 'KES 12' },
  { range: 'KES 500 — KES 999', fee: 'KES 18' },
  { range: 'KES 1,000 — KES 1,499', fee: 'KES 23' },
  { range: 'KES 1,500 — KES 2,499', fee: 'KES 30' },
  { range: 'KES 2,500 — KES 3,499', fee: 'KES 33' },
  { range: 'KES 3,500 — KES 4,999', fee: 'KES 40' },
  { range: 'KES 5,000 — KES 7,499', fee: 'KES 50' },
  { range: 'KES 7,500 — KES 9,999', fee: 'KES 55' },
  { range: 'KES 10,000 — KES 14,999', fee: 'KES 65' },
  { range: 'KES 15,000 — KES 19,999', fee: 'KES 85' },
  { range: 'KES 20,000 — KES 34,999', fee: 'KES 110' },
  { range: 'KES 35,000 — KES 49,999', fee: 'KES 150' },
  { range: 'KES 50,000 — KES 149,999', fee: 'KES 170' },
  { range: 'KES 150,000 — KES 249,999', fee: 'KES 200' },
  { range: 'KES 250,000+', fee: '2%' },
];

const BULK_AIRTIME_FEES: FeeTier[] = [
  { range: 'KES 10 — KES 99', fee: 'KES 2 per transaction' },
  { range: 'KES 100 — KES 499', fee: 'KES 5 per transaction' },
  { range: 'KES 500 — KES 999', fee: 'KES 8 per transaction' },
  { range: 'KES 1,000 — KES 4,999', fee: 'KES 12 per transaction' },
  { range: 'KES 5,000 — KES 9,999', fee: 'KES 18 per transaction' },
  { range: 'KES 10,000 — KES 24,999', fee: 'KES 25 per transaction' },
  { range: 'KES 25,000 — KES 49,999', fee: 'KES 35 per transaction' },
  { range: 'KES 50,000 — KES 99,999', fee: 'KES 50 per transaction' },
  { range: 'KES 100,000 — KES 249,999', fee: 'KES 75 per transaction' },
  { range: 'KES 250,000+', fee: '0.05% of airtime value' },
];

// ─── Components ─────────────────────────────────────────────────────
function FeeTable({
  title,
  subtitle,
  icon: Icon,
  fees,
  accentColor = 'emerald',
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  fees: FeeTier[];
  accentColor?: string;
}) {
  const accentMap: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-200 dark:border-emerald-800/50',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-200 dark:border-blue-800/50',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    },
    violet: {
      bg: 'bg-violet-50 dark:bg-violet-950/20',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-200 dark:border-violet-800/50',
      iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    },
  };

  const accent = accentMap[accentColor] || accentMap.emerald;

  return (
    <div className="bg-white dark:bg-[#0f1f3a] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 ${accent.iconBg} rounded-xl`}>
              <Icon className={`w-5 h-5 ${accent.text}`} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className={`w-3.5 h-3.5 ${accent.text}`} />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 px-6 py-3 bg-gray-50/80 dark:bg-[#0a2540]/60 border-b border-gray-100 dark:border-gray-800">
        <span className="col-span-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          #
        </span>
        <span className="col-span-6 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Transaction Amount
        </span>
        <span className="col-span-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">
          Transaction Fee
        </span>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-y-auto max-h-[480px]">
        {fees.map((tier, idx) => (
          <div
            key={idx}
            className={`grid grid-cols-12 px-6 py-3.5 border-b border-gray-50 dark:border-gray-800/40 hover:bg-gray-50/60 dark:hover:bg-[#1a2a4a]/40 transition-colors ${
              tier.isFree ? 'bg-emerald-50/40 dark:bg-emerald-950/10' : ''
            }`}
          >
            <span className="col-span-2 text-xs text-gray-400 dark:text-gray-500 font-mono">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <span className="col-span-6 text-sm font-medium text-gray-700 dark:text-gray-300">
              {tier.range}
            </span>
            <span
              className={`col-span-4 text-sm font-semibold text-right ${
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

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50/50 dark:bg-[#0a2540]/30 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {fees.length} tier{fees.length !== 1 ? 's' : ''}
          </span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            All amounts in KES
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function TransactionFeePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'stk' | 'b2c' | 'bulk-airtime'>('all');
  const [authChecked, setAuthChecked] = useState(false);

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

  const tabs = [
    { id: 'all' as const, label: 'All Rates', count: 3 },
    { id: 'stk' as const, label: 'STK Push', count: 1 },
    { id: 'b2c' as const, label: 'B2C Payouts', count: 1 },
    { id: 'bulk-airtime' as const, label: 'Bulk Airtime', count: 1 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a2540]">
      {/* Top Header Section */}
      <div className="bg-white dark:bg-[#0f1f3a] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Transaction Fees & Rates
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-full">
                  Live
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Standard pricing for all transaction types. Last updated Sept 12, 2026.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1a2a4a] border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-[#1f3354] transition-colors">
                <FileText className="w-4 h-4" />
                Export PDF
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0a2540] dark:bg-emerald-600 rounded-lg hover:bg-[#0d3058] dark:hover:bg-emerald-700 transition-colors shadow-sm">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-6 -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  activeTab === tab.id
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/50 rounded-xl">
          <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex-shrink-0">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Fee Schedule Notice
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              Transaction fees are deducted from your settlement balance. All rates shown are inclusive of applicable taxes (VAT). Enterprise clients may qualify for custom pricing — contact your account manager.
            </p>
          </div>
          <button className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 whitespace-nowrap">
            Learn more
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0f1f3a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Rate Types</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Active categories</p>
          </div>
          <div className="bg-white dark:bg-[#0f1f3a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Updated</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">Today</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Sep 12, 2026</p>
          </div>
          <div className="bg-white dark:bg-[#0f1f3a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-violet-100 dark:bg-violet-900/40 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Compliance</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">CBK</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Regulatory approved</p>
          </div>
          <div className="bg-white dark:bg-[#0f1f3a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                <Wallet className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Currency</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">KES</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Kenyan Shilling</p>
          </div>
        </div>

        {/* Tables - Landscape Layout */}
        {activeTab === 'all' ? (
          <div className="space-y-6">
            {/* STK Push - Full Width Landscape */}
            <FeeTable
              title="STK Push"
              subtitle="Customer-initiated M-Pesa payments via LIPA NA M-PESA"
              icon={Smartphone}
              fees={STK_PUSH_FEES}
              accentColor="emerald"
            />

            {/* B2C and Bulk Airtime side by side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <FeeTable
                title="B2C Payments"
                subtitle="Business-to-customer payouts and disbursements"
                icon={Send}
                fees={B2C_FEES}
                accentColor="blue"
              />
              <FeeTable
                title="Bulk Airtime"
                subtitle="Bulk airtime distribution to multiple recipients"
                icon={Radio}
                fees={BULK_AIRTIME_FEES}
                accentColor="violet"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {activeTab === 'stk' && (
              <FeeTable
                title="STK Push"
                subtitle="Customer-initiated M-Pesa payments via LIPA NA M-PESA"
                icon={Smartphone}
                fees={STK_PUSH_FEES}
                accentColor="emerald"
              />
            )}
            {activeTab === 'b2c' && (
              <FeeTable
                title="B2C Payments"
                subtitle="Business-to-customer payouts and disbursements"
                icon={Send}
                fees={B2C_FEES}
                accentColor="blue"
              />
            )}
            {activeTab === 'bulk-airtime' && (
              <FeeTable
                title="Bulk Airtime"
                subtitle="Bulk airtime distribution to multiple recipients"
                icon={Radio}
                fees={BULK_AIRTIME_FEES}
                accentColor="violet"
              />
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 pb-6 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <Wallet className="w-3.5 h-3.5" />
            <span>All fees are in Kenyan Shillings (KES). Rates are subject to change with prior notice.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
            <span>v2.4.0</span>
            <span>•</span>
            <span>© 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
