// src/components/lending/ProductTable.tsx
'use client';

import { Package } from 'lucide-react';
import ProductRow from './ProductRow';
import type { LoanProduct } from '@/lib/lending-api';

interface Props {
  products: LoanProduct[];
  loading?: boolean;
  onSelect?: (product: LoanProduct) => void;
  emptyAction?: React.ReactNode;
}

export function ProductTable({ products, loading, onSelect, emptyAction }: Props) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50/60 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          <div className="flex-1">Product</div>
          <div className="w-48 text-right hidden sm:block">Amount Range</div>
          <div className="w-28 text-right hidden md:block">Rate</div>
          <div className="w-20 text-right hidden lg:block">Term</div>
          <div className="w-24 text-right">Status</div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 animate-pulse">
            <div className="flex-1">
              <div className="h-3.5 bg-gray-200 rounded w-40 mb-1.5" />
              <div className="h-3 bg-gray-100 rounded w-32" />
            </div>
            <div className="h-3.5 bg-gray-100 rounded w-32" />
            <div className="h-3.5 bg-gray-100 rounded w-16" />
            <div className="h-3.5 bg-gray-100 rounded w-12" />
            <div className="h-5 bg-gray-100 rounded-full w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="text-center py-14 px-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-gray-400" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">No products yet</h3>
          <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto">
            Loan products define the terms you offer: amount ranges, interest rates,
            terms, and repayment structures.
          </p>
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-2.5 bg-gray-50/60 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        <div className="flex-1">Product</div>
        <div className="text-right w-48 hidden sm:block">Amount Range</div>
        <div className="text-right w-28 hidden md:block">Rate</div>
        <div className="text-right w-20 hidden lg:block">Term</div>
        <div className="text-right w-24">Status</div>
      </div>
      {products.map((p) => (
        <ProductRow key={p.id} product={p} onSelect={onSelect} />
      ))}
    </div>
  );
}

export default ProductTable;