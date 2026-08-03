// src/app/dashboard/activity-logs/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  ChevronDown,
  User,
  Clock,
  Mail,
  LogIn,
  Eye,
  Settings,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Users,
  Bell,
  Shield,
  FileText,
  MessageSquare,
  Loader2,
  AlertTriangle,
  MapPin,
  Globe,
} from 'lucide-react';
import { getToken, getStoredMerchant } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Supabase Client ──────────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// ─── Types ──────────────────────────────────────────────────────────
interface ActivityLog {
  id: string;
  merchant_id: number;
  email: string;
  action: string;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface GroupedLogs {
  [date: string]: ActivityLog[];
}

// ─── Extract Location from Details ─────────────────────────────────
const extractLocation = (details: string): { city: string; country: string; full: string } | null => {
  const match = details?.match(/Location: ([^,]+), ([^)]+)/);
  if (match) {
    return {
      city: match[1].trim(),
      country: match[2].trim(),
      full: `${match[1].trim()}, ${match[2].trim()}`
    };
  }
  
  const simpleMatch = details?.match(/Location: ([^)]+)/);
  if (simpleMatch) {
    const parts = simpleMatch[1].split(',');
    if (parts.length >= 2) {
      return {
        city: parts[0].trim(),
        country: parts[parts.length - 1].trim(),
        full: simpleMatch[1].trim()
      };
    }
    return {
      city: simpleMatch[1].trim(),
      country: '',
      full: simpleMatch[1].trim()
    };
  }
  
  return null;
};

// ─── Activity Icon Component ──────────────────────────────────────
const ActivityIcon = ({ action }: { action: string }) => {
  const getIcon = () => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('login') || actionLower.includes('logout')) {
      return { icon: LogIn, color: 'bg-blue-50 text-blue-600' };
    }
    if (actionLower.includes('transaction') || actionLower.includes('payment')) {
      return { icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' };
    }
    if (actionLower.includes('withdraw')) {
      return { icon: ArrowUpRight, color: 'bg-amber-50 text-amber-600' };
    }
    if (actionLower.includes('beneficiary')) {
      return { icon: Users, color: 'bg-purple-50 text-purple-600' };
    }
    if (actionLower.includes('profile') || actionLower.includes('account')) {
      return { icon: User, color: 'bg-indigo-50 text-indigo-600' };
    }
    if (actionLower.includes('security') || actionLower.includes('api') || actionLower.includes('key')) {
      return { icon: Shield, color: 'bg-red-50 text-red-600' };
    }
    if (actionLower.includes('statement')) {
      return { icon: FileText, color: 'bg-cyan-50 text-cyan-600' };
    }
    if (actionLower.includes('pin') || actionLower.includes('app')) {
      return { icon: Settings, color: 'bg-pink-50 text-pink-600' };
    }
    if (actionLower.includes('dashboard')) {
      return { icon: Activity, color: 'bg-indigo-50 text-indigo-600' };
    }
    return { icon: Activity, color: 'bg-gray-50 text-gray-600' };
  };

  const { icon: Icon, color } = getIcon();
  return (
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
      <Icon className="w-5 h-5" />
    </div>
  );
};

// ─── Location Badge Component ──────────────────────────────────────
const LocationBadge = ({ city, country }: { city: string; country: string }) => {
  if (!city) return null;
  
  const getCountryEmoji = (countryCode: string) => {
    const emojis: Record<string, string> = {
      'Kenya': '🇰🇪',
      'Tanzania': '🇹🇿',
      'Uganda': '🇺🇬',
      'Rwanda': '🇷🇼',
      'Burundi': '🇧🇮',
      'South Africa': '🇿🇦',
      'Nigeria': '🇳🇬',
      'Ghana': '🇬🇭',
      'Egypt': '🇪🇬',
      'Ethiopia': '🇪🇹',
      'United States': '🇺🇸',
      'United Kingdom': '🇬🇧',
      'Germany': '🇩🇪',
      'France': '🇫🇷',
      'Canada': '🇨🇦',
      'Australia': '🇦🇺',
      'India': '🇮🇳',
      'China': '🇨🇳',
      'Japan': '🇯🇵',
    };
    return emojis[country] || '🌍';
  };

  const flag = getCountryEmoji(country);
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      <MapPin className="w-3 h-3" />
      {city}
      <span className="ml-0.5">{flag}</span>
    </span>
  );
};

