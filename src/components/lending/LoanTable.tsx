// src/components/lending/LoanTable.tsx
'use client';

import LoanRow from './LoanRow';
import EmptyState from './EmptyState';
import { Inbox } from 'lucide-react';
import type { Loan } from '@/lib/lending-api';

interface Props {
  loans: Loan[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function LoanTable({
  loans,
  loading,
  emptyTitle = 'No loans yet',
  emptyDescription = 'Once you start lending, your portfolio will show up here.',
}: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 animate-pulse">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-48" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-6 bg-gray-100 rounded-full w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!loans || loans.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Borrower / Reference
        </div>
        <div className="text-right hidden sm:block w-28 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Principal
        </div>
        <div className="text-right hidden md:block w-32 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Outstanding
        </div>
        <div className="w-24 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Status
        </div>
        <div className="w-4" />
      </div>
      {loans.map((loan) => (
        <LoanRow key={loan.id} loan={loan} />
      ))}
    </div>
  );
}

export default LoanTable;