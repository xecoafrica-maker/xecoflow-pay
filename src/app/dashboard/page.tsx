// src/app/dashboard/page.tsx
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
  ArrowUpLeft,
  Headphones,
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
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Types ──────────────────────────────────────────────────────────
interface Transaction {
  id: string;
  user_id?: string;
  amount: string;
  phone_number: string | null;
  business_shortcode?: string | null;
  status: string;
  payment_status: string;
  source: string;
  request_type: string;
  checkout_id?: string | null;
  mpesa_receipt: string | null;
  result_code?: string | null;
  result_desc?: string | null;
  created_at: string;
  completed_at?: string | null;
  updated_at?: string;
  channel?: 'STK_PUSH' | 'C2B';
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

interface OnboardingStep {
  id: number;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  completed: boolean;
  active: boolean;
}

const STATUS_FILTERS = ['All', 'Completed', 'Pending', 'Failed', 'AWAITING_CUSTOMER_PIN'];
const chartTypes = ['Bar', 'Line'];

const COMPLETED_KEYWORDS = ['COMPLETED', 'SUCCESS', 'SETTLED', 'PAID'];
const FAILED_KEYWORDS = ['FAILED', 'ERROR', 'DECLINED', 'CANCELLED', 'CANCELED', 'REVERSED'];
const PENDING_KEYWORDS = ['PENDING', 'AWAITING', 'PROCESSING', 'INITIATED'];

const deriveStatus = (tx: Transaction): 'Completed' | 'Pending' | 'Failed' => {
  const combined = `${tx.status || ''} ${tx.payment_status || ''}`.toUpperCase();
  if (FAILED_KEYWORDS.some((k) => combined.includes(k))) return 'Failed';
  if (COMPLETED_KEYWORDS.some((k) => combined.includes(k))) return 'Completed';
  if (PENDING_KEYWORDS.some((k) => combined.includes(k))) return 'Pending';
  if (tx.mpesa_receipt) return 'Completed';
  return 'Pending';
};

const isCompleted = (tx: Transaction) => deriveStatus(tx) === 'Completed';

// ─── Skeleton Components ──────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
    <div className="w-8 h-8 rounded-lg bg-gray-200 mb-3" />
    <div className="h-7 w-24 bg-gray-200 rounded mb-2" />
    <div className="h-3 w-28 bg-gray-100 rounded mb-2" />
    <div className="h-3 w-20 bg-gray-100 rounded" />
  </div>
);

const SkeletonTransactionRow = () => (
  <tr className="border-b border-gray-50">
    <td className="px-5 py-2.5"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
    <td className="px-5 py-2.5"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
    <td className="px-5 py-2.5"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse" /></td>
    <td className="px-5 py-2.5"><div className="h-4 w-16 bg-gray-200 rounded animate-pulse" /></td>
    <td className="px-5 py-2.5"><div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse" /></td>
    <td className="px-5 py-2.5"><div className="h-4 w-24 bg-gray-200 rounded animate-pulse" /></td>
    <td className="px-5 py-2.5"><div className="h-4 w-4 bg-gray-200 rounded animate-pulse" /></td>
  </tr>
);

