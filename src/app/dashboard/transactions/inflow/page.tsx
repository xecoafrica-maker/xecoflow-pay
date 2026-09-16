// src/app/dashboard/transactions/inflow/page.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Download,
  Filter,
  RefreshCw,
  X,
  Copy,
  Printer,
  Mail,
  Hash,
  CreditCard,
  Phone,
  TrendingUp,
  Wallet,
  Smartphone,
  Coins,
  ArrowDownRight,
  Loader2,
  FileSpreadsheet,
  FileText,
  Calendar,
} from 'lucide-react';
import { getStoredMerchant } from '@/lib/auth';
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

interface InflowTransaction {
  id: string;
  receipt: string | null;
  customer: string;
  phone: string;
  maskedPhone: string;
  email: string;
  amount: number;
  method: string;
  channel: string;
  category: string;
  status: string;
  ref: string;
  description: string;
  date: string;
  settlementDate: string;
}

type DatePreset =
  | 'Today'
  | 'Yesterday'
  | 'Last 7 days'
  | 'Last 30 days'
  | 'This month'
  | 'Last month'
  | 'Custom';

interface DateRange {
  from: Date | null;
  to: Date | null;
  preset: DatePreset;
}

// ─── Colors ──────────────────────────────────────────────────────────
const statusColors = {
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Failed: 'bg-red-50 text-red-700 border-red-200',
};

const statusIcons = {
  Completed: CheckCircle,
  Pending: Clock,
  Failed: XCircle,
};

const statusBadgeColors = {
  Completed: 'bg-emerald-500',
  Pending: 'bg-amber-500',
  Failed: 'bg-red-500',
};

const categoryIcons: Record<string, any> = {
  'Payment': Wallet,
  'Utility Payment': Smartphone,
  'Commission': Coins,
  'M-PESA': Smartphone,
  'Card': CreditCard,
  'Bank Transfer': Wallet,
};

const categoryColors: Record<string, string> = {
  'Payment': 'bg-blue-50 text-blue-600 border-blue-200',
  'Utility Payment': 'bg-emerald-50 text-emerald-600 border-emerald-200',
  'Commission': 'bg-purple-50 text-purple-600 border-purple-200',
  'M-PESA': 'bg-green-50 text-green-600 border-green-200',
  'Card': 'bg-indigo-50 text-indigo-600 border-indigo-200',
  'Bank Transfer': 'bg-amber-50 text-amber-600 border-amber-200',
};

// ─── Helpers ─────────────────────────────────────────────────────────
const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const getPresetRange = (preset: DatePreset): { from: Date; to: Date } => {
  const now = new Date();
  const today = startOfDay(now);
  const endToday = endOfDay(now);

  switch (preset) {
    case 'Today':
      return { from: today, to: endToday };
    case 'Yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'Last 7 days': {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to: endToday };
    }
    case 'Last 30 days': {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from: startOfDay(from), to: endToday };
    }
    case 'This month': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: startOfDay(from), to: endOfDay(to) };
    }
    case 'Last month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: startOfDay(from), to: endOfDay(to) };
    }
    default: {
      // Fallback: this month
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: startOfDay(from), to: endOfDay(to) };
    }
  }
};

const formatRangeCaption = (range: DateRange) => {
  if (!range.from || !range.to) return '—';
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const fromStr = range.from.toLocaleDateString('en-US', opts);
  const toStr = range.to.toLocaleDateString('en-US', opts);
  return `${fromStr} – ${toStr}`;
};

const toInputDate = (d: Date | null) => {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Mask phone: keep country code + last 3, mask the middle
// 254712071385  →  254712***385
// 0712071385    →  0712***385
const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) return '—';
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.length < 6) return cleaned;
  const head = cleaned.slice(0, 6);
  const tail = cleaned.slice(-3);
  return `${head}***${tail}`;
};

// ─── Summary Card ────────────────────────────────────────────────────
const SummaryCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

