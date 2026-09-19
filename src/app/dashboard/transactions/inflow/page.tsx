// src/app/dashboard/transactions/inflow/page.tsx
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Copy,
  Printer,
  Mail,
  Phone,
  Wallet,
  Smartphone,
  ArrowDownRight,
  Calendar,
  Loader2,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Types ──────────────────────────────────────────────────────────
interface Transaction {
  id: string;
  amount: string;
  phone_number: string | null;
  status: string;
  payment_status: string;
  request_type?: string;
  checkout_id?: string | null;
  mpesa_receipt: string | null;
  created_at: string;
  completed_at?: string | null;
  channel?: 'STK_PUSH' | 'C2B';
}

interface InflowTransaction {
  id: string;
  receipt: string | null;
  customer: string;
  phone: string;
  maskedPhone: string;
  amount: number;
  method: string;
  channel: string;
  category: string;
  status: 'Completed' | 'Pending' | 'Failed';
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

type ChannelFilter = 'all' | 'stk' | 'c2b';

interface DateRange {
  from: Date | null;
  to: Date | null;
  preset: DatePreset;
}

// ─── Constants ──────────────────────────────────────────────────────
const STATUS_COLORS = {
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Failed: 'bg-red-50 text-red-700 border-red-200',
} as const;

const STATUS_ICONS = {
  Completed: CheckCircle,
  Pending: Clock,
  Failed: XCircle,
} as const;

const STATUS_DOT = {
  Completed: 'bg-emerald-500',
  Pending: 'bg-amber-500',
  Failed: 'bg-red-500',
} as const;

const CATEGORY_ICONS: Record<string, typeof Smartphone> = {
  'M-PESA STK Push': Smartphone,
  'M-PESA Paybill': Wallet,
};

const CATEGORY_COLORS: Record<string, string> = {
  'M-PESA STK Push': 'bg-blue-50 text-blue-600 border-blue-200',
  'M-PESA Paybill': 'bg-teal-50 text-teal-600 border-teal-200',
};

const DATE_PRESETS: DatePreset[] = [
  'Today',
  'Yesterday',
  'Last 7 days',
  'Last 30 days',
  'This month',
  'Last month',
  'Custom',
];

// ─── Helpers ────────────────────────────────────────────────────────
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function getPresetRange(preset: DatePreset): { from: Date; to: Date } {
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
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { from: startOfDay(from), to: endOfDay(to) };
    }
  }
}

function formatRangeCaption(range: DateRange) {
  if (!range.from || !range.to) return '—';
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return `${range.from.toLocaleDateString('en-US', opts)} – ${range.to.toLocaleDateString('en-US', opts)}`;
}

function toInputDate(d: Date | null) {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '—';
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.length < 6) return cleaned;
  return `${cleaned.slice(0, 6)}***${cleaned.slice(-3)}`;
}

