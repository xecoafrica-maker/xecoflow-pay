// src/components/lending/CreateLoanForBorrowerModal.tsx
'use client';

import { useEffect, useState } from 'react';
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

export default function CreateLoanForBorrowerModal({
  open,
  borrower,
  onClose,
  onCreated,
}: Props) {
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productId, setProductId] = useState<string>('');
  const [principal, setPrincipal] = useState<string>('');
  const [termDays, setTermDays] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState<TargetStatus>('PENDING');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId) || null;

  useEffect(() => {
    if (!open) {
      setProductId('');
      setPrincipal('');
      setTermDays('');
      setTargetStatus('PENDING');
      setSubmitting(false);
      setError(null);
      setConfirmed(false);
      return;
    }

    // Load products when modal opens
    (async () => {
      setLoadingProducts(true);
      try {
        const res = await listProducts({ status: 'ACTIVE', limit: 50 });
        setProducts(res.products);
        if (res.products.length === 1) {
          setProductId(res.products[0].id);
          setTermDays(String(res.products[0].default_term_days));
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load products.');
      } finally {
        setLoadingProducts(false);
      }
    })();
  }, [open]);

  if (!open || !borrower) return null;

  const validate = (): string | null => {
    if (!productId) return 'Select a product.';
    if (!selectedProduct) return 'Selected product could not be found.';
    const p = Number(principal);
    if (!Number.isFinite(p) || p <= 0) return 'Principal must be a positive number.';
    const minA = Number(selectedProduct.min_amount);
    const maxA = Number(selectedProduct.max_amount);
    if (p < minA || p > maxA) {
      return `Principal must be between ${formatKES(minA)} and ${formatKES(maxA)}.`;
    }
    const t = parseInt(termDays, 10);
    if (!Number.isFinite(t) || t <= 0) return 'Term must be a positive integer.';
    if (t < selectedProduct.min_term_days || t > selectedProduct.max_term_days) {
      return `Term must be between ${selectedProduct.min_term_days} and ${selectedProduct.max_term_days} days.`;
    }
    if ((targetStatus === 'DISBURSED' || targetStatus === 'ACTIVE') && !confirmed) {
      return 'Please confirm you understand this will post to the ledger.';
    }
    return null;
  };

  const needsLedgerWarning = targetStatus === 'DISBURSED' || targetStatus === 'ACTIVE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    if (!borrower.identity) {
      setError('Borrower has no credit identity.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: CreateLoanForBorrowerInput = {
        borrower_identity_id: borrower.identity.id,
        product_id: productId,
        principal: Number(principal),
        term_days: parseInt(termDays, 10),
        target_status: targetStatus,
      };
      const res = await createLoanForBorrower(payload);
      void res;

      // Success — close and refresh list
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
              <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
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
                    const p = products.find((x) => x.id === e.target.value);
                    if (p) setTermDays(String(p.default_term_days));
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  required
                >
                  <option value="">Select a product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatKES(p.min_amount)}–{formatKES(p.max_amount)},{' '}
                      {p.min_term_days}–{p.max_term_days}d)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Principal + term */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Principal (KES)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="5000"
                  required
                />
                {selectedProduct && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    Range: {formatKES(selectedProduct.min_amount)} –{' '}
                    {formatKES(selectedProduct.max_amount)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Term (days)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={termDays}
                  onChange={(e) => setTermDays(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="30"
                  required
                />
                {selectedProduct && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    Range: {selectedProduct.min_term_days} – {selectedProduct.max_term_days} days
                  </p>
                )}
              </div>
            </div>

            {/* Target status */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Initial status
              </label>
              <div className="space-y-1.5">
                {(['PENDING', 'APPROVED', 'DISBURSED', 'ACTIVE'] as TargetStatus[]).map((s) => (
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
                ))}
              </div>
            </div>

            {/* Ledger warning for disbursed/active */}
            {needsLedgerWarning && (
              <div className="border border-amber-200 bg-amber-50 rounded-md px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-amber-700 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-900">
                    <div className="font-semibold">This action cannot be undone</div>
                    <div className="mt-0.5">
                      Funds will be posted to the borrower's ledger immediately. Reversing
                      requires a compensating entry.
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
              disabled={submitting || products.length === 0}
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