export default function InflowPage() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<InflowTransaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [merchantId, setMerchantId] = useState<string>('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Date range state
  const initialRange = getPresetRange('This month');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: initialRange.from,
    to: initialRange.to,
    preset: 'This month',
  });
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const dateMenuRef = useRef<HTMLDivElement>(null);

  const hasLoggedView = useRef(false);
  const isLoggingView = useRef(false);

  // ─── Fetch Real Transactions ──────────────────────────────────────
  const fetchTransactions = async () => {
    try {
      setLoading(true);

      const cached = getStoredMerchant();
      let id = merchantId;

      if (!id && cached) {
        id = String(cached.merchant_id || cached.merchantId);
        setMerchantId(id);
      }

      if (!id) {
        console.warn('No merchant ID available');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.append('merchantId', id);
      params.append('limit', '100');

      const response = await fetch(`/api/transactions?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.success) {
        setTransactions(data.data || []);
        setLastFetched(new Date());
      } else {
        console.error('Failed to fetch transactions:', data.message);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // ─── Log View ──────────────────────────────────────────────────────
  useEffect(() => {
    const logView = async () => {
      if (isLoggingView.current || hasLoggedView.current || transactions.length === 0) {
        return;
      }

      try {
        isLoggingView.current = true;

        const cached = getStoredMerchant();
        const id = merchantId || cached?.merchant_id || cached?.merchantId;

        if (id) {
          await log(
            ActivityActions.VIEW_INFLOW,
            `Viewed ${transactions.length} inflow transactions`
          );
          hasLoggedView.current = true;
        }
      } catch (error) {
        console.debug('Inflow view logging skipped:', error);
      } finally {
        isLoggingView.current = false;
      }
    };

    if (!loading && transactions.length > 0 && !hasLoggedView.current) {
      logView();
    }
  }, [loading, transactions.length, merchantId, log]);

  // ─── Transform Transactions ─────────────────────────────────────
  const transformToInflow = (tx: Transaction): InflowTransaction => {
    let category = 'Payment';
    const source = tx.source?.toLowerCase() || '';
    const requestType = tx.request_type?.toLowerCase() || '';

    if (requestType.includes('utility') || requestType.includes('kplc') || requestType.includes('airtime')) {
      category = 'Utility Payment';
    } else if (requestType.includes('commission') || requestType.includes('fee')) {
      category = 'Commission';
    } else if (source.includes('mpesa')) {
      category = 'M-PESA';
    } else if (source.includes('card')) {
      category = 'Card';
    } else if (source.includes('bank')) {
      category = 'Bank Transfer';
    }

    let status = 'Pending';
    const txStatus = tx.status?.toUpperCase() || tx.payment_status?.toUpperCase() || '';
    if (txStatus.includes('COMPLETED') || txStatus.includes('SUCCESS')) {
      status = 'Completed';
    } else if (txStatus.includes('FAILED') || txStatus.includes('ERROR') || txStatus.includes('DECLINED')) {
      status = 'Failed';
    } else if (txStatus.includes('PENDING') || txStatus.includes('AWAITING')) {
      status = 'Pending';
    }

    const amountValue = parseFloat(tx.amount) || 0;

    return {
      id: tx.id,
      receipt: tx.mpesa_receipt || null,
      customer: tx.phone_number || 'Unknown Customer',
      phone: tx.phone_number || 'N/A',
      maskedPhone: maskPhone(tx.phone_number),
      email: `${tx.phone_number || 'user'}@example.com`,
      amount: amountValue,
      method: tx.source || 'M-PESA',
      channel: tx.request_type || 'Payment',
      category: category,
      status: status,
      ref: tx.checkout_id || tx.id.slice(0, 12),
      description: `${tx.request_type || 'Payment'} - ${tx.phone_number || ''}`,
      date: tx.created_at,
      settlementDate: tx.completed_at || tx.created_at,
    };
  };

  const getInflowData = (): InflowTransaction[] => {
    return transactions.map(transformToInflow);
  };

  // ─── Filter Chain: date → category → search ───────────────────────
  const filteredData = useMemo(() => {
    const data = getInflowData();

    // 1. Date filter
    const dateFiltered = data.filter((item) => {
      if (!dateRange.from || !dateRange.to) return true;
      const d = new Date(item.date).getTime();
      return d >= dateRange.from.getTime() && d <= dateRange.to.getTime();
    });

    // 2. Category filter
    const categoryFiltered = dateFiltered.filter(
      (item) => filterCategory === 'All' || item.category === filterCategory
    );

    // 3. Search filter (now includes receipt and amount)
    const term = searchTerm.toLowerCase();
    const searched = !term
      ? categoryFiltered
      : categoryFiltered.filter(
          (item) =>
            item.receipt?.toLowerCase().includes(term) ||
            item.customer?.toLowerCase().includes(term) ||
            item.phone?.toLowerCase().includes(term) ||
            item.id?.toLowerCase().includes(term) ||
            item.ref?.toLowerCase().includes(term) ||
            item.method?.toLowerCase().includes(term) ||
            item.status?.toLowerCase().includes(term) ||
            item.category?.toLowerCase().includes(term) ||
            item.amount.toString().includes(term)
        );

    // 4. Sort newest first
    return [...searched].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, dateRange, filterCategory, searchTerm]);

  const totalInflow = filteredData.reduce((sum, t) => sum + t.amount, 0);
  const completedCount = filteredData.filter((t) => t.status === 'Completed').length;
  const pendingCount = filteredData.filter((t) => t.status === 'Pending').length;
  const failedCount = filteredData.filter((t) => t.status === 'Failed').length;

  // ─── Date Range Handlers ──────────────────────────────────────────
  const applyPreset = (preset: DatePreset) => {
    if (preset === 'Custom') {
      setCustomFrom(toInputDate(dateRange.from));
      setCustomTo(toInputDate(dateRange.to));
      setCustomRangeOpen(true);
      return;
    }
    const { from, to } = getPresetRange(preset);
    setDateRange({ from, to, preset });
    setCustomRangeOpen(false);
  };

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return;
    const from = startOfDay(new Date(customFrom));
    const to = endOfDay(new Date(customTo));
    if (from > to) {
      alert('Start date must be before end date');
      return;
    }
    setDateRange({ from, to, preset: 'Custom' });
    setCustomRangeOpen(false);
  };

  // Close date menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) {
        setCustomRangeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Export ──────────────────────────────────────────────────────
  const exportToCSV = (data: InflowTransaction[]) => {
    const headers = [
      'M-PESA Receipt',
      'Date',
      'Time',
      'Phone (Masked)',
      'Amount (KES)',
      'Method',
      'Channel',
      'Category',
      'Status',
      'Reference',
      'Description',
    ];

    const rows = data.map((tx) => [
      tx.receipt || '—',
      formatDate(tx.date),
      formatTime(tx.date),
      tx.maskedPhone,
      tx.amount.toFixed(2),
      tx.method,
      tx.channel,
      tx.category,
      tx.status,
      tx.ref,
      tx.description,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csvContent;
  };

  const handleExport = (format: 'csv' | 'excel') => {
    if (filteredData.length === 0) {
      alert('No transactions to export');
      return;
    }

    setIsExporting(true);
    setShowExportMenu(false);

    try {
      const csvData = exportToCSV(filteredData);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      const from = dateRange.from ? toInputDate(dateRange.from) : 'all';
      const to = dateRange.to ? toInputDate(dateRange.to) : 'all';
      const filename = `inflow_${from}_to_${to}.${format === 'csv' ? 'csv' : 'xlsx'}`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      log(
        'Exported transactions',
        `Exported ${filteredData.length} inflow transactions as ${format.toUpperCase()}`
      );
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    hasLoggedView.current = false;
    await fetchTransactions();
  };

  const handleViewDetails = async (tx: InflowTransaction) => {
    setSelectedTransaction(tx);
    setShowModal(true);
    await log(
      'Viewed transaction details',
      `Viewed details for transaction ${tx.receipt || tx.id} - Amount: KES ${tx.amount}`
    );
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    if (name.startsWith('0') || name.startsWith('+') || name.startsWith('254')) {
      return name.slice(0, 2);
    }
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const StatusIcon = statusIcons[status as keyof typeof statusIcons] || Clock;
    const colorKey = status as keyof typeof statusColors;
    const color = statusColors[colorKey] || 'bg-gray-50 text-gray-700 border-gray-200';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color} whitespace-nowrap`}>
        <StatusIcon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const CategoryBadge = ({ category }: { category: string }) => {
    const Icon = categoryIcons[category] || Wallet;
    const color = categoryColors[category as keyof typeof categoryColors] || 'bg-gray-50 text-gray-600 border-gray-200';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color} whitespace-nowrap`}>
        <Icon className="w-3 h-3" />
        {category}
      </span>
    );
  };

  // ─── Auth ─────────────────────────────────────────────────────────
  useEffect(() => {
    let merchant = null;
    let id = '';

    try {
      const stored = localStorage.getItem('merchant');
      if (stored) {
        merchant = JSON.parse(stored);
        id = String(merchant.merchant_id || merchant.merchantId || '');
      }
    } catch (e) {
      console.error('Failed to parse merchant data', e);
    }

    if (!merchant || !id) {
      console.warn('⚠️ No merchant found in localStorage, redirecting to login');
      router.push('/login?session=expired');
      return;
    }

    setMerchantId(id);
    fetchTransactions();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading transactions...</p>
        </div>
      </div>
    );
  }

  const datePresets: DatePreset[] = [
    'Today',
    'Yesterday',
    'Last 7 days',
    'Last 30 days',
    'This month',
    'Last month',
    'Custom',
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 px-4 sm:px-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm shadow-emerald-200">
              <ArrowDownRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inflow Transactions</h1>
              <p className="text-sm text-gray-500">All incoming payments received by your business</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm shadow-emerald-200 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Exporting...' : 'Export'}
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100"
                >
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Export as CSV</span>
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Export as Excel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Summary Cards (Sticky) ─────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm -mx-4 px-4 py-3 -mt-1 border-b border-gray-200/50">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Inflow"
            value={`KES ${totalInflow.toLocaleString()}`}
            icon={TrendingUp}
            color="bg-emerald-50 text-emerald-500"
          />
          <SummaryCard
            title="Successful"
            value={completedCount}
            icon={CheckCircle}
            color="bg-green-50 text-green-500"
          />
          <SummaryCard
            title="Pending"
            value={pendingCount}
            icon={Clock}
            color="bg-amber-50 text-amber-500"
          />
          <SummaryCard
            title="Failed"
            value={failedCount}
            icon={XCircle}
            color="bg-red-50 text-red-500"
          />
        </div>
      </div>

      {/* ─── Filters & Search (Sticky) ──────────────────────────────── */}
      <div className="sticky top-[88px] z-10 bg-gray-50/95 backdrop-blur-sm -mx-4 px-4 py-3 -mt-1 border-b border-gray-200/50">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by M-PESA receipt, phone, amount…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap items-center">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none pr-10 shadow-sm"
            >
              <option value="All">All Categories</option>
              <option value="Payment">Payment</option>
              <option value="Utility Payment">Utility Payment</option>
              <option value="Commission">Commission</option>
              <option value="M-PESA">M-PESA</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>

            {/* Date preset dropdown + range caption */}
            <div className="relative" ref={dateMenuRef}>
              <button
                onClick={() => setCustomRangeOpen((v) => !v)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <Calendar className="w-4 h-4" />
                {dateRange.preset}
              </button>

              {customRangeOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  <div className="py-1">
                    {datePresets.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => applyPreset(preset)}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          dateRange.preset === preset
                            ? 'bg-emerald-50 text-emerald-700 font-medium'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {dateRange.preset === 'Custom' && (
                    <div className="border-t border-gray-100 p-3 space-y-2">
                      <label className="block">
                        <span className="text-xs text-gray-500">From</span>
                        <input
                          type="date"
                          value={customFrom}
                          onChange={(e) => setCustomFrom(e.target.value)}
                          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-gray-500">To</span>
                        <input
                          type="date"
                          value={customTo}
                          onChange={(e) => setCustomTo(e.target.value)}
                          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                        />
                      </label>
                      <button
                        onClick={applyCustomRange}
                        className="w-full mt-1 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Range caption */}
            <div className="hidden sm:flex items-center px-3 py-2 bg-white rounded-xl text-xs text-gray-500 border border-gray-200 whitespace-nowrap">
              {formatRangeCaption(dateRange)}
            </div>

            {/* Transaction count */}
            <div className="flex items-center px-4 py-2 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-200 whitespace-nowrap">
              <span className="font-medium text-gray-700">{filteredData.length}</span>
              <span className="ml-1">transactions</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Table ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-y-auto max-h-[500px]">
          <table className="w-full text-sm table-fixed min-w-[820px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-200 bg-gray-100">
                <th className="w-[140px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">M-PESA Receipt</th>
                <th className="w-[140px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date &amp; Time</th>
                <th className="w-[160px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="w-[120px] px-3 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="w-[120px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="w-[110px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-emerald-50 rounded-full">
                        <ArrowDownRight className="w-14 h-14 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium text-lg">No inflow transactions</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {transactions.length > 0
                            ? 'No transactions match your filters'
                            : 'Your incoming payments will appear here'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => handleViewDetails(tx)}
                    className="border-b border-gray-100 hover:bg-gray-50/70 transition-colors cursor-pointer group"
                  >
                    {/* M-PESA Receipt */}
                    <td className="px-3 py-3.5">
                      {tx.receipt ? (
                        <div className="flex items-center gap-1.5 group/receipt">
                          <span className="font-mono text-xs text-gray-700 group-hover:text-emerald-600 transition-colors tracking-normal">
                            {tx.receipt}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(tx.receipt!, tx.id);
                            }}
                            title="Copy receipt"
                            className="opacity-0 group-hover/receipt:opacity-100 transition-opacity p-1 rounded hover:bg-emerald-50"
                          >
                            {copiedId === tx.id ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Date & Time */}
                    <td className="px-3 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700">{formatDate(tx.date)}</span>
                        <span className="text-xs text-gray-400">{formatTime(tx.date)}</span>
                      </div>
                    </td>

                    {/* Customer (masked) */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 font-semibold text-xs flex-shrink-0">
                          {getInitials(tx.customer)}
                        </div>
                        <span className="text-sm text-gray-900 truncate font-mono">{tx.maskedPhone}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        KES {tx.amount.toLocaleString()}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3.5">
                      <CategoryBadge category={tx.category} />
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3.5">
                      <StatusBadge status={tx.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredData.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 bg-gray-50/80">
            <span className="text-xs text-gray-500">
              Showing {filteredData.length} of {getInflowData().length} transactions
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Last updated: {lastFetched ? lastFetched.toLocaleString() : '—'}
            </span>
          </div>
        )}
      </div>

      {/* ─── View Details Modal ──────────────────────────────────────── */}
      {showModal && selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusBadgeColors[selectedTransaction.status as keyof typeof statusBadgeColors] || 'bg-gray-500'}`} />
                <h3 className="text-lg font-bold text-gray-900">Transaction Details</h3>
                {selectedTransaction.receipt && (
                  <span className="text-xs text-gray-500 font-mono ml-2">
                    #{selectedTransaction.receipt}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Customer</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
                        {getInitials(selectedTransaction.customer)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 font-mono truncate">{selectedTransaction.phone}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">Mobile Money</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">M-PESA Receipt</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="font-mono text-sm text-gray-900 break-all">
                        {selectedTransaction.receipt || '—'}
                      </p>
                      {selectedTransaction.receipt && (
                        <button
                          onClick={() => handleCopy(selectedTransaction.receipt!, 'modal-receipt')}
                          className="p-1.5 rounded hover:bg-gray-200 transition-colors"
                          title="Copy receipt"
                        >
                          {copiedId === 'modal-receipt' ? (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Reference</p>
                    <p className="font-mono text-sm text-gray-900 mt-1 break-all">{selectedTransaction.ref}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Description</p>
                    <p className="text-sm text-gray-700 mt-1 break-words">{selectedTransaction.description}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Category</p>
                    <div className="mt-1">
                      <CategoryBadge category={selectedTransaction.category} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50">
                    <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">Amount</p>
                    <p className="text-3xl font-bold text-emerald-700 mt-1 break-words">
                      KES {selectedTransaction.amount.toLocaleString()}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={selectedTransaction.status} />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Payment Details</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-sm text-gray-500">Method</span>
                        <span className="text-sm font-medium text-gray-900 text-right truncate ml-2">{selectedTransaction.method}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-sm text-gray-500">Channel</span>
                        <span className="text-sm text-gray-900 text-right truncate ml-2">{selectedTransaction.channel}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-sm text-gray-500">Settlement Date</span>
                        <span className="text-sm text-gray-900 text-right">{formatDate(selectedTransaction.settlementDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Date &amp; Time</span>
                        <span className="text-sm text-gray-900 text-right">
                          {formatDate(selectedTransaction.date)} {formatTime(selectedTransaction.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                <button
                  onClick={() => handleCopy(selectedTransaction.receipt || selectedTransaction.id, 'modal-copy')}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {selectedTransaction.receipt ? 'Copy Receipt' : 'Copy Reference'}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}