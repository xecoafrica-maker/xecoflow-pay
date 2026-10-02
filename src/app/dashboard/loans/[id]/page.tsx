// src/app/dashboard/loans/[id]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export default function LoanDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-gray-200">
        <Link
          href="/dashboard/loans/active"
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Active Loans
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Loan Detail</h1>
        {id && (
          <p className="text-xs text-gray-400 mt-1 font-mono tabular-nums">
            Reference ID: {id}
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="text-center py-16 px-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Loan Detail View</h3>
          <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto">
            Full loan view with schedule, repayment history, timeline, and actions
            (approve / reject / disburse / activate / penalize).
          </p>
        </div>
      </div>
    </div>
  );
}