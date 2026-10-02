// src/components/lending/StatusBadge.tsx
'use client';

import type { LoanStatus } from '@/lib/lending-api';

const CONFIG: Record<LoanStatus, { bg: string; text: string; label: string }> = {
  PENDING:     { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Pending' },
  APPROVED:    { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Approved' },
  REJECTED:    { bg: 'bg-gray-100',    text: 'text-gray-700',    label: 'Rejected' },
  DISBURSED:   { bg: 'bg-cyan-100',    text: 'text-cyan-700',    label: 'Disbursed' },
  ACTIVE:      { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active' },
  OVERDUE:     { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Overdue' },
  PAID:        { bg: 'bg-emerald-600', text: 'text-white',       label: 'Paid' },
  DEFAULTED:   { bg: 'bg-rose-100',    text: 'text-rose-700',    label: 'Defaulted' },
  WRITTEN_OFF: { bg: 'bg-slate-200',   text: 'text-slate-700',   label: 'Written Off' },
};

export function StatusBadge({ status, size = 'sm' }: { status: LoanStatus; size?: 'sm' | 'md' }) {
  const c = CONFIG[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
  const padding = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={'inline-flex items-center font-medium rounded-full ' + c.bg + ' ' + c.text + ' ' + padding}>
      {c.label}
    </span>
  );
}

export default StatusBadge;