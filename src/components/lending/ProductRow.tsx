// src/components/lending/ProductRow.tsx
'use client';

import { ChevronRight } from 'lucide-react';
import { formatKES, type LoanProduct } from '@/lib/lending-api';

const STATUS_STYLES: Record<LoanProduct['status'], string> = {
  DRAFT:    'bg-gray-100 text-gray-700',
  ACTIVE:   'bg-emerald-100 text-emerald-700',
  PAUSED:   'bg-amber-100 text-amber-700',
  ARCHIVED: 'bg-slate-200 text-slate-600',
};

interface Props {
  product: LoanProduct;
  onSelect?: (product: LoanProduct) => void;
}

export function ProductRow({ product, onSelect }: Props) {
  const range = formatKES(product.min_amount) + ' — ' + formatKES(product.max_amount);
  const term = product.min_term_days + '–' + product.max_term_days + 'd';
  const rate = Number(product.interest_rate).toFixed(2) + '% ' + product.interest_period.toLowerCase();

  return (
    <div
      onClick={() => onSelect?.(product)}
      className="group flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50/80 transition-colors cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
          <span className="font-mono tabular-nums">{product.code}</span>
          <span className="text-gray-300">·</span>
          <span>{product.repayment_frequency}</span>
        </div>
      </div>

      <div className="text-right w-48 hidden sm:block">
        <div className="font-mono text-sm tabular-nums text-gray-700">{range}</div>
      </div>

      <div className="text-right w-28 hidden md:block">
        <div className="font-mono text-sm tabular-nums text-gray-700">{rate}</div>
      </div>

      <div className="text-right w-20 hidden lg:block">
        <div className="font-mono text-sm tabular-nums text-gray-700">{term}</div>
      </div>

      <div className="w-24 flex justify-end">
        <span
          className={
            'inline-flex items-center font-medium rounded-full px-2 py-0.5 text-xs ' +
            STATUS_STYLES[product.status]
          }
        >
          {product.status}
        </span>
      </div>

      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" />
    </div>
  );
}

export default ProductRow;