// src/components/lending/RejectDialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  loanReference?: string;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const QUICK_REASONS = [
  'Insufficient credit history',
  'KYC not verified',
  'Incomplete documentation',
  'Outside lending policy',
];

export function RejectDialog({
  open,
  loanReference,
  submitting,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Reject Application
            </h2>
            {loanReference && (
              <p className="text-xs text-gray-500 mt-0.5 font-mono tabular-nums">
                {loanReference}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
            Reason <span className="text-red-500">*</span>
          </label>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={
                  'px-2.5 py-1 text-xs rounded-md border transition-colors ' +
                  (reason === r
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50')
                }
              >
                {r}
              </button>
            ))}
          </div>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Explain why this application is being rejected…"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
          />

          <p className="text-xs text-gray-500 mt-2">
            The borrower will be notified. This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !reason.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 transition-colors"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Reject Application
          </button>
        </div>
      </div>
    </div>
  );
}

export default RejectDialog;