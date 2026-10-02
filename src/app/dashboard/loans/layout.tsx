// src/app/dashboard/loans/layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Activity, Users, Package,
  BarChart3, Webhook, Settings,
} from 'lucide-react';

const TABS = [
  { href: '/dashboard/loans',               label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { href: '/dashboard/loans/applications',  label: 'Applications', icon: Inbox },
  { href: '/dashboard/loans/active',        label: 'Active Loans', icon: Activity },
  { href: '/dashboard/loans/borrowers',     label: 'Borrowers',    icon: Users },
  { href: '/dashboard/loans/products',      label: 'Products',     icon: Package },
  { href: '/dashboard/loans/reports',       label: 'Reports',      icon: BarChart3 },
  { href: '/dashboard/loans/webhooks',      label: 'Webhooks',     icon: Webhook },
  { href: '/dashboard/loans/settings',      label: 'Settings',     icon: Settings },
];

export default function LoansLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (tab: typeof TABS[number]) =>
    tab.exact ? pathname === tab.href : (pathname?.startsWith(tab.href) ?? false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <h1 className="text-2xl font-bold text-gray-900">Boost Biashara Loan</h1>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Manage your lending portfolio and borrowers
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 overflow-x-auto -mb-px" aria-label="Lending tabs">
            {TABS.map((tab) => {
              const active = isActive(tab);
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ' +
                    (active
                      ? 'border-emerald-500 text-emerald-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}