// src/app/dashboard/apps/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Handshake,
  TrendingUp,
  Smartphone,
  Zap,
  Box,
  ArrowRight,
  Sparkles,
  Clock,
  Shield,
  Coins,
  Building,
  Users,
  Wallet,
  CreditCard,
  Pin,
  PinOff,
  Check,
  X,
} from 'lucide-react';

interface AppCard {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  badge?: string;
  color: string;
  bgColor: string;
  status: 'active' | 'coming-soon' | 'new';
  pinned?: boolean;
}

const defaultApps: AppCard[] = [
  {
    id: 'pamojafund',
    icon: Handshake,
    title: 'PamojaFund',
    description: 'Community-based savings and lending platform for groups and businesses.',
    href: '/dashboard/pamojafund',
    badge: 'New',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    status: 'new',
    pinned: false,
  },
  {
    id: 'boost-loan',
    icon: TrendingUp,
    title: 'Boost Biashara Loan',
    description: 'Get instant business loans from KES 5,000 to KES 5,000,000 with AI-powered credit decisions.',
    href: '/dashboard/loans',
    badge: 'Coming Soon',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    status: 'coming-soon',
    pinned: false,
  },
  {
    id: 'airtime-retail',
    icon: Smartphone,
    title: 'Retail Quick Top-Up',
    description: 'Instantly buy airtime for yourself or your customers with zero fees.',
    href: '/dashboard/utilities/airtime/retail',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    status: 'active',
    pinned: false,
  },
  {
    id: 'airtime-bulk',
    icon: Box,
    title: 'Bulk Airtime',
    description: 'Purchase airtime in bulk for your business or resell to customers at a profit.',
    href: '/dashboard/utilities/airtime/bulk',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    status: 'active',
    pinned: false,
  },
  {
    id: 'kplc-token',
    icon: Zap,
    title: 'Buy KPLC Token',
    description: 'Purchase KPLC prepaid electricity tokens instantly for yourself or your customers.',
    href: '/dashboard/utilities/kplc',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    status: 'active',
    pinned: false,
  },
  {
    id: 'wallet-transactions',
    icon: Wallet,
    title: 'Wallet Transactions',
    description: 'View and manage all your wallet transactions, deposits, and withdrawals.',
    href: '/dashboard/transactions/wallet',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    status: 'active',
    pinned: false,
  },
];

// ─── Local Storage Key ─────────────────────────────────────────────
const PINNED_APPS_KEY = 'xecoflow_pinned_apps';

