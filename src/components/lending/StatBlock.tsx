// src/components/lending/StatBlock.tsx
'use client';

import type { LucideIcon } from 'lucide-react';

export type StatStatus = 'default' | 'success' | 'warning' | 'critical' | 'muted';

interface StatBlockProps {
  label: string;
  value: string;
  context?: string;
  trend?: { value: string; direction: 'up' | 'down' | 'flat'; label: string };
  status?: StatStatus;
  icon?: LucideIcon;
}

const STATUS_STYLES: Record<StatStatus, string> = {
  default:  'border-gray-200 bg-white',
  success:  'border-emerald-200 bg-emerald-50/20',
  warning:  'border-amber-200 bg-amber-50/30',
  critical: 'border-red-200 bg-red-50/30',
  muted:    'border-gray-200 bg-gray-50/40',
};

const ICON_STYLES: Record<StatStatus, string> = {
  default:  'text-gray-400',
  success:  'text-emerald-600',
  warning:  'text-amber-600',
  critical: 'text-red-600',
  muted:    'text-gray-400',
};

export function StatBlock({ label, value, context, trend, status = 'default', icon: Icon }: StatBlockProps) {
  const trendColor =
    trend?.direction === 'up' ? 'text-emerald-700' :
    trend?.direction === 'down' ? 'text-red-700' : 'text-gray-500';
  const trendGlyph = trend?.direction === 'up' ? '↑' : trend?.direction === 'down' ? '↓' : '—';

  return (
    <div className={'relative border rounded-lg px-5 py-4 transition-colors ' + STATUS_STYLES[status]}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</div>
        {Icon && <Icon className={'w-4 h-4 flex-shrink-0 ' + ICON_STYLES[status]} aria-hidden="true" />}
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold text-gray-900 tabular-nums tracking-tight leading-none">
        {value}
      </div>
      {context && <div className="mt-1.5 text-xs text-gray-500 tabular-nums">{context}</div>}
      {trend && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span className={'font-medium tabular-nums ' + trendColor}>{trendGlyph} {trend.value}</span>
          <span className="text-gray-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

export default StatBlock;