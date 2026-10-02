// src/components/lending/LoanRow.tsx
'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatKES, formatDate, type Loan } from '@/lib/lending-api';

interface Props {
  loan: Loan;
  href?: string;
}

export function LoanRow({ loan, href }: Props) {
  const link = href ?? ('/dashboard/loans/' + loan.id);
  const borrowerLabel = loan.external_customer_id || loan.loan_reference.slice(0, 20);

  return (
    <Link href={link} className="group flex items-center gap-4 px-5 py-4 hover:bg-gray-50 border-b border-gray-100 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 truncate">{borrowerLabel}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span className="font-mono">{loan.loan_reference}</span>
          {loan.timeline.maturity_date && (
            <>
              <span>·</span>
              <span>Due {formatDate(loan.timeline.maturity_date)}</span>
            </>
          )}
        </div>
      </div>

      <div className="text-right hidden sm:block w-28">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Principal</p>
        <p className="text-sm font-medium text-gray-900">{formatKES(loan.principal_amount)}</p>
      </div>

      <div className="text-right hidden md:block w-32">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Outstanding</p>
        <p className="text-sm font-semibold text-gray-900">{formatKES(loan.outstanding.total)}</p>
      </div>

      <div className="w-24 flex justify-end">
        <StatusBadge status={loan.status} />
      </div>

      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
    </Link>
  );
}

export default LoanRow;