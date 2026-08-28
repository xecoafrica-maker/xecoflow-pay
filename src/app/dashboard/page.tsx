'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Clock,
  XCircle,
  Wallet,
  TrendingUp,
  BarChart3,
  Link2,
  CreditCard,
  Code,
  Eye,
  X,
  ChevronRight,
  Building,
  Landmark,
  Settings,
  Send,
  FileText,
  Smartphone,
  Zap,
  Coins,
  LogOut,
  ArrowUpRight,
  AlertCircle,
  Users,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
} from 'recharts';
import { getToken, removeToken, getStoredMerchant } from '@/lib/auth';
import { getMerchantProfile } from '@/lib/auth-api';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Types ──────────────────────────────────────────────────────────
interface Transaction {
  id: string;
  user_id: string;
  amount: string;
  phone_number: string;
  business_shortcode: string;
  status: string;
  payment_status: string;
  source: string;
  request_type: string;
  checkout_id: string;
  mpesa_receipt: string | null;
  result_code: string | null;
  result_desc: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

interface DashboardStats {
  totalTransactions: number;
  totalAmount: number;
  pendingTransactions: number;
  completedTransactions: number;
  failedTransactions: number;
  todayTransactions: number;
  todayAmount: number;
  statusCounts: Record<string, number>;
  completedAmount?: number;
}

// ─── Onboarding Steps ──────────────────────────────────────────────
interface OnboardingStep {
  id: number;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  completed: boolean;
  active: boolean;
}

// ─── Filter Options ──────────────────────────────────────────────
const STATUS_FILTERS = ['All', 'Completed', 'Pending', 'Failed', 'AWAITING_CUSTOMER_PIN'];
const chartTypes = ['Bar', 'Line'];

// ─── Get Current Month ─────────────────────────────────────────────
const getCurrentMonth = () => {
  return new Date().toLocaleDateString('en-US', { month: 'long' });
};

export default function DashboardOverview() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();
  const [merchantName, setMerchantName] = useState<string>('Merchant');
  const [merchantId, setMerchantId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  
  // ✅ Prevent duplicate logging ONLY during the same page load
  const hasLoggedView = useRef(false);
  const isLoggingView = useRef(false);

  // ─── Onboarding Steps State ─────────────────────────────────────
  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);