export default function DashboardOverview() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();
  const [merchantName, setMerchantName] = useState<string>('Merchant');
  const [merchantId, setMerchantId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const hasLoggedView = useRef(false);
  const isLoggingView = useRef(false);

  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ledgerBalance, setLedgerBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState<boolean>(true);

  const [statusFilter, setStatusFilter] = useState('All');
  const [chartType, setChartType] = useState('Bar');
  const [timeRange, setTimeRange] = useState('7D');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const tooltipFormatter = (value: any) => [`KES ${value}`, 'Amount'];

  const fetchOnboarding = async () => {
    try {
      const res = await fetch(`/api/onboarding/status`, { credentials: 'include' });
      const data = await res.json();

      if (data) {
        const stepMappings = [
          { id: 1, label: '01 — Business Profile', href: '/dashboard/onboarding/stage1', completed: data.steps.businessProfile === 'COMPLETED' },
          { id: 2, label: '02 — Owners & Documents', href: '/dashboard/onboarding/stage2', completed: data.steps.ownersDocuments === 'COMPLETED' },
          { id: 3, label: '03 — Tax & Compliance', href: '/dashboard/onboarding/stage3', completed: data.steps.taxCompliance === 'COMPLETED' },
          { id: 4, label: '04 — Settlement', href: '/dashboard/onboarding/stage4', completed: data.steps.settlement === 'COMPLETED' },
          { id: 5, label: '05 — Review & Submit', href: '/dashboard/onboarding/stage5', completed: data.overallStatus === 'SUBMITTED' },
        ];

        const activeStepId = data.currentStep;
        const mappedSteps = stepMappings.map((step) => ({
          ...step,
          icon: step.label.includes('Business Profile') ? Building :
                step.label.includes('Owners') ? Users :
                step.label.includes('Tax') ? FileText :
                step.label.includes('Settlement') ? Landmark : CheckCircle,
          active: step.id === activeStepId,
        }));

        setOnboardingSteps(mappedSteps);
      }
    } catch (error) {
      console.error('Failed to fetch onboarding:', error);
    }
  };

  const fetchDashboardData = async (merchantIdParam?: string) => {
    try {
      const params = new URLSearchParams();
      if (merchantIdParam) params.append('merchantId', merchantIdParam);
      params.append('limit', '500');

      const transRes = await fetch(`/api/transactions/inflow?${params.toString()}`, { credentials: 'include' });
      const transData = await transRes.json();

      if (transData.success) {
        setTransactions(transData.data || []);
        setFilteredTransactions(transData.data || []);
      }

      const statsRes = await fetch(`/api/dashboard/stats?${params.toString()}`, { credentials: 'include' });
      const statsData = await statsRes.json();

      if (statsData.success) setStats(statsData.stats);

      if (merchantIdParam) {
        const paddedId = String(merchantIdParam).padStart(8, '0');
        const accountNumber = `1-1001-${paddedId}`;

        const balanceRes = await fetch(`/api/ledger/accounts/${accountNumber}/balance`, { credentials: 'include' });
        const balanceData = await balanceRes.json();

        if (balanceData.success) setLedgerBalance(balanceData.balance);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setBalanceLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...transactions];

    if (statusFilter !== 'All') {
      filtered = filtered.filter((t) => {
        const combined = `${t.status || ''} ${t.payment_status || ''}`.toUpperCase();
        if (statusFilter === 'Completed') return COMPLETED_KEYWORDS.some((k) => combined.includes(k));
        if (statusFilter === 'Pending') return PENDING_KEYWORDS.some((k) => combined.includes(k));
        if (statusFilter === 'Failed') return FAILED_KEYWORDS.some((k) => combined.includes(k));
        if (statusFilter === 'AWAITING_CUSTOMER_PIN') return combined.includes('AWAITING_CUSTOMER_PIN');
        return true;
      });
    }

    setFilteredTransactions(filtered);
  }, [transactions, statusFilter]);

  useEffect(() => {
    let merchant = null;
    let merchantIdValue = null;
    let merchantNameValue = 'Merchant';

    try {
      const stored = localStorage.getItem('merchant');
      if (stored) {
        merchant = JSON.parse(stored);
        merchantIdValue = merchant.merchantId || merchant.merchant_id;
        merchantNameValue = merchant.businessName || merchant.business_name || 'Merchant';
      }
    } catch (e) {
      console.error('Failed to parse merchant data', e);
    }

    if (!merchant || !merchantIdValue) {
      router.push('/login?session=expired');
      return;
    }

    setMerchantId(String(merchantIdValue));
    setMerchantName(merchantNameValue);

    const fetchData = async () => {
      try {
        await fetchDashboardData(String(merchantIdValue));
        await fetchOnboarding();
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    const logView = async () => {
      if (isLoggingView.current || hasLoggedView.current || !merchantId) return;

      try {
        isLoggingView.current = true;
        await log(ActivityActions.VIEW_DASHBOARD, `Viewed dashboard for ${merchantName}`);
        hasLoggedView.current = true;
      } catch (error) {
        // silent
      } finally {
        isLoggingView.current = false;
      }
    };

    if (!loading && merchantId && !hasLoggedView.current) logView();
  }, [loading, merchantId, merchantName, log]);

  const generateStats = () => {
    if (!stats && transactions.length === 0) {
      return [
        { label: 'Available Balance', value: 'KES 0', trend: 'Ready to withdraw', trendUp: true, icon: Wallet, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
        { label: 'Total Processed', value: 'KES 0', trend: 'This month', trendUp: true, icon: TrendingUp, iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
        { label: 'Transactions', value: '0', trend: 'This month', trendUp: true, icon: BarChart3, iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
        { label: 'Total Withdrawn', value: 'KES 0', trend: 'All time', trendUp: true, icon: ArrowUpLeft, iconBg: 'bg-purple-50', iconColor: 'text-purple-500' },
      ];
    }

    const completedAmount = transactions.filter(isCompleted).reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
    const totalTransactions = transactions.length;

    const todayTransactions = transactions.filter((t) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(t.created_at) >= today;
    }).length;

    const availableBalance = ledgerBalance;
    const totalWithdrawn = 0;

    return [
      { label: 'Available Balance', value: `KES ${availableBalance.toLocaleString()}`, trend: 'Ready to withdraw', trendUp: true, icon: Wallet, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
      { label: 'Total Processed', value: `KES ${completedAmount.toLocaleString()}`, trend: 'This month', trendUp: true, icon: TrendingUp, iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
      { label: 'Transactions', value: totalTransactions.toString(), trend: `${todayTransactions} today`, trendUp: true, icon: BarChart3, iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
      { label: 'Total Withdrawn', value: `KES ${totalWithdrawn.toLocaleString()}`, trend: 'All time', trendUp: true, icon: ArrowUpLeft, iconBg: 'bg-purple-50', iconColor: 'text-purple-500' },
    ];
  };

  const statsData = generateStats();

  const chartData = [...filteredTransactions]
    .filter(isCompleted)
    .slice(0, 7)
    .map((t) => ({
      day: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: parseFloat(t.amount || '0'),
    }))
    .reverse();

  const getTodayTransactions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTxs = transactions.filter((t) => {
      const txDate = new Date(t.created_at);
      txDate.setHours(0, 0, 0, 0);
      return txDate.getTime() === today.getTime();
    });

    return todayTxs
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)
      .map((t) => ({
        id: t.id.slice(0, 8),
        fullId: t.id,
        customer: t.phone_number || (t.channel === 'C2B' ? 'M-PESA Paybill' : 'Unknown'),
        amount: parseFloat(t.amount || '0'),
        method: t.channel === 'C2B' ? 'M-PESA Paybill' : 'M-PESA STK Push',
        channel: t.channel,
        status: deriveStatus(t),
        checkoutId: t.checkout_id,
        date: new Date(t.created_at).toLocaleString(),
        receipt: t.mpesa_receipt,
      }));
  };

  const recentTransactions = getTodayTransactions();

  const getStatusDisplay = (status: string) => {
    const s = status?.toUpperCase() || '';
    if (s.includes('COMPLETED') || s.includes('SUCCESS') || s.includes('SETTLED')) {
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

  const AmountWithStatus = ({ amount, status }: { amount: number; status: string }) => {
    const s = status?.toUpperCase() || '';
    const isSuccess = s.includes('COMPLETED') || s.includes('SUCCESS') || s.includes('SETTLED');
    const isFailed = s.includes('FAILED') || s.includes('ERROR') || s.includes('DECLINED');
    const isPending = !isSuccess && !isFailed;

    return (
      <div className="flex items-center gap-1.5">
        <span className={`font-semibold ${isSuccess ? 'text-gray-900' : isFailed ? 'text-gray-400 line-through' : 'text-amber-700'}`}>
          KES {amount.toLocaleString()}
        </span>
        {isSuccess && <CheckCircle size={12} className="text-emerald-500 shrink-0" />}
        {isFailed && <XCircle size={12} className="text-red-400 shrink-0" />}
        {isPending && <Clock size={12} className="text-amber-400 shrink-0" />}
      </div>
    );
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailsModal(true);
  };

  const completedSteps = onboardingSteps.filter((s) => s.completed).length;
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
      <div className="max-w-[1400px] mx-auto space-y-4">
        <div>
          <div className="h-3 w-28 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-7 w-64 bg-gray-200 rounded animate-pulse mb-1.5" />
          <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-48 w-full bg-gray-100 rounded-lg animate-pulse" />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mb-3" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-lg animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-3.5 w-28 bg-gray-200 rounded mb-1" />
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <h1 className="text-[24px] font-bold text-gray-900 mt-0.5 tracking-tight">
            {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'}, {merchantName}
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Here's what's happening with your business today.</p>
        </div>

        <Link
          href="/dashboard/support"
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-[13px] font-medium transition-colors shadow-sm shrink-0"
        >
          <Headphones className="w-3.5 h-3.5 text-gray-500" />
          Support
        </Link>
      </div>

      {/* ─── Onboarding ─────────────────────────────────────────────── */}
      {!showOnboarding && !isFullyOnboarded && onboardingSteps.length > 0 && (
        <div
          className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group"
          onClick={() => setShowOnboarding(true)}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle size={14} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-gray-800">Setup incomplete · {totalSteps - completedSteps} steps remaining</p>
            </div>
          </div>
          <span className="text-[12px] font-medium text-indigo-600 group-hover:text-indigo-700 flex items-center gap-1">
            Resume setup <ChevronRight size={12} />
          </span>
        </div>
      )}

      {showOnboarding && !isFullyOnboarded && onboardingSteps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5 mb-3">
            <div>
              <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                Activate your XecoFlow Business
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Complete the steps below to start accepting payments securely.</p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                {completedSteps} / {totalSteps}
              </span>
              <span className="text-[13px] font-medium text-gray-800">Completed</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mb-3">
            {onboardingSteps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border ${
                    step.completed ? 'bg-emerald-50 border-emerald-200'
                    : step.active ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                    : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    step.completed ? 'bg-emerald-500 text-white'
                    : step.active ? 'bg-indigo-600 text-white'
                    : 'bg-gray-300 text-gray-500'
                  }`}>
                    {step.completed ? <CheckCircle size={12} /> : <span className="text-[10px] font-bold">{step.id}</span>}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[11px] font-semibold truncate ${
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

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-gray-100">
            <Link
              href={onboardingSteps.find((s) => !s.completed)?.href || '/dashboard'}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[13px] font-medium transition-all duration-200 w-full sm:w-auto justify-center"
            >
              {getActionButtonText()}
            </Link>
            <button
              onClick={() => setShowOnboarding(false)}
              className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 transition-colors justify-center sm:justify-start"
            >
              <span>Remind me later</span>
              <ChevronRight size={11} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {statsData.map((stat) => (
          <div
            key={stat.label}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all"
          >
            <div className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center mb-3`}>
              <stat.icon size={16} className={stat.iconColor} />
            </div>

            <p className="text-[24px] font-bold text-gray-900 tracking-tight leading-none mb-1.5">
              {stat.value}
            </p>

            <p className="text-[12px] text-gray-500 mb-1.5">{stat.label}</p>

            <div className="flex items-center gap-1 text-[11px]">
              {stat.trendUp ? (
                <ArrowUp size={11} className="text-emerald-500 shrink-0" />
              ) : (
                <ArrowDown size={11} className="text-red-500 shrink-0" />
              )}
              <span className={stat.trendUp ? 'text-emerald-600' : 'text-red-600'}>
                {stat.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Two-column layout ─────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* ─── Analytics Card ─── */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* ─── Single-row header with title + controls ─── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 px-5 py-3.5 border-b border-gray-100">
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-gray-900 leading-tight">Transaction Analytics</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {filteredTransactions.filter(isCompleted).length > 0
                  ? `${filteredTransactions.filter(isCompleted).length} completed transactions`
                  : 'Completed transaction amounts'}
              </p>
            </div>

            {/* Controls — all inline */}
            <div className="flex flex-wrap items-center gap-1.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-[11px] font-medium outline-none hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {STATUS_FILTERS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              <div className="flex gap-0.5 bg-gray-50 border border-gray-200 rounded-md p-0.5">
                {chartTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                      chartType === type
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex gap-0.5 bg-gray-50 border border-gray-200 rounded-md p-0.5">
                {['7D', '30D', '90D'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                      timeRange === range
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── Chart area — tight, no extra vertical padding ─── */}
          <div className="px-5 pt-2 pb-1">
            {chartData.length > 0 ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'Bar' ? (
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8', dy: 2 }} axisLine={false} tickLine={false} tickFormatter={(value) => `KES ${value.toLocaleString()}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '10px 14px', fontSize: 12 }}
                        formatter={tooltipFormatter}
                        cursor={{ fill: '#f1f5f9' }}
                      />
                      <Bar dataKey="amount" fill="#10B981" radius={[5, 5, 0, 0]} barSize={26} />
                    </BarChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: -10 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8', dy: 2 }} axisLine={false} tickLine={false} tickFormatter={(value) => `KES ${value.toLocaleString()}`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '10px 14px', fontSize: 12 }}
                        formatter={tooltipFormatter}
                      />
                      <Line type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', strokeWidth: 2, r: 3.5 }} activeDot={{ r: 5, fill: '#10B981' }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-gray-400 gap-2">
                <BarChart3 size={24} className="text-gray-300" />
                <span className="text-[13px]">No completed transactions to chart</span>
              </div>
            )}
          </div>
        </div>

        {/* ─── Quick Actions ──────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/dashboard/smart-bills/create"
              className="flex items-center gap-3 px-3.5 py-2.5 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors flex items-center justify-center flex-shrink-0">
                <Link2 size={15} className="text-blue-600 group-hover:text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-900 group-hover:text-blue-700 transition-colors">Create Bill Link</p>
                <p className="text-[11px] text-gray-400">Generate a payment link</p>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
            </Link>

            <Link
              href="/dashboard/withdrawals/Withdraw-fund"
              className="flex items-center gap-3 px-3.5 py-2.5 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 group-hover:bg-emerald-100 transition-colors flex items-center justify-center flex-shrink-0">
                <ArrowUpRight size={15} className="text-emerald-600 group-hover:text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">Withdraw Funds</p>
                <p className="text-[11px] text-gray-400">Withdraw to your account</p>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
            </Link>

            <Link
              href="/dashboard/account/api-keys"
              className="flex items-center gap-3 px-3.5 py-2.5 bg-white hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors flex items-center justify-center flex-shrink-0">
                <Code size={15} className="text-purple-600 group-hover:text-purple-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-900 group-hover:text-purple-700 transition-colors">API Integration</p>
                <p className="text-[11px] text-gray-400">Developer documentation</p>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-purple-400 transition-colors flex-shrink-0" />
            </Link>

            <Link
              href="/dashboard/transactions/statement"
              className="flex items-center gap-3 px-3.5 py-2.5 bg-white hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-lg transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-50 group-hover:bg-amber-100 transition-colors flex items-center justify-center flex-shrink-0">
                <FileText size={15} className="text-amber-600 group-hover:text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-900 group-hover:text-amber-700 transition-colors">Generate Statement</p>
                <p className="text-[11px] text-gray-400">Download transaction report</p>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-amber-400 transition-colors flex-shrink-0" />
            </Link>

            <Link
              href="/dashboard/utilities/airtime/retail"
              className="flex items-center gap-3 px-3.5 py-2.5 bg-white hover:bg-rose-50 border border-gray-200 hover:border-rose-300 rounded-lg transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-rose-50 group-hover:bg-rose-100 transition-colors flex items-center justify-center flex-shrink-0">
                <Smartphone size={15} className="text-rose-600 group-hover:text-rose-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-gray-900 group-hover:text-rose-700 transition-colors">Buy Airtime</p>
                <p className="text-[11px] text-gray-400">Top up your phone</p>
              </div>
              <ChevronRight size={14} className="text-gray-300 group-hover:text-rose-400 transition-colors flex-shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Recent Transactions ────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-gray-900">Today's Transactions</h2>
          <Link href="/dashboard/inflow" className="text-[12px] text-emerald-500 font-medium hover:text-emerald-600">
            View All →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left bg-gray-50">
                <th className="px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Transaction</th>
                <th className="px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Customer</th>
                <th className="px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Method</th>
                <th className="px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-5 py-2.5 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => {
                  const statusInfo = getStatusDisplay(tx.status);
                  return (
                    <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-5 py-2.5 font-mono text-[11px] text-gray-500">{tx.id}</td>
                      <td className="px-5 py-2.5 text-[13px] font-medium text-gray-900">{tx.customer}</td>
                      <td className="px-5 py-2.5"><AmountWithStatus amount={tx.amount} status={tx.status} /></td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          tx.channel === 'C2B' ? 'bg-teal-50 text-teal-600 border-teal-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                        }`}>
                          {tx.channel === 'C2B' ? 'M-PESA Paybill' : 'M-PESA STK Push'}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-gray-400 text-[11px]">{tx.date}</td>
                      <td className="px-5 py-2.5">
                        <button
                          onClick={() => {
                            const fullTx = transactions.find((t) => t.id === tx.fullId);
                            if (fullTx) handleViewDetails(fullTx);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-center text-gray-400 text-[13px]">No transactions today</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Transaction Details Modal ──────────────────────────────── */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-[18px] font-bold text-gray-900">Transaction Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Transaction ID</p>
                  <p className="font-mono text-[13px] mt-0.5">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Checkout ID</p>
                  <p className="font-mono text-[13px] mt-0.5">{selectedTransaction.checkout_id || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Amount</p>
                  <p className="font-bold text-[18px] text-gray-900 mt-0.5">KES {parseFloat(selectedTransaction.amount || '0').toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Status</p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusDisplay(deriveStatus(selectedTransaction)).color}`}>
                      {getStatusDisplay(deriveStatus(selectedTransaction)).icon}
                      {getStatusDisplay(deriveStatus(selectedTransaction)).label}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Phone Number</p>
                  <p className="text-[13px] mt-0.5">{selectedTransaction.phone_number || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Merchant ID</p>
                  <p className="text-[13px] mt-0.5">{selectedTransaction.user_id || merchantId}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Method</p>
                  <p className="text-[13px] mt-0.5">{selectedTransaction.source || 'M-PESA'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Channel</p>
                  <p className="text-[13px] mt-0.5">{selectedTransaction.channel === 'C2B' ? 'M-PESA Paybill' : 'M-PESA STK Push'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Request Type</p>
                  <p className="text-[13px] mt-0.5">{selectedTransaction.request_type}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider">Created At</p>
                  <p className="text-[13px] mt-0.5">{new Date(selectedTransaction.created_at).toLocaleString()}</p>
                </div>
                {selectedTransaction.mpesa_receipt && (
                  <div className="col-span-2">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">M-PESA Receipt</p>
                    <p className="text-[13px] font-mono mt-0.5">{selectedTransaction.mpesa_receipt}</p>
                  </div>
                )}
                {selectedTransaction.result_code && (
                  <div className="col-span-2">
                    <p className="text-[11px] text-gray-400 uppercase tracking-wider">Result</p>
                    <p className="text-[13px] mt-0.5">{selectedTransaction.result_code} - {selectedTransaction.result_desc}</p>
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