// src/components/lending/LoanTable.tsx
'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatKES, formatDate, type Loan } from '@/lib/lending-api';

interface Props {
  loans: Loan[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  dense?: boolean;
}

export function LoanTable({
  loans, loading,
  emptyTitle = 'No loans yet',
  emptyDescription = 'Loans you originate or approve will appear here.',
  emptyAction, dense = false,
}: Props) {
  const rowPad = dense ? 'py-2.5' : 'py-3.5';

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50/60 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          <div className="flex-1">Borrower / Reference</div>
          <div className="w-28 text-right">Principal</div>
          <div className="w-32 text-right">Outstanding</div>
          <div className="w-24 text-right">Status</div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className={'flex items-center gap-4 px-5 border-b border-gray-50 animate-pulse ' + rowPad}>
            <div className="flex-1">
              <div className="h-3.5 bg-gray-200 rounded w-40 mb-1.5" />
              <div className="h-3 bg-gray-100 rounded w-56" />
            </div>
            <div className="h-3.5 bg-gray-100 rounded w-20" />
            <div className="h-3.5 bg-gray-100 rounded w-24" />
            <div className="h-5 bg-gray-100 rounded-full w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!loans || loans.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="text-center py-14 px-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{emptyTitle}</h3>
          <p className="text-xs text-gray-500 mt-1.5 max-w-sm mx-auto">{emptyDescription}</p>
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50/60 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        <div className="flex-1">Borrower / Reference</div>
        <div className="text-right w-28 hidden sm:block">Principal</div>
        <div className="text-right w-32 hidden md:block">Outstanding</div>
        <div className="text-right w-24">Status</div>
      </div>

      {loans.map((loan) => {
        const borrowerLabel = loan.external_customer_id || loan.loan_reference.slice(0, 24);
        return (
          <Link key={loan.id} href={'/dashboard/loans/' + loan.id}
            className={'group flex items-center gap-4 px-5 border-b border-gray-50 hover:bg-gray-50/80 transition-colors ' + rowPad}>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{borrowerLabel}</div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                <span className="font-mono tabular-nums">{loan.loan_reference}</span>
                {loan.timeline.maturity_date && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span>Due {formatDate(loan.timeline.maturity_date)}</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right w-28 hidden sm:block">
              <div className="font-mono text-sm tabular-nums text-gray-700">{formatKES(loan.principal_amount)}</div>
            </div>
            <div className="text-right w-32 hidden md:block">
              <div className="font-mono text-sm font-semibold tabular-nums text-gray-900">{formatKES(loan.outstanding.total)}</div>
            </div>
            <div className="w-24 flex justify-end">
              <StatusBadge status={loan.status} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default LoanTable;