  // ─── Real Data State ──────────────────────────────────────────────
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // ✅ NEW: Real balance from Ledger Engine
  const [ledgerBalance, setLedgerBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState<boolean>(true);
  
  // ─── Filter State ──────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState('All');
  const [chartType, setChartType] = useState('Bar');
  const [timeRange, setTimeRange] = useState('7 Days');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const tooltipFormatter = (value: any) => [`KES ${value}`, 'Amount'];

  // ─── 🚀 Fetch Onboarding Status from Backend ──────────────────────
  const fetchOnboarding = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/v1/onboarding/status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data) {
        const stepMappings = [
          { 
            id: 1, 
            label: '01 — Business Profile', 
            href: '/dashboard/onboarding/stage1', 
            completed: data.steps.businessProfile === 'COMPLETED' 
          },
          { 
            id: 2, 
            label: '02 — Owners & Documents', 
            href: '/dashboard/onboarding/stage2', 
            completed: data.steps.ownersDocuments === 'COMPLETED' 
          },
          { 
            id: 3, 
            label: '03 — Tax & Compliance', 
            href: '/dashboard/onboarding/stage3', 
            completed: data.steps.taxCompliance === 'COMPLETED' 
          },
          { 
            id: 4, 
            label: '04 — Settlement', 
            href: '/dashboard/onboarding/stage4', 
            completed: data.steps.settlement === 'COMPLETED' 
          },
          { 
            id: 5, 
            label: '05 — Review & Submit', 
            href: '/dashboard/onboarding/stage5', 
            completed: data.overallStatus === 'SUBMITTED' 
          },
        ];

        const activeStepId = data.currentStep;
        
        const mappedSteps = stepMappings.map((step) => ({
          ...step,
          icon: step.label.includes('Business Profile') ? Building : 
                step.label.includes('Owners') ? Users : 
                step.label.includes('Tax') ? FileText : 
                step.label.includes('Settlement') ? Landmark : CheckCircle,
          active: step.id === activeStepId
        }));
        
        setOnboardingSteps(mappedSteps);
      }
    } catch (error) {
      console.error('Failed to fetch onboarding:', error);
    }
  };

  // ─── Fetch Real Data ──────────────────────────────────────────────
  const fetchDashboardData = async (merchantIdParam?: string) => {
    try {
      console.log("🔍 Fetching data for merchant:", merchantIdParam);
      
      const params = new URLSearchParams();
      if (merchantIdParam) {
        params.append('merchantId', merchantIdParam);
      }
      params.append('limit', '100');

      // 1. Fetch Transactions
      const transRes = await fetch(`/api/transactions?${params.toString()}`);
      const transData = await transRes.json();
      
      if (transData.success) {
        setTransactions(transData.data || []);
        setFilteredTransactions(transData.data || []);
      }

      // 2. Fetch Stats (for history, not balance)
      const statsRes = await fetch(`/api/dashboard/stats?${params.toString()}`);
      const statsData = await statsRes.json();
      
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // 3. ✅ Fetch REAL Balance from Ledger Engine
      if (merchantIdParam) {
        const paddedId = String(merchantIdParam).padStart(8, '0');
        const accountNumber = `1-1001-${paddedId}`;
        console.log('🔍 Fetching balance for account:', accountNumber);
        
        const balanceRes = await fetch(`/v1/ledger/accounts/${accountNumber}/balance`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const balanceData = await balanceRes.json();
        console.log('🔍 Balance response:', balanceData);
        
        if (balanceData.success) {
          setLedgerBalance(balanceData.balance);
        } else {
          console.error('❌ Failed to fetch balance:', balanceData.error);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setBalanceLoading(false);
    }
  };

  // ─── Apply Filters ──────────────────────────────────────────────
  useEffect(() => {
    let filtered = [...transactions];

    if (statusFilter !== 'All') {
      filtered = filtered.filter(t => {
        const status = t.status || t.payment_status || '';
        if (statusFilter === 'Completed') {
          return status.includes('COMPLETED') || status.includes('SUCCESS');
        }
        if (statusFilter === 'Pending') {
          return status.includes('PENDING') || status.includes('AWAITING');
        }
        if (statusFilter === 'Failed') {
          return status.includes('FAILED') || status.includes('ERROR');
        }
        if (statusFilter === 'AWAITING_CUSTOMER_PIN') {
          return status === 'AWAITING_CUSTOMER_PIN';
        }
        return true;
      });
    }

    setFilteredTransactions(filtered);
  }, [transactions, statusFilter]);

  // ─── Auth & Profile ──────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const cached = getStoredMerchant();
    console.log("📦 Cached merchant:", cached);
    
    if (cached) {
      const id = cached.merchantId || cached.merchant_id;
      if (id) {
        setMerchantId(String(id));
        setMerchantName(cached.businessName || cached.business_name || 'Merchant');
      }
    }

    getMerchantProfile(token)
      .then((profile) => {
        if (profile) {
          const id = profile.merchant_id;
          if (id) {
            setMerchantId(String(id));
            setMerchantName(profile.business_name || 'Merchant');
            localStorage.setItem('merchant', JSON.stringify(profile));
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch profile:', err);
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          removeToken();
          router.push('/login');
        } else {
          setLoading(false);
        }
      });

    const checkAndFetch = async () => {
      const cachedData = getStoredMerchant();
      if (cachedData) {
        const id = cachedData.merchantId || cachedData.merchant_id;
        if (id) {
          console.log("🚀 Fetching data with merchant ID:", id);
          await fetchDashboardData(String(id));
          await fetchOnboarding();
        }
      } else {
        try {
          const token = getToken();
          if (token) {
            const profile = await getMerchantProfile(token);
            if (profile && profile.merchant_id) {
              setMerchantId(String(profile.merchant_id));
              await fetchDashboardData(String(profile.merchant_id));
              await fetchOnboarding();
            }
          }
        } catch (err) {
          console.error("Failed to get profile for data fetch:", err);
        }
      }
    };

    setTimeout(() => {
      checkAndFetch();
    }, 500);
  }, [router]);

  // ─── Log Dashboard View - Only once per page visit ──────────────
  useEffect(() => {
    const logView = async () => {
      if (isLoggingView.current || hasLoggedView.current || !merchantId) {
        return;
      }
      
      try {
        isLoggingView.current = true;
        await log(
          ActivityActions.VIEW_DASHBOARD,
          `Viewed dashboard for ${merchantName}`
        );
        hasLoggedView.current = true;
        console.log('✅ Dashboard view logged');
      } catch (error) {
        console.debug('Dashboard view logging skipped:', error);
      } finally {
        isLoggingView.current = false;
      }
    };
    
    if (!loading && merchantId && !hasLoggedView.current) {
      logView();
    }
  }, [loading, merchantId, merchantName, log]);

  // ─── Generate Real Stats ──────────────────────────────────────────
  const currentMonth = getCurrentMonth();

  const generateStats = () => {
    // If no data, return zeros
    if (!stats && transactions.length === 0) {
      return [
        { 
          label: 'Available Balance', 
          value: 'KES 0', 
          change: 'Ready to withdraw', 
          up: true, 
          icon: Wallet, 
          color: 'text-emerald-500', 
          bg: 'bg-emerald-50' 
        },
        { 
          label: 'Total Processed', 
          value: 'KES 0', 
          change: 'This month', 
          up: true, 
          icon: TrendingUp, 
          color: 'text-blue-500', 
          bg: 'bg-blue-50' 
        },
        { 
          label: 'Transactions', 
          value: '0', 
          change: 'This month', 
          up: true, 
          icon: BarChart3, 
          color: 'text-amber-500', 
          bg: 'bg-amber-50' 
        },
        { 
          label: 'Total Withdrawn',
          value: 'KES 0', 
          change: 'All withdrawals',
          up: true, 
          icon: Coins, 
          color: 'text-purple-500', 
          bg: 'bg-purple-50' 
        },
      ];
    }

    const totalAmount = stats?.totalAmount || transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalTransactions = stats?.totalTransactions || transactions.length;
    const todayTransactions = stats?.todayTransactions || transactions.filter(t => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(t.created_at) >= today;
    }).length;
    const todayAmount = stats?.todayAmount || transactions.filter(t => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(t.created_at) >= today;
    }).reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const pendingTransactions = stats?.pendingTransactions || transactions.filter(t => 
      t.status === 'AWAITING_CUSTOMER_PIN' || t.payment_status === 'PENDING'
    ).length;

    // ✅ Use REAL ledgerBalance from journal_entries
    const availableBalance = ledgerBalance;

    // Total Withdrawn - this should come from withdrawals API
    const totalWithdrawn = 0; // This will come from API

    return [
      { 
        label: 'Available Balance', 
        value: `KES ${availableBalance.toLocaleString()}`, 
        change: 'Ready to withdraw', 
        up: true, 
        icon: Wallet, 
        color: 'text-emerald-500', 
        bg: 'bg-emerald-50' 
      },
      { 
        label: 'Total Processed', 
        value: `KES ${totalAmount.toLocaleString()}`, 
        change: 'This month', 
        up: todayTransactions > 0, 
        icon: TrendingUp, 
        color: 'text-blue-500', 
        bg: 'bg-blue-50' 
      },
      { 
        label: 'Transactions', 
        value: totalTransactions.toString(), 
        change: `${todayTransactions} today`, 
        up: todayTransactions > 0, 
        icon: BarChart3, 
        color: 'text-amber-500', 
        bg: 'bg-amber-50' 
      },
      { 
        label: 'Total Withdrawn',
        value: `KES ${totalWithdrawn.toLocaleString()}`, 
        change: 'All withdrawals',
        up: true, 
        icon: Coins, 
        color: 'text-purple-500', 
        bg: 'bg-purple-50' 
      },
    ];
  };

  const statsData = generateStats();

  // ─── Generate Chart Data ──────────────────────────────────────────
  const chartData = [...filteredTransactions]
    .slice(0, 7)
    .map(t => ({
      day: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: parseFloat(t.amount),
    }))
    .reverse();

  // ─── Recent Transactions - Only Today, Max 6 ──────────────────────
  const getTodayTransactions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTxs = transactions.filter(t => {
      const txDate = new Date(t.created_at);
      txDate.setHours(0, 0, 0, 0);
      return txDate.getTime() === today.getTime();
    });

    // Sort by newest first and take only 6
    return todayTxs
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)
      .map(t => ({
        id: t.id.slice(0, 8),
        customer: t.phone_number,
        amount: parseFloat(t.amount),
        method: t.source || 'M-PESA',
        status: t.status || t.payment_status || 'PENDING',
        checkoutId: t.checkout_id,
        date: new Date(t.created_at).toLocaleString(),
        receipt: t.mpesa_receipt,
      }));
  };

  const recentTransactions = getTodayTransactions();

  // ─── Status Helper ────────────────────────────────────────────────
  const getStatusDisplay = (status: string) => {
    const s = status?.toUpperCase() || '';
    if (s.includes('COMPLETED') || s.includes('SUCCESS')) {
      return { label: 'Completed', color: 'bg-emerald-50 text-emerald-600', icon: <CheckCircle size={12} /> };
    }
    if (s.includes('PENDING') || s.includes('AWAITING')) {
      return { label: 'Pending', color: 'bg-amber-50 text-amber-600', icon: <Clock size={12} /> };
    }
    if (s.includes('FAILED') || s.includes('ERROR') || s.includes('DECLINED')) {
      return { label: 'Failed', color: 'bg-red-50 text-red-600', icon: <XCircle size={12} /> };
    }
    return { label: status || 'Unknown', color: 'bg-gray-50 text-gray-600', icon: <Clock size={12} /> };
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  // ─── Onboarding Calculation ──────────────────────────────────────
  const completedSteps = onboardingSteps.filter(s => s.completed).length;
  const totalSteps = onboardingSteps.length;
  const isFullyOnboarded = totalSteps > 0 && completedSteps === totalSteps;
  
  const getActionButtonText = () => {
    if (isFullyOnboarded) return 'Submitted ✓';
    if (completedSteps === 0) return 'Start setup →';
    if (completedSteps > 0 && completedSteps < 4) return 'Continue setup →';
    if (completedSteps === 4) return 'Review & Submit →';
    return 'Complete Setup';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'}, {merchantName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
      </div>

      {/* ─── COLLAPSIBLE ACTIVATION CENTER ──────────────────────────── */}
      {!showOnboarding && !isFullyOnboarded && onboardingSteps.length > 0 && (
        <div 
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group"
          onClick={() => setShowOnboarding(true)}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Setup incomplete · {totalSteps - completedSteps} steps remaining</p>
            </div>
          </div>
          <span className="text-xs font-medium text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1">
            Resume setup <ChevronRight size={14} />
          </span>
        </div>
      )}

      {showOnboarding && !isFullyOnboarded && onboardingSteps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative">
          {/* ─── Header ────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                Activate your XecoFlow Business
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Complete the steps below to start accepting payments securely.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                {completedSteps} / {totalSteps}
              </span>
              <span className="text-sm font-medium text-gray-800">Completed</span>
            </div>
          </div>

          {/* ─── Steps Grid (5 Stages) ────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            {onboardingSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    step.completed
                      ? 'bg-emerald-50 border-emerald-200'
                      : step.active
                      ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      step.completed
                        ? 'bg-emerald-500 text-white'
                        : step.active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-300 text-gray-500'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle size={14} />
                    ) : (
                      <span className="text-xs font-bold">{step.id}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-xs font-semibold truncate ${
                      step.completed ? 'text-emerald-700' : step.active ? 'text-indigo-700' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      {step.completed ? '✓ Completed' : 'Required'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ─── Footer Action ────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <Link
              href={onboardingSteps.find(s => !s.completed)?.href || '/dashboard'}
              className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all duration-200 w-full sm:w-auto justify-center"
            >
              {getActionButtonText()}
            </Link>
            <button
              onClick={() => setShowOnboarding(false)}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors justify-center sm:justify-start"
            >
              <span>Remind me later</span>
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Stats Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <span className={`text-xs font-medium flex items-center gap-1 ${stat.up ? 'text-emerald-500' : 'text-red-500'}`}>
                {stat.up ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Two‑column layout ───────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Transaction Analytics */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Transaction Analytics</h2>
              <p className="text-sm text-gray-500">Total transaction amounts (KES)</p>
              {filteredTransactions.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">{filteredTransactions.length} transactions found</p>
              )}
            </div>
            <div className="flex items-center gap-3 mt-3 sm:mt-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
              >
                {STATUS_FILTERS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartData.length > 0 ? (
                chartType === 'Bar' ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12, fill: '#94a3b8' }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#94a3b8' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(value) => `KES ${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '12px', 
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        padding: '12px 16px'
                      }} 
                      formatter={tooltipFormatter}
                      cursor={{ fill: '#f1f5f9' }}
                    />
                    <Bar 
                      dataKey="amount" 
                      fill="#10B981" 
                      radius={[6, 6, 0, 0]} 
                      barSize={32}
                    />
                  </BarChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 12, fill: '#94a3b8' }} 
                      axisLine={false} 
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#94a3b8' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(value) => `KES ${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        borderRadius: '12px', 
                        border: '1px solid #e5e7eb',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        padding: '12px 16px'
                      }} 
                      formatter={tooltipFormatter}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#10B981" 
                      strokeWidth={3} 
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#10B981' }}
                    />
                  </LineChart>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-3">
                  <BarChart3 size={40} className="text-gray-300" />
                  <span className="text-sm">No transaction data available</span>
                </div>
              )}
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {chartTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    chartType === type 
                      ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="w-px h-6 bg-gray-200 mx-2" />
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {['7 Days', '30 Days', '90 Days'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    timeRange === range 
                      ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Quick Actions ──────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Quick Actions
          </h2>
          <div className="space-y-2.5">
            <Link
              href="/dashboard/smart-bills/create"
              className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors flex items-center justify-center flex-shrink-0">
                <Link2 size={17} className="text-blue-600 group-hover:text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                  Create Bill Link
                </p>
                <p className="text-xs text-gray-400">Generate a payment link</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
            </Link>

            <Link
              href="/dashboard/withdrawals/Withdraw-fund"
              className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-xl transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors flex items-center justify-center flex-shrink-0">
                <ArrowUpRight size={17} className="text-emerald-600 group-hover:text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                  Withdraw Funds
                </p>
                <p className="text-xs text-gray-400">Withdraw to your account</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
            </Link>

            <Link
              href="/dashboard/account/api-keys"
              className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-xl transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors flex items-center justify-center flex-shrink-0">
                <Code size={17} className="text-purple-600 group-hover:text-purple-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-purple-700 transition-colors">
                  API Integration
                </p>
                <p className="text-xs text-gray-400">Developer documentation</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-purple-400 transition-colors flex-shrink-0" />
            </Link>

            <Link
              href="/dashboard/transactions/statement"
              className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-xl transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-50 group-hover:bg-amber-100 transition-colors flex items-center justify-center flex-shrink-0">
                <FileText size={17} className="text-amber-600 group-hover:text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-amber-700 transition-colors">
                  Generate Statement
                </p>
                <p className="text-xs text-gray-400">Download transaction report</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-amber-400 transition-colors flex-shrink-0" />
            </Link>

            <Link
              href="/dashboard/utilities/airtime/retail"
              className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-300 rounded-xl transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-lg bg-rose-50 group-hover:bg-rose-100 transition-colors flex items-center justify-center flex-shrink-0">
                <Smartphone size={17} className="text-rose-600 group-hover:text-rose-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 group-hover:text-rose-700 transition-colors">
                  Buy Airtime
                </p>
                <p className="text-xs text-gray-400">Top up your phone</p>
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-rose-400 transition-colors flex-shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Recent Transactions ──────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Today's Transactions</h2>
          <Link href="/dashboard/transactions" className="text-sm text-emerald-500 font-medium hover:text-emerald-600">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left bg-gray-50">
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase">Transaction</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase">Customer</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase">Method</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => {
                  const statusInfo = getStatusDisplay(tx.status);
                  return (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-xs text-gray-500">{tx.id}</td>
                      <td className="px-6 py-3 font-medium text-gray-900">{tx.customer}</td>
                      <td className="px-6 py-3 font-semibold text-gray-900">KES {tx.amount.toLocaleString()}</td>
                      <td className="px-6 py-3 text-gray-500">{tx.method}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-400 text-xs">{tx.date}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => {
                            const fullTx = transactions.find(t => t.id.startsWith(tx.id));
                            if (fullTx) handleViewDetails(fullTx);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-400">No transactions today</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Transaction Details Modal ────────────────────────────────── */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Transaction Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Transaction ID</p>
                  <p className="font-mono text-sm">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Checkout ID</p>
                  <p className="font-mono text-sm">{selectedTransaction.checkout_id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Amount</p>
                  <p className="font-bold text-lg text-gray-900">KES {parseFloat(selectedTransaction.amount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusDisplay(selectedTransaction.status || selectedTransaction.payment_status || '').color}`}>
                    {getStatusDisplay(selectedTransaction.status || selectedTransaction.payment_status || '').icon}
                    {getStatusDisplay(selectedTransaction.status || selectedTransaction.payment_status || '').label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone Number</p>
                  <p className="text-sm">{selectedTransaction.phone_number}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Merchant ID</p>
                  <p className="text-sm">{selectedTransaction.user_id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Method</p>
                  <p className="text-sm">{selectedTransaction.source || 'M-PESA'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Request Type</p>
                  <p className="text-sm">{selectedTransaction.request_type}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Created At</p>
                  <p className="text-sm">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                </div>
                {selectedTransaction.mpesa_receipt && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">M-PESA Receipt</p>
                    <p className="text-sm font-mono">{selectedTransaction.mpesa_receipt}</p>
                  </div>
                )}
                {selectedTransaction.result_code && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Result Code</p>
                    <p className="text-sm">{selectedTransaction.result_code} - {selectedTransaction.result_desc}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}