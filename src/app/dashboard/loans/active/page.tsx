// src/app/dashboard/loans/active/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import PageHeader from '@/components/lending/PageHeader';
import LoanTable from '@/components/lending/LoanTable';
import { listLoans, type Loan } from '@/lib/lending-api';

type Filter = 'ACTIVE' | 'OVERDUE' | 'DISBURSED' | 'ALL';

export default function ActiveLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // The credit engine accepts a single status filter, so we fetch
      // each of the three interesting statuses and merge.
      if (filter === 'ALL') {
        const [active, overdue, disbursed] = await Promise.all([
          listLoans({ status: 'ACTIVE', limit: 100 }),
          listLoans({ status: 'OVERDUE', limit: 100 }),
          listLoans({ status: 'DISBURSED', limit: 100 }),
        ]);
        setLoans([
          ...active.loans,
          ...overdue.loans,
          ...disbursed.loans,
        ].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        ));
      } else {
        const result = await listLoans({ status: filter, limit: 100 });
        setLoans(result.loans);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load active loans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const counts = {
    active: loans.filter((l) => l.status === 'ACTIVE').length,
    overdue: loans.filter((l) => l.status === 'OVERDUE').length,
    disbursed: loans.filter((l) => l.status === 'DISBURSED').length,
  };

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'ALL',       label: 'All' },
    { key: 'ACTIVE',    label: 'Active' },
    { key: 'OVERDUE',   label: 'Overdue' },
    { key: 'DISBURSED', label: 'Disbursed' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader onRefresh={load} refreshing={loading} />

      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Active Loans
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {loading
                ? 'Loading…'
                : loans.length === 0
                ? 'No loans in this view'
                : `${loans.length} loan${loans.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count =
              f.key === 'ALL'
                ? loans.length
                : counts[
                    f.key.toLowerCase() as keyof typeof counts
                  ];
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={
                  'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ' +
                  (active
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50')
                }
              >
                {f.label}
                <span
                  className={
                    'text-[10px] px-1.5 py-0.5 rounded-full ' +
                    (active
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600')
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="flex items-start gap-3 border border-red-200 bg-red-50 text-red-800 rounded-lg px-4 py-3 text-sm mb-4">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-medium">Unable to load loans</div>
              <div className="text-xs text-red-700/80 mt-0.5">{error}</div>
            </div>
          </div>
        )}

        <LoanTable
          loans={loans}
          loading={loading}
          emptyTitle="No active loans"
          emptyDescription="Loans you approve and disburse will appear here as they become active."
          emptyAction={
            <Link
              href="/dashboard/loans"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              Back to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
      </section>
    </div>
  );
}