export default function ActivityLogsPage() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [merchantId, setMerchantId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const hasLoggedView = useRef(false);
  const isLoggingView = useRef(false);

  // ─── Fetch Activity Logs ──────────────────────────────────────────
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      if (!supabase) {
        setError('Supabase is not configured. Please check your .env file.');
        setLoading(false);
        return;
      }

      const cached = getStoredMerchant();
      let id = cached?.merchant_id || cached?.merchantId;
      
      if (!id) {
        setError('No merchant ID found. Please log in again.');
        setLoading(false);
        return;
      }

      setMerchantId(id);

      // ✅ Already ordered by created_at DESC from the query
      const { data, error: supabaseError } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('merchant_id', id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (supabaseError) {
        console.error('Error fetching logs:', supabaseError);
        setError('Failed to load activity logs. Please try again.');
        setLogs([]);
      } else {
        setLogs(data || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('An unexpected error occurred. Please try again.');
      setLogs([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // ─── Log view only once ──────────────────────────────────────────
  useEffect(() => {
    const logView = async () => {
      if (isLoggingView.current || hasLoggedView.current) {
        return;
      }
      
      try {
        isLoggingView.current = true;
        
        const cached = getStoredMerchant();
        if (cached?.merchant_id && supabase) {
          await log(
            ActivityActions.VIEW_ACTIVITY_LOGS,
            `Viewed activity logs for ${cached.business_name || 'business'}`
          );
          hasLoggedView.current = true;
        }
      } catch (error) {
        console.debug('Activity logging skipped:', error);
      } finally {
        isLoggingView.current = false;
      }
    };
    
    logView();
    fetchLogs();
  }, []);

  // ─── Search Filter ──────────────────────────────────────────────
  const filteredLogs = logs.filter(
    (log) =>
      log.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.includes(searchTerm)
  );

  // ─── Group Logs by Date ──────────────────────────────────────────
  const groupLogsByDate = (logs: ActivityLog[]): GroupedLogs => {
    const groups: GroupedLogs = {};
    
    logs.forEach((log) => {
      const date = new Date(log.created_at);
      const dateStr = date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(log);
    });
    
    return groups;
  };

  // ✅ Get dates sorted in descending order (most recent first)
  const sortedGroupedLogs = Object.entries(groupLogsByDate(filteredLogs))
    .sort(([dateA], [dateB]) => {
      // Parse dates and compare
      const dateAObj = new Date(dateA);
      const dateBObj = new Date(dateB);
      return dateBObj.getTime() - dateAObj.getTime(); // Descending (newest first)
    });

  // ─── Format Time ──────────────────────────────────────────────────
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    hasLoggedView.current = false;
    fetchLogs();
  };

  // ─── Loading State ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading activity logs...</p>
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            Try Again
          </button>
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
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
              <p className="text-sm text-gray-500">
                A complete record of user actions and system events.
                {logs.length > 0 && ` (${logs.length} events)`}
              </p>
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
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
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
            placeholder="Search by user, action, IP, city, or country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
            <Calendar className="w-4 h-4" />
            30 Days
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <div className="flex items-center px-4 py-2 bg-gray-50 rounded-xl text-sm text-gray-500 border border-gray-200">
            <span className="font-medium text-gray-700">{filteredLogs.length}</span>
            <span className="ml-1">events</span>
          </div>
        </div>
      </div>

      {/* ─── Activity Logs ──────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          {sortedGroupedLogs.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-indigo-50 rounded-full">
                  <Activity className="w-14 h-14 text-indigo-400" />
                </div>
                <div>
                  <p className="text-gray-500 font-medium text-lg">
                    {searchTerm ? 'No matching logs found' : 'No activity logs yet'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchTerm 
                      ? 'Try adjusting your search terms' 
                      : 'User actions and system events will appear here'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            sortedGroupedLogs.map(([dateGroup, dateLogs]) => (
              <div key={dateGroup} className="mb-8 last:mb-0">
                {/* ─── Date Header ─────────────────────────────────── */}
                <h3 className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">
                  {dateGroup}
                </h3>

                {/* ─── Log Items ───────────────────────────────────── */}
                <div className="space-y-4">
                  {dateLogs.map((log) => {
                    const location = extractLocation(log.details);
                    return (
                      <div key={log.id} className="flex items-start gap-4 hover:bg-gray-50/50 rounded-lg p-2 -mx-2 transition-colors">
                        <ActivityIcon action={log.action} />
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Mail className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {log.email}
                              </span>
                              {location && (
                                <LocationBadge city={location.city} country={location.country} />
                              )}
                            </div>
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {formatTime(log.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5 break-words">
                            {log.action}
                          </p>
                          {log.details && (
                            <p className="text-xs text-gray-400 mt-1 break-words">
                              {log.details}
                            </p>
                          )}
                          {log.ip_address && (
                            <div className="flex items-center gap-2 mt-1">
                              <Globe className="w-3 h-3 text-gray-300" />
                              <span className="text-[10px] text-gray-300 font-mono">
                                IP: {log.ip_address}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ─── Footer ────────────────────────────────────────────────── */}
        {filteredLogs.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-xs text-gray-400">
              Showing {filteredLogs.length} of {logs.length} events
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              Real-time updates
            </span>
          </div>
        )}
      </div>
    </div>
  );
}