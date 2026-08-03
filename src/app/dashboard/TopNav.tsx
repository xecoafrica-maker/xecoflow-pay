'use client';

import Link from 'next/link';
import { Menu, X, ArrowLeft } from 'lucide-react';
import { useSidebar } from '@/context/sidebar-context';

export default function TopNav() {
  const { toggleSidebar, isLoanPage } = useSidebar();

  if (!isLoanPage) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            Xeco<span className="text-emerald-600">Flow</span>
          </span>
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-emerald-600 font-medium">Imara Credit</span>
      </div>
    </nav>
  );
}