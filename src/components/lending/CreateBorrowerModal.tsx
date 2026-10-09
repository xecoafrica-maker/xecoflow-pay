// src/components/lending/CreateBorrowerModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { X, UserPlus, AlertTriangle } from 'lucide-react';
import { createBorrower, type CreateBorrowerInput } from '@/lib/borrowers-api';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}

interface FormState {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  id_number: string;
  credit_limit: string;
}

const EMPTY: FormState = {
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  id_number: '',
  credit_limit: '',
};

export default function CreateBorrowerModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset on close
      setForm(EMPTY);
      setError(null);
      setSubmitting(false);
      setSuccess(false);
    }
  }, [open]);

  if (!open) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): string | null => {
    if (!form.email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address.';
    if (!form.first_name.trim()) return 'First name is required.';
    if (!form.phone.trim()) return 'Phone number is required.';
    const limit = Number(form.credit_limit);
    if (!Number.isFinite(limit) || limit < 0) return 'Credit limit must be a number ≥ 0.';
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

    setSubmitting(true);
    try {
      const payload: CreateBorrowerInput = {
        email: form.email.trim().toLowerCase(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim() || undefined,
        phone: form.phone.trim(),
        id_number: form.id_number.trim() || undefined,
        credit_limit: Number(form.credit_limit),
      };
      await createBorrower(payload);
      setSuccess(true);
      setTimeout(() => {
        void onCreated();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Failed to create borrower.');
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
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-semibold text-gray-900">Create Borrower</h2>
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

        {success ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <UserPlus className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Borrower created</h3>
            <p className="text-xs text-gray-500 mt-1.5">
              A welcome email with login credentials has been sent to{' '}
              <strong className="text-gray-700">{form.email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="px-5 py-4 space-y-3 overflow-y-auto">
              {error && (
                <div className="flex items-start gap-2 border border-red-200 bg-red-50 text-red-800 rounded-md px-3 py-2 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="borrower@example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
                  <input
                    type="text"
                    value={form.first_name}
                    onChange={(e) => set('first_name', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Last name <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={form.last_name}
                    onChange={(e) => set('last_name', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="+254712345678"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ID number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.id_number}
                  onChange={(e) => set('id_number', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="12345678"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Starting credit limit (KES)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.credit_limit}
                  onChange={(e) => set('credit_limit', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  placeholder="5000"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Leave at 0 if you want to set a limit later.
                </p>
              </div>
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
                disabled={submitting}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-md transition-colors"
              >
                {submitting ? 'Creating…' : 'Create Borrower'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}