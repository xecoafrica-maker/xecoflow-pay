// src/components/settings/SettingsTabs.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Shield, FileText, Users } from 'lucide-react';

const TABS = [
  { label: 'Business & Profile', href: '/dashboard/settings/business', icon: Building2 },
  { label: 'Security & Access', href: '/dashboard/settings/security', icon: Shield },
  { label: 'Compliance & KYC', href: '/dashboard/settings/compliance', icon: FileText },
  { label: 'Team & Access', href: '/dashboard/settings/team', icon: Users },
];

export default function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-5 py-3.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                active
                  ? 'border-indigo-500 text-indigo-600 bg-indigo-50/40'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}