// src/components/lending/CreateLoanForBorrowerModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Plus, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import {
  createLoanForBorrower,
  formatKES,
  type Borrower,
  type CreateLoanForBorrowerInput,
  type TargetStatus,
} from '@/lib/borrowers-api';
import { listProducts, type LoanProduct } from '@/lib/lending-api';

interface Props {
  open: boolean;
  borrower: Borrower | null;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}

const TARGET_LABELS: Record<TargetStatus, { label: string; description: string }> = {
  PENDING: {
    label: 'Pending',
    description: 'Creates the loan and leaves it awaiting approval. No funds move.',
  },
  APPROVED: {
    label: 'Approved',
    description: 'Reserves the credit limit. No funds move yet.',
  },
  DISBURSED: {
    label: 'Disbursed',
    description:
      'Approves and disburses. Funds are posted to the borrower ledger. Cannot be undone without a compensating entry.',
  },
  ACTIVE: {
    label: 'Active',
    description:
      'Full chain: approve, disburse, activate. Funds are posted to the ledger and the loan begins accruing.',
  },
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function humanFrequency(freq: string): string {
  switch (freq) {
    case 'BULLET':
      return 'Single payment at maturity';
    case 'DAILY':
      return 'Daily';
    case 'WEEKLY':
      return 'Weekly';
    case 'BIWEEKLY':
      return 'Every 2 weeks';
    case 'MONTHLY':
      return 'Monthly';
    default:
      return freq || '—';
  }
}

function humanInterestMethod(method?: string): string {
  switch (method) {
    case 'DECLINING':
      return 'declining balance';
    case 'FLAT':
      return 'flat';
    case 'COMPOUND':
      return 'compound';
    default:
      return method ? method.toLowerCase() : '';
  }
}

function humanInterestPeriod(period: string): string {
  switch (period) {
    case 'DAILY':
      return 'daily';
    case 'WEEKLY':
      return 'weekly';
    case 'BIWEEKLY':
      return 'per 2 weeks';
    case 'MONTHLY':
      return 'monthly';
    case 'ANNUAL':
      return 'annual';
    default:
      return period ? period.toLowerCase() : '';
  }
}

export default function CreateLoanForBorrowerModal({
  open,
  borrower,
  onClose,
  onCreated,
}: Props) {
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productId, setProductId] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState<TargetStatus>('PENDING');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId) || null,
    [products, productId]
  );

  // Amount is always the product's max_amount. Term is always default_term_days.
  const amount = selectedProduct ? Number(selectedProduct.max_amount) : 0;
  const termDays = selectedProduct ? Number(selectedProduct.default_term_days) : 0;

  // Derived dates. First due = today + term. Maturity = same for BULLET,
  // or the last due date for instalment products. Since we only have
  // defaults here, we use today + term for both — the credit engine
  // recomputes the real schedule on creation.
  const today = new Date();
  const firstDueDate = selectedProduct ? addDays(today, termDays) : null;
  const maturityDate = firstDueDate;

  // Reset on open/close
  useEffect(() => {
    if (!open) {
      setProductId('');
      setTargetStatus('PENDING');
      setSubmitting(false);
      setError(null);
      setConfirmed(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingProducts(true);
      try {
        const res = await listProducts({ status: 'ACTIVE', limit: 50 });
        if (cancelled) return;
        setProducts(res.products);
        if (res.products.length === 1) {
          setProductId(res.products[0].id);
        }
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Failed to load products.');
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open || !borrower) return null;

  const needsLedgerWarning =
    targetStatus === 'DISBURSED' || targetStatus === 'ACTIVE';

  const validate = (): string | null => {
    if (!selectedProduct) return 'Select a product.';
    if (!borrower.identity) return 'Borrower has no credit identity.';

    // Credit limit check
    if (borrower.creditLimit) {
      const available = Number(borrower.creditLimit.availableLimit);
      if (amount > available) {
        return `Amount ${formatKES(amount)} exceeds available limit ${formatKES(available)}.`;
      }
    }

    if (needsLedgerWarning && !confirmed) {
      return 'Please confirm you understand this will post to the ledger.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    if (!selectedProduct || !borrower.identity) return;

    setSubmitting(true);
    try {
      const payload: CreateLoanForBorrowerInput = {
        borrower_identity_id: borrower.identity.id,
        product_id: selectedProduct.id,
        principal: amount,
        term_days: termDays,
        target_status: targetStatus,
      };
      await createLoanForBorrower(payload);
      await onCreated();
    } catch (err: any) {
      setError(err?.message || 'Failed to create loan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-900">New Loan</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-5 py-4 space-y-3 overflow-y-auto">
            {/* Borrower summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Borrower
              </div>
              <div className="text-sm font-medium text-gray-900">
                {borrower.fullName || borrower.email}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{borrower.email}</div>
              {borrower.creditLimit && (
                <div className="text-xs text-gray-600 mt-1.5">
                  Available limit:{' '}
                  <strong className="text-gray-800">
                    {formatKES(borrower.creditLimit.availableLimit)}
                  </strong>{' '}
                  of {formatKES(borrower.creditLimit.maxLimit)}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 border border-red-200 bg-red-50 text-red-800 rounded-md px-3 py-2 text-xs">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Product */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Product
              </label>
              {loadingProducts ? (
                <div className="text-xs text-gray-500 py-2">Loading products…</div>
              ) : products.length === 0 ? (
                <div className="text-xs text-gray-500 py-2">
                  No active products. Create one in the Products tab first.
                </div>
              ) : (
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    setConfirmed(false);
                    setError(null);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  required
                >
                  <option value="">Select a product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatKES(p.min_amount)}–{formatKES(p.max_amount)})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Read-only product details */}
            {selectedProduct && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Amount
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mt-0.5 tabular-nums">
                      {formatKES(amount)}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Term
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mt-0.5">
                      {termDays} day{termDays === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Repayment
                    </div>
                    <div className="text-sm font-medium text-gray-800 mt-0.5">
                      {humanFrequency(selectedProduct.repayment_frequency)}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Interest
                    </div>
                    <div className="text-sm font-medium text-gray-800 mt-0.5">
                      {parseFloat(selectedProduct.interest_rate).toFixed(2)}%{' '}
                      {humanInterestPeriod(selectedProduct.interest_period)}
                      {selectedProduct.interest_method
                        ? ` · ${humanInterestMethod(selectedProduct.interest_method)}`
                        : ''}
                    </div>
                  </div>
                </div>

                {firstDueDate && maturityDate && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        First due
                      </div>
                      <div className="text-sm font-medium text-gray-800 mt-0.5">
                        {formatDateShort(firstDueDate)}
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        Maturity
                      </div>
                      <div className="text-sm font-medium text-gray-800 mt-0.5">
                        {formatDateShort(maturityDate)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-[11px] text-gray-500 leading-snug">
                  Amount, term, and repayment are set by the product. To vary
                  these, create a new product in the Products tab.
                </div>
              </>
            )}

            {/* Target status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Initial status
              </label>
              <div className="space-y-1.5">
                {(['PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE'] as TargetStatus[]).map(
                  (s) => (
                    <label
                      key={s}
                      className={
                        'flex items-start gap-2 border rounded-md px-3 py-2 cursor-pointer transition-colors ' +
                        (targetStatus === s
                          ? 'border-emerald-500 bg-emerald-50/40'
                          : 'border-gray-200 hover:bg-gray-50')
                      }
                    >
                      <input
                        type="radio"
                        name="target_status"
                        value={s}
                        checked={targetStatus === s}
                        onChange={() => {
                          setTargetStatus(s);
                          setConfirmed(false);
                        }}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="text-xs font-medium text-gray-900">
                          {TARGET_LABELS[s].label}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {TARGET_LABELS[s].description}
                        </div>
                      </div>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Ledger warning */}
            {needsLedgerWarning && (
              <div className="border border-amber-200 bg-amber-50 rounded-md px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-900">
                    <div className="font-semibold">This action cannot be undone</div>
                    <div className="mt-0.5">
                      Funds will be posted to the borrower&apos;s ledger immediately.
                      Reversing requires a compensating entry.
                    </div>
                    <label className="mt-2 flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span className="text-[11px]">
                        I understand and want to proceed.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 px-5 py-3 flex items-center justify-end gap-2 bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedProduct || products.length === 0}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors"
            >
              {submitting ? 'Creating…' : 'Create Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}