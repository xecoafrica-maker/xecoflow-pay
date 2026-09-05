// src/app/login/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  Clock,
  Loader2,
  AlertTriangle,
  X,
  ChevronRight,
} from 'lucide-react';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Constants ──────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const TOAST_DURATION = 5000;
const SESSION_DURATION = 5 * 60; // 5 minutes in seconds

// ─── Types ──────────────────────────────────────────────────────────
interface LoginAttempt {
  count: number;
  timestamp: number;
  lockedUntil?: number;
}

// ─── Toast Component ──────────────────────────────────────────────
const Toast = ({ 
  type, 
  title, 
  message, 
  onClose 
}: { 
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  onClose: () => void;
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 300);
    }, TOAST_DURATION);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const colors = {
    error: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-500',
      title: 'text-red-700 dark:text-red-400',
      message: 'text-red-600 dark:text-red-300',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-500',
      title: 'text-amber-700 dark:text-amber-400',
      message: 'text-amber-600 dark:text-amber-300',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-500',
      title: 'text-blue-700 dark:text-blue-400',
      message: 'text-blue-600 dark:text-blue-300',
    },
    success: {
      bg: 'bg-green-50 dark:bg-green-950/30',
      border: 'border-green-200 dark:border-green-800',
      icon: 'text-green-500',
      title: 'text-green-700 dark:text-green-400',
      message: 'text-green-600 dark:text-green-300',
    },
  };

  const color = colors[type];
  const Icon = type === 'error' ? AlertTriangle : type === 'warning' ? AlertCircle : AlertCircle;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div className={`p-4 ${color.bg} border ${color.border} rounded-xl shadow-lg flex items-start gap-3 relative overflow-hidden`}>
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 animate-shrink" />
        
        <Icon className={`w-5 h-5 ${color.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <p className={`text-sm font-medium ${color.title}`}>{title}</p>
          <p className={`text-sm ${color.message}`}>{message}</p>
        </div>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(() => {
              setIsVisible(false);
              onClose();
            }, 300);
          }}
          className="p-1 hover:bg-white/50 rounded-lg transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default function LoginPage() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();
  
  // ─── State ────────────────────────────────────────────────────────
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_LOGIN_ATTEMPTS);
  
  // ─── Toast State ──────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'error' | 'warning' | 'info' | 'success'; title: string; message: string }>>([]);

  // ── Refs ──────────────────────────────────────────────────────────
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toastIdCounter = useRef(0);

  // ─── Show Toast ──────────────────────────────────────────────────
  const showToast = (type: 'error' | 'warning' | 'info' | 'success', title: string, message: string) => {
    const id = String(toastIdCounter.current++);
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // ─── Load Login Attempts from LocalStorage ──────────────────────
  useEffect(() => {
    const loadAttemptData = () => {
      try {
        const stored = localStorage.getItem(`login_attempts_${identifier || 'default'}`);
        if (stored) {
          const data: LoginAttempt = JSON.parse(stored);
          
          if (data.lockedUntil && data.lockedUntil > Date.now()) {
            setIsLocked(true);
            setLockoutTimeLeft(Math.ceil((data.lockedUntil - Date.now()) / 1000));
            startLockTimer(data.lockedUntil);
          }
          
          if (data.timestamp && Date.now() - data.timestamp > LOCKOUT_DURATION) {
            resetAttempts();
          } else {
            setAttemptsRemaining(MAX_LOGIN_ATTEMPTS - data.count);
          }
        }
      } catch (e) {
        console.debug('Failed to load attempt data');
      }
    };
    
    loadAttemptData();
    
    return () => {
      if (lockTimerRef.current) {
        clearInterval(lockTimerRef.current);
      }
    };
  }, [identifier]);

  // ─── Lock Timer ──────────────────────────────────────────────────
  const startLockTimer = (lockedUntil: number) => {
    if (lockTimerRef.current) {
      clearInterval(lockTimerRef.current);
    }
    
    lockTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setIsLocked(false);
        setLockoutTimeLeft(0);
        clearInterval(lockTimerRef.current!);
        resetAttempts();
      } else {
        setLockoutTimeLeft(remaining);
      }
    }, 1000);
  };

  // ─── Reset Attempts ──────────────────────────────────────────────
  const resetAttempts = () => {
    localStorage.removeItem(`login_attempts_${identifier || 'default'}`);
    setAttemptsRemaining(MAX_LOGIN_ATTEMPTS);
    setIsLocked(false);
    setLockoutTimeLeft(0);
  };

  // ─── Track Failed Attempt ────────────────────────────────────────
  const trackFailedAttempt = () => {
    const key = identifier || 'default';
    const stored = localStorage.getItem(`login_attempts_${key}`);
    let data: LoginAttempt = { count: 0, timestamp: Date.now() };
    
    if (stored) {
      try {
        data = JSON.parse(stored);
      } catch (e) {
        // Ignore
      }
    }
    
    data.count += 1;
    data.timestamp = Date.now();
    
    if (data.count >= MAX_LOGIN_ATTEMPTS) {
      data.lockedUntil = Date.now() + LOCKOUT_DURATION;
      setIsLocked(true);
      startLockTimer(data.lockedUntil);
      showToast('error', 'Account Locked', 'Too many failed attempts. Please try again in 15 minutes.');
    }
    
    localStorage.setItem(`login_attempts_${key}`, JSON.stringify(data));
    setAttemptsRemaining(MAX_LOGIN_ATTEMPTS - data.count);
  };

  // ─── Clear Attempts on Success ──────────────────────────────────
  const clearAttempts = () => {
    localStorage.removeItem(`login_attempts_${identifier || 'default'}`);
    setAttemptsRemaining(MAX_LOGIN_ATTEMPTS);
    setIsLocked(false);
    setLockoutTimeLeft(0);
  };

  // ─── Format Lockout Time ─────────────────────────────────────────
  const formatLockoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // ─── MAIN LOGIN HANDLER ──────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      showToast('error', 'Account Locked', 'Too many failed attempts. Please try again in 15 minutes.');
      return;
    }

    if (!identifier || !password) {
      showToast('warning', 'Validation Error', 'Please enter your email and password');
      return;
    }

    setLoading(true);

    try {
      // ─── Determine if identifier is email or merchant ID ────────────
      const isEmail = identifier.includes('@') && identifier.includes('.');
      const isMerchantId = /^[A-Z0-9]{8,}$/.test(identifier.toUpperCase());
      
      // ─── Prepare login payload ──────────────────────────────────────
      const loginPayload = {
        identifier,
        password,
      };

      console.log('🔐 Login attempt for:', { identifier, isEmail, isMerchantId });

      // ─── Call the Next.js API route ──────────────────────────────────
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      });

      const data = await response.json();

      console.log('📤 Login response status:', response.status);

      // ─── Rate Limit Error Handling ──────────────────────────────────
      if (response.status === 429) {
        const retryAfter = data.retryAfter || 60;
        showToast('warning', 'Too Many Requests', `Please wait ${retryAfter} seconds before trying again.`);
        setLoading(false);
        return;
      }

      // ─── Extract token from response ─────────────────────────────────
      let token = null;
      let userData = null;

      if (data.token) {
        token = data.token;
        userData = data.user || data;
      } 
      else if (data.data && data.data.accessToken) {
        token = data.data.accessToken;
        userData = data.data;
      }
      else if (data.accessToken) {
        token = data.accessToken;
        userData = data;
      }
      
      console.log('🔑 Extracted token:', token ? token.substring(0, 30) + '...' : 'NO TOKEN');

      if (!token) {
        if (data.error?.includes('Too many') || data.error?.includes('rate')) {
          showToast('warning', 'Too Many Attempts', data.error || 'Please wait before trying again.');
          trackFailedAttempt();
        } else {
          showToast('error', 'Login Failed', data.error || 'Invalid credentials. Please try again.');
          trackFailedAttempt();
        }
        setLoading(false);
        return;
      }

      // ─── Get user data ──────────────────────────────────────────────
      const user = {
        userId: Number(userData?.userId || userData?.user_id || 0),
        email: userData?.email || identifier,
        role: userData?.role || 'merchant',
        businessName: userData?.businessName || userData?.business_name || '',
      };

      console.log('✅ Login successful for:', user);

      // ─── Store token and user data (5 minutes session) ─────────────
      const expiryTime = Date.now() + SESSION_DURATION * 1000;
      
      localStorage.setItem('xecoflow_token', token);
      localStorage.setItem('token_expiry', String(expiryTime));
      localStorage.setItem('session_start', String(Date.now()));
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user_role', user.role);

      clearAttempts();

      document.cookie = `auth_token=${token}; path=/; max-age=${SESSION_DURATION}; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`;

      await log(
        ActivityActions.LOGIN,
        `Successful login for ${user.email} (Role: ${user.role})`
      );

      showToast('success', 'Welcome Back!', `Signed in as ${user.role}`);

      setTimeout(() => {
        if (user.role === 'developer') {
          router.push('/developer/dashboard');
        } else {
          router.push('/dashboard');
        }
      }, 500);

      return;

    } catch (err: any) {
      console.error('❌ Login error:', err);
      trackFailedAttempt();
      
      await log(
        'Failed login attempt',
        `Failed login attempt for ${identifier} - ${err.message || 'Unknown error'}`
      );
      
      if (err.message?.includes('Too many') || err.message?.includes('rate')) {
        showToast('warning', 'Too Many Requests', err.message || 'Please wait before trying again.');
      } else {
        showToast('error', 'Error', err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0a2540] dark:to-[#0f1f3a] flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* ─── TOAST NOTIFICATIONS ── */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* ─── MAIN CONTAINER - Expanded Width ─── */}
      <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-white dark:bg-[#0f1f3a] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
        
        {/* ── LEFT PANEL – Brand ── */}
        <div className="lg:w-1/2 bg-[#0a2540] p-8 sm:p-10 md:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden min-h-[400px] lg:min-h-[550px]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-[#0a2540] to-emerald-900/20" />
          <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* ── Brand ── */}
            <div>
              <Link href="/" className="inline-block">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Xeco<span className="text-emerald-400">Flow</span>
                </h1>
              </Link>
            </div>

            {/* ── Hero Text ── */}
            <div className="space-y-3 sm:space-y-4 py-6 sm:py-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Modern payments
                <br />
                for African
                <br />
                <span className="text-emerald-400">businesses.</span>
              </h2>
              <p className="text-slate-400 text-sm sm:text-base max-w-sm">
                Accept M-PESA, Airtel Money, cards, and bank transfers through a single API.
              </p>
            </div>

            {/* ─── Accepted Channels ── */}
            <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Accepted Channels</span>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="bg-white/5 px-3 py-1.5 rounded-full text-xs sm:text-sm text-slate-300">M-PESA</span>
                <span className="bg-white/5 px-3 py-1.5 rounded-full text-xs sm:text-sm text-slate-300">Airtel Money</span>
                <span className="bg-white/5 px-3 py-1.5 rounded-full text-xs sm:text-sm text-slate-300">Visa</span>
                <span className="bg-white/5 px-3 py-1.5 rounded-full text-xs sm:text-sm text-slate-300">Mastercard</span>
                <span className="bg-white/5 px-3 py-1.5 rounded-full text-xs sm:text-sm text-slate-300">Banks</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL – Login Form ── */}
        <div className="lg:w-1/2 p-6 sm:p-8 md:p-10 lg:p-12 bg-white dark:bg-[#0f1f3a]">
          <div className="max-w-sm mx-auto w-full">
            {/* ── Mobile Brand (hidden on desktop) ── */}
            <div className="lg:hidden mb-6 sm:mb-8">
              <Link href="/" className="inline-block">
                <h1 className="text-2xl font-bold text-[#0a2540] dark:text-white">
                  Xeco<span className="text-emerald-500">Flow</span>
                </h1>
              </Link>
            </div>

            {/* ── Header ── */}
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Sign in to your XecoFlow account
              </p>
            </div>

            {/* ─── LOGIN FORM ───────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* ── Email Field ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#1a2a4a] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                    required
                    autoFocus
                    disabled={isLocked}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* ── Password Field ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 bg-gray-50 dark:bg-[#1a2a4a] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                    required
                    disabled={isLocked}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    disabled={isLocked}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* ── Remember Me & Forgot Password ── */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                    disabled={isLocked}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Remember for 30 days</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* ── Attempts Remaining Indicator ── */}
              {!isLocked && attemptsRemaining < MAX_LOGIN_ATTEMPTS && attemptsRemaining > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span>{attemptsRemaining} login attempt{attemptsRemaining !== 1 ? 's' : ''} remaining</span>
                </div>
              )}

              {/* ── Submit Button ── */}
              {isLocked ? (
                <div className="w-full py-3.5 bg-gray-400 cursor-not-allowed text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Too many attempts - Try again in {formatLockoutTime(lockoutTimeLeft)}
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !identifier || !password}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </form>

            {/* ─── Footer ── */}
            <div className="mt-6 space-y-4">
              {/* ── Terms & Privacy ── */}
              <p className="text-xs text-center text-gray-400 dark:text-gray-500 leading-relaxed">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline">
                  Privacy Policy
                </Link>
              </p>

              {/* ── Create Account ── */}
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                New to XecoFlow?{' '}
                <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center gap-1">
                  Create account
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CSS Animation ──────────────────────────────────────────── */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink {
          animation: shrink ${TOAST_DURATION}ms linear forwards;
        }
      `}</style>
    </div>
  );
}