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
  Users, 
  Code, 
  Building, 
  Key, 
  ChevronRight,
  AlertCircle,
  Clock,
  Loader2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Constants ──────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const TOAST_DURATION = 5000;

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
  type: 'error' | 'warning' | 'info';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<'merchant' | 'developer'>('merchant');
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_LOGIN_ATTEMPTS);
  
  // ─── Toast State ──────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'error' | 'warning' | 'info'; title: string; message: string }>>([]);

  // ── XecoFlow ID Login State ──
  const [useXecoflowId, setUseXecoflowId] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [xecoflowLoading, setXecoflowLoading] = useState(false);
  const [xecoflowError, setXecoflowError] = useState('');

  // ── Refs ──────────────────────────────────────────────────────────
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toastIdCounter = useRef(0);

  // ─── Show Toast ──────────────────────────────────────────────────
  const showToast = (type: 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = String(toastIdCounter.current++);
    console.log('📢 Showing toast:', { type, title, message });
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // ─── Load Login Attempts from LocalStorage ──────────────────────
  useEffect(() => {
    const loadAttemptData = () => {
      try {
        const stored = localStorage.getItem(`login_attempts_${email || 'default'}`);
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
  }, [email]);

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
    localStorage.removeItem(`login_attempts_${email || 'default'}`);
    setAttemptsRemaining(MAX_LOGIN_ATTEMPTS);
    setIsLocked(false);
    setLockoutTimeLeft(0);
  };

  // ─── Track Failed Attempt ────────────────────────────────────────
  const trackFailedAttempt = () => {
    const key = email || 'default';
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
    localStorage.removeItem(`login_attempts_${email || 'default'}`);
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

  // ── Email Login ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isLocked) {
      showToast('error', 'Account Locked', 'Too many failed attempts. Please try again in 15 minutes.');
      return;
    }

    if (!email || !password) {
      showToast('error', 'Error', 'Please enter your email and password');
      return;
    }

    setLoading(true);

    try {
      // ─── Call the Next.js API route ──────────────────────────────────
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      console.log('📤 Login response status:', response.status);
      console.log('📤 Login response data:', data);

      // ─── Handle rate limiting ──────────────────────────────────
      if (response.status === 429) {
        showToast('error', 'Too Many Attempts', data.error || 'Please wait before trying again.');
        setLoading(false);
        return;
      }

      // ─── Handle locked account ──────────────────────────────────
      if (data.code === 'RATE_LIMITED' || data.lockoutRemaining || data.locked) {
        showToast('error', 'Account Locked', data.error || 'Too many failed attempts. Please try again later.');
        setLoading(false);
        return;
      }

      // ─── Handle email verification required ─────────────────────
      if (data.requiresVerification) {
        showToast('warning', 'Verification Required', 'Please verify your email before logging in. Check your inbox.');
        setLoading(false);
        return;
      }

      // ─── Handle OTP required ────────────────────────────────────
      if (data.requiresOTP) {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        setLoading(false);
        return;
      }

      // ─── Handle invalid credentials ─────────────────────────────
      if (!data.success) {
        trackFailedAttempt();
        await log(
          'Failed login attempt',
          `Failed login attempt for ${email} - ${data.error || 'Invalid credentials'}`
        );
        
        // Show attempts remaining if available
        let errorMessage = data.error || 'Invalid email or password';
        if (data.attempts_remaining !== undefined && data.attempts_remaining > 0) {
          errorMessage = `${errorMessage} (${data.attempts_remaining} attempts remaining)`;
        }
        
        showToast('error', 'Login Failed', errorMessage);
        setLoading(false);
        return;
      }

      // ─── Handle successful login ────────────────────────────────
      if (data.success && data.token) {
        clearAttempts();
        
        await log(
          ActivityActions.LOGIN,
          `User logged in successfully`
        );

        console.log('✅ Login successful, storing token and redirecting...');

        // ─── Store token and merchant data ────────────────────────
        localStorage.setItem('xecoflow_token', data.token);
        localStorage.setItem('token_expiry', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
        localStorage.setItem('session_start', String(Date.now()));

        if (data.merchant) {
          localStorage.setItem('merchant', JSON.stringify(data.merchant));
        }

        // ─── Set cookie for middleware ─────────────────────────────
        document.cookie = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`;

        // ─── Redirect based on role ────────────────────────────────
        if (role === 'developer') {
          router.push('/developer/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        trackFailedAttempt();
        showToast('error', 'Login Failed', data.error || 'Invalid email or password');
      }
    } catch (err: any) {
      console.error('❌ Login error:', err);
      trackFailedAttempt();
      await log(
        'Failed login attempt',
        `Failed login attempt for ${email} - ${err.message || 'Unknown error'}`
      );
      showToast('error', 'Error', err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // ── XecoFlow ID Login ──
  const handleXecoflowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setXecoflowError('');

    if (!businessName || !merchantId) {
      setXecoflowError('Please enter both Business Name and Merchant ID');
      return;
    }

    setXecoflowLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/auth/login-xecoflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, merchantId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await log(
          ActivityActions.LOGIN,
          `XecoFlow ID login successful for ${businessName} (ID: ${merchantId})`
        );
        
        localStorage.setItem('xecoflow_token', data.token);
        localStorage.setItem('token_expiry', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
        localStorage.setItem('session_start', String(Date.now()));
        
        if (data.merchant) {
          localStorage.setItem('merchant', JSON.stringify(data.merchant));
        }

        document.cookie = `auth_token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`;

        router.push('/dashboard');
      } else {
        setXecoflowError(data.message || 'Login failed. Please check your credentials.');
        await log(
          'Failed XecoFlow ID login',
          `Failed XecoFlow ID login for ${businessName} (ID: ${merchantId}) - ${data.message || 'Unknown error'}`
        );
      }
    } catch (err: any) {
      setXecoflowError('Failed to connect to server. Please try again.');
    } finally {
      setXecoflowLoading(false);
    }
  };

  const switchToXecoflow = () => {
    setUseXecoflowId(true);
    setXecoflowError('');
    setBusinessName('');
    setMerchantId('');
  };

  const switchToEmail = () => {
    setUseXecoflowId(false);
    setXecoflowError('');
    setBusinessName('');
    setMerchantId('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0a2540] dark:to-[#0f1f3a] flex items-center justify-center p-4">
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

      <div className="w-full max-w-6xl flex flex-col lg:flex-row bg-white dark:bg-[#0f1f3a] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
        
        {/* ── LEFT PANEL – Brand ── */}
        <div className="lg:w-1/2 bg-[#0a2540] p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden min-h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-[#0a2540] to-emerald-900/20" />
          <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <Link href="/" className="inline-block">
                <h1 className="text-3xl font-bold text-white">
                  Xeco<span className="text-emerald-400">Flow</span>
                </h1>
              </Link>
            </div>

            <div className="space-y-4 py-8">
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                {role === 'merchant' ? (
                  <>
                    Modern payments
                    <br />
                    for African
                    <br />
                    <span className="text-emerald-400">businesses.</span>
                  </>
                ) : (
                  <>
                    Build, test, and
                    <br />
                    integrate payments
                    <br />
                    <span className="text-emerald-400">with ease.</span>
                  </>
                )}
              </h2>
              <p className="text-slate-400 text-base max-w-sm">
                {role === 'merchant' 
                  ? 'Accept M-PESA, Airtel Money, cards, and bank transfers through a single API.'
                  : 'Access powerful APIs, webhooks, and developer tools to build payment solutions.'}
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap pt-4 border-t border-white/10">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Accepted</span>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="bg-white/5 px-3 py-1 rounded-full text-xs">M-PESA</span>
                <span className="bg-white/5 px-3 py-1 rounded-full text-xs">Airtel</span>
                <span className="bg-white/5 px-3 py-1 rounded-full text-xs">Visa</span>
                <span className="bg-white/5 px-3 py-1 rounded-full text-xs">Mastercard</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL – Login Form ── */}
        <div className="lg:w-1/2 p-8 lg:p-12 bg-white dark:bg-[#0f1f3a]">
          <div className="max-w-sm mx-auto w-full">
            <div className="lg:hidden mb-8">
              <Link href="/" className="inline-block">
                <h1 className="text-2xl font-bold text-[#0a2540] dark:text-white">
                  Xeco<span className="text-emerald-500">Flow</span>
                </h1>
              </Link>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Sign in to your account
              </p>
            </div>

            {/* ── Role Selector ── */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-[#1a2a4a] rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
              <button
                type="button"
                onClick={() => setRole('merchant')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  role === 'merchant'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-[#1a2a4a]'
                }`}
              >
                <Users className="w-4 h-4" />
                Merchant
              </button>
              <button
                type="button"
                onClick={() => setRole('developer')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                  role === 'developer'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-[#1a2a4a]'
                }`}
              >
                <Code className="w-4 h-4" />
                Developer
              </button>
            </div>

            {/* ── LOGIN FORM ── */}
            {!useXecoflowId ? (
              /* ─── EMAIL LOGIN ─── */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email address or Merchant ID
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email or ID number"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#1a2a4a] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                      required
                      autoFocus
                      disabled={isLocked}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full pl-10 pr-11 py-3 bg-gray-50 dark:bg-[#1a2a4a] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white"
                      required
                      disabled={isLocked}
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

                {isLocked ? (
                  <div className="w-full py-3.5 bg-gray-400 cursor-not-allowed text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    Too many attempts - Try again in {formatLockoutTime(lockoutTimeLeft)}
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || !email || !password}
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

                {/* ── OR DIVIDER ── */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-3 bg-white dark:bg-[#0f1f3a] text-gray-400 dark:text-gray-500">Or continue with</span>
                  </div>
                </div>

                {/* ── XECOFLOW ID LINK ── */}
                <button
                  type="button"
                  onClick={switchToXecoflow}
                  className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300 group"
                >
                  <Building className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                  Login with XecoFlow ID
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </button>
              </form>
            ) : (
              /* ─── XECOFLOW ID LOGIN ─── */
              <div>
                {xecoflowError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">Error</p>
                      <p className="text-sm text-red-600 dark:text-red-300">{xecoflowError}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <button
                    type="button"
                    onClick={switchToEmail}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    ← Back
                  </button>
                </div>

                <form onSubmit={handleXecoflowSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Business Name</label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Enter your business name"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#1a2a4a] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Merchant ID</label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={merchantId}
                        onChange={(e) => setMerchantId(e.target.value)}
                        placeholder="Enter your merchant ID"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#1a2a4a] border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={xecoflowLoading || !businessName || !merchantId}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    {xecoflowLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        Login with XecoFlow ID
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ── Footer Links ── */}
            <div className="mt-6 space-y-3">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                {role === 'merchant' ? (
                  <>
                    Don't have a merchant account?{' '}
                    <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                      Sign up
                    </Link>
                  </>
                ) : (
                  <>
                    New developer?{' '}
                    <Link href="/developer/signup" className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                      Create developer account
                    </Link>
                  </>
                )}
              </p>

              <div className="text-center text-xs text-gray-400 dark:text-gray-500">
                {role === 'merchant' ? (
                  <span>Merchant Portal</span>
                ) : (
                  <span>Developer Portal</span>
                )}
              </div>
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