// src/components/lending/ProductForm.tsx
'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { createProduct, type CreateProductInput, type LoanProduct } from '@/lib/lending-api';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (product: LoanProduct) => void;
}

const initialForm = {
  code: '',
  name: '',
  description: '',
  min_amount: '100',
  max_amount: '50000',
  min_term_days: 7,
  max_term_days: 90,
  default_term_days: 30,
  interest_rate: '15',
  interest_period: 'MONTHLY' as const,
  interest_method: 'DECLINING' as const,
  repayment_frequency: 'BULLET' as const,
  penalty_rate_per_day: '0',
  grace_period_days: 0,
  requires_kyc: true,
  // advanced
  origination_fee_type: 'PERCENT' as const,
  origination_fee_value: '0',
  service_fee_type: 'FLAT' as const,
  service_fee_value: '0',
  max_penalty_percent: '0',
  allow_partial_prepay: true,
  allow_early_settlement: true,
  min_credit_score: 0,
  status: 'ACTIVE' as const,
};

export function ProductForm({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState(initialForm);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.code || form.code.length < 2) errs.code = 'Code must be at least 2 characters';
    if (!form.name || form.name.length < 2) errs.name = 'Name must be at least 2 characters';
    if (Number(form.min_amount) <= 0) errs.min_amount = 'Must be > 0';
    if (Number(form.max_amount) < Number(form.min_amount)) errs.max_amount = 'Must be ≥ min';
    if (form.min_term_days <= 0) errs.min_term_days = 'Must be > 0';
    if (form.max_term_days < form.min_term_days) errs.max_term_days = 'Must be ≥ min';
    if (form.default_term_days < form.min_term_days || form.default_term_days > form.max_term_days) {
      errs.default_term_days = 'Must be between min and max';
    }
    if (Number(form.interest_rate) < 0) errs.interest_rate = 'Must be ≥ 0';

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload: CreateProductInput = {
        code: form.code,
        name: form.name,
        description: form.description || undefined,
        min_amount: form.min_amount,
        max_amount: form.max_amount,
        min_term_days: form.min_term_days,
        max_term_days: form.max_term_days,
        default_term_days: form.default_term_days,
        interest_rate: form.interest_rate,
        interest_period: form.interest_period,
        interest_method: form.interest_method,
        repayment_frequency: form.repayment_frequency,
        penalty_rate_per_day: form.penalty_rate_per_day,
        grace_period_days: form.grace_period_days,
        requires_kyc: form.requires_kyc,
        origination_fee_type: form.origination_fee_type,
        origination_fee_value: form.origination_fee_value,
        service_fee_type: form.service_fee_type,
        service_fee_value: form.service_fee_value,
        max_penalty_percent: form.max_penalty_percent,
        allow_partial_prepay: form.allow_partial_prepay,
        allow_early_settlement: form.allow_early_settlement,
        min_credit_score: form.min_credit_score,
        status: form.status,
      };
      const created = await createProduct(payload);
      onCreated(created);
      setForm(initialForm);
      setAdvancedOpen(false);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (field: string) =>
    'w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors ' +
    (fieldErrors[field] ? 'border-red-300 bg-red-50/30' : 'border-gray-200');

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-gray-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">New Loan Product</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Define the terms you offer to borrowers
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="border border-red-200 bg-red-50 text-red-800 rounded-md px-3 py-2 text-sm">
                {error}
              </div>
            )}

            {/* Core fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Product Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => update('code', e.target.value.toUpperCase())}
                  placeholder="SME-30D"
                  className={inputClass('code') + ' font-mono'}
                />
                {fieldErrors.code && <p className="text-xs text-red-600 mt-1">{fieldErrors.code}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="SME Working Capital 30 Days"
                  className={inputClass('name')}
                />
                {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={2}
                placeholder="Short description for your records"
                className={inputClass('description')}
              />
            </div>

            {/* Amounts */}
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Amount Range (KES)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                  <input
                    type="text"
                    value={form.min_amount}
                    onChange={(e) => update('min_amount', e.target.value)}
                    className={inputClass('min_amount') + ' font-mono tabular-nums'}
                  />
                  {fieldErrors.min_amount && <p className="text-xs text-red-600 mt-1">{fieldErrors.min_amount}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                  <input
                    type="text"
                    value={form.max_amount}
                    onChange={(e) => update('max_amount', e.target.value)}
                    className={inputClass('max_amount') + ' font-mono tabular-nums'}
                  />
                  {fieldErrors.max_amount && <p className="text-xs text-red-600 mt-1">{fieldErrors.max_amount}</p>}
                </div>
              </div>
            </div>

            {/* Terms */}
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Term (Days)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min</label>
                  <input
                    type="number"
                    value={form.min_term_days}
                    onChange={(e) => update('min_term_days', Number(e.target.value))}
                    className={inputClass('min_term_days') + ' font-mono tabular-nums'}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max</label>
                  <input
                    type="number"
                    value={form.max_term_days}
                    onChange={(e) => update('max_term_days', Number(e.target.value))}
                    className={inputClass('max_term_days') + ' font-mono tabular-nums'}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Default</label>
                  <input
                    type="number"
                    value={form.default_term_days}
                    onChange={(e) => update('default_term_days', Number(e.target.value))}
                    className={inputClass('default_term_days') + ' font-mono tabular-nums'}
                  />
                  {fieldErrors.default_term_days && <p className="text-xs text-red-600 mt-1">{fieldErrors.default_term_days}</p>}
                </div>
              </div>
            </div>

            {/* Interest */}
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Interest & Repayment
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Rate (%)</label>
                  <input
                    type="text"
                    value={form.interest_rate}
                    onChange={(e) => update('interest_rate', e.target.value)}
                    className={inputClass('interest_rate') + ' font-mono tabular-nums'}
                  />
                  {fieldErrors.interest_rate && <p className="text-xs text-red-600 mt-1">{fieldErrors.interest_rate}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Period</label>
                  <select
                    value={form.interest_period}
                    onChange={(e) => update('interest_period', e.target.value as any)}
                    className={inputClass('interest_period')}
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Bi-weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="ANNUAL">Annual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Frequency</label>
                  <select
                    value={form.repayment_frequency}
                    onChange={(e) => update('repayment_frequency', e.target.value as any)}
                    className={inputClass('repayment_frequency')}
                  >
                    <option value="BULLET">Bullet (single payment)</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Bi-weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Advanced toggle */}
            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              {advancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {advancedOpen ? 'Hide' : 'Show'} advanced settings
            </button>

            {/* Advanced */}
            {advancedOpen && (
              <div className="border-t border-gray-100 pt-5 space-y-4">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Fees
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Origination Fee Type</label>
                      <select
                        value={form.origination_fee_type}
                        onChange={(e) => update('origination_fee_type', e.target.value as any)}
                        className={inputClass('origination_fee_type')}
                      >
                        <option value="PERCENT">Percent</option>
                        <option value="FLAT">Flat</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Value</label>
                      <input
                        type="text"
                        value={form.origination_fee_value}
                        onChange={(e) => update('origination_fee_value', e.target.value)}
                        className={inputClass('origination_fee_value') + ' font-mono tabular-nums'}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    Penalties
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Penalty Rate / Day (%)</label>
                      <input
                        type="text"
                        value={form.penalty_rate_per_day}
                        onChange={(e) => update('penalty_rate_per_day', e.target.value)}
                        className={inputClass('penalty_rate_per_day') + ' font-mono tabular-nums'}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Grace Period (days)</label>
                      <input
                        type="number"
                        value={form.grace_period_days}
                        onChange={(e) => update('grace_period_days', Number(e.target.value))}
                        className={inputClass('grace_period_days') + ' font-mono tabular-nums'}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="requires_kyc"
                    checked={form.requires_kyc}
                    onChange={(e) => update('requires_kyc', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="requires_kyc" className="text-sm text-gray-700">
                    Require KYC verification before application
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
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
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating…' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;