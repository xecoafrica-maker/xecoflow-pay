// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  Link2,
  Settings,
  LogOut,
  ChevronRight,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Send,
  Building,
  Shield,
  X,
  Clock,
  History,
  Wallet,
  Users,
  Smartphone,
  Zap,
  FileText,
  Download,
  Coins,
  Handshake,
  Pin,
  MonitorSmartphone,
  Code,
  Phone,
  Building2,
  Package,
  Store as StoreIcon,
  Layers,
  ChevronUp,
  UserCircle,
  Eye,
  EyeOff,
  CheckCircle,
  BadgeDollarSign,
  Box,
} from 'lucide-react';
import { getStoredMerchant } from '../../lib/auth';

// ─── Types ──────────────────────────────────────────────────────────
interface SidebarItem {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  href?: string;
  children?: SidebarItem[];
  badge?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

// ─── Pinned apps ────────────────────────────────────────────────────
const APP_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  pamojafund: Handshake,
  'airtime-retail': Smartphone,
  'airtime-bulk': Box,
  'kplc-token': Zap,
  'wallet-transactions': Wallet,
  'pos-terminal': MonitorSmartphone,
  'kra-automation': FileText,
  'chama-link': Users,
  marketplace: StoreIcon,
};

const APP_LABEL_MAP: Record<string, string> = {
  pamojafund: 'PamojaFund',
  'airtime-retail': 'Retail Quick Top-Up',
  'airtime-bulk': 'Bulk Airtime',
  'kplc-token': 'Buy KPLC Token',
  'wallet-transactions': 'Wallet Transactions',
  'pos-terminal': 'POS / Counter Pay',
  'kra-automation': 'KRA Automation',
  'chama-link': 'Chama Link',
  marketplace: 'Apps Marketplace',
};

const APP_HREF_MAP: Record<string, string> = {
  pamojafund: '/dashboard/pamojafund',
  'airtime-retail': '/dashboard/utilities/airtime/retail',
  'airtime-bulk': '/dashboard/utilities/airtime/bulk',
  'kplc-token': '/dashboard/utilities/kplc',
  'wallet-transactions': '/dashboard/transactions/wallet',
  'pos-terminal': '/dashboard/pos',
  'kra-automation': '/dashboard/ecosystem/kra-automation',
  'chama-link': '/dashboard/ecosystem/chama-link',
  marketplace: '/dashboard/ecosystem/marketplace',
};

const PINNED_APPS_KEY = 'xecoflow_pinned_apps';

// ─── Navigation config ──────────────────────────────────────────────
const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: '',
    items: [{ icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' }],
  },
  {
    title: 'PAYMENTS',
    items: [
      {
        icon: CreditCard,
        label: 'Transactions',
        children: [
          { icon: ArrowUpRight, label: 'Inflow', href: '/dashboard/transactions/inflow' },
          { icon: ArrowDownRight, label: 'Outflow', href: '/dashboard/transactions/outflow' },
          { icon: Coins, label: 'Wallet Transactions', href: '/dashboard/transactions/wallet' },
          { icon: Download, label: 'Generate Statement', href: '/dashboard/transactions/statement' },
        ],
      },
      {
        icon: Wallet,
        label: 'Withdrawals',
        children: [
          { icon: PlusCircle, label: 'Withdraw Funds', href: '/dashboard/withdrawals/Withdraw-fund' },
          { icon: History, label: 'Withdraw History', href: '/dashboard/withdrawals/Withdraw-History' },
          { icon: Clock, label: 'Scheduled Withdraws', href: '/dashboard/withdrawals/Withdraw-scheduled' },
        ],
      },
    ],
  },
  {
    title: 'SERVICES',
    items: [
      { icon: Send, label: 'Send STK Push', href: '/dashboard/hosted-checkout/integration' },
      {
        icon: Link2,
        label: 'Payment Links',
        children: [
          { icon: Package, label: 'Create Product Link', href: '/dashboard/smart-bills/create-product' },
          { icon: CreditCard, label: 'Create Payment Page', href: '/dashboard/payment-pages/create' },
          { icon: Layers, label: 'All Payment Links', href: '/dashboard/smart-bills/pages' },
        ],
      },
      { icon: Building2, label: 'Get Automated PayBill', href: '/dashboard/paybill/automated' },
      { icon: BadgeDollarSign, label: 'Service Charges', href: '/dashboard/rates/transaction-fees' },
    ],
  },
  {
    title: 'DISBURSEMENT',
    items: [{ icon: Phone, label: 'Bulk Airtime', href: '/dashboard/utilities/airtime/bulk' }],
  },
  {
    title: 'ECOSYSTEM',
    items: [
      {
        icon: StoreIcon,
        label: 'Apps Marketplace',
        href: '/dashboard/ecosystem/marketplace',
        badge: 'NEW',
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        icon: Settings,
        label: 'Account Settings',
        children: [
          { icon: Building, label: 'Business & Profile', href: '/dashboard/settings/business' },
          { icon: Shield, label: 'Security & Access', href: '/dashboard/settings/security' },
          { icon: FileText, label: 'Compliance & KYC', href: '/dashboard/settings/compliance' },
          { icon: FileText, label: 'Activity Logs', href: '/dashboard/activity-logs' },
        ],
      },
    ],
  },
  {
    title: 'DEVELOPER HUB',
    items: [{ icon: Code, label: 'API Keys & Webhooks', href: '/dashboard/account/api-keys' }],
  },
];

