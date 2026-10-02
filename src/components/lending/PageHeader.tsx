// src/components/lending/PageHeader.tsx
'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function PageHeader({ onRefresh, refreshing }: Props) {
  const [merchant, setMerchant] = useState<{ name: string; id: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => {
        const u = d?.user;
        if (u) setMerchant({ name: u.businessName || 'Merchant', id: u.merchantId });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const now = new Date();
    setLastUpdated(
      now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: false })
    );
  }, [refreshing]);

  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-6 border-b border-gray-200">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Lending Operations</h1>
        <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
          <span className="font-medium text-gray-700">Boost Biashara Loan</span>
          {merchant && (
            <>
              <span className="text-gray-300">·</span>
              <span>{merchant.name}</span>
              <span className="text-gray-300">·</span>
              <span className="font-mono text-xs tabular-nums">#{String(merchant.id).padStart(8, '0')}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {lastUpdated && <span className="text-xs text-gray-400 tabular-nums">Updated {lastUpdated} EAT</span>}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={'w-3.5 h-3.5 ' + (refreshing ? 'animate-spin' : '')} />
            Refresh
          </button>
        )}
      </div>
    </div>
  );
}

export default PageHeader;