// src/app/dashboard/transactions/withdraw-history/page.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
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
  Phone,
  History,
  Loader2,
  Smartphone,
  ArrowUpRight,
  FileSpreadsheet,
  FileText,
  Calendar,
} from 'lucide-react';
import { getStoredMerchant } from '@/lib/auth';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Types ──────────────────────────────────────────────────────────
interface WithdrawTransaction {
  id: string;
  receipt: string | null;
  recipient: string;
  recipientDisplayName: string;
  phone: string;
  maskedPhone: string;
  amount: number;
  method: string;
  status: string;
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

const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) return '—';
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.length < 6) return cleaned;
  const head = cleaned.slice(0, 6);
  const tail = cleaned.slice(-3);
  return `${head}***${tail}`;
};

// Extract just the name from a receiver_name string.
// Handles formats like "254XXXXXXXXX - NAME" or "NAME".
const extractReceiverName = (
  raw: string | null | undefined,
  fallbackPhone: string | null | undefined
): string => {
  if (!raw) return fallbackPhone || 'Unknown';
  const trimmed = raw.trim();
  if (trimmed.includes(' - ')) {
    const parts = trimmed.split(' - ');
    const name = parts[parts.length - 1].trim();
    if (name) return name;
  }
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length >= 9 && digitsOnly.length <= 15 && /^\d+$/.test(digitsOnly)) {
    return fallbackPhone || 'Unknown';
  }
  return trimmed;
};

// ─── Status derivation ────────────────────────────────────────────────
const COMPLETED_KEYWORDS = ['COMPLETED', 'SUCCESS', 'SETTLED', 'PAID'];
const FAILED_KEYWORDS = ['FAILED', 'ERROR', 'DECLINED', 'CANCELLED', 'CANCELED', 'REVERSED'];
const PENDING_KEYWORDS = ['PENDING', 'AWAITING', 'PROCESSING', 'INITIATED'];

const deriveStatus = (raw: string): 'Completed' | 'Pending' | 'Failed' => {
  const s = (raw || '').toUpperCase();
  if (FAILED_KEYWORDS.some((k) => s.includes(k))) return 'Failed';
  if (COMPLETED_KEYWORDS.some((k) => s.includes(k))) return 'Completed';
  if (PENDING_KEYWORDS.some((k) => s.includes(k))) return 'Pending';
  return 'Pending';
};

// ─── Skeleton Components ──────────────────────────────────────────
const SkeletonSummaryCard = () => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm animate-pulse">
    <div className="h-3 w-24 bg-gray-200 rounded mb-2" />
    <div className="h-6 w-20 bg-gray-200 rounded" />
  </div>
);

const SkeletonTransactionRow = () => (
  <tr className="border-b border-gray-100">
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
        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
      </div>
    </td>
    <td className="px-3 py-3.5">
      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
    </td>
    <td className="px-3 py-3.5">
      <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse" />
    </td>
  </tr>
);

