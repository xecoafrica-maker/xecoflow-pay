// src/components/lending/ApplicationCard.tsx
'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Phone,
  User,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { formatKES, formatDate, type Loan } from '@/lib/lending-api';

interface Props {
  loan: Loan;
  processing?: 'approve' | 'reject' | null;
  onApprove: (loan: Loan) => void;
  onReject: (loan: Loan) => void;
}

export function ApplicationCard({ loan, processing, onApprove, onReject }: Props) {
  const busy = processing !== null;
  const borrowerLabel =
    loan.external_customer_id || loan.loan_reference.slice(0, 20);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-100">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">
                {borrowerLabel}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                <span className="font-mono tabular-nums">{loan.loan_reference}</span>
              </div>
            </div>
          </div>
        </div>

        <Link
          href={'/dashboard/loans/' + loan.id}
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 flex-shrink-0"
        >
          View <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        <div className="px-5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Principal
          </div>
          <div className="mt-1 font-mono text-base font-semibold tabular-nums text-gray-900">
            {formatKES(loan.principal_amount)}
          </div>
        </div>
        <div className="px-5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Interest
          </div>
          <div className="mt-1 font-mono text-base tabular-nums text-gray-700">
            {formatKES(loan.interest_amount)}
          </div>
        </div>
        <div className="px-5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Total Due
          </div>
          <div className="mt-1 font-mono text-base font-semibold tabular-nums text-gray-900">
            {formatKES(loan.total_due)}
          </div>
        </div>
        <div className="px-5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Term
          </div>
          <div className="mt-1 text-sm text-gray-700">
            {loan.terms.term_days} days
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2.5 bg-gray-50/50 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Requested {formatDate(loan.timeline.requested_at)}
        </span>
        {loan.terms.repayment_frequency && (
          <span>
            {loan.terms.repayment_frequency.charAt(0) +
              loan.terms.repayment_frequency.slice(1).toLowerCase()}{' '}
            · {Number(loan.terms.interest_rate).toFixed(2)}%{' '}
            {loan.terms.interest_period.toLowerCase()}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-5 py-3 bg-white">
        <button
          onClick={() => onReject(loan)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-red-300 hover:text-red-700 disabled:opacity-50 transition-colors"
        >
          {processing === 'reject' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          Reject
        </button>
        <button
          onClick={() => onApprove(loan)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md disabled:opacity-50 transition-colors"
        >
          {processing === 'approve' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5" />
          )}
          Approve
        </button>
      </div>
    </div>
  );
}

export default ApplicationCard;