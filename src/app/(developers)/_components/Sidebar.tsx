// src/app/(developers)/_components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const sidebarSections = [
  {
    title: 'Quick Start',
    items: [
      { label: 'Overview', href: '/introduction' },
      { label: 'Sandbox & Test Credentials', href: '/sandbox' },
      { label: 'Get a Merchant Account', href: '/merchant-account' },
      { label: 'Merchant Portal Access', href: '/portal-access' },
      { label: 'Payment Methods & Currencies', href: '/payment-methods' },
    ],
  },
  {
    title: 'API Guides', // New section
    items: [
      { label: 'Authentication', href: '/authentication' },
      { label: 'Unified Gateway', href: '/unified-gateway' },
      { label: 'Webhooks', href: '/webhooks' },
      { label: 'Best Practices', href: '/best-practices' },
    ],
  },
  {
    title: 'Payment Solutions',
    items: [
      { label: 'Overview', href: '/payment-solutions' },
      { label: 'Payment Links & Invoicing', href: '/payment-links' },
      { label: 'E-commerce Plugins', href: '/ecommerce-plugins' },
    ],
  },
  {
    title: 'Features',
    items: [
      { label: 'Overview', href: '/features' },
      { label: 'Recurring & Bulk Payments', href: '/recurring' },
      { label: 'Fraud Protection & Risk Management', href: '/fraud' },
    ],
  },
  {
    title: 'Integrations',
    items: [
      { label: 'Overview', href: '/integrations' },
      { label: 'Plugins', href: '/plugins' },
    ],
  },
  {
    title: 'API Docs',
    items: [
      { label: 'API Reference', href: '/api-docs/reference' },
      { label: 'Error Codes', href: '/api-docs/error-codes' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Frequently Asked Questions', href: '/resources/faq' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-8">
      {sidebarSections.map((section) => (
        <div key={section.title}>
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            {section.title}
          </h4>
          <ul className="space-y-2">
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`block text-sm py-1.5 rounded-lg px-2 -ml-2 transition-colors ${
                      isActive
                        ? 'text-emerald-600 bg-emerald-50 font-medium'
                        : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}