export default function WithdrawHistoryPage() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<WithdrawTransaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [merchantId, setMerchantId] = useState<string>('');
  const [withdrawData, setWithdrawData] = useState<WithdrawTransaction[]>([]);
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
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const hasLoggedView = useRef(false);
  const isLoggingView = useRef(false);

  // ─── Fetch Withdrawals (same endpoint as Outflow) ─────────────────
  const fetchWithdrawals = async () => {
    try {
      const cached = getStoredMerchant();
      const id = merchantId || String(cached?.merchant_id || cached?.merchantId || '');

      if (!id) {
        console.warn('No merchant ID available for withdrawals fetch');
        setWithdrawData([]);
        return;
      }

      const params = new URLSearchParams();
      params.append('merchantId', id);
      params.append('limit', '500');

      const res = await fetch(`/api/transactions/outflow?${params.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      if (json.success) {
        const mapped: WithdrawTransaction[] = (json.data || []).map((item: any) => {
          const displayName = extractReceiverName(item.receiver_name, item.phone_number);
          const rawStatus = item.status || 'PENDING';
          return {
            id: item.id || item.mpesa_receipt || 'N/A',
            receipt: item.mpesa_receipt || item.transaction_id || null,
            recipient: item.receiver_name || item.phone_number || 'Unknown',
            recipientDisplayName: displayName,
            phone: item.phone_number || '',
            maskedPhone: maskPhone(item.phone_number),
            amount: Number(item.amount) || 0,
            method: 'M-PESA',
            status: deriveStatus(rawStatus),
            description: `Withdrawal to ${displayName}`,
            date: item.created_at || new Date().toISOString(),
            settlementDate: item.completed_at || item.created_at || new Date().toISOString(),
          };
        });

        setWithdrawData(mapped);
        setLastFetched(new Date());
      } else {
        console.error('Failed to fetch withdrawals:', json.error || json.message);
        setWithdrawData([]);
      }
    } catch (error) {
      console.error('Failed to load withdrawals:', error);
      setWithdrawData([]);
    }
  };

  // ─── Auth ─────────────────────────────────────────────────────────
  useEffect(() => {
    const cached = getStoredMerchant();
    const id = String(cached?.merchant_id || cached?.merchantId || '');

    if (!id) {
      console.warn('No merchant found, redirecting to login');
      router.push('/login?session=expired');
      return;
    }

    setMerchantId(id);
    fetchWithdrawals().finally(() => setLoading(false));
  }, [router]);

  // ─── Log View ──────────────────────────────────────────────────────
  useEffect(() => {
    const logView = async () => {
      if (isLoggingView.current || hasLoggedView.current || loading) return;

      try {
        isLoggingView.current = true;
        if (merchantId) {
          await log(
            ActivityActions.VIEW_WITHDRAW_HISTORY,
            `Viewed withdraw history (${withdrawData.length} transactions)`
          );
          hasLoggedView.current = true;
        }
      } catch (error) {
        console.debug('Withdraw history view logging skipped:', error);
      } finally {
        isLoggingView.current = false;
      }
    };

    if (merchantId && !hasLoggedView.current && !loading) {
      logView();
    }
  }, [merchantId, loading, log, withdrawData.length, ActivityActions.VIEW_WITHDRAW_HISTORY]);

  // ─── Filter Chain: date → search ──────────────────────────────────
  const filteredData = useMemo(() => {
    const dateFiltered = withdrawData.filter((item) => {
      if (!dateRange.from || !dateRange.to) return true;
      const d = new Date(item.date).getTime();
      return d >= dateRange.from.getTime() && d <= dateRange.to.getTime();
    });

    const term = searchTerm.toLowerCase();
    const searched = !term
      ? dateFiltered
      : dateFiltered.filter(
          (item) =>
            item.receipt?.toLowerCase().includes(term) ||
            item.recipientDisplayName?.toLowerCase().includes(term) ||
            item.phone?.toLowerCase().includes(term) ||
            item.id?.toLowerCase().includes(term) ||
            item.status?.toLowerCase().includes(term) ||
            item.amount.toString().includes(term)
        );

    return [...searched].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [withdrawData, dateRange, searchTerm]);

  // ✅ Total Withdrawn only counts Completed
  const totalWithdrawn = filteredData
    .filter((t) => t.status === 'Completed')
    .reduce((sum, t) => sum + t.amount, 0);

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

  // Close menus when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target as Node)) {
        setCustomRangeOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Export ──────────────────────────────────────────────────────
  const exportToCSV = (data: WithdrawTransaction[]) => {
    const headers = [
      'M-PESA Receipt',
      'Date',
      'Time',
      'Recipient',
      'Phone (Masked)',
      'Amount (KES)',
      'Method',
      'Status',
      'Description',
    ];

    const rows = data.map((tx) => [
      tx.receipt || '—',
      formatDate(tx.date),
      formatTime(tx.date),
      tx.recipientDisplayName,
      tx.maskedPhone,
      tx.amount.toFixed(2),
      tx.method,
      tx.status,
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
      const filename = `withdraw_history_${from}_to_${to}.${format === 'csv' ? 'csv' : 'xlsx'}`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      log(
        'Exported transactions',
        `Exported ${filteredData.length} withdrawal transactions as ${format.toUpperCase()}`
      );
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setIsRefreshing(true);
    hasLoggedView.current = false;
    try {
      await fetchWithdrawals();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleViewDetails = async (tx: WithdrawTransaction) => {
    setSelectedTransaction(tx);
    setShowModal(true);
    await log(
      'Viewed withdrawal details',
      `Viewed details for withdrawal ${tx.receipt || tx.id} - Amount: KES ${tx.amount}`
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const datePresets: DatePreset[] = [
    'Today',
    'Yesterday',
    'Last 7 days',
    'Last 30 days',
    'This month',
    'Last month',
    'Custom',
  ];

  // ─── Skeleton Loading State ───────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-6 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
            <div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonSummaryCard key={i} />
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1">
            <div className="h-11 w-full bg-gray-200 rounded-xl animate-pulse" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="h-11 w-32 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-11 w-32 bg-gray-200 rounded-xl animate-pulse hidden sm:block" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-y-auto max-h-[500px]">
            <table className="w-full text-sm table-fixed min-w-[850px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-gray-200 bg-gray-100">
                  <th className="w-[140px] px-3 py-3.5">
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </th>
                  <th className="w-[140px] px-3 py-3.5">
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                  </th>
                  <th className="w-[180px] px-3 py-3.5">
                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                  </th>
                  <th className="w-[120px] px-3 py-3.5">
                    <div className="h-3 w-14 bg-gray-200 rounded animate-pulse ml-auto" />
                  </th>
                  <th className="w-[110px] px-3 py-3.5">
                    <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <SkeletonTransactionRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 px-4 sm:px-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-sm shadow-rose-200">
              <History className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Withdraw History</h1>
              <p className="text-sm text-gray-500">All your withdrawal transactions</p>
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

          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm shadow-rose-200 disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Exporting...' : 'Export'}
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100"
                >
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>Export as CSV</span>
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-rose-500" />
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
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Withdrawn</p>
            <p className="text-xl font-bold text-rose-600 mt-1">{formatCurrency(totalWithdrawn)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Successful</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{completedCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Pending</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Failed</p>
            <p className="text-xl font-bold text-red-600 mt-1">{failedCount}</p>
          </div>
        </div>
      </div>

      {/* ─── Filters & Search (Sticky) ──────────────────────────────── */}
      <div className="sticky top-[88px] z-10 bg-gray-50/95 backdrop-blur-sm -mx-4 px-4 py-3 -mt-1 border-b border-gray-200/50">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by receipt, recipient, phone, amount…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
            />
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <div className="relative" ref={dateMenuRef}>
              <button
                onClick={() => setCustomRangeOpen((v) => !v)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <Calendar className="w-4 h-4" />
                {dateRange.preset}
              </button>

              {customRangeOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="py-1">
                    {datePresets.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => applyPreset(preset)}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          dateRange.preset === preset
                            ? 'bg-rose-50 text-rose-700 font-medium'
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
                          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-gray-500">To</span>
                        <input
                          type="date"
                          value={customTo}
                          onChange={(e) => setCustomTo(e.target.value)}
                          className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        />
                      </label>
                      <button
                        onClick={applyCustomRange}
                        className="w-full mt-1 px-3 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="hidden sm:flex items-center px-3 py-2 bg-white rounded-xl text-xs text-gray-500 border border-gray-200 whitespace-nowrap">
              {formatRangeCaption(dateRange)}
            </div>

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
          <table className="w-full text-sm table-fixed min-w-[850px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-200 bg-gray-100">
                <th className="w-[140px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">M-PESA Receipt</th>
                <th className="w-[140px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date &amp; Time</th>
                <th className="w-[180px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Recipient</th>
                <th className="w-[120px] px-3 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="w-[110px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-rose-50 rounded-full">
                        <History className="w-14 h-14 text-rose-400" />
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium text-lg">No withdrawal history</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {withdrawData.length > 0
                            ? 'No transactions match your filters'
                            : 'Your withdrawal transactions will appear here'}
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
                          <span className="font-mono text-xs text-gray-700 group-hover:text-rose-600 transition-colors tracking-normal">
                            {tx.receipt}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(tx.receipt!, tx.id);
                            }}
                            title="Copy receipt"
                            className="opacity-0 group-hover/receipt:opacity-100 transition-opacity p-1 rounded hover:bg-rose-50"
                          >
                            {copiedId === tx.id ? (
                              <CheckCircle className="w-3.5 h-3.5 text-rose-600" />
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
                        <span className="text-sm text-gray-700">{formatDate(tx.date)}</span>
                        <span className="text-xs text-gray-400">{formatTime(tx.date)}</span>
                      </div>
                    </td>

                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center text-rose-700 font-semibold text-xs flex-shrink-0">
                          {getInitials(tx.recipientDisplayName)}
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <span className="text-sm text-gray-900 truncate">
                            {tx.recipientDisplayName}
                          </span>
                          <span className="text-xs text-gray-400 font-mono truncate">
                            {tx.maskedPhone}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3.5 text-right font-semibold text-rose-600 whitespace-nowrap">
                      - {formatCurrency(tx.amount)}
                    </td>

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
              Showing {filteredData.length} of {withdrawData.length} transactions
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
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
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <h3 className="text-lg font-bold text-gray-900">Withdrawal Details</h3>
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
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Recipient</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center text-rose-700 font-semibold text-sm flex-shrink-0">
                        {getInitials(selectedTransaction.recipientDisplayName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {selectedTransaction.recipientDisplayName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate font-mono">{selectedTransaction.phone}</span>
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
                            <CheckCircle className="w-4 h-4 text-rose-600" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Description</p>
                    <p className="text-sm text-gray-900 mt-1 break-words">{selectedTransaction.description}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Method</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">M-PESA</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl p-4 border border-rose-200/50">
                    <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">Amount</p>
                    <p className="text-3xl font-bold text-rose-700 mt-1 break-words">
                      - {formatCurrency(selectedTransaction.amount)}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-rose-50 text-rose-700 border-rose-200">
                        <ArrowUpRight className="w-3 h-3" />
                        Debit
                      </span>
                      <StatusBadge status={selectedTransaction.status} />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Settlement Date</p>
                    <p className="text-sm text-gray-900 mt-1">{formatDate(selectedTransaction.settlementDate)}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Date &amp; Time</p>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(selectedTransaction.date)} {formatTime(selectedTransaction.date)}
                    </p>
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