// src/app/dashboard/transactions/inflow/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
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
  Mail as MailIcon,
  TrendingUp,
  Wallet,
  Smartphone,
  Coins,
  ArrowDownRight,
  Loader2,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { getToken, getStoredMerchant } from '@/lib/auth';
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
  customer: string;
  phone: string;
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

// ─── Summary Card Component ──────────────────────────────────────
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
      
      const response = await fetch(`/api/transactions?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data || []);
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
      id: tx.id.slice(0, 8),
      customer: tx.phone_number || 'Unknown Customer',
      phone: tx.phone_number || 'N/A',
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

  const filteredData = getInflowData().filter(
    (item) =>
      (filterCategory === 'All' || item.category === filterCategory) &&
      (item.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalInflow = filteredData.reduce((sum, t) => sum + t.amount, 0);
  const completedCount = filteredData.filter(t => t.status === 'Completed').length;
  const pendingCount = filteredData.filter(t => t.status === 'Pending').length;
  const failedCount = filteredData.filter(t => t.status === 'Failed').length;

  // ─── Export Functions ─────────────────────────────────────────────
  const exportToCSV = (data: InflowTransaction[]) => {
    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Customer',
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
      tx.customer,
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
      const filename = `inflow_transactions_${date}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      log('Exported transactions', `Exported ${filteredData.length} inflow transactions as ${format.toUpperCase()}`);
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
      }
    }

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
          
          {/* Export Dropdown */}
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

      {/* ─── Summary Cards ───────────────────────────────────────────── */}
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

      {/* ─── Filters & Search ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by customer phone, transaction ID, reference, method, status, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
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

      {/* ─── Table with 6 Columns ─────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="w-[80px] px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="w-[150px] px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="w-[150px] px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="w-[120px] px-3 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="w-[120px] px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="w-[100px] px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
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
                            ? 'No transactions match your search criteria'
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
                    className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer group"
                  >
                    {/* ID */}
                    <td className="px-3 py-3.5">
                      <span className="font-mono text-xs text-gray-500 group-hover:text-emerald-600 transition-colors">
                        {tx.id}
                      </span>
                    </td>
                    
                    {/* Date & Time */}
                    <td className="px-3 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700">{formatDate(tx.date)}</span>
                        <span className="text-xs text-gray-400">{formatTime(tx.date)}</span>
                      </div>
                    </td>
                    
                    {/* Customer */}
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-700 font-semibold text-xs flex-shrink-0">
                          {getInitials(tx.customer)}
                        </div>
                        <span className="text-sm text-gray-900 truncate">{tx.phone}</span>
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
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 bg-gray-50/50">
            <span className="text-xs text-gray-400">
              Showing {filteredData.length} of {getInflowData().length} transactions
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
                <span className="text-xs text-gray-400 font-mono ml-2">#{selectedTransaction.id}</span>
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
                        <p className="font-medium text-gray-900 truncate">{selectedTransaction.customer}</p>
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