// src/components/lending/OperationsPanel.tsx
'use client';

import Link from 'next/link';
import { ArrowRight, Inbox, AlertTriangle, CalendarClock, Package } from 'lucide-react';
import type { PortfolioSummary } from '@/lib/lending-api';

interface Props { summary: PortfolioSummary | null; loading?: boolean; }

function countByStatus(summary: PortfolioSummary | null, status: string): number {
  if (!summary) return 0;
  return summary.by_status.find((s) => s.status === status)?.count ?? 0;
}

export function OperationsPanel({ summary, loading }: Props) {
  const pendingCount = countByStatus(summary, 'PENDING');
  const overdueCount = countByStatus(summary, 'OVERDUE');

  const ops = [
    { label: 'Applications', count: pendingCount, href: '/dashboard/loans/applications',
      icon: Inbox, accent: pendingCount > 0 ? 'text-amber-600' : 'text-gray-400',
      hint: pendingCount > 0 ? 'Awaiting review' : 'All reviewed' },
    { label: 'Overdue', count: overdueCount, href: '/dashboard/loans/active?status=OVERDUE',
      icon: AlertTriangle, accent: overdueCount > 0 ? 'text-red-600' : 'text-gray-400',
      hint: overdueCount > 0 ? 'Requires action' : 'None overdue' },
    { label: 'Due this week', count: 0, href: '/dashboard/loans/active',
      icon: CalendarClock, accent: 'text-gray-400', hint: 'Coming soon' },
    { label: 'Products', count: 0, href: '/dashboard/loans/products',
      icon: Package, accent: 'text-gray-400', hint: 'Configure offerings' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Operations</h3>
      </div>
      <div>
        {ops.map((op, i) => {
          const Icon = op.icon;
          return (
            <Link key={op.label} href={op.href}
              className={'group flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors ' + (i < ops.length - 1 ? 'border-b border-gray-50' : '')}>
              <Icon className={'w-4 h-4 flex-shrink-0 ' + op.accent} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-900">{op.label}</span>
                  {!loading && op.count > 0 && (
                    <span className="font-mono text-sm font-semibold tabular-nums text-gray-900">{op.count}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{op.hint}</div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default OperationsPanel;