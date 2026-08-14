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
  History,
  Loader2,
  Smartphone,
  Landmark,
  CreditCard,
} from 'lucide-react';
import { getToken, getStoredMerchant } from '@/lib/auth';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Types ──────────────────────────────────────────────────────────
interface WithdrawTransaction {
  id: string;
  Ref: string;
  Description: string;
  Amount: number;
  Balance: number;
  Method: string;
  status: string;
  Posted_Time: string;
  recipient: string;
  phoneNumber?: string;
  bankName?: string;
  accountNumber?: string;
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

const methodIcons = {
  'M-PESA': Smartphone,
  'Bank Transfer': Landmark,
  'Credit Card': CreditCard,
};

const methodColors = {
  'M-PESA': 'bg-green-50 text-green-700 border-green-200',
  'Bank Transfer': 'bg-blue-50 text-blue-700 border-blue-200',
  'Credit Card': 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function WithdrawHistoryPage() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();
  
  // ─── State ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<WithdrawTransaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterMethod, setFilterMethod] = useState('All');
  const [merchantId, setMerchantId] = useState<string>('');
  const [merchantName, setMerchantName] = useState<string>('');
  const [withdrawData, setWithdrawData] = useState<WithdrawTransaction[]>([]);

  // ✅ Prevent duplicate logging
  const hasLoggedView = useRef(false);
  const isLoggingView = useRef(false);

  // ─── Fetch Withdrawals ────────────────────────────────────────────
  const fetchWithdrawals = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch('/v1/payments/withdrawals', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (json.success) {
        const mapped = (json.data || []).map((item: any) => ({
          id: item.id,
          Ref: item.mpesa_receipt || item.id.slice(0, 8),
          Description: `Withdrawal to ${item.phone_number}`,
          Amount: Number(item.amount),
          Balance: 0, // You can fetch this separately if needed
          Method: 'M-PESA',
          status: item.status,
          Posted_Time: new Date(item.created_at).toLocaleString(),
          recipient: item.phone_number,
          phoneNumber: item.phone_number,
        }));
        setWithdrawData(mapped);
      }
    } catch (error) {
      console.error('Failed to load withdrawals:', error);
    }
  };

  // ─── Load Merchant Data ──────────────────────────────────────────
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

