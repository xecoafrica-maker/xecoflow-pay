// src/app/dashboard/ecosystem/marketplace/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  Search,
  Sparkles,
  ArrowRight,
  FileText,
  Star,
  Download,
  Clock,
  CheckCircle,
  Home,
  LayoutDashboard,
  Settings,
  HelpCircle,
  Menu,
  X,
  Receipt,
  Shield,
  TrendingUp,
  Building,
  Users,
  Calendar,
  Bell,
  User,
  CreditCard,
  Wallet,
  BarChart3,
  FileCheck,
  Smartphone,
  Zap,
  Globe,
  Link2,
  MonitorSmartphone,
  Handshake,
  Box,
  Eye,
  Loader2,
  ChevronRight,
  Award,
  Rocket,
  Target,
  PieChart,
  Briefcase,
  DollarSign,
  Lock,
  RefreshCw,
  LifeBuoy,
  MessageCircle,
  PlayCircle,
  Check,
  Info,
  ExternalLink,
  ThumbsUp,
  Share2,
  Bookmark,
  Flag,
} from 'lucide-react';

// Sidebar Component
const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (open: boolean) => void }) => {
  const router = useRouter();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
    { id: 'ecosystem', label: 'Ecosystem', icon: LayoutDashboard, href: '/dashboard/ecosystem' },
    { id: 'marketplace', label: 'App Store', icon: Store, href: '/dashboard/ecosystem/marketplace', active: true },
    { id: 'transactions', label: 'Transactions', icon: Receipt, href: '/dashboard/transactions' },
    { id: 'settings', label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:relative lg:z-0 flex-shrink-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500 rounded-xl">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-800 dark:text-white">App Store</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Discover & Install</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    router.push(item.href);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    item.active
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-800">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider px-4 mb-3">
                Support
              </p>
              <div className="space-y-1">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                  <LifeBuoy className="w-5 h-5" />
                  Help Center
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all">
                  <MessageCircle className="w-5 h-5" />
                  Feedback
                </button>
              </div>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                JD
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">John Doe</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">john@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

// Main Page Component
export default function AppsMarketplacePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [loadingApp, setLoadingApp] = useState<string | null>(null);

  const taxmanApp = {
    id: 'kra-taxman',
    name: 'Taxman KRA',
    tagline: 'Smart Tax Filing & Compliance Made Easy',
    description: 'Automate your KRA tax filing, compliance, and reporting with Taxman. Get real-time tax calculations, automated returns, and seamless integration with your business financials.',
    icon: FileText,
    category: 'Tax & Compliance',
    status: 'active' as const,
    featured: true,
    href: '/dashboard/ecosystem/kra-taxman',
    rating: 4.8,
    downloads: 1247,
    color: 'from-blue-600 to-blue-700',
    badge: 'POPULAR',
    longDescription: 'Taxman KRA is a powerful tax automation platform designed specifically for Kenyan businesses. It simplifies the entire tax compliance process, from calculating PAYE, VAT, and withholding tax to filing returns directly with KRA.',
    features: [
      'Automated KRA tax calculations (PAYE, VAT, Withholding Tax)',
      'Real-time tax liability tracking',
      'One-click KRA return filing',
      'Automated receipt and invoice generation',
      'Comprehensive tax reports and analytics',
      'Secure KRA integration with SSL encryption',
      'Multi-currency support for international transactions',
      'Audit-ready documentation',
    ],
    integrations: [
      'KRA iTax System',
      'Bank Accounts',
      'POS Systems',
      'Accounting Software',
      'Mobile Money (M-Pesa)',
    ],
    pricing: {
      free: 'Basic tax calculation',
      pro: 'KES 1,500/month - Full automation + priority support',
      enterprise: 'Custom pricing - Multi-business + API access',
    },
    reviews: [
      { name: 'Jane Mwangi', rating: 5, comment: 'Taxman has saved me countless hours on tax filing. The automation is incredible!', date: '2 weeks ago' },
      { name: 'Peter Ochieng', rating: 4.5, comment: 'Great tool for small businesses. The KRA integration works flawlessly.', date: '1 month ago' },
      { name: 'Sarah Wanjiru', rating: 5, comment: 'I finally understand my tax obligations. The reports are so clear and detailed.', date: '2 months ago' },
    ],
  };

  const handleInstall = () => {
    setIsInstalling(true);
    setTimeout(() => {
      setIsInstalling(false);
      setIsInstalled(true);
    }, 2000);
  };

  const handleOpenApp = () => {
    setLoadingApp('kra-taxman');
    setTimeout(() => {
      router.push('/dashboard/ecosystem/kra-taxman');
    }, 800);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-800 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Hero Section - Taxman Only */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-12 text-white">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shadow-xl">
                  <FileText className="w-10 h-10" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl md:text-4xl font-bold">Taxman KRA</h1>
                    <span className="text-[10px] font-bold bg-emerald-400/30 backdrop-blur-sm text-white px-3 py-1 rounded-full animate-pulse">
                      {taxmanApp.badge}
                    </span>
                  </div>
                  <p className="text-blue-100 text-sm md:text-base">{taxmanApp.tagline}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 ml-auto">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  <span className="font-semibold">{taxmanApp.rating}</span>
                  <span className="text-blue-200">(124 reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Download className="w-4 h-4" />
                  <span>{taxmanApp.downloads.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* App Details Section */}
        <div className="max-w-5xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">About Taxman KRA</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {taxmanApp.longDescription}
                </p>
              </div>

              {/* Features */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Key Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {taxmanApp.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrations */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Integrations</h2>
                <div className="flex flex-wrap gap-2">
                  {taxmanApp.integrations.map((integration, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-medium"
                    >
                      {integration}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Reviews</h2>
                  <button className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
                    See all
                  </button>
                </div>
                <div className="space-y-4">
                  {taxmanApp.reviews.map((review, index) => (
                    <div key={index} className="border-b border-gray-100 dark:border-slate-700 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-800 dark:text-white">{review.name}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(review.rating)
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{review.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Install/Pricing */}
            <div className="space-y-6">
              {/* Install Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 sticky top-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg mb-3">
                    <FileText className="w-10 h-10" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">Taxman KRA</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">v2.4.1 • 12.4 MB</p>
                </div>

                {!isInstalled ? (
                  <button
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-400 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {isInstalling ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Installing...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Install App
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleOpenApp}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <Rocket className="w-5 h-5" />
                    Open App
                  </button>
                )}

                {isInstalled && (
                  <div className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="w-4 h-4" />
                    Successfully installed
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium">{taxmanApp.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500 dark:text-gray-400">Downloads</span>
                    <span className="font-medium">{taxmanApp.downloads.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500 dark:text-gray-400">Category</span>
                    <span className="font-medium">{taxmanApp.category}</span>
                  </div>
                </div>
              </div>

              {/* Pricing Card */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Pricing Plans</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Free</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">KES 0</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{taxmanApp.pricing.free}</p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border-2 border-blue-500/30">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-600 dark:text-blue-400">Pro</span>
                      <span className="text-blue-600 dark:text-blue-400 font-bold">KES 1,500/mo</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{taxmanApp.pricing.pro}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Enterprise</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Custom</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{taxmanApp.pricing.enterprise}</p>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">Secure & Compliant</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">256-bit SSL encryption • KRA certified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {loadingApp && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm transition-all duration-500">
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <span className="text-3xl font-bold text-emerald-600">XecoFlow</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">Opening Taxman KRA</h2>
              <p className="text-gray-500 mb-8">Loading your tax workspace...</p>
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
    </div>
  );
}