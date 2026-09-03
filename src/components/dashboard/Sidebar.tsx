// src/components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  ShoppingCart,
  Link2,
  Terminal,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Send,
  Key,
  Building,
  Briefcase,
  Shield,
  X,
  Clock,
  History,
  Wallet,
  User,
  Activity,
  Lock,
  Mail,
  Users,
  Globe,
  Bell,
  Smartphone,
  Zap,
  FileText,
  Download,
  TrendingUp,
  Repeat,
  Box,
  BriefcaseBusiness,
  Coins,
  Handshake,
  AppWindow,
  Grid3x3,
  Webhook,
  Landmark,
  PiggyBank,
  Pin,
  MonitorSmartphone,
  HelpCircle,
  BookOpen,
  Code,
  Brackets,
  Phone,
  Building2,
  Package,
  Store,
  Receipt,
  Layers,
  ChevronUp,
  UserCircle,
  Store as StoreIcon,
  Blocks,
  Sparkles,
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

// ─── Pinned Apps Mapping ──────────────────────────────────────────
const APP_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'pamojafund': Handshake,
  'boost-loan': TrendingUp,
  'airtime-retail': Smartphone,
  'airtime-bulk': Box,
  'kplc-token': Zap,
  'wallet-transactions': Wallet,
  'pos-terminal': MonitorSmartphone,
  'kra-automation': FileText,
  'chama-link': Users,
  'marketplace': StoreIcon,
};

const APP_LABEL_MAP: Record<string, string> = {
  'pamojafund': 'PamojaFund',
  'boost-loan': 'Boost Biashara Loan',
  'airtime-retail': 'Retail Quick Top-Up',
  'airtime-bulk': 'Bulk Airtime',
  'kplc-token': 'Buy KPLC Token',
  'wallet-transactions': 'Wallet Transactions',
  'pos-terminal': 'POS / Counter Pay',
  'kra-automation': 'KRA Automation',
  'chama-link': 'Chama Link',
  'marketplace': 'Apps Marketplace',
};

const APP_HREF_MAP: Record<string, string> = {
  'pamojafund': '/dashboard/pamojafund',
  'boost-loan': '/dashboard/loans',
  'airtime-retail': '/dashboard/utilities/airtime/retail',
  'airtime-bulk': '/dashboard/utilities/airtime/bulk',
  'kplc-token': '/dashboard/utilities/kplc',
  'wallet-transactions': '/dashboard/transactions/wallet',
  'pos-terminal': '/dashboard/pos',
  'kra-automation': '/dashboard/ecosystem/kra-automation',
  'chama-link': '/dashboard/ecosystem/chama-link',
  'marketplace': '/dashboard/ecosystem/marketplace',
};

const PINNED_APPS_KEY = 'xecoflow_pinned_apps';

