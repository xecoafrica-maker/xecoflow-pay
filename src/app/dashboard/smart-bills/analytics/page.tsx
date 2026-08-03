'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  DollarSign,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Printer,
  Mail,
  AlertCircle,
  PlusCircle,
  Search,
  X,
  Loader2,
  Hash,
  User,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import { getStoredMerchant } from '@/lib/auth';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ✅ IMPORT THE MODAL COMPONENT
import CreateBillModal from '../components/CreateBillModal';

// ─── Types ──────────────────────────────────────────────────────────
interface Bill {
  id: string;
  bill_id: string;
  merchant_id: string;
  business_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  amount: number;
  currency: string;
  description: string;
  items: any[];
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'PROCESSING';
  expiry_date: string;
  created_at: string;
  paid_at: string | null;
  return_url: string | null;
}

// ─── Colors ──────────────────────────────────────────────────────────
const statusColors = {
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  EXPIRED: 'bg-gray-50 text-gray-700 border-gray-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const statusIcons = {
  PAID: CheckCircle,
  PENDING: Clock,
  PROCESSING: Clock,
  EXPIRED: XCircle,
  CANCELLED: AlertCircle,
};

const statusBadgeColors = {
  PAID: 'bg-emerald-500',
  PENDING: 'bg-amber-500',
  PROCESSING: 'bg-blue-500',
  EXPIRED: 'bg-gray-500',
  CANCELLED: 'bg-red-500',
};

const statusLabels = {
  PAID: 'Paid',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
};

// ─── Summary Card Component ──────────────────────────────────────
const SummaryCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{title}</p>
        <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