export default function AppsPage() {
  const [apps, setApps] = useState<AppCard[]>(defaultApps);
  const [pinnedApps, setPinnedApps] = useState<string[]>([]);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // ─── Load pinned apps from localStorage ──────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(PINNED_APPS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPinnedApps(parsed);
        // Update apps with pinned status
        setApps(prev => prev.map(app => ({
          ...app,
          pinned: parsed.includes(app.id)
        })));
      } catch (e) {
        console.error('Error loading pinned apps:', e);
      }
    }
  }, []);

  // ─── Save pinned apps to localStorage ────────────────────────────
  const savePinnedApps = (newPinned: string[]) => {
    localStorage.setItem(PINNED_APPS_KEY, JSON.stringify(newPinned));
    setPinnedApps(newPinned);
    // Update app pinned status
    setApps(prev => prev.map(app => ({
      ...app,
      pinned: newPinned.includes(app.id)
    })));
  };

  // ─── Toggle Pin ──────────────────────────────────────────────────
  const togglePin = (appId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const app = apps.find(a => a.id === appId);
    if (!app || app.status === 'coming-soon') return;

    const newPinned = pinnedApps.includes(appId)
      ? pinnedApps.filter(id => id !== appId)
      : [...pinnedApps, appId];

    savePinnedApps(newPinned);

    setShowToast({
      message: pinnedApps.includes(appId)
        ? `"${app.title}" unpinned from sidebar`
        : `"${app.title}" pinned to sidebar!`,
      type: pinnedApps.includes(appId) ? 'info' : 'success'
    });

    setTimeout(() => setShowToast(null), 3000);
  };

  const pinnedCount = pinnedApps.length;

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      {/* ─── Toast Notification ────────────────────────────────────── */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ${
          showToast.type === 'success' 
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          {showToast.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600" />
          ) : (
            <X className="w-5 h-5 text-blue-600" />
          )}
          <span className="text-sm font-medium">{showToast.message}</span>
        </div>
      )}

      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm shadow-emerald-200">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Apps & Services</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Discover and manage all the tools available for your business
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
            <Pin className="w-4 h-4 text-emerald-500" />
            <span><strong className="text-gray-700">{pinnedCount}</strong> pinned to sidebar</span>
          </div>
        </div>
      </div>

      {/* ─── Stats Bar ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Available Apps</p>
          <p className="text-2xl font-bold text-gray-900">{apps.filter(a => a.status === 'active').length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">New Releases</p>
          <p className="text-2xl font-bold text-emerald-600">{apps.filter(a => a.status === 'new').length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Pinned to Sidebar</p>
          <p className="text-2xl font-bold text-indigo-600">{pinnedCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Services</p>
          <p className="text-2xl font-bold text-gray-900">{apps.length}</p>
        </div>
      </div>

      {/* ─── Apps Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => {
          const Icon = app.icon;
          const isDisabled = app.status === 'coming-soon';
          const isPinned = pinnedApps.includes(app.id);

          return (
            <div
              key={app.id}
              className={`group relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm transition-all duration-300 ${
                isDisabled
                  ? 'opacity-70 cursor-not-allowed'
                  : isPinned
                  ? 'hover:shadow-lg hover:border-emerald-300 ring-1 ring-emerald-200'
                  : 'hover:shadow-lg hover:border-gray-300'
              }`}
            >
              {/* Pin Button */}
              {!isDisabled && (
                <button
                  onClick={(e) => togglePin(app.id, e)}
                  className={`absolute top-3 right-3 p-2 rounded-lg transition-all duration-200 ${
                    isPinned
                      ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                  }`}
                  title={isPinned ? 'Unpin from sidebar' : 'Pin to sidebar'}
                >
                  {isPinned ? (
                    <Pin className="w-4 h-4" />
                  ) : (
                    <PinOff className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Badge */}
              {app.badge && (
                <span className={`absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                  app.status === 'new' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}>
                  {app.badge}
                </span>
              )}

              {/* Pinned indicator */}
              {isPinned && (
                <div className="absolute top-3 left-3 flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-200">
                  <Pin className="w-3 h-3" />
                  Pinned
                </div>
              )}

              <Link href={isDisabled ? '#' : app.href} className="block">
                <div className="flex items-start gap-4 mt-2">
                  <div className={`p-3 rounded-xl ${app.bgColor} flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${app.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{app.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed line-clamp-2">
                      {app.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {app.status === 'active' && '● Available'}
                    {app.status === 'new' && '● New'}
                    {app.status === 'coming-soon' && '● Coming Soon'}
                  </span>
                  {!isDisabled && (
                    <span className="text-sm font-medium text-emerald-600 group-hover:text-emerald-700 transition-colors flex items-center gap-1">
                      Open
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                  {isDisabled && (
                    <span className="text-sm font-medium text-amber-600">
                      Coming Soon
                    </span>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* ─── Info Banner ────────────────────────────────────────────── */}
      <div className="mt-8 bg-gradient-to-r from-indigo-50 to-emerald-50 border border-indigo-100 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Pin className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">📌 Pin to Sidebar</h3>
            <p className="text-sm text-gray-600 mt-1 max-w-2xl">
              Click the <strong>Pin</strong> button on any app to add it to your sidebar for 1-click access from anywhere. 
              Unpin anytime to keep your sidebar clean and focused on what matters most to your business.
            </p>
            <div className="flex gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Pinned apps appear in sidebar
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                Unpinned apps stay in Apps & Services
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}