// src/app/dashboard/loans/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Inbox, Package, RefreshCw } from 'lucide-react';
import PortfolioStats from '@/components/lending/PortfolioStats';
import LoanTable from '@/components/lending/LoanTable';
import {
  getPortfolio,
  listLoans,
  type PortfolioSummary,
  type Loan,
} from '@/lib/lending-api';

export default function LoansDashboardPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [recent, setRecent] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [portfolio, list] = await Promise.all([
        getPortfolio(),
        listLoans({ limit: 10 }),
      ]);
      setSummary(portfolio);
      setRecent(list.loans);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Portfolio Overview</h2>
          <p className="text-sm text-gray-500">A snapshot of your lending business</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
          Refresh
        </button>
      </div>

      <PortfolioStats summary={summary} loading={loading} />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Link href="/dashboard/loans/active" className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <LoanTable
          loans={recent}
          loading={loading}
          emptyTitle="No loans yet"
          emptyDescription="Once you approve loan applications, they'll show up here."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/loans/applications" className="group flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-sm">
            <Inbox className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-emerald-700">Review Applications</p>
            <p className="text-sm text-gray-500">Approve or reject pending loan requests</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
        </Link>

        <Link href="/dashboard/loans/products" className="group flex items-center gap-4 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
            <Package className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 group-hover:text-emerald-700">Manage Products</p>
            <p className="text-sm text-gray-500">Define loan terms, rates, and limits</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
        </Link>
      </div>
    </div>
  );
}