function deriveStatus(tx: Transaction): 'Completed' | 'Pending' | 'Failed' {
  const combined = `${tx.status || ''} ${tx.payment_status || ''}`.toUpperCase();

  if (['FAILED', 'ERROR', 'DECLINED', 'CANCELLED', 'CANCELED', 'REVERSED'].some((k) => combined.includes(k))) {
    return 'Failed';
  }
  if (['COMPLETED', 'SUCCESS', 'SETTLED', 'PAID'].some((k) => combined.includes(k))) {
    return 'Completed';
  }
  if (['PENDING', 'AWAITING', 'PROCESSING', 'INITIATED'].some((k) => combined.includes(k))) {
    return 'Pending';
  }
  if (tx.mpesa_receipt) return 'Completed';
  return 'Pending';
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(name: string) {
  if (!name) return '??';
  if (name.startsWith('0') || name.startsWith('+') || name.startsWith('254')) {
    return name.slice(0, 2);
  }
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Small UI pieces ────────────────────────────────────────────────
function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
            {title}
          </p>
          <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'Completed' | 'Pending' | 'Failed' }) {
  const Icon = STATUS_ICONS[status] || Clock;
  const color = STATUS_COLORS[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color} whitespace-nowrap`}
    >
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const Icon = CATEGORY_ICONS[category] || Wallet;
  const color = CATEGORY_COLORS[category] || 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color} whitespace-nowrap`}
    >
      <Icon className="w-3 h-3" />
      {category}
    </span>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function InflowPage() {
  const { user, loading: sessionLoading } = useSession();
  const { log, ActivityActions } = useActivityLogger();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] =
    useState<InflowTransaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterChannel, setFilterChannel] = useState<ChannelFilter>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

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

  // ─── Fetch transactions ───────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    if (!user?.merchantId) return;

    try {
      setLoading(true);

      const params = new URLSearchParams({
        merchantId: user.merchantId,
        limit: '500',
      });

      const response = await fetch(`/api/transactions/inflow?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json();

      if (data.success) {
        setTransactions(data.data || []);
        setLastFetched(new Date());
      }
    } catch {
      // Silent fail — UI already shows empty state
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.merchantId]);

  // Load data once session is ready
  useEffect(() => {
    if (!sessionLoading && user?.merchantId) {
      fetchTransactions();
    }
  }, [sessionLoading, user?.merchantId, fetchTransactions]);

  // Activity log (once)
  useEffect(() => {
    if (loading || transactions.length === 0 || hasLoggedView.current) return;

    hasLoggedView.current = true;
    log(
      ActivityActions.VIEW_INFLOW,
      `Viewed ${transactions.length} inflow transactions`
    ).catch(() => {
      // non-blocking
    });
  }, [loading, transactions.length, log, ActivityActions]);

  // ─── Transform ────────────────────────────────────────────────────
  const transformToInflow = (tx: Transaction): InflowTransaction => {
    const isC2B = tx.channel === 'C2B';
    const category = isC2B ? 'M-PESA Paybill' : 'M-PESA STK Push';
    const status = deriveStatus(tx);
    const amountValue = parseFloat(tx.amount) || 0;

    return {
      id: tx.id,
      receipt: tx.mpesa_receipt || null,
      customer: isC2B ? 'M-PESA Paybill' : tx.phone_number || 'Unknown Customer',
      phone: isC2B ? '—' : tx.phone_number || 'N/A',
      maskedPhone: isC2B ? '—' : maskPhone(tx.phone_number),
      amount: amountValue,
      method: category,
      channel: category,
      category,
      status,
      ref: tx.checkout_id || tx.id.slice(0, 12),
      description: isC2B
        ? 'Manual M-PESA Paybill payment'
        : `${tx.request_type || 'Payment'}${tx.phone_number ? ` - ${tx.phone_number}` : ''}`,
      date: tx.created_at,
      settlementDate: tx.completed_at || tx.created_at,
    };
  };

  // ─── Filtered data ────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    const data = transactions.map(transformToInflow);

    const dateFiltered = data.filter((item) => {
      if (!dateRange.from || !dateRange.to) return true;
      const d = new Date(item.date).getTime();
      return d >= dateRange.from.getTime() && d <= dateRange.to.getTime();
    });

    const channelFiltered = dateFiltered.filter((item) => {
      if (filterChannel === 'all') return true;
      if (filterChannel === 'stk') return item.channel === 'M-PESA STK Push';
      if (filterChannel === 'c2b') return item.channel === 'M-PESA Paybill';
      return true;
    });

    const term = searchTerm.toLowerCase().trim();
    const searched = !term
      ? channelFiltered
      : channelFiltered.filter(
          (item) =>
            item.receipt?.toLowerCase().includes(term) ||
            item.customer?.toLowerCase().includes(term) ||
            item.phone?.toLowerCase().includes(term) ||
            item.id?.toLowerCase().includes(term) ||
            item.ref?.toLowerCase().includes(term) ||
            item.status?.toLowerCase().includes(term) ||
            item.amount.toString().includes(term)
        );

    return [...searched].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions, dateRange, filterChannel, searchTerm]);

  const totalInflow = filteredData
    .filter((t) => t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const completedCount = filteredData.filter((t) => t.status === 'Completed').length;
  const pendingCount = filteredData.filter((t) => t.status === 'Pending').length;
  const failedCount = filteredData.filter((t) => t.status === 'Failed').length;

  // ─── Date handlers ────────────────────────────────────────────────
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
    if (from > to) return;
    setDateRange({ from, to, preset: 'Custom' });
    setCustomRangeOpen(false);
  };

  // Close date menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) {
        setCustomRangeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Actions ──────────────────────────────────────────────────────
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
    ).catch(() => {});
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // ─── Loading / Auth states ────────────────────────────────────────
  if (sessionLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return null; // useSession already redirects
  }

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Inflow
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Incoming payments via M-PESA STK Push and Paybill
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Loader2
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Inflow"
          value={`KES ${totalInflow.toLocaleString()}`}
          icon={ArrowDownRight}
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

      {/* Filters */}
      <div className="sticky top-[88px] z-10 bg-gray-50/95 backdrop-blur-sm -mx-4 px-4 py-3 border-b border-gray-200/50">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by receipt, phone, amount…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value as ChannelFilter)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
            >
              <option value="all">All Channels</option>
              <option value="stk">M-PESA STK Push</option>
              <option value="c2b">M-PESA Paybill</option>
            </select>

            <div className="relative" ref={dateMenuRef}>
              <button
                onClick={() => setCustomRangeOpen((v) => !v)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
              >
                <Calendar className="w-4 h-4" />
                {dateRange.preset}
              </button>

              {customRangeOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="py-1">
                    {DATE_PRESETS.map((preset) => (
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

            <div className="hidden sm:flex items-center px-3 py-2 bg-white rounded-xl text-xs text-gray-500 border border-gray-200">
              {formatRangeCaption(dateRange)}
            </div>

            <div className="flex items-center px-4 py-2 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-200">
              <span className="font-medium text-gray-700">{filteredData.length}</span>
              <span className="ml-1">transactions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-y-auto max-h-[500px]">
          <table className="w-full text-sm table-fixed min-w-[850px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-200 bg-gray-100">
                <th className="w-[140px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  M-PESA Receipt
                </th>
                <th className="w-[140px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="w-[160px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="w-[120px] px-3 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="w-[170px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="w-[120px] px-3 py-3.5 pl-5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-3 py-3.5">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="h-6 w-32 bg-gray-200 rounded-full animate-pulse" />
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-emerald-50 rounded-full">
                        <ArrowDownRight className="w-14 h-14 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium text-lg">
                          No inflow transactions
                        </p>
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
                    <td className="px-3 py-3.5">
                      {tx.receipt ? (
                        <div className="flex items-center gap-1.5 group/receipt">
                          <span className="font-mono text-xs text-gray-700 group-hover:text-emerald-600 transition-colors">
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
                    <td className="px-3 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700">
                          {formatDate(tx.date)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTime(tx.date)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 font-semibold text-xs flex-shrink-0">
                          {getInitials(tx.customer)}
                        </div>
                        <span className="text-sm text-gray-900 truncate font-mono">
                          {tx.maskedPhone}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                        KES {tx.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 pr-6">
                      <CategoryBadge category={tx.category} />
                    </td>
                    <td className="px-3 py-3.5 pl-5">
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
              Showing {filteredData.length} of {transactions.length} transactions
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Last updated:{' '}
              {lastFetched ? lastFetched.toLocaleString() : '—'}
            </span>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showModal && selectedTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    STATUS_DOT[selectedTransaction.status] || 'bg-gray-500'
                  }`}
                />
                <h3 className="text-lg font-bold text-gray-900">
                  Transaction Details
                </h3>
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
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">
                      Customer
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 font-semibold text-sm flex-shrink-0">
                        {getInitials(selectedTransaction.customer)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 font-mono truncate">
                          {selectedTransaction.phone}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span>Mobile Money</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">
                      M-PESA Receipt
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="font-mono text-sm text-gray-900 break-all">
                        {selectedTransaction.receipt || '—'}
                      </p>
                      {selectedTransaction.receipt && (
                        <button
                          onClick={() =>
                            handleCopy(selectedTransaction.receipt!, 'modal-receipt')
                          }
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
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">
                      Reference
                    </p>
                    <p className="font-mono text-sm text-gray-900 mt-1 break-all">
                      {selectedTransaction.ref}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">
                      Description
                    </p>
                    <p className="text-sm text-gray-700 mt-1 break-words">
                      {selectedTransaction.description}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">
                      Category
                    </p>
                    <div className="mt-1">
                      <CategoryBadge category={selectedTransaction.category} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-4 border border-emerald-200/50">
                    <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">
                      Amount
                    </p>
                    <p className="text-3xl font-bold text-emerald-700 mt-1">
                      KES {selectedTransaction.amount.toLocaleString()}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={selectedTransaction.status} />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">
                      Payment Details
                    </p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-sm text-gray-500">Method</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedTransaction.method}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-sm text-gray-500">Channel</span>
                        <span className="text-sm text-gray-900">
                          {selectedTransaction.channel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-sm text-gray-500">
                          Settlement Date
                        </span>
                        <span className="text-sm text-gray-900">
                          {formatDate(selectedTransaction.settlementDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Date & Time</span>
                        <span className="text-sm text-gray-900">
                          {formatDate(selectedTransaction.date)}{' '}
                          {formatTime(selectedTransaction.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    handleCopy(
                      selectedTransaction.receipt || selectedTransaction.id,
                      'modal-copy'
                    )
                  }
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