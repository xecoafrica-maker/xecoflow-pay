// src/app/dashboard/transactions/outflow/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowDownRight,
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
  Mail as MailIcon,
  TrendingDown,
  Wallet,
  Zap,
  Landmark,
  Building,
  ArrowUpRight,
  Coins,
  History,
  Loader2,
  Smartphone,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { getToken, getStoredMerchant } from '@/lib/auth';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Types ──────────────────────────────────────────────────────────
interface OutflowTransaction {
  id: string;
  recipient: string;
  email: string;
  phone: string;
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
  'Withdrawal': Wallet,
  'Refund': ArrowUpRight,
  'Platform Fee': Coins,
  'Utility Cost': Zap,
  'Payment': CreditCard,
  'M-PESA': Smartphone,
  'Bank Transfer': Landmark,
};

const categoryColors: Record<string, string> = {
  'Withdrawal': 'bg-purple-50 text-purple-600 border-purple-200',
  'Refund': 'bg-rose-50 text-rose-600 border-rose-200',
  'Platform Fee': 'bg-gray-50 text-gray-600 border-gray-200',
  'Utility Cost': 'bg-amber-50 text-amber-600 border-amber-200',
  'Payment': 'bg-blue-50 text-blue-600 border-blue-200',
  'M-PESA': 'bg-green-50 text-green-600 border-green-200',
  'Bank Transfer': 'bg-indigo-50 text-indigo-600 border-indigo-200',
};

// ─── Summary Cards ──────────────────────────────────────────────────
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

