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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <nav className="flex gap-0 overflow-x-auto -mb-px" aria-label="Lending tabs">
            {TABS.map((tab) => {
              const active = isActive(tab);
              const Icon = tab.icon;
              return (
                <Link key={tab.href} href={tab.href}
                  className={'flex items-center gap-2 px-3 py-3 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors ' +
                    (active
                      ? 'border-emerald-600 text-emerald-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300')}>
                  <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-6 py-6">{children}</div>
    </div>
  );
}