'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Plus,
  Search,
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
  Loader2,
  Printer,
  Mail,
} from 'lucide-react';
import { useSession } from '@/hooks/useSession';

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

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// ─── Constants ──────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  PROCESSING: 'bg-blue-50 text-blue-700 border-blue-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  FAILED: 'bg-red-50 text-red-700 border-red-200',
  CANCELLED: 'bg-gray-50 text-gray-700 border-gray-200',
  PAUSED: 'bg-amber-50 text-amber-700 border-amber-200',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  PENDING: ClockIcon,
  PROCESSING: ClockIcon,
  COMPLETED: CheckCircle,
  FAILED: XCircle,
  CANCELLED: XCircle,
  PAUSED: Pause,
};

const METHOD_ICONS: Record<string, React.ElementType> = {
  'M-PESA': Smartphone,
  'Bank Transfer': Landmark,
  MPESA_PHONE: Smartphone,
  BANK_ACCOUNT: Landmark,
  LEDGER_ACCOUNT: Landmark,
};

const FREQUENCY_OPTIONS = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly'];

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
};

// ─── Components ─────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const upper = (status || '').toUpperCase();
  const Icon = STATUS_ICONS[upper] || ClockIcon;
  const color = STATUS_COLORS[upper] || 'bg-gray-50 text-gray-700 border-gray-200';
  const label = upper.charAt(0) + upper.slice(1).toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {label}
    </span>
  );
};

const MethodBadge = ({ method }: { method: string }) => {
  const Icon = METHOD_ICONS[method] || Landmark;
  const color = METHOD_ICONS[method] ? (method.includes('MPESA') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200') : 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {method}
    </span>
  );
};

const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

export default function ScheduledWithdrawalsPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();

  // ─── State ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [scheduledData, setScheduledData] = useState<ScheduledWithdrawal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledWithdrawal | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterFrequency, setFilterFrequency] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Form State ───────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    amount: '',
    frequency: 'weekly',
    nextDate: '',
    time: '08:00',
    method: 'M-PESA',
    destination_reference: '',
    confirmAccuracy: false,
  });

  // ─── Fetch Schedules Securely ────────────────────────────────────
  const fetchSchedules = useCallback(async () => {
    if (!user?.merchantId) return;

    try {
      const statusParam = filterStatus !== 'All' ? `&status=${filterStatus}` : '';
      const frequencyParam = filterFrequency !== 'All' ? `&frequency=${filterFrequency}` : '';

      const response = await fetch(
        `/api/schedules?merchantId=${user.merchantId}&limit=100${statusParam}${frequencyParam}`,
        { credentials: 'include', cache: 'no-store' }
      );

      if (!response.ok) {
        if (response.status === 401) {
          window.location.replace('/login?session=expired');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const json: ApiResponse = await response.json();

      if (json.success) {
        const mappedData: ScheduledWithdrawal[] = (json.data || []).map((item: any) => {
          const destType = item.destination_type || '';
          const method = destType === 'MPESA_PHONE' ? 'M-PESA' : 'Bank Transfer';
          const recipient = item.destination_reference || item.destination_account_number || 'N/A';

          return {
            id: item.id,
            name: FREQUENCY_LABELS[item.frequency] || item.frequency || 'Scheduled Withdrawal',
            description: `${FREQUENCY_LABELS[item.frequency] || item.frequency} withdrawal of ${item.currency} ${Number(item.amount).toLocaleString()}`,
            amount: Number(item.amount),
            frequency: item.frequency || 'weekly',
            method,
            status: (item.status || 'PENDING').toUpperCase(),
            recipient,
            startDate: item.created_at,
            nextDate: item.scheduled_at,
            time: item.scheduled_at
              ? new Date(item.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : '08:00',
          };
        });

        setScheduledData(mappedData);
        setError(null);
      } else {
        setError(json.error || 'Failed to load schedules.');
      }
    } catch (err) {
      setError('Failed to load schedules. Please try again.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.merchantId, filterStatus, filterFrequency]);

  // Load data once session is ready
  useEffect(() => {
    if (!sessionLoading && user?.merchantId) {
      fetchSchedules();
    } else if (!sessionLoading && !user) {
      setLoading(false);
    }
  }, [sessionLoading, user?.merchantId, fetchSchedules]);

  // ─── Filter Data ──────────────────────────────────────────────────
  const filteredData = scheduledData.filter(
    (item) =>
      (filterStatus === 'All' || item.status === filterStatus.toUpperCase()) &&
      (filterFrequency === 'All' || item.frequency === filterFrequency) &&
      (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.recipient?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ─── Statistics ──────────────────────────────────────────────────
  const totalScheduled = filteredData.length;
  const activeCount = filteredData.filter((t) => t.status === 'PENDING' || t.status === 'PROCESSING').length;
  const pausedCount = filteredData.filter((t) => t.status === 'PAUSED').length;

  // ─── Handlers ──────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSchedules();
  };

  const handleViewDetails = (schedule: ScheduledWithdrawal) => {
    setSelectedSchedule(schedule);
    setShowModal(true);
  };

  const handleDelete = (schedule: ScheduledWithdrawal) => {
    setSelectedSchedule(schedule);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedSchedule || !user?.merchantId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/schedules/${selectedSchedule.id}?merchantId=${user.merchantId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete schedule');

      setShowDeleteModal(false);
      setSelectedSchedule(null);
      await fetchSchedules();
    } catch {
      alert('Failed to delete schedule. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (schedule: ScheduledWithdrawal) => {
    if (!user?.merchantId) return;

    const isActive = schedule.status === 'PENDING' || schedule.status === 'PROCESSING';
    const action = isActive ? 'pause' : 'resume';

    setIsToggling(true);
    try {
      const response = await fetch(`/api/schedules/${schedule.id}/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: user.merchantId }),
      });

      if (!response.ok) throw new Error('Failed to update schedule status');

      await fetchSchedules();
    } catch {
      alert('Failed to update schedule status. Please try again.');
    } finally {
      setIsToggling(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!user?.merchantId) return;
    if (!formData.amount || !formData.nextDate || !formData.time) {
      alert('Please fill in all required fields');
      return;
    }
    if (!formData.confirmAccuracy) {
      alert('Please confirm the accuracy of the details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const localDateTimeString = `${formData.nextDate}T${formData.time || '08:00'}:00`;
      const localDate = new Date(localDateTimeString);

      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          merchantId: user.merchantId,
          amount: parseFloat(formData.amount),
          frequency: formData.frequency,
          method: formData.method,
          destination_type: formData.method === 'M-PESA' ? 'MPESA_PHONE' : 'BANK_ACCOUNT',
          destination_reference: formData.destination_reference || user.phone || '',
          scheduled_at: localDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create schedule');
      }

      setShowCreateModal(false);
      setFormData({
        amount: '',
        frequency: 'weekly',
        nextDate: '',
        time: '08:00',
        method: 'M-PESA',
        destination_reference: '',
        confirmAccuracy: false,
      });

      await fetchSchedules();
    } catch (err: any) {
      alert(err.message || 'Failed to create schedule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ─── Loading / Auth states ───────────────────────────────────────
  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    return null; // useSession already redirects
  }

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto space-y-6 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-10 h-10 rounded-xl" />
            <div><SkeletonBlock className="h-6 w-56 mb-2" /><SkeletonBlock className="h-4 w-72" /></div>
          </div>
          <div className="flex gap-3">
            <SkeletonBlock className="h-10 w-32 rounded-xl" />
            <SkeletonBlock className="h-10 w-24 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3].map((i) => <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"><SkeletonBlock className="h-3 w-24 mb-3" /><SkeletonBlock className="h-7 w-16" /></div>)}</div>
        <div className="flex flex-col sm:flex-row gap-3">
          <SkeletonBlock className="h-11 flex-1 rounded-xl" />
          <SkeletonBlock className="h-11 w-40 rounded-xl" />
          <SkeletonBlock className="h-11 w-40 rounded-xl" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50/80">{[32, 16, 32, 24, 16].map((w, i) => <th key={i} className="px-6 py-3.5"><SkeletonBlock className={`h-3 w-${w}`} /></th>)}</tr></thead>
            <tbody>{[1, 2, 3, 4, 5].map((i) => <tr key={i} className="border-b border-gray-50">{[20, 24, 32, 24, 20].map((w, j) => <td key={j} className="px-6 py-4"><SkeletonBlock className={`h-4 w-${w}`} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto space-y-6 px-4 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-sm shadow-purple-200">
            <Calendar className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scheduled Withdrawals</h1>
            <p className="text-sm text-gray-500">Manage your recurring withdrawal schedules</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreateModal(true)} className="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm shadow-purple-200">
            <Plus className="w-4 h-4" aria-hidden="true" /> Create Schedule
          </button>
          <button onClick={handleRefresh} disabled={isRefreshing} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3" role="alert">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError(null)} className="text-xs text-red-600 hover:text-red-800 mt-1">Dismiss</button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
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

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
          <input type="text" placeholder="Search by frequency, ID, or recipient..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} aria-label="Search schedules" className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" />
        </div>
        <div className="flex gap-2">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter by status" className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none pr-10 shadow-sm">
            <option value="All">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select value={filterFrequency} onChange={(e) => setFilterFrequency(e.target.value)} aria-label="Filter by frequency" className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 appearance-none pr-10 shadow-sm">
            <option value="All">All Frequencies</option>
            {FREQUENCY_OPTIONS.map((freq) => <option key={freq} value={freq}>{FREQUENCY_LABELS[freq]}</option>)}
          </select>
          <div className="flex items-center px-4 py-2 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-200 whitespace-nowrap">
            <span className="font-medium text-gray-700">{filteredData.length}</span>
            <span className="ml-1">schedules</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transfer Frequency</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Processing Date</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Destination</th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-4 bg-purple-50 rounded-full"><Calendar className="w-12 h-12 text-purple-400" aria-hidden="true" /></div>
                      <p className="text-gray-500 font-medium text-lg">No scheduled withdrawals created</p>
                      <p className="text-sm text-gray-400">Create a new schedule to get started</p>
                      <button onClick={() => setShowCreateModal(true)} className="mt-3 px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm shadow-purple-200">
                        <Plus className="w-4 h-4" aria-hidden="true" /> Create Schedule
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((schedule) => (
                  <tr key={schedule.id} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors group">
                    <td className="px-6 py-4"><span className="text-sm text-gray-700">{FREQUENCY_LABELS[schedule.frequency] || schedule.frequency}</span></td>
                    <td className="px-6 py-4"><StatusBadge status={schedule.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                        <span className="text-sm text-gray-700">{formatDate(schedule.nextDate)}</span>
                        <span className="text-xs text-gray-400 ml-1">{schedule.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {schedule.method === 'M-PESA' ? <Smartphone className="w-4 h-4 text-gray-400" aria-hidden="true" /> : <Landmark className="w-4 h-4 text-gray-400" aria-hidden="true" />}
                        <span className="text-sm text-gray-700">{schedule.method}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleViewDetails(schedule)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600" title="View Details" aria-label={`View details for schedule ${schedule.id}`}>
                          <Eye className="w-4 h-4" aria-hidden="true" />
                        </button>
                        {(schedule.status === 'PENDING' || schedule.status === 'PROCESSING' || schedule.status === 'PAUSED') && (
                          <button onClick={() => handleToggleStatus(schedule)} disabled={isToggling} className={`p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 ${schedule.status === 'PAUSED' ? 'text-emerald-400 hover:text-emerald-600' : 'text-amber-400 hover:text-amber-600'}`} title={schedule.status === 'PAUSED' ? 'Resume' : 'Pause'} aria-label={`${schedule.status === 'PAUSED' ? 'Resume' : 'Pause'} schedule ${schedule.id}`}>
                            {schedule.status === 'PAUSED' ? <Play className="w-4 h-4" aria-hidden="true" /> : <Pause className="w-4 h-4" aria-hidden="true" />}
                          </button>
                        )}
                        <button onClick={() => handleDelete(schedule)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-red-400 hover:text-red-600" title="Delete" aria-label={`Delete schedule ${schedule.id}`}>
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredData.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-400">Showing {filteredData.length} schedules</span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" aria-hidden="true" /> Last updated: {new Date().toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} role="dialog" aria-modal="true" aria-labelledby="create-modal-title">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 id="create-modal-title" className="text-lg font-bold text-gray-900">Schedule Withdrawals</h3>
                <p className="text-sm text-gray-500">Set up an automatic withdrawal schedule below.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" aria-label="Close dialog">
                <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Amount <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">KES</span>
                    <input type="number" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full pl-14 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" min="1" step="1" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Transfer frequency <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-5 gap-2">
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <button key={freq} type="button" onClick={() => setFormData({ ...formData, frequency: freq })} className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${formData.frequency === freq ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                        {FREQUENCY_LABELS[freq]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Next processing date <span className="text-red-500">*</span></label>
                    <input type="date" value={formData.nextDate} onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Time <span className="text-red-500">*</span></label>
                    <input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Withdraw To <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setFormData({ ...formData, method: 'Bank Transfer' })} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${formData.method === 'Bank Transfer' ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                      <Landmark className="w-4 h-4" aria-hidden="true" />
                      <div className="text-left"><div className="font-medium">Bank Account</div><div className="text-xs text-gray-400">Linked bank</div></div>
                    </button>
                    <button type="button" onClick={() => setFormData({ ...formData, method: 'M-PESA' })} className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${formData.method === 'M-PESA' ? 'border-purple-500 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                      <Smartphone className="w-4 h-4" aria-hidden="true" />
                      <div className="text-left"><div className="font-medium">Mobile Money</div><div className="text-xs text-gray-400">Linked phone</div></div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{formData.method === 'M-PESA' ? 'Mobile number' : 'Account number'}</label>
                  <input type="text" value={formData.destination_reference} onChange={(e) => setFormData({ ...formData, destination_reference: e.target.value })} placeholder={formData.method === 'M-PESA' ? 'e.g. 254XXXXXXXXX' : 'e.g. 0123456789'} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none" />
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Summary</p>
                  <div className="space-y-2">
                    <div className="flex justify-between"><span className="text-sm text-gray-500">Amount</span><span className="text-sm font-medium text-gray-900">{formData.amount ? `KES ${parseFloat(formData.amount).toLocaleString()}` : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-500">Transfer frequency</span><span className="text-sm font-medium text-gray-900">{FREQUENCY_LABELS[formData.frequency]}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-500">Start processing</span><span className="text-sm font-medium text-gray-900">{formData.nextDate || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-500">Time</span><span className="text-sm font-medium text-gray-900">{formData.time || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-gray-500">Destination</span><span className="text-sm font-medium text-gray-900">{formData.method}</span></div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input type="checkbox" id="confirmAccuracy" checked={formData.confirmAccuracy} onChange={(e) => setFormData({ ...formData, confirmAccuracy: e.target.checked })} className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                  <label htmlFor="confirmAccuracy" className="text-sm text-gray-600">I confirm the details are correct and understand that any errors may cause processing delays.</label>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4" role="note">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div><p className="text-sm text-amber-800">A minimum balance is required for the automatic transfer to take place. Bank charges may apply per transfer.</p></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex gap-3">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleCreateSchedule} disabled={isSubmitting} className="flex-1 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Creating...</> : <><Plus className="w-4 h-4" aria-hidden="true" /> Create Schedule</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showModal && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} role="dialog" aria-modal="true" aria-labelledby="details-modal-title">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${selectedSchedule.status === 'PENDING' || selectedSchedule.status === 'PROCESSING' ? 'bg-emerald-500' : selectedSchedule.status === 'PAUSED' ? 'bg-amber-500' : selectedSchedule.status === 'FAILED' ? 'bg-red-500' : 'bg-gray-500'}`} aria-hidden="true" />
                <h3 id="details-modal-title" className="text-lg font-bold text-gray-900">Schedule Details</h3>
                <span className="text-xs text-gray-400 font-mono ml-2">#{selectedSchedule.id.slice(0, 8)}</span>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-lg transition-colors" aria-label="Close dialog">
                <X className="w-5 h-5 text-gray-500" aria-hidden="true" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Frequency</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{FREQUENCY_LABELS[selectedSchedule.frequency] || selectedSchedule.frequency}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Recipient</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{selectedSchedule.recipient}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Status</p>
                    <div className="mt-1"><StatusBadge status={selectedSchedule.status} /></div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Payment Method</p>
                    <div className="mt-1"><MethodBadge method={selectedSchedule.method} /></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-4 border border-purple-200/50">
                    <p className="text-xs text-gray-500 uppercase font-medium tracking-wider">Amount</p>
                    <p className="text-3xl font-bold text-purple-700 mt-1">{formatCurrency(selectedSchedule.amount)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase font-medium tracking-wider">Schedule Dates</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Created</span><span className="text-sm font-medium text-gray-900">{formatDate(selectedSchedule.startDate)}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Next run</span><span className="text-sm font-medium text-emerald-600">{formatDate(selectedSchedule.nextDate)}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-gray-500">Time</span><span className="text-sm font-medium text-gray-900">{selectedSchedule.time}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap gap-3">
                {(selectedSchedule.status === 'PENDING' || selectedSchedule.status === 'PROCESSING' || selectedSchedule.status === 'PAUSED') && (
                  <button onClick={() => handleToggleStatus(selectedSchedule)} disabled={isToggling} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 disabled:opacity-50 ${selectedSchedule.status === 'PAUSED' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                    {selectedSchedule.status === 'PAUSED' ? <><Play className="w-4 h-4" aria-hidden="true" /> Resume Schedule</> : <><Pause className="w-4 h-4" aria-hidden="true" /> Pause Schedule</>}
                  </button>
                )}
                <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2">
                  <Printer className="w-4 h-4" aria-hidden="true" /> Print
                </button>
                <button className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2" aria-label="Email schedule (coming soon)" title="Coming soon">
                  <Mail className="w-4 h-4" aria-hidden="true" /> Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" aria-hidden="true" />
                </div>
              </div>
              <h3 id="delete-modal-title" className="text-xl font-bold text-gray-900 text-center">Delete Schedule</h3>
              <p className="text-sm text-gray-500 text-center mt-1">Are you sure you want to delete this schedule? This action cannot be undone.</p>

              <div className="mt-4 bg-gray-50 rounded-xl p-3">
                <p className="text-sm font-medium text-gray-900">{FREQUENCY_LABELS[selectedSchedule.frequency] || selectedSchedule.frequency} — {formatCurrency(selectedSchedule.amount)}</p>
                <p className="text-xs text-gray-500 font-mono">{selectedSchedule.id.slice(0, 12)}</p>
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all disabled:opacity-50">Cancel</button>
                <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isDeleting ? <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Deleting...</> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}