    // ✅ Fetch real withdrawals
    fetchWithdrawals();

    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [router]);

  // ─── Log View - Only once per page visit ──────────────────────
  useEffect(() => {
    const logView = async () => {
      if (isLoggingView.current || hasLoggedView.current) {
        return;
      }
      
      try {
        isLoggingView.current = true;
        
        if (merchantId) {
          await log(
            ActivityActions.VIEW_WITHDRAW_HISTORY,
            `Viewed withdraw history for ${merchantName || 'business'}`
          );
          hasLoggedView.current = true;
          console.log('✅ Withdraw history view logged');
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
  }, [merchantId, merchantName, loading, log]);

  // ─── Apply Filters ──────────────────────────────────────────────
  const filteredData = withdrawData.filter(
    (item) =>
      (filterMethod === 'All' || item.Method === filterMethod) &&
      (item.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.recipient?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalWithdrawn = filteredData.reduce((sum, t) => sum + t.Amount, 0);
  const completedCount = filteredData.filter(t => t.status === 'Completed').length;
  const pendingCount = filteredData.filter(t => t.status === 'Pending').length;
  const failedCount = filteredData.filter(t => t.status === 'Failed').length;

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleRefresh = () => {
    setIsRefreshing(true);
    hasLoggedView.current = false;
    fetchWithdrawals(); // ✅ Refresh data
    setTimeout(() => {
      setIsRefreshing(false);
      setLoading(false);
    }, 500);
  };

  const handleViewDetails = async (tx: WithdrawTransaction) => {
    setSelectedTransaction(tx);
    setShowModal(true);
    await log(
      'Viewed withdrawal details',
      `Viewed details for withdrawal ${tx.Ref} - Amount: KES ${tx.Amount}`
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // ─── Status Badge ──────────────────────────────────────────────────
  const StatusBadge = ({ status }: { status: string }) => {
    const StatusIcon = statusIcons[status as keyof typeof statusIcons] || Clock;
    const colorKey = status as keyof typeof statusColors;
    const color = statusColors[colorKey] || 'bg-gray-50 text-gray-700 border-gray-200';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
        <StatusIcon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  // ─── Method Badge ──────────────────────────────────────────────────
  const MethodBadge = ({ method }: { method: string }) => {
    const Icon = methodIcons[method as keyof typeof methodIcons] || CreditCard;
    const color = methodColors[method as keyof typeof methodColors] || 'bg-gray-50 text-gray-600 border-gray-200';
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
        <Icon className="w-3 h-3" />
        {method}
      </span>
    );
  };

  // ─── Loading State ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-rose-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading withdrawal history...</p>
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
          <button className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm shadow-rose-200">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* ─── Summary Cards ───────────────────────────────────────────── */}
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
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Failed</p>
          <p className="text-xl font-bold text-red-600 mt-1">{failedCount}</p>
        </div>
      </div>

      {/* ─── Filters & Search ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by description, reference, or recipient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 appearance-none pr-10 shadow-sm"
          >
            <option value="All">All Methods</option>
            <option value="M-PESA">📱 M-PESA</option>
            <option value="Bank Transfer">🏦 Bank Transfer</option>
          </select>
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <div className="flex items-center px-4 py-2 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-200">
            <span className="font-medium text-gray-700">{filteredData.length}</span>
            <span className="ml-1">transactions</span>
          </div>
        </div>
      </div>

      {/* ─── Table ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Posted Time</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-rose-50 rounded-full">
                        <History className="w-14 h-14 text-rose-400" />
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium text-lg">No withdrawal history</p>
                        <p className="text-sm text-gray-400 mt-1">Your withdrawal transactions will appear here</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((tx, index) => {
                  return (
                    <tr
                      key={index}
                      onClick={() => handleViewDetails(tx)}
                      className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{tx.Posted_Time}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-gray-500 group-hover:text-rose-600 transition-colors">
                            {tx.Ref}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{tx.Description}</span>
                      </td>
                      <td className="px-6 py-4">
                        <MethodBadge method={tx.Method} />
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-rose-600">
                        - {formatCurrency(tx.Amount)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {formatCurrency(tx.Balance)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={tx.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Footer ────────────────────────────────────────────────── */}
        {filteredData.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-400">
              Showing all {filteredData.length} withdrawals
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              Last updated: {new Date().toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* ─── View Details Modal ──────────────────────────────────────── */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <h3 className="text-lg font-bold text-gray-900">Withdrawal Details</h3>
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
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Reference</p>
                    <p className="font-mono text-sm text-gray-900 mt-1">{selectedTransaction.Ref}</p>
                    <button
                      onClick={() => handleCopy(selectedTransaction.Ref)}
                      className="mt-1 text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Reference
                    </button>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Description</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedTransaction.Description}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Posted Time</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedTransaction.Posted_Time}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Recipient</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedTransaction.recipient}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 rounded-xl p-4 border border-rose-200/50">
                    <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">Amount</p>
                    <p className="text-3xl font-bold text-rose-700 mt-1">
                      - {formatCurrency(selectedTransaction.Amount)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border bg-rose-50 text-rose-700 border-rose-200">
                        <ArrowUpRight className="w-3 h-3" />
                        Debit
                      </span>
                      <StatusBadge status={selectedTransaction.status} />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Balance After</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(selectedTransaction.Balance)}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Payment Method</p>
                    <div className="mt-1">
                      <MethodBadge method={selectedTransaction.Method} />
                    </div>
                    {selectedTransaction.Method === 'M-PESA' && selectedTransaction.phoneNumber && (
                      <p className="text-sm text-gray-600 mt-2">Phone: {selectedTransaction.phoneNumber}</p>
                    )}
                    {selectedTransaction.Method === 'Bank Transfer' && selectedTransaction.bankName && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">Bank: {selectedTransaction.bankName}</p>
                        <p className="text-sm text-gray-600">Account: {selectedTransaction.accountNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Actions ────────────────────────────────────────── */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                <button
                  onClick={() => handleCopy(selectedTransaction.Ref)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Reference
                </button>
                <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
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
