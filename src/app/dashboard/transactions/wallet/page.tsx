// src/app/dashboard/transactions/wallet/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ArrowDownRight,
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
  Calendar,
  Eye,
  History,
  Loader2,
  Zap,
  Smartphone,
  Landmark,
} from 'lucide-react';
import { getToken, getStoredMerchant } from '@/lib/auth';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Types ──────────────────────────────────────────────────────────
interface LedgerEntry {
  id: string;
  amount: number;
  entry_type: 'CREDIT' | 'DEBIT';
  description: string | null;
  reference_id: string | null;
  created_at: string;
  status: string;
  balance_before: number;
  balance_after: number;
}

interface WalletTransaction {
  id: string;
  Ref: string;
  Description: string;
  Amount: number;
  BalanceBefore: number;
  BalanceAfter: number;
  Type: 'Credit' | 'Debit' | 'Withdrawal' | 'Airtime' | 'KPLC';
  status: string;
  Posted_Time: string;
}

// ─── Colors & Icons ────────────────────────────────────────────────
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

const typeIcons = {
  Credit: ArrowUpRight,
  Debit: ArrowDownRight,
  Withdrawal: ArrowDownRight,
  Airtime: Smartphone,
  KPLC: Zap,
};

const typeColors = {
  Credit: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Debit: 'bg-rose-50 text-rose-700 border-rose-200',
  Withdrawal: 'bg-rose-50 text-rose-700 border-rose-200',
  Airtime: 'bg-blue-50 text-blue-700 border-blue-200',
  KPLC: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function WalletPage() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [merchantId, setMerchantId] = useState<string>('');
  const [ledgerEntries, setLedgerEntries] = useState<WalletTransaction[]>([]);

  // ✅ Prevent duplicate logging
  const hasLoggedView = useRef(false);
  const isLoggingView = useRef(false);

  // ─── Helper: Determine transaction type ───────────────────────────
  const determineType = (entry: LedgerEntry): WalletTransaction['Type'] => {
    const desc = entry.description?.toLowerCase() || '';
    if (entry.entry_type === 'CREDIT') return 'Credit';
    if (desc.includes('withdrawal')) return 'Withdrawal';
    if (desc.includes('airtime') || desc.includes('top up')) return 'Airtime';
    if (desc.includes('kplc') || desc.includes('electricity')) return 'KPLC';
    return 'Debit';
  };

  // ─── Fetch Wallet Transactions ─────────────────────────────────────
  const fetchWalletTransactions = async () => {
    try {
      const token = getToken();
      if (!token || !merchantId) return;

      const paddedId = String(merchantId).padStart(8, '0');
      const accountNumber = `1-1001-${paddedId}`;

      const res = await fetch(`/v1/ledger/accounts/${accountNumber}/entries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (json.success) {
        const mapped = (json.data || []).map((item: LedgerEntry) => ({
          id: item.id,
          Ref: item.reference_id || item.id.slice(0, 8),
          Description: item.description || '—',
          Amount: item.amount,
          BalanceBefore: item.balance_before,
          BalanceAfter: item.balance_after,
          Type: determineType(item),
          status: item.status === 'POSTED' ? 'Completed' : item.status,
          Posted_Time: new Date(item.created_at).toLocaleString(),
        }));
        setLedgerEntries(mapped);
      }
    } catch (error) {
      console.error('Failed to fetch wallet transactions:', error);
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
      }
    }

    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, [router]);

  // ─── Fetch data when merchantId is available ─────────────────────
  useEffect(() => {
    if (merchantId) {
      fetchWalletTransactions();
    }
  }, [merchantId]);

  // ─── Log View - Only once per page visit ──────────────────────
  useEffect(() => {
    const logView = async () => {
      if (isLoggingView.current || hasLoggedView.current || loading) {
        return;
      }
      
      try {
        isLoggingView.current = true;
        const cached = getStoredMerchant();
        const id = merchantId || cached?.merchant_id || cached?.merchantId;
        if (id) {
          await log(
            ActivityActions.VIEW_WALLET,
            `Viewed wallet transactions (${ledgerEntries.length} transactions)`
          );
          hasLoggedView.current = true;
          console.log('✅ Wallet view logged');
        }
      } catch (error) {
        console.debug('Wallet view logging skipped:', error);
      } finally {
        isLoggingView.current = false;
      }
    };
    
    if (!loading && !hasLoggedView.current && merchantId) {
      logView();
    }
  }, [loading, merchantId, ledgerEntries.length, log]);

  // ─── Apply Filters ──────────────────────────────────────────────
  const filteredData = ledgerEntries.filter(
    (item) =>
      (filterType === 'All' || item.Type === filterType) &&
      (item.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Type?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalCredits = filteredData.filter(t => t.Type === 'Credit').reduce((sum, t) => sum + t.Amount, 0);
  const totalDebits = filteredData.filter(t => t.Type !== 'Credit').reduce((sum, t) => sum + t.Amount, 0);
  const netBalance = totalCredits - totalDebits;
  const totalWithdrawals = filteredData.filter(t => t.Type === 'Withdrawal').reduce((sum, t) => sum + t.Amount, 0);
  const totalUtilities = filteredData.filter(t => t.Type === 'Airtime' || t.Type === 'KPLC').reduce((sum, t) => sum + t.Amount, 0);

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleRefresh = () => {
    setIsRefreshing(true);
    hasLoggedView.current = false;
    fetchWalletTransactions();
    setTimeout(() => {
      setIsRefreshing(false);
      setLoading(false);
    }, 500);
  };

  const handleViewDetails = async (tx: WalletTransaction) => {
    setSelectedTransaction(tx);
    setShowModal(true);
    await log(
      'Viewed wallet transaction details',
      `Viewed details for transaction ${tx.Ref} - Amount: KES ${tx.Amount}`
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

  // ─── Type Badge ──────────────────────────────────────────────────
  const TypeBadge = ({ type }: { type: WalletTransaction['Type'] }) => {
    const Icon = typeIcons[type] || Wallet;
    const color = typeColors[type as keyof typeof typeColors] || 'bg-gray-50 text-gray-600 border-gray-200';
    const label = type === 'Debit' ? 'Debit' : type;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    );
  };

  // ─── Loading State ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading wallet transactions...</p>
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
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Wallet Transactions</h1>
              <p className="text-sm text-gray-500">All movements in your XecoFlow wallet</p>
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
          <button className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm shadow-indigo-200">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* ─── Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Credits</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(totalCredits)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Debits</p>
          <p className="text-xl font-bold text-rose-600 mt-1">{formatCurrency(totalDebits)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Net Balance</p>
          <p className={`text-xl font-bold mt-1 ${netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatCurrency(netBalance)}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Transactions</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{filteredData.length}</p>
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
            placeholder="Search by description or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none pr-10 shadow-sm"
          >
            <option value="All">All Types</option>
            <option value="Credit">📈 Credit</option>
            <option value="Debit">📉 Debit</option>
            <option value="Withdrawal">💸 Withdrawal</option>
            <option value="Airtime">📱 Airtime</option>
            <option value="KPLC">⚡ KPLC</option>
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
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance Before</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance After</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-indigo-50 rounded-full">
                        <Wallet className="w-14 h-14 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium text-lg">No wallet transactions</p>
                        <p className="text-sm text-gray-400 mt-1">Your wallet activity will appear here</p>
                      </div>
                      <button
                        onClick={() => window.location.href = '/dashboard/withdrawals/withdraw-fund'}
                        className="mt-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm shadow-indigo-200"
                      >
                        <Wallet className="w-4 h-4" />
                        View Wallet
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((tx, index) => {
                  const isCredit = tx.Type === 'Credit';
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
                          <span className="font-mono text-xs text-gray-500 group-hover:text-indigo-600 transition-colors">
                            {tx.Ref}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{tx.Description}</span>
                      </td>
                      <td className={`px-6 py-4 text-right font-semibold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isCredit ? '+' : '-'} {formatCurrency(tx.Amount)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-700">
                        {formatCurrency(tx.BalanceBefore)}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        {formatCurrency(tx.BalanceAfter)}
                      </td>
                      <td className="px-6 py-4">
                        <TypeBadge type={tx.Type} />
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
              Showing all {filteredData.length} transactions
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
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
                <div className={`w-3 h-3 rounded-full ${selectedTransaction.Type === 'Credit' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <h3 className="text-lg font-bold text-gray-900">Transaction Details</h3>
                <span className="text-xs text-gray-400 font-mono ml-2">#{selectedTransaction.Ref}</span>
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
                      className="mt-1 text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
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
                </div>

                <div className="space-y-4">
                  <div className={`rounded-xl p-4 border ${
                    selectedTransaction.Type === 'Credit'
                      ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50'
                      : 'bg-gradient-to-br from-rose-50 to-rose-100/50 border-rose-200/50'
                  }`}>
                    <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">Amount</p>
                    <p className={`text-3xl font-bold mt-1 ${selectedTransaction.Type === 'Credit' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {selectedTransaction.Type === 'Credit' ? '+' : '-'} {formatCurrency(selectedTransaction.Amount)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        selectedTransaction.Type === 'Credit'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {selectedTransaction.Type === 'Credit' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {selectedTransaction.Type === 'Credit' ? 'Credit' : 'Debit'}
                      </span>
                      <StatusBadge status={selectedTransaction.status} />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Balance Before</p>
                    <p className="text-xl font-bold text-gray-700 mt-1">{formatCurrency(selectedTransaction.BalanceBefore)}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Balance After</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(selectedTransaction.BalanceAfter)}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Transaction Type</p>
                    <div className="mt-1">
                      <TypeBadge type={selectedTransaction.Type} />
                    </div>
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