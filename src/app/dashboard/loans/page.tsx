// src/app/dashboard/loans/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import PageHeader from '@/components/lending/PageHeader';
import StatGrid from '@/components/lending/StatGrid';
import LoanTable from '@/components/lending/LoanTable';
import OperationsPanel from '@/components/lending/OperationsPanel';
import { getPortfolio, listLoans, type PortfolioSummary, type Loan } from '@/lib/lending-api';

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
        listLoans({ limit: 8 }),
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
    <div className="space-y-6">
      <PageHeader onRefresh={load} refreshing={loading} />

      {error && (
        <div className="flex items-start gap-3 border border-red-200 bg-red-50 text-red-800 rounded-lg px-4 py-3 text-sm">
          <div className="flex-1">
            <div className="font-medium">Unable to load dashboard</div>
            <div className="text-xs text-red-700/80 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Portfolio</h2>
        </div>
        <StatGrid summary={summary} loading={loading} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Recent Loans</h2>
            <Link href="/dashboard/loans/active" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <LoanTable
            loans={recent}
            loading={loading}
            emptyTitle="No loans yet"
            emptyDescription="Create a loan product to define the terms you offer your customers."
            emptyAction={
              <Link href="/dashboard/loans/products" className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Create product
              </Link>
            }
          />
        </div>

        <div className="lg:col-span-1">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Quick Access</h2>
          </div>
          <OperationsPanel summary={summary} loading={loading} />
        </div>
      </div>
    </div>
  );
}