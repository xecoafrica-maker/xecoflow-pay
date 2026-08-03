// src/app/dashboard/withdrawals/Withdraw-scheduled/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  X,
  AlertCircle,
  Smartphone,
  Landmark,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
  Eye,
  Pause,
  Play,
  Trash2,
  Download,
  CreditCard,
  Printer,
  Mail,
  Wallet,
  Loader2,
} from 'lucide-react';
import { getToken, getStoredMerchant } from '@/lib/auth';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Types ──────────────────────────────────────────────────────────
interface ScheduledWithdrawal {
  id: string;
  name: string;
  description: string;
  amount: number;
  frequency: string;
  method: string;
  status: string;
  recipient: string;
  startDate: string;
  nextDate: string;
  time: string;
}

// ─── Colors ──────────────────────────────────────────────────────────
const statusColors = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Paused: 'bg-amber-50 text-amber-700 border-amber-200',
  Cancelled: 'bg-gray-50 text-gray-700 border-gray-200',
  Completed: 'bg-blue-50 text-blue-700 border-blue-200',
};

const statusIcons = {
  Active: CheckCircle,
  Paused: ClockIcon,
  Cancelled: XCircle,
  Completed: CheckCircle,
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

const frequencyOptions = ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly'];

// ─── Status Badge ──────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const StatusIcon = statusIcons[status as keyof typeof statusIcons] || ClockIcon;
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

export default function ScheduledWithdrawalsPage() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();

  // ─── State ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledWithdrawal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterFrequency, setFilterFrequency] = useState('All');
  const [merchantId, setMerchantId] = useState<string>('');
  const [merchantName, setMerchantName] = useState<string>('');

  // ✅ Prevent duplicate logging
  const hasLoggedView = useRef(false);
  const isLoggingView = useRef(false);

  // ─── Form State ───────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    amount: '',
    frequency: 'Daily',
    nextDate: '',
    time: '',
    method: 'Bank Transfer',
    confirmAccuracy: false,
  });

  // ─── Empty Data ──────────────────────────────────────────────────
  const scheduledData: ScheduledWithdrawal[] = [];

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
            ActivityActions.VIEW_WITHDRAW_SCHEDULES,
            `Viewed scheduled withdrawals for ${merchantName || 'business'}`
          );
          hasLoggedView.current = true;
          console.log('✅ Scheduled withdrawals view logged');
        }
      } catch (error) {
        console.debug('Scheduled withdrawals view logging skipped:', error);
      } finally {
        isLoggingView.current = false;
      }
    };
    
    if (merchantId && !hasLoggedView.current && !loading) {
      logView();
    }
  }, [merchantId, merchantName, loading, log]);

  // ─── Filter Data ──────────────────────────────────────────────────
  const filteredData = scheduledData.filter(
    (item) =>
      (filterStatus === 'All' || item.status === filterStatus) &&
      (filterFrequency === 'All' || item.frequency === filterFrequency) &&
      (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.recipient?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ─── Statistics ──────────────────────────────────────────────────
  const totalScheduled = filteredData.length;
  const activeCount = filteredData.filter(t => t.status === 'Active').length;
  const pausedCount = filteredData.filter(t => t.status === 'Paused').length;

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleRefresh = () => {
    setIsRefreshing(true);
    hasLoggedView.current = false;
    setTimeout(() => {
      setIsRefreshing(false);
      setLoading(false);
    }, 500);
  };

  const handleViewDetails = async (schedule: ScheduledWithdrawal) => {
    setSelectedSchedule(schedule);
    setShowModal(true);
    await log(
      'Viewed scheduled withdrawal details',
      `Viewed details for schedule ${schedule.id} - Amount: KES ${schedule.amount}`
    );
  };

  const handleDelete = (schedule: ScheduledWithdrawal) => {
    setSelectedSchedule(schedule);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (selectedSchedule) {
      await log(
        'Deleted scheduled withdrawal',
        `Deleted schedule ${selectedSchedule.id} - Amount: KES ${selectedSchedule.amount}`
      );
    }
    setShowDeleteModal(false);
    alert('Schedule deleted successfully');
  };

  const handleToggleStatus = async (schedule: ScheduledWithdrawal) => {
    const newStatus = schedule.status === 'Active' ? 'Paused' : 'Active';
    await log(
      schedule.status === 'Active' ? 'Paused scheduled withdrawal' : 'Activated scheduled withdrawal',
      `${schedule.status === 'Active' ? 'Paused' : 'Activated'} schedule ${schedule.id}`
    );
    alert(`Schedule ${newStatus === 'Active' ? 'activated' : 'paused'} successfully`);
  };

  const handleCreateSchedule = async () => {
    if (!formData.amount || !formData.nextDate || !formData.time) {
      alert('Please fill in all required fields');
      return;
    }
    
    await log(
      'Created scheduled withdrawal',
      `Created new schedule: ${formData.frequency} withdrawal of KES ${parseFloat(formData.amount).toLocaleString()}`
    );
    
    setShowCreateModal(false);
    alert('Schedule created successfully');
    setFormData({
      amount: '',
      frequency: 'Daily',
      nextDate: '',
      time: '',
      method: 'Bank Transfer',
      confirmAccuracy: false,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ─── Loading State ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading scheduled withdrawals...</p>
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
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm shadow-purple-200">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Scheduled Withdrawals</h1>
              <p className="text-sm text-gray-500">Manage your recurring withdrawal schedules</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm shadow-purple-200"
          >
            <Plus className="w-4 h-4" />
            Create Schedule
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* ─── Summary Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Schedules</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{totalScheduled}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Active</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Paused</p>
          <p className="text-xl font-bold text-amber-600 mt-1">{pausedCount}</p>
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
            placeholder="Search by name, ID, or recipient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none pr-10 shadow-sm"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Paused">Paused</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <select
            value={filterFrequency}
            onChange={(e) => setFilterFrequency(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none pr-10 shadow-sm"
          >
            <option value="All">All Frequencies</option>
            {frequencyOptions.map((freq) => (
              <option key={freq} value={freq}>{freq}</option>
            ))}
          </select>
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <div className="flex items-center px-4 py-2 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-200">
            <span className="font-medium text-gray-700">{filteredData.length}</span>
            <span className="ml-1">schedules</span>
          </div>
        </div>
      </div>

      {/* ─── Table ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transfer Frequency</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Processing Date</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Default Bank</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-purple-50 rounded-full">
                        <Calendar className="w-12 h-12 text-purple-400" />
                      </div>
                      <p className="text-gray-500 font-medium text-lg">No scheduled withdrawals created</p>
                      <p className="text-sm text-gray-400">Create a new schedule to get started</p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-3 px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm shadow-purple-200"
                      >
                        <Plus className="w-4 h-4" />
                        Create Schedule
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((schedule) => (
                  <tr
                    key={schedule.id}
                    className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{schedule.frequency}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={schedule.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm text-gray-700">{formatDate(schedule.nextDate)}</span>
                        <span className="text-xs text-gray-400 ml-1">{schedule.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {schedule.method === 'M-PESA' ? (
                          <Smartphone className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Landmark className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-700">{schedule.method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(schedule)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(schedule)}
                          className={`p-1.5 hover:bg-gray-100 rounded-lg transition-colors ${
                            schedule.status === 'Active' ? 'text-amber-400 hover:text-amber-600' : 'text-emerald-400 hover:text-emerald-600'
                          }`}
                          title={schedule.status === 'Active' ? 'Pause' : 'Activate'}
                        >
                          {schedule.status === 'Active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(schedule)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-red-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
        {filteredData.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-400">
              Showing {filteredData.length} schedules
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Last updated: {new Date().toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* ─── Create Schedule Modal ──────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Schedule Withdrawals</h3>
                <p className="text-sm text-gray-500">Set up an automatic withdrawal schedule below.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Amount */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">KES</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-14 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Transfer Frequency */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Transfer frequency <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly'].map((freq) => (
                      <button
                        key={freq}
                        onClick={() => setFormData({ ...formData, frequency: freq })}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                          formData.frequency === freq
                            ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Next Processing Date & Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      Next processing date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.nextDate}
                      onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Withdraw To Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Withdraw To <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setFormData({ ...formData, method: 'Bank Transfer' })}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        formData.method === 'Bank Transfer'
                          ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Landmark className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-medium">Bank Account</div>
                        <div className="text-xs text-gray-400">AFRICAN BANKING CORP.</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, method: 'M-PESA' })}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        formData.method === 'M-PESA'
                          ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20'
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-medium">Mobile Money</div>
                        <div className="text-xs text-gray-400">254712xxxxx78</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Summary</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Amount</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formData.amount ? `KES ${parseFloat(formData.amount).toLocaleString()}` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Transfer frequency</span>
                      <span className="text-sm font-medium text-gray-900">{formData.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Start processing</span>
                      <span className="text-sm font-medium text-gray-900">{formData.nextDate || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Time</span>
                      <span className="text-sm font-medium text-gray-900">{formData.time || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Destination</span>
                      <span className="text-sm font-medium text-gray-900">{formData.method}</span>
                    </div>
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="confirmAccuracy"
                    checked={formData.confirmAccuracy}
                    onChange={(e) => setFormData({ ...formData, confirmAccuracy: e.target.checked })}
                    className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="confirmAccuracy" className="text-sm text-gray-600">
                    I confirm I have submitted accurate bank details and understand that any errors may cause processing delays.
                  </label>
                </div>

                {/* Warning Message */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-800">
                        A minimum balance of <span className="font-bold">KES 0.00</span> is required for the automatic transfer to take place. Bank charges may apply per transfer.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Need Support */}
                <div className="text-center">
                  <p className="text-sm text-gray-500">Need Support?</p>
                  <button className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors">
                    Contact our support team
                  </button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSchedule}
                  className="flex-1 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── View Details Modal ──────────────────────────────────────── */}
      {showModal && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  selectedSchedule.status === 'Active' ? 'bg-emerald-500' :
                  selectedSchedule.status === 'Paused' ? 'bg-amber-500' : 'bg-gray-500'
                }`} />
                <h3 className="text-lg font-bold text-gray-900">Schedule Details</h3>
                <span className="text-xs text-gray-400 font-mono ml-2">#{selectedSchedule.id}</span>
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
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Schedule Name</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedSchedule.name}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Description</p>
                    <p className="text-sm text-gray-900 mt-1">{selectedSchedule.description}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Recipient</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedSchedule.recipient}</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Frequency</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedSchedule.frequency}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/50">
                    <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">Amount</p>
                    <p className="text-3xl font-bold text-purple-700 mt-1">
                      {formatCurrency(selectedSchedule.amount)}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={selectedSchedule.status} />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Payment Method</p>
                    <div className="mt-1">
                      <MethodBadge method={selectedSchedule.method} />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Schedule Dates</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Start Date</span>
                        <span className="text-sm font-medium text-gray-900">{formatDate(selectedSchedule.startDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Next Date</span>
                        <span className="text-sm font-medium text-emerald-600">{formatDate(selectedSchedule.nextDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Time</span>
                        <span className="text-sm font-medium text-gray-900">{selectedSchedule.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Actions ────────────────────────────────────────── */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                <button
                  onClick={() => handleToggleStatus(selectedSchedule)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedSchedule.status === 'Active'
                      ? 'bg-amber-500 hover:bg-amber-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {selectedSchedule.status === 'Active' ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause Schedule
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Activate Schedule
                    </>
                  )}
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

      {/* ─── Delete Confirmation Modal ──────────────────────────────── */}
      {showDeleteModal && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center">Delete Schedule</h3>
              <p className="text-sm text-gray-500 text-center mt-1">
                Are you sure you want to delete this schedule? This action cannot be undone.
              </p>

              <div className="mt-4 bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-900">{selectedSchedule.name}</p>
                <p className="text-xs text-gray-500">{selectedSchedule.id}</p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}