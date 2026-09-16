'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'Security', href: '/dashboard/account/security' },
  { label: 'Business Identity', href: '/dashboard/business/identity' },
  { label: 'Contact', href: '/dashboard/business/contact' },
  { label: 'Team Management', href: '/dashboard/business/team' },
  { label: 'Preferences', href: '/dashboard/account/preferences' },
];

export default function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav
        className="flex gap-6 px-4 sm:px-6 overflow-x-auto"
        aria-label="Settings tabs"
      >
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + '/');

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}