export default function OutflowPage() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<OutflowTransaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [merchantId, setMerchantId] = useState<string>('');
  const [merchantName, setMerchantName] = useState<string>('');
  const [outflowData, setOutflowData] = useState<OutflowTransaction[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const hasLoggedView = useRef(false);
  const isLoggingView = useRef(false);

  // ─── Fetch Outflow Data ──────────────────────────────────────────────
  const fetchOutflowData = async () => {
    try {
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch('/v1/payments/withdrawals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      
      if (json.success) {
        const mapped = (json.data || []).map((item: any) => ({
          id: item.id || item.mpesa_receipt || 'N/A',
          recipient: item.recipient_name || item.phone_number || 'Unknown',
          email: item.email || '',
          phone: item.phone_number || '',
          amount: Number(item.amount),
          method: item.method || 'M-PESA',
          channel: item.channel || 'M-PESA',
          category: item.category || 'Withdrawal',
          status: item.status || 'Pending',
          ref: item.reference || item.mpesa_receipt || item.id,
          description: item.description || `Withdrawal to ${item.phone_number}`,
          date: item.created_at || new Date().toISOString(),
          settlementDate: item.completed_at || item.created_at || new Date().toISOString(),
        }));
        
        setOutflowData(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch outflow data:', error);
      setOutflowData([]);
    }
  };

  // ─── Load Data ──────────────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const cached = getStoredMerchant();
    if (cached) {
      const id = String(cached.merchant_id || cached.merchantId);
      if (id) {
        setMerchantId(id);
        setMerchantName(cached.business_name || cached.businessName || '');
      }
    }

    fetchOutflowData();

    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [router]);

  // ─── Log View ──────────────────────────────────────────────────────
  useEffect(() => {
    const logView = async () => {
      if (isLoggingView.current || hasLoggedView.current) {
        return;
      }
      
      try {
        isLoggingView.current = true;
        
        const cached = getStoredMerchant();
        const id = merchantId || cached?.merchant_id || cached?.merchantId;
        
        if (id) {
          await log(
            ActivityActions.VIEW_OUTFLOW,
            `Viewed outflow transactions (${outflowData.length} transactions)`
          );
          hasLoggedView.current = true;
        }
      } catch (error) {
        console.debug('Outflow view logging skipped:', error);
      } finally {
        isLoggingView.current = false;
      }
    };
    
    if (!loading && !hasLoggedView.current && outflowData.length > 0) {
      logView();
    }
  }, [loading, merchantId, log, outflowData.length]);

  // ─── Apply Filters ──────────────────────────────────────────────
  const filteredData = outflowData.filter(
    (item) =>
      (filterCategory === 'All' || item.category === filterCategory) &&
      (item.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ─── Summary Stats ────────────────────────────────────────────────
  const totalOutflow = filteredData.reduce((sum, t) => sum + t.amount, 0);
  const completedCount = filteredData.filter(t => t.status === 'Completed').length;
  const pendingCount = filteredData.filter(t => t.status === 'Pending').length;
  const failedCount = filteredData.filter(t => t.status === 'Failed').length;

  // ─── Export Functions ─────────────────────────────────────────────
  const exportToCSV = (data: OutflowTransaction[]) => {
    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Recipient',
      'Phone',
      'Amount (KES)',
      'Method',
      'Channel',
      'Category',
      'Status',
      'Reference',
      'Description'
    ];

    const rows = data.map(tx => [
      tx.id,
      formatDate(tx.date),
      formatTime(tx.date),
      tx.recipient,
      tx.phone,
      tx.amount.toFixed(2),
      tx.method,
      tx.channel,
      tx.category,
      tx.status,
      tx.ref,
      tx.description
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

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
      
      const date = new Date().toISOString().split('T')[0];
      const filename = `outflow_transactions_${date}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      log('Exported transactions', `Exported ${filteredData.length} outflow transactions as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleRefresh = () => {
    setIsRefreshing(true);
    hasLoggedView.current = false;
    fetchOutflowData();
    setTimeout(() => {
      setIsRefreshing(false);
      setLoading(false);
    }, 500);
  };

  const handleViewDetails = async (tx: OutflowTransaction) => {
    setSelectedTransaction(tx);
    setShowModal(true);
    await log(
      'Viewed outflow transaction details',
      `Viewed details for transaction ${tx.id} - Amount: KES ${tx.amount}`
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    if (name.startsWith('0') || name.startsWith('+') || name.startsWith('254')) {
      return name.slice(0, 2);
    }
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading transactions...</p>
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
              <ArrowDownRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Outflow Transactions</h1>
              <p className="text-sm text-gray-500">All outgoing payments made by your business</p>
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
          
          {/* Export Dropdown */}
          <div className="relative">
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
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
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
          <SummaryCard
            title="Total Outflow"
            value={`KES ${totalOutflow.toLocaleString()}`}
            icon={TrendingDown}
            color="bg-rose-50 text-rose-500"
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by recipient, transaction ID, reference, method, status, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 appearance-none pr-10 shadow-sm"
            >
              <option value="All">All Categories</option>
              <option value="Withdrawal">Withdrawal</option>
              <option value="Refund">Refund</option>
              <option value="Platform Fee">Platform Fee</option>
              <option value="Utility Cost">Utility Cost</option>
              <option value="Payment">Payment</option>
              <option value="M-PESA">M-PESA</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
            <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <div className="flex items-center px-4 py-2 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-200 whitespace-nowrap">
              <span className="font-medium text-gray-700">{filteredData.length}</span>
              <span className="ml-1">transactions</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Table with Fixed Header and Scrollable Body ────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-y-auto max-h-[500px]">
          <table className="w-full text-sm table-fixed min-w-[700px]">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-200 bg-gray-100">
                <th className="w-[80px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="w-[150px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date & Time</th>
                <th className="w-[150px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Recipient</th>
                <th className="w-[120px] px-3 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
                <th className="w-[120px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                <th className="w-[100px] px-3 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-rose-50 rounded-full">
                        <History className="w-14 h-14 text-rose-400" />
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium text-lg">No outflow transactions</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {outflowData.length > 0 
                            ? 'No transactions match your search criteria'
                            : 'Your outgoing payments will appear here'}
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
                    {/* ID */}
                    <td className="px-3 py-3.5">
                      <span className="font-mono text-xs text-gray-500 group-hover:text-rose-600 transition-colors">
                        {tx.id.slice(0, 8)}
                      </span>
                    </td>
                    
                    {/* Date & Time */}
                    <td className="px-3 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700">{formatDate(tx.date)}</span>
                        <span className="text-xs text-gray-400">{formatTime(tx.date)}</span>
                      </div>
                    </td>
                    
                    {/* Recipient */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center text-rose-700 font-semibold text-xs flex-shrink-0">
                          {getInitials(tx.recipient)}
                        </div>
                        <span className="text-sm text-gray-900 truncate">{tx.phone}</span>
                      </div>
                    </td>
                    
                    {/* Amount */}
                    <td className="px-3 py-3.5 text-right">
                      <span className="text-sm font-semibold text-rose-600 whitespace-nowrap">
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
              Showing {filteredData.length} of {outflowData.length} transactions
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Last updated: {new Date().toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* ─── View Details Modal ──────────────────────────────────────── */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusBadgeColors[selectedTransaction.status as keyof typeof statusBadgeColors] || 'bg-gray-500'}`} />
                <h3 className="text-lg font-bold text-gray-900">Transaction Details</h3>
                <span className="text-xs text-gray-400 font-mono ml-2">#{selectedTransaction.id.slice(0, 8)}</span>
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
                        {getInitials(selectedTransaction.recipient)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{selectedTransaction.recipient}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{selectedTransaction.phone}</span>
                        </div>
                      </div>
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
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl p-4 border border-rose-200/50">
                    <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">Amount</p>
                    <p className="text-3xl font-bold text-rose-700 mt-1 break-words">
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
                        <span className="text-sm text-gray-500">Date & Time</span>
                        <span className="text-sm text-gray-900 text-right">{formatDate(selectedTransaction.date)} {formatTime(selectedTransaction.date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                <button
                  onClick={() => handleCopy(selectedTransaction.id)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy ID
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