// ─── Component ──────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [merchantName, setMerchantName] = useState('Merchant');
  const [merchantEmail, setMerchantEmail] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showLoading, setShowLoading] = useState(false);
  const isManualToggle = useRef(false);
  const [pinnedApps, setPinnedApps] = useState<string[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Password verification modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  const isFullPageApp = pathname?.startsWith('/dashboard/ecosystem') || false;

  // Close user menu on outside click.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load pinned apps.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PINNED_APPS_KEY);
      if (saved) setPinnedApps(JSON.parse(saved));
    } catch {
      // Corrupt JSON — ignore.
    }
  }, []);

  // Load merchant display name from cached profile.
  useEffect(() => {
    const stored = getStoredMerchant();
    if (stored?.businessName) setMerchantName(stored.businessName);
    else if (stored?.business_name) setMerchantName(stored.business_name);
    if (stored?.email) setMerchantEmail(stored.email);
  }, []);

  const getPinnedItems = (): SidebarItem[] =>
    pinnedApps.map((appId) => ({
      icon: APP_ICON_MAP[appId] || Pin,
      label: APP_LABEL_MAP[appId] || appId,
      href: APP_HREF_MAP[appId] || '#',
    }));

  const getSections = (): SidebarSection[] => {
    const pinnedItems = getPinnedItems();
    if (pinnedItems.length > 0) {
      return SIDEBAR_SECTIONS.map((section) =>
        section.title === 'MY APPS & SHORTCUTS'
          ? { ...section, items: pinnedItems }
          : section
      );
    }
    return SIDEBAR_SECTIONS.filter((section) => section.title !== 'MY APPS & SHORTCUTS');
  };

  // Auto-expand the section containing the active route.
  useEffect(() => {
    if (isManualToggle.current) {
      isManualToggle.current = false;
      return;
    }
    const newExpanded: Record<string, boolean> = {};
    getSections().forEach((section) => {
      section.items.forEach((item) => {
        if (item.children?.some((child) => pathname === child.href)) {
          newExpanded[item.label] = true;
        }
      });
    });
    setExpanded(newExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, pinnedApps]);

  const toggleExpand = (label: string) => {
    isManualToggle.current = true;
    if (expanded[label]) {
      setExpanded({});
      return;
    }
    setExpanded({ [label]: true });
  };

  const hasExpanded = Object.values(expanded).some((v) => v === true);
  const hasHref = (item: SidebarItem) => Boolean(item.href);

  // Verify the merchant's password before entering Apps Marketplace.
  const verifyPassword = async (enteredPassword: string): Promise<boolean> => {
    try {
      const storedMerchant = getStoredMerchant();
      const merchantId = storedMerchant?.merchantId || storedMerchant?.merchant_id || '';

      const response = await fetch('/api/auth/verify-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Merchant-ID': String(merchantId),
        },
        body: JSON.stringify({ password: enteredPassword }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) return true;

      setPasswordError(data.message || 'Incorrect password. Please try again.');
      return false;
    } catch {
      setPasswordError('Network error. Please try again.');
      return false;
    }
  };

  const handleMarketplaceClick = (href: string) => {
    setPendingHref(href);
    setPassword('');
    setPasswordError('');
    setVerificationSuccess(false);
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setPasswordError('Please enter your password');
      return;
    }

    setIsVerifying(true);
    setPasswordError('');
    const isValid = await verifyPassword(password);
    setIsVerifying(false);

    if (isValid && pendingHref) {
      setVerificationSuccess(true);
      setTimeout(() => {
        setShowPasswordModal(false);
        setPassword('');
        setVerificationSuccess(false);
        handleFullPageApp(pendingHref);
      }, 800);
    }
  };

  const handleFullPageApp = (href: string) => {
    setShowLoading(true);
    setTimeout(() => router.push(href), 800);
  };

  // Hide the loading overlay once the ecosystem page mounts.
  useEffect(() => {
    if (pathname?.startsWith('/dashboard/ecosystem')) setShowLoading(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore — the user is being logged out regardless.
    }

    // Clear cached profile data (auth cookies are cleared by the server).
    try {
      localStorage.removeItem('merchant');
      localStorage.removeItem('merchant_id');
      localStorage.removeItem('businessName');
      localStorage.removeItem('email');
      localStorage.removeItem('user');
      localStorage.removeItem('merchantData');
    } catch {
      // Storage may be unavailable.
    }

    router.replace('/login');
  };

  if (isFullPageApp) return null;

  const sections = getSections();

  return (
    <>
      {/* Password verification modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Verify Your Identity</h3>
                  <p className="text-sm text-gray-500">
                    Enter your password to continue to Apps Marketplace
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20">
                    {merchantName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Continuing as</p>
                    <p className="text-sm text-gray-600">{merchantName}</p>
                    {merchantEmail && (
                      <p className="text-xs text-gray-400">{merchantEmail}</p>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Account Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError('');
                        }}
                        placeholder="Enter your password"
                        className={`w-full pl-4 pr-12 py-3 bg-white border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm ${
                          passwordError ? 'border-red-500' : 'border-gray-300'
                        }`}
                        autoFocus
                        disabled={isVerifying}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordError && (
                      <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                        <X className="w-3.5 h-3.5" />
                        {passwordError}
                      </p>
                    )}
                  </div>

                  {verificationSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm text-emerald-700">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Password verified! Redirecting…
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPassword('');
                        setPasswordError('');
                        setPendingHref(null);
                        setVerificationSuccess(false);
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifying || !password || verificationSuccess}
                      className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Verifying…
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Continue
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              <p className="mt-4 text-xs text-gray-400 text-center">
                This is a security measure to protect your account
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full-page app loading overlay */}
      {showLoading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm transition-all duration-500">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <span className="text-3xl font-bold text-emerald-600">XecoFlow</span>
            </div>
            <h2 className="text-3xl font-semibold text-gray-800 mb-3">
              Loading Application
            </h2>
            <p className="text-gray-500 mb-8">Please wait while we prepare your workspace</p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }} />
              <div className="w-4 h-4 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.8s' }} />
            </div>
            <p className="text-sm text-gray-400 mt-6">Loading…</p>
          </div>
        </div>
      )}

      <aside className="h-screen sticky top-0 flex flex-col bg-[#071526] border-r border-[#11243d] transition-all duration-300 ease-in-out w-72">
        <div className="flex items-center justify-between p-5 border-b-2 border-[#1a2a4a] shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <Link href="/dashboard" className="flex flex-col">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xl font-bold tracking-tight text-white">
                  Xeco<span className="text-emerald-400">Flow</span>
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

        <nav
          className={`flex-1 px-3 py-4 overflow-y-auto ${hasExpanded ? '' : 'overflow-hidden'}`}
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a2a4a transparent' }}
        >
          {sections.map((section) => {
            if (section.items.length === 0) return null;

            return (
              <div key={section.title || 'section'} className="mb-4">
                {section.title && (
                  <div className="px-3 py-1.5">
                    <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
                      {section.title}
                    </p>
                  </div>
                )}

                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isLeaf = !item.children || item.children.length === 0;
                    const isActive =
                      isLeaf &&
                      (pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href!)));

                    const childActive = item.children
                      ? item.children.some((child) => pathname === child.href)
                      : false;

                    const showExpanded = expanded[item.label] || false;
                    const isParentWithHref = !isLeaf && hasHref(item);

                    // Apps Marketplace — requires password verification.
                    if (
                      item.label === 'Apps Marketplace' &&
                      item.href === '/dashboard/ecosystem/marketplace'
                    ) {
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => handleMarketplaceClick(item.href!)}
                          className={`w-full group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                              : 'text-white hover:bg-slate-800/50 hover:text-white border border-transparent'
                          }`}
                        >
                          {item.icon && (
                            <item.icon
                              size={18}
                              className={`flex-shrink-0 ${
                                isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                              }`}
                            />
                          )}
                          <span className="truncate text-[13px]">{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full animate-pulse">
                              {item.badge}
                            </span>
                          )}
                          {!isActive && (
                            <Shield className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 transition-colors ml-0.5" />
                          )}
                        </button>
                      );
                    }

                    return (
                      <div key={item.label}>
                        {isLeaf ? (
                          <Link
                            href={item.href!}
                            className={`group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all ${
                              isActive
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                                : 'text-white hover:bg-slate-800/50 hover:text-white border border-transparent'
                            }`}
                          >
                            {item.icon && (
                              <item.icon
                                size={18}
                                className={`flex-shrink-0 ${
                                  isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
                                }`}
                              />
                            )}
                            <span className="truncate text-[13px]">{item.label}</span>
                            {item.badge && (
                              <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        ) : (
                          <div>
                            {isParentWithHref ? (
                              <Link
                                href={item.href!}
                                onClick={() => toggleExpand(item.label)}
                                className={`w-full group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all ${
                                  childActive || showExpanded
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/10'
                                    : 'text-white hover:bg-slate-800/50 hover:text-white border border-transparent'
                                }`}
                              >
                                {item.icon && (
                                  <item.icon
                                    size={18}
                                    className={`flex-shrink-0 ${
                                      childActive || showExpanded
                                        ? 'text-emerald-400'
                                        : 'text-slate-500 group-hover:text-slate-300'
                                    }`}
                                  />
                                )}
                                <span className="flex-1 text-left truncate text-[13px]">{item.label}</span>
                                {item.badge && (
                                  <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                                <span
                                  className={`text-slate-500 transition-transform duration-200 ${
                                    showExpanded ? 'rotate-90' : ''
                                  }`}
                                >
                                  <ChevronRight size={16} />
                                </span>
                              </Link>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleExpand(item.label)}
                                className={`w-full group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all ${
                                  childActive || showExpanded
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/10'
                                    : 'text-white hover:bg-slate-800/50 hover:text-white border border-transparent'
                                }`}
                              >
                                {item.icon && (
                                  <item.icon
                                    size={18}
                                    className={`flex-shrink-0 ${
                                      childActive || showExpanded
                                        ? 'text-emerald-400'
                                        : 'text-slate-500 group-hover:text-slate-300'
                                    }`}
                                  />
                                )}
                                <span className="flex-1 text-left truncate text-[13px]">{item.label}</span>
                                {item.badge && (
                                  <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
                                    {item.badge}
                                  </span>
                                )}
                                <span
                                  className={`text-slate-500 transition-transform duration-200 ${
                                    showExpanded ? 'rotate-90' : ''
                                  }`}
                                >
                                  <ChevronRight size={16} />
                                </span>
                              </button>
                            )}

                            {showExpanded && (
                              <div className="ml-6 mt-0.5 space-y-0.5 border-l border-slate-600/60 pl-2">
                                {item.children!.map((child) => {
                                  const childIsActive = pathname === child.href;
                                  return (
                                    <Link
                                      key={child.label}
                                      href={child.href!}
                                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all ${
                                        childIsActive
                                          ? 'bg-emerald-500/10 text-emerald-300'
                                          : 'text-white hover:bg-slate-800/50 hover:text-white'
                                      }`}
                                    >
                                      {child.icon && (
                                        <child.icon
                                          size={16}
                                          className={`flex-shrink-0 ${
                                            childIsActive ? 'text-emerald-400' : 'text-slate-500'
                                          }`}
                                        />
                                      )}
                                      <span className="truncate text-[13px]">{child.label}</span>
                                      {childIsActive && (
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      )}
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div ref={menuRef} className="border-t border-slate-700/50 p-4 mt-auto flex-shrink-0 relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-800/50 transition-all relative z-10"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20 shrink-0">
              {merchantName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-white truncate">{merchantName}</p>
              <p className="text-xs text-slate-400 truncate">Admin Account</p>
            </div>
            <ChevronUp
              className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                showUserMenu ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div
            className={`absolute bottom-full left-0 right-0 mb-2 overflow-hidden transition-all duration-300 ease-in-out ${
              showUserMenu
                ? 'max-h-80 opacity-100 pointer-events-auto'
                : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="mx-2 rounded-xl bg-slate-800/95 border border-slate-700/50 overflow-hidden shadow-xl shadow-black/30 backdrop-blur-sm">
              <div className="px-4 py-3 border-b border-slate-700/50">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Account
                </p>
              </div>

              <Link
                href="/dashboard/settings/business"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 transition-colors text-sm text-slate-300 hover:text-white"
              >
                <UserCircle className="w-4 h-4" />
                Profile
              </Link>
              <Link
                href="/dashboard/settings/business"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 transition-colors text-sm text-slate-300 hover:text-white"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>

              <div className="border-t border-slate-700/50"></div>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors text-sm text-red-400 hover:text-red-300"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}