export default function SmartBillsAnalytics() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();
  
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [merchantId, setMerchantId] = useState<string>('');

  // ✅ NEW: State to control the creation modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // ✅ Prevent duplicate logging ONLY during the same page load
  const hasLoggedView = useRef(false);
  const isLoggingView = useRef(false);

  // ─── Fetch Bills from Supabase ──────────────────────────────────
  const fetchBills = async () => {
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
      
      console.log('🔍 Fetching bills for merchant:', id);
      
      const response = await fetch(`/api/bills/merchant?merchantId=${id}`);
      const data = await response.json();
      
      console.log('📊 Bills response:', data);
      
      if (data.success) {
        setBills(data.data || []);
      } else {
        console.error('Failed to fetch bills:', data.error);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // ─── Log View - Only once per page visit ──────────────────────
  useEffect(() => {
    const logView = async () => {
      // ✅ Prevent duplicate logs during the same page load
      if (isLoggingView.current || hasLoggedView.current || bills.length === 0) {
        return;
      }
      
      try {
        isLoggingView.current = true;
        
        const cached = getStoredMerchant();
        const id = merchantId || cached?.merchant_id || cached?.merchantId;
        
        if (id) {
          await log(
            ActivityActions.VIEW_BILLS,
            `Viewed ${bills.length} smart bills`
          );
          hasLoggedView.current = true;
          console.log('✅ Bills view logged');
        }
      } catch (error) {
        console.debug('Bills view logging skipped:', error);
      } finally {
        isLoggingView.current = false;
      }
    };
    
    // Only log when bills are loaded and we haven't logged yet
    if (!loading && bills.length > 0 && !hasLoggedView.current) {
      logView();
    }
  }, [loading, bills.length, merchantId, log]);

  // ─── Load Data ──────────────────────────────────────────────────────
  useEffect(() => {
    const cached = getStoredMerchant();
    if (cached) {
      const id = String(cached.merchant_id || cached.merchantId);
      if (id) {
        setMerchantId(id);
      }
    }
    fetchBills();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // ✅ Reset the log flag so refresh can log again
    hasLoggedView.current = false;
    await fetchBills();
  };

  const handleViewDetails = async (bill: Bill) => {
    setSelectedBill(bill);
    setShowModal(true);
    await log(
      'Viewed bill details',
      `Viewed details for bill ${bill.bill_id} - Amount: ${bill.currency} ${bill.amount}`
    );
  };

  // ─── Filter Data ──────────────────────────────────────────────────
  const filteredBills = bills.filter(
    (bill) =>
      (filterStatus === 'All' || bill.status === filterStatus) &&
      (bill.bill_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ─── Statistics ──────────────────────────────────────────────────
  const totalBills = filteredBills.length;
  const totalAmount = filteredBills.reduce((sum, bill) => sum + Number(bill.amount), 0);
  const paidCount = filteredBills.filter(b => b.status === 'PAID').length;
  const pendingCount = filteredBills.filter(b => b.status === 'PENDING').length;
  const processingCount = filteredBills.filter(b => b.status === 'PROCESSING').length;
  const expiredCount = filteredBills.filter(b => b.status === 'EXPIRED').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const StatusIcon = statusIcons[status as keyof typeof statusIcons] || Clock;
    const label = statusLabels[status as keyof typeof statusLabels] || status;
    const colorKey = status as keyof typeof statusColors;
    const color = statusColors[colorKey] || statusColors.PENDING;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
        <StatusIcon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your bills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-sm shadow-indigo-200">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Smart Bills Analytics</h1>
              <p className="text-sm text-gray-500">Track your bill performance and insights</p>
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
          
          {/* ✅ UPDATED: Triggers the Modal instead of navigating directly */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm shadow-indigo-200"
          >
            <PlusCircle className="w-4 h-4" />
            Create Bill
          </button>
        </div>
      </div>

      {/* ─── Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Bills"
          value={totalBills}
          icon={FileText}
          color="bg-indigo-50 text-indigo-500"
        />
        <SummaryCard
          title="Total Amount"
          value={formatCurrency(totalAmount)}
          icon={DollarSign}
          color="bg-emerald-50 text-emerald-500"
        />
        <SummaryCard
          title="Paid"
          value={paidCount}
          icon={CheckCircle}
          color="bg-green-50 text-green-500"
          subtitle={`${totalBills > 0 ? Math.round((paidCount / totalBills) * 100) : 0}% of bills`}
        />
        <SummaryCard
          title="Pending / Processing"
          value={pendingCount + processingCount}
          icon={Clock}
          color="bg-amber-50 text-amber-500"
          subtitle={`${totalBills > 0 ? Math.round(((pendingCount + processingCount) / totalBills) * 100) : 0}% of bills`}
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
            placeholder="Search by bill ID, customer name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none pr-10 shadow-sm"
          >
            <option value="All">All Status</option>
            <option value="PAID">✅ Paid</option>
            <option value="PENDING">⏳ Pending</option>
            <option value="PROCESSING">🔄 Processing</option>
            <option value="EXPIRED">⏰ Expired</option>
            <option value="CANCELLED">🚫 Cancelled</option>
          </select>
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <div className="flex items-center px-4 py-2 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-200">
            <span className="font-medium text-gray-700">{filteredBills.length}</span>
            <span className="ml-1">bills</span>
          </div>
        </div>
      </div>

      {/* ─── Table ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Bill</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-indigo-50 rounded-full">
                        <FileText className="w-14 h-14 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium text-lg">No bills created yet</p>
                        <p className="text-sm text-gray-400 mt-1">Create your first smart bill to get started</p>
                      </div>
                      {/* ✅ Updated empty state link to trigger modal */}
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm shadow-indigo-200"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Create Your First Bill
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr
                    key={bill.id}
                    onClick={() => handleViewDetails(bill)}
                    className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <Hash className="w-3.5 h-3.5 text-indigo-500" />
                        </div>
                        <span className="font-mono text-xs text-gray-500 group-hover:text-indigo-600 transition-colors">
                          {bill.bill_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-700">{formatDate(bill.created_at)}</span>
                        <span className="text-xs text-gray-400">{formatTime(bill.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                          {getInitials(bill.customer_name)}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{bill.customer_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(Number(bill.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-700">{formatDate(bill.expiry_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={bill.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(bill);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                          title="Resend Bill"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Footer ────────────────────────────────────────────────── */}
        {filteredBills.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-400">
              Showing {filteredBills.length} of {bills.length} bills
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              Last updated: {new Date().toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* ─── View Details Modal ──────────────────────────────────────── */}
      {showModal && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusBadgeColors[selectedBill.status as keyof typeof statusBadgeColors] || 'bg-gray-500'}`} />
                <h3 className="text-lg font-bold text-gray-900">Bill Details</h3>
                <span className="text-xs text-gray-400 font-mono ml-2">#{selectedBill.bill_id}</span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Customer</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-semibold text-sm">
                        {getInitials(selectedBill.customer_name)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{selectedBill.customer_name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          <span>{selectedBill.customer_email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Reference</p>
                    <p className="font-mono text-sm text-gray-900 mt-1">{selectedBill.bill_id}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Description</p>
                    <p className="text-sm text-gray-700 mt-1">{selectedBill.description}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className={`rounded-xl p-4 border ${
                    selectedBill.status === 'PAID'
                      ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50'
                      : selectedBill.status === 'PROCESSING'
                      ? 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50'
                      : selectedBill.status === 'PENDING'
                      ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50'
                      : selectedBill.status === 'EXPIRED'
                      ? 'bg-gradient-to-br from-gray-50 to-gray-100/50 border-gray-200/50'
                      : 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200/50'
                  }`}>
                    <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">Amount</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {formatCurrency(Number(selectedBill.amount))}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={selectedBill.status} />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Payment Method</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {selectedBill.status === 'PAID' ? 'M-PESA' : 'Not paid'}
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Actions</p>
                    <div className="flex gap-2 mt-2">
                      <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Resend
                      </button>
                      <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                      <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-1.5">
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ ADD THIS AT THE VERY BOTTOM: The Create Bill Modal */}
      <CreateBillModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}