// src/components/lending/PortfolioStats.tsx
'use client';

import { TrendingUp, Wallet, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { formatKES, type PortfolioSummary } from '@/lib/lending-api';

interface Props {
  summary: PortfolioSummary | null;
  loading?: boolean;
}

export function PortfolioStats({ summary, loading }: Props) {
  const stats = [
    {
      label: 'Total Disbursed',
      value: summary ? formatKES(summary.totals.principal_total) : 'KES 0',
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      hint: 'All-time originations',
    },
    {
      label: 'Outstanding',
      value: summary ? formatKES(summary.totals.outstanding_total) : 'KES 0',
      icon: Wallet,
      color: 'from-blue-500 to-blue-600',
      hint: 'Currently owed to you',
    },
    {
      label: 'At Risk',
      value: summary ? formatKES(summary.totals.at_risk_total) : 'KES 0',
      icon: AlertTriangle,
      color: 'from-amber-500 to-amber-600',
      hint: 'Overdue balances',
    },
    {
      label: 'Active Loans',
      value: summary
        ? String(
            (summary.by_status.find((s) => s.status === 'ACTIVE')?.count || 0) +
            (summary.by_status.find((s) => s.status === 'OVERDUE')?.count || 0)
          )
        : '0',
      icon: CheckCircle2,
      color: 'from-cyan-500 to-cyan-600',
      hint: 'In good standing + overdue',
    },
    {
      label: 'Pending Review',
      value: summary
        ? String(summary.by_status.find((s) => s.status === 'PENDING')?.count || 0)
        : '0',
      icon: Clock,
      color: 'from-violet-500 to-violet-600',
      hint: 'Awaiting your decision',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={'p-2 rounded-xl bg-gradient-to-br ' + s.color + ' text-white shadow-sm'}>
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '—' : s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.hint}</p>
          </div>
        );
      })}
    </div>
  );
}

export default PortfolioStats;