// ─── Configuration ──────────────────────────────────────────────────
const sidebarSections: SidebarSection[] = [
  {
    title: '',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    ],
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
    title: 'PRODUCTS',
    items: [
      {
        icon: Send,
        label: 'Send STK Push',
        href: '/dashboard/hosted-checkout/integration',
      },
      {
        icon: Link2,
        label: 'Payment Links',
        children: [
          { 
            icon: Package, 
            label: 'Create Product Link', 
            href: '/dashboard/smart-bills/create-product',
          },
          { 
            icon: CreditCard, 
            label: 'Create Payment Page', 
            href: '/dashboard/payment-pages/create',
          },
          { 
            icon: Layers, 
            label: 'All Payment Links', 
            href: '/dashboard/smart-bills/pages',
          },
        ],
      },
      {
        icon: Building2,
        label: 'Get Automated PayBill',
        href: '/dashboard/paybill/automated',
      },
    ],
  },
  {
    title: 'DISBURSEMENT',
    items: [
      {
        icon: Phone,
        label: 'Bulk Airtime',
        href: '/dashboard/utilities/airtime/bulk',
      },
    ],
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
      // Finance items moved here
      {
        icon: TrendingUp,
        label: 'Boost Biashara Loan',
        href: '/dashboard/loans',
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        icon: Settings,
        label: 'Business & Account',
        children: [
          { icon: Building, label: 'Business Identity', href: '/dashboard/business/identity' },
          { icon: Users, label: 'Team Management', href: '/dashboard/business/team' },
          { icon: BarChart3, label: 'Reports & Analytics', href: '/dashboard/business/reports' },
          { icon: Bell, label: 'Preferences', href: '/dashboard/account/preferences' },
          { icon: Shield, label: 'Security', href: '/dashboard/account/security' },
          { icon: Activity, label: 'Activity Logs', href: '/dashboard/activity-logs' },
        ],
      },
    ],
  },
  {
    title: 'DEVELOPER HUB',
    items: [
      {
        icon: Code,
        label: 'API Keys & Webhooks',
        href: '/dashboard/account/api-keys',
      },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [merchantName, setMerchantName] = useState('Merchant');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showLoading, setShowLoading] = useState(false);
  const isManualToggle = useRef(false);
  const [pinnedApps, setPinnedApps] = useState<string[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if we're on the loan page or ecosystem page (full page apps)
  const isFullPageApp = pathname?.startsWith('/dashboard/loans') || 
                         pathname?.startsWith('/dashboard/ecosystem') || false;

  // ─── Close menu when clicking outside ──────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ─── Load pinned apps from localStorage ──────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(PINNED_APPS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPinnedApps(parsed);
      } catch (e) {
        console.error('Error loading pinned apps:', e);
      }
    }
  }, []);

  // ─── Build dynamic pinned app items ──────────────────────────────
  const getPinnedItems = (): SidebarItem[] => {
    return pinnedApps.map(appId => ({
      icon: APP_ICON_MAP[appId] || Pin,
      label: APP_LABEL_MAP[appId] || appId,
      href: APP_HREF_MAP[appId] || '#',
    }));
  };

  // ─── Get sections with dynamic pinned apps ──────────────────────
  const getSections = (): SidebarSection[] => {
    const pinnedItems = getPinnedItems();
    
    if (pinnedItems.length > 0) {
      return sidebarSections.map(section => {
        if (section.title === 'MY APPS & SHORTCUTS') {
          return {
            ...section,
            items: pinnedItems,
          };
        }
        return section;
      });
    }
    
    return sidebarSections.filter(section => section.title !== 'MY APPS & SHORTCUTS');
  };

  // Load merchant data from stored profile
  useEffect(() => {
    const stored = getStoredMerchant();
    if (stored?.businessName) {
      setMerchantName(stored.businessName);
    } else if (stored?.business_name) {
      setMerchantName(stored.business_name);
    }
  }, []);

  // Initialize expanded state based on current path
  useEffect(() => {
    if (isManualToggle.current) {
      isManualToggle.current = false;
      return;
    }

    const newExpanded: Record<string, boolean> = {};
    const sections = getSections();
    sections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children) {
          const isActive = item.children.some((child) => pathname === child.href);
          if (isActive) {
            newExpanded[item.label] = true;
          }
        }
      });
    });
    setExpanded(newExpanded);
  }, [pathname, pinnedApps]);

  // ─── Auto-collapse other sections ────────────────────────────────
  const toggleExpand = (label: string) => {
    isManualToggle.current = true;
    const newExpanded: Record<string, boolean> = {};
    if (expanded[label]) {
      setExpanded({});
      return;
    }
    newExpanded[label] = true;
    setExpanded(newExpanded);
  };

  const hasExpanded = Object.values(expanded).some(value => value === true);
  const hasHref = (item: SidebarItem) => {
    return item.href !== undefined && item.href !== '';
  };

  // ─── Special handler for full page apps (Loan, Ecosystem) ──────
  const handleFullPageApp = (href: string) => {
    setShowLoading(true);
    setTimeout(() => {
      router.push(href);
    }, 800);
  };

  // Hide loading immediately when we're on the full page
  useEffect(() => {
    if (pathname?.startsWith('/dashboard/loans') || pathname?.startsWith('/dashboard/ecosystem')) {
      setShowLoading(false);
    }
  }, [pathname]);

  // ─── Handle Sign Out ──────────────────────────────────────────────
  const handleSignOut = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('xecoflow_merchant');
    router.push('/login');
  };

  // Don't render sidebar on full page apps (loan, ecosystem)
  if (isFullPageApp) {
    return null;
  }

  const sections = getSections();

  return (
    <>
      {/* ─── Loading Overlay ────────────────────────────────────── */}
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
            
            <p className="text-sm text-gray-400 mt-6">Loading...</p>
          </div>
        </div>
      )}

      <aside
        className={`h-screen sticky top-0 flex flex-col bg-[#071526] border-r border-[#11243d] transition-all duration-300 ease-in-out w-72`}
      >
        {/* ─── Header ────────────────────────────────────────────────── */}
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

        {/* ─── Navigation ───────────────────────────────────────────── */}
        <nav 
          className={`flex-1 px-3 py-4 overflow-y-auto ${
            hasExpanded ? '' : 'overflow-hidden'
          }`}
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

                    // ─── Full page app items (Loan, Marketplace) ──
                    const isFullPageItem = 
                      (item.label === 'Boost Biashara Loan' && item.href === '/dashboard/loans') ||
                      (item.label === 'Apps Marketplace' && item.href === '/dashboard/ecosystem/marketplace');

                    if (isFullPageItem) {
                      return (
                        <button
                          key={item.label}
                          onClick={() => handleFullPageApp(item.href!)}
                          className={`w-full group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
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
                            <span className={`ml-auto text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full ${
                              item.label === 'Apps Marketplace' ? 'animate-pulse' : ''
                            }`}>
                              {item.badge}
                            </span>
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
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
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
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
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
                                <span className={`text-slate-500 transition-transform duration-200 ${
                                  showExpanded ? 'rotate-90' : ''
                                }`}>
                                  <ChevronRight size={16} />
                                </span>
                              </Link>
                            ) : (
                              <button
                                onClick={() => toggleExpand(item.label)}
                                className={`w-full group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all ${
                                  childActive || showExpanded
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/10'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border border-transparent'
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
                                <span className={`text-slate-500 transition-transform duration-200 ${
                                  showExpanded ? 'rotate-90' : ''
                                }`}>
                                  <ChevronRight size={16} />
                                </span>
                              </button>
                            )}

                            {showExpanded && (
                              <div className="ml-6 mt-0.5 space-y-0.5 border-l border-slate-700/50 pl-2">
                                {item.children!.map((child) => {
                                  const childActive = pathname === child.href;
                                  return (
                                    <Link
                                      key={child.label}
                                      href={child.href!}
                                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all ${
                                        childActive
                                          ? 'bg-emerald-500/10 text-emerald-300'
                                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                                      }`}
                                    >
                                      {child.icon && (
                                        <child.icon
                                          size={16}
                                          className={`flex-shrink-0 ${
                                            childActive ? 'text-emerald-400' : 'text-slate-500'
                                          }`}
                                        />
                                      )}
                                      <span className="truncate text-[13px]">{child.label}</span>
                                      {childActive && (
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

        {/* ─── Footer ────────────────────────────────────────────────── */}
        <div ref={menuRef} className="border-t border-slate-700/50 p-4 mt-auto flex-shrink-0 relative">
          {/* User Profile Button - Stays at bottom */}
          <button
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

          {/* Dropdown Menu - Opens UPWARD from the button */}
          <div
            className={`absolute bottom-full left-0 right-0 mb-2 overflow-hidden transition-all duration-300 ease-in-out ${
              showUserMenu ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="mx-2 rounded-xl bg-slate-800/95 border border-slate-700/50 overflow-hidden shadow-xl shadow-black/30 backdrop-blur-sm">
              {/* Account Header */}
              <div className="px-4 py-3 border-b border-slate-700/50">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</p>
              </div>

              {/* Menu Items */}
              <Link
                href="/dashboard/account/profile"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 transition-colors text-sm text-slate-300 hover:text-white"
              >
                <UserCircle className="w-4 h-4" />
                Profile
              </Link>
              <Link
                href="/dashboard/account/preferences"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700/50 transition-colors text-sm text-slate-300 hover:text-white"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              
              <div className="border-t border-slate-700/50"></div>
              
              <button
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