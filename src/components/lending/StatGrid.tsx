// src/components/lending/StatGrid.tsx
'use client';

import { TrendingUp, Wallet, AlertTriangle, Activity, Clock } from 'lucide-react';
import StatBlock from './StatBlock';
import { formatKES, type PortfolioSummary } from '@/lib/lending-api';

interface Props { summary: PortfolioSummary | null; loading?: boolean; }

function countByStatus(summary: PortfolioSummary | null, status: string): number {
  if (!summary) return 0;
  return summary.by_status.find((s) => s.status === status)?.count ?? 0;
}

export function StatGrid({ summary, loading }: Props) {
  const l = loading;
  const activeCount = countByStatus(summary, 'ACTIVE');
  const overdueCount = countByStatus(summary, 'OVERDUE');
  const pendingCount = countByStatus(summary, 'PENDING');
  const paidCount = countByStatus(summary, 'PAID');

  const principalTotal = summary?.totals.principal_total ?? '0';
  const outstandingTotal = summary?.totals.outstanding_total ?? '0';
  const atRiskTotal = summary?.totals.at_risk_total ?? '0';

  const outstandingNum = Number(outstandingTotal);
  const atRiskPct = outstandingNum > 0 ? Math.round((Number(atRiskTotal) / outstandingNum) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      <StatBlock
        label="Principal Disbursed"
        value={l ? '—' : formatKES(principalTotal)}
        context={l ? undefined : `${summary?.totals.count ?? 0} loans written`}
        icon={TrendingUp}
      />
      <StatBlock
        label="Outstanding"
        value={l ? '—' : formatKES(outstandingTotal)}
        context={l ? undefined : `${activeCount + overdueCount} active loans`}
        icon={Wallet}
        status={overdueCount > 0 ? 'warning' : 'default'}
      />
      <StatBlock
        label="At Risk"
        value={l ? '—' : formatKES(atRiskTotal)}
        context={l ? undefined : overdueCount > 0 ? `${overdueCount} overdue · ${atRiskPct}% of book` : 'No overdue loans'}
        icon={AlertTriangle}
        status={overdueCount > 0 ? 'critical' : 'default'}
      />
      <StatBlock
        label="Active Loans"
        value={l ? '—' : String(activeCount + overdueCount)}
        context={l ? undefined : `${paidCount} repaid to date`}
        icon={Activity}
      />
      <StatBlock
        label="Pending Review"
        value={l ? '—' : String(pendingCount)}
        context={l ? undefined : pendingCount > 0 ? 'Awaiting your decision' : 'No action required'}
        icon={Clock}
        status={pendingCount > 0 ? 'warning' : 'muted'}
      />
    </div>
  );
}

export default StatGrid;