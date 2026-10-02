// Placeholder — real implementation coming next.
'use client';

import { Package } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Loan Products</h1>
        <p className="text-sm text-gray-500 mt-1">Define the loan terms you offer: amounts, rates, and repayment structures.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="text-center py-16 px-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Coming soon</h3>
          <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto">
            This section is being built. The backend is already live — we're wiring the UI now.
          </p>
          <Link
            href="/dashboard/loans"
            className="inline-flex items-center gap-2 mt-5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}