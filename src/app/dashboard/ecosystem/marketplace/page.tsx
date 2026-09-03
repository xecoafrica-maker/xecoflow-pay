// src/app/dashboard/ecosystem/marketplace/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Search,
  Sparkles,
  ArrowRight,
  Smartphone,
  Users,
  FileText,
  Zap,
  Building,
  Handshake,
  TrendingUp,
  Wallet,
  Box,
  MonitorSmartphone,
  Link2,
  Globe,
  Shield,
  Star,
  Download,
  Eye,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface App {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  category: string;
  status: 'active' | 'coming_soon' | 'installed';
  featured?: boolean;
  href: string;
  rating: number;
  downloads: number;
  color: string;
  badge?: string;
}

const apps: App[] = [
  {
    id: 'kra-automation',
    name: 'KRA Automation',
    description: 'Automate your KRA tax filing and compliance with ease',
    icon: FileText,
    category: 'Tax & Compliance',
    status: 'active',
    featured: true,
    href: '/dashboard/ecosystem/kra-automation',
    rating: 4.8,
    downloads: 1247,
    color: 'from-blue-500 to-blue-600',
    badge: 'POPULAR',
  },
  {
    id: 'chama-link',
    name: 'Chama Link',
    description: 'Manage your chama groups, contributions, and investments',
    icon: Users,
    category: 'Community Finance',
    status: 'active',
    featured: true,
    href: '/dashboard/ecosystem/chama-link',
    rating: 4.7,
    downloads: 856,
    color: 'from-purple-500 to-purple-600',
    badge: 'NEW',
  },
  {
    id: 'pamojafund',
    name: 'PamojaFund',
    description: 'Collect and manage contributions for community projects',
    icon: Handshake,
    category: 'Community Finance',
    status: 'installed',
    href: '/dashboard/pamojafund',
    rating: 4.9,
    downloads: 2341,
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'boost-loan',
    name: 'Boost Biashara Loan',
    description: 'Get quick business loans to grow your enterprise',
    icon: TrendingUp,
    category: 'Finance',
    status: 'installed',
    href: '/dashboard/loans',
    rating: 4.6,
    downloads: 1789,
    color: 'from-amber-500 to-amber-600',
  },
  {
    id: 'airtime-retail',
    name: 'Retail Quick Top-Up',
    description: 'Sell airtime to customers instantly with zero stock risk',
    icon: Smartphone,
    category: 'Utilities',
    status: 'installed',
    href: '/dashboard/utilities/airtime/retail',
    rating: 4.5,
    downloads: 3210,
    color: 'from-green-500 to-green-600',
  },
  {
    id: 'kplc-token',
    name: 'KPLC Token Purchase',
    description: 'Buy and sell KPLC electricity tokens instantly',
    icon: Zap,
    category: 'Utilities',
    status: 'installed',
    href: '/dashboard/utilities/kplc',
    rating: 4.4,
    downloads: 1567,
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    id: 'wallet-transactions',
    name: 'Wallet Manager',
    description: 'Track all your wallet transactions and balances',
    icon: Wallet,
    category: 'Finance',
    status: 'installed',
    href: '/dashboard/transactions/wallet',
    rating: 4.3,
    downloads: 987,
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    id: 'pos-terminal',
    name: 'POS / Counter Pay',
    description: 'Accept payments at your counter with POS integration',
    icon: MonitorSmartphone,
    category: 'Payments',
    status: 'active',
    href: '/dashboard/pos',
    rating: 4.2,
    downloads: 654,
    color: 'from-rose-500 to-rose-600',
  },
];

const categories = ['All', 'Finance', 'Community Finance', 'Utilities', 'Payments', 'Tax & Compliance'];

export default function AppsMarketplacePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loadingApp, setLoadingApp] = useState<string | null>(null);

  const filteredApps = apps.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredApps = apps.filter(app => app.featured);

  const handleOpenApp = (app: App) => {
    if (app.status === 'coming_soon') {
      // Show coming soon message
      return;
    }
    
    setLoadingApp(app.id);
    setTimeout(() => {
      router.push(app.href);
    }, 800);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Available
          </span>
        );
      case 'installed':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Installed
          </span>
        );
      case 'coming_soon':
        return (
          <span className="inline-flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            Coming Soon
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-16 text-white">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
        <div className="relative max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Apps Marketplace</h1>
              <p className="text-emerald-100 mt-1">Discover and install powerful apps to grow your business</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search apps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Apps */}
        {featuredApps.length > 0 && selectedCategory === 'All' && !searchTerm && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Featured Apps</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredApps.map(app => (
                <div
                  key={app.id}
                  onClick={() => handleOpenApp(app)}
                  className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all cursor-pointer border-2 border-emerald-500/20 hover:border-emerald-500/50"
                >
                  {app.badge && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                      {app.badge}
                    </span>
                  )}
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${app.color} text-white shadow-lg`}>
                      <app.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {app.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {app.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        {app.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5" />
                        {app.downloads.toLocaleString()}
                      </span>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Apps Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {selectedCategory === 'All' ? 'All Apps' : selectedCategory}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredApps.length} apps
            </span>
          </div>
          
          {filteredApps.length === 0 ? (
            <div className="text-center py-16">
              <div className="p-4 bg-gray-100 dark:bg-slate-800 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No apps found matching your criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredApps.map(app => (
                <div
                  key={app.id}
                  onClick={() => handleOpenApp(app)}
                  className="group bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 dark:border-slate-700 hover:border-emerald-500/30"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg bg-gradient-to-br ${app.color} text-white shadow-md flex-shrink-0`}>
                      <app.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {app.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {app.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        {app.rating}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(app.status)}
                      <ArrowRight className={`w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors ${
                        app.status === 'coming_soon' ? 'opacity-50' : ''
                      }`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {loadingApp && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm transition-all duration-500">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-3xl font-bold text-emerald-600">XecoFlow</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Opening App</h2>
            <p className="text-gray-500 mb-8">Loading your workspace...</p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }} />
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.8s' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}