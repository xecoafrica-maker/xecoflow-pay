// src/app/(auth)/login/page.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  CheckCircle2,
} from 'lucide-react';
import { useActivityLogger } from '@/hooks/useActivityLogger';

// ─── Constants ──────────────────────────────────────────────────────
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const TOAST_DURATION = 5000;
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days (default)
const REMEMBER_ME_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

// ─── Types ──────────────────────────────────────────────────────────
interface LoginAttempt {
  count: number;
  timestamp: number;
  lockedUntil?: number;
}

type ToastType = 'error' | 'warning' | 'info' | 'success';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

// ─── Toast Component ────────────────────────────────────────────────
function Toast({
  type,
  title,
  message,
  onClose,
}: {
  type: ToastType;
  title: string;
  message: string;
  onClose: () => void;
}) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    error: {
      bg: 'bg-red-50 dark:bg-red-950/30',
      border: 'border-red-200 dark:border-red-800',
      icon: 'text-red-500',
      title: 'text-red-700 dark:text-red-400',
      message: 'text-red-600 dark:text-red-300',
      bar: 'bg-red-500',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'text-amber-500',
      title: 'text-amber-700 dark:text-amber-400',
      message: 'text-amber-600 dark:text-amber-300',
      bar: 'bg-amber-500',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'text-blue-500',
      title: 'text-blue-700 dark:text-blue-400',
      message: 'text-blue-600 dark:text-blue-300',
      bar: 'bg-blue-500',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: 'text-emerald-500',
      title: 'text-emerald-700 dark:text-emerald-400',
      message: 'text-emerald-600 dark:text-emerald-300',
      bar: 'bg-emerald-500',
    },
  };

  const style = styles[type];
  const Icon =
    type === 'success' ? CheckCircle2 :
    type === 'error' ? AlertTriangle :
    AlertCircle;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ${
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      <div
        className={`p-4 ${style.bg} border ${style.border} rounded-xl shadow-lg flex items-start gap-3 relative overflow-hidden`}
      >
        <div
          className={`absolute bottom-0 left-0 h-1 ${style.bar} animate-shrink`}
          style={{ animationDuration: `${TOAST_DURATION}ms` }}
        />
        <Icon className={`w-5 h-5 ${style.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${style.title}`}>{title}</p>
          <p className={`text-sm ${style.message}`}>{message}</p>
        </div>
        <button
          onClick={() => {
            setIsExiting(true);
            setTimeout(onClose, 300);
          }}
          className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { log, ActivityActions } = useActivityLogger();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validation / errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  // Lockout
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(MAX_LOGIN_ATTEMPTS);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastId = useRef(0);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Helpers ──────────────────────────────────────────────────────
  const showToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = String(++toastId.current);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const formatLockoutTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0 && secs > 0) {
      return `${mins}m ${secs}s`;
    } else if (mins > 0) {
      return `${mins}m`;
    }
    return `${secs}s`;
  };

  const getAttemptKey = (emailValue: string) =>
    `login_attempts_${emailValue.trim().toLowerCase() || 'anonymous'}`;

  // ─── Lockout Logic ────────────────────────────────────────────────
  const startLockTimer = useCallback((lockedUntil: number) => {
    if (lockTimerRef.current) clearInterval(lockTimerRef.current);

    lockTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setIsLocked(false);
        setLockoutTimeLeft(0);
        if (lockTimerRef.current) clearInterval(lockTimerRef.current);
        localStorage.removeItem(getAttemptKey(email));
        setAttemptsRemaining(MAX_LOGIN_ATTEMPTS);
      } else {
        setLockoutTimeLeft(remaining);
      }
    }, 1000);
  }, [email]);

  const resetAttempts = useCallback(() => {
    localStorage.removeItem(getAttemptKey(email));
    setAttemptsRemaining(MAX_LOGIN_ATTEMPTS);
    setIsLocked(false);
    setLockoutTimeLeft(0);
  }, [email]);

  const trackFailedAttempt = useCallback(() => {
    const key = getAttemptKey(email);
    let data: LoginAttempt = { count: 0, timestamp: Date.now() };

    try {
      const stored = localStorage.getItem(key);
      if (stored) data = JSON.parse(stored);
    } catch {
      // ignore
    }

    data.count += 1;
    data.timestamp = Date.now();

    if (data.count >= MAX_LOGIN_ATTEMPTS) {
      data.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      setIsLocked(true);
      startLockTimer(data.lockedUntil);
      setFormError('Too many failed attempts. Please try again in 15 minutes.');
      showToast('error', 'Account Locked', 'Too many failed attempts. Please try again in 15 minutes.');
    }

    localStorage.setItem(key, JSON.stringify(data));
    setAttemptsRemaining(Math.max(0, MAX_LOGIN_ATTEMPTS - data.count));
  }, [email, showToast, startLockTimer]);

  // Load existing lockout state when email changes
  useEffect(() => {
    const key = getAttemptKey(email);
    try {
      const stored = localStorage.getItem(key);
      if (!stored) {
        setAttemptsRemaining(MAX_LOGIN_ATTEMPTS);
        setIsLocked(false);
        return;
      }

      const data: LoginAttempt = JSON.parse(stored);

      if (data.lockedUntil && data.lockedUntil > Date.now()) {
        setIsLocked(true);
        setLockoutTimeLeft(Math.ceil((data.lockedUntil - Date.now()) / 1000));
        startLockTimer(data.lockedUntil);
      } else if (Date.now() - data.timestamp > LOCKOUT_DURATION_MS) {
        resetAttempts();
      } else {
        setAttemptsRemaining(Math.max(0, MAX_LOGIN_ATTEMPTS - data.count));
      }
    } catch {
      // ignore
    }

    return () => {
      if (lockTimerRef.current) clearInterval(lockTimerRef.current);
    };
  }, [email, startLockTimer, resetAttempts]);

  // ─── Validation ───────────────────────────────────────────────────
  const validateForm = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setFormError('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      valid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      valid = false;
    }

    return valid;
  };

  // ─── Submit Handler ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setEmailError('');
    setPasswordError('');

    if (isLocked) {
      setFormError(`Too many failed attempts. Please try again in ${formatLockoutTime(lockoutTimeLeft)}`);
      return;
    }

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      // ── ERROR HANDLING: 400 Bad Request ──
      if (response.status === 400) {
        setFormError('Please enter both email and password.');
        setLoading(false);
        return;
      }

      // ── ERROR HANDLING: 401 Unauthorized ──
      if (response.status === 401) {
        setFormError('Invalid email or password. Please check your credentials.');
        trackFailedAttempt();
        setLoading(false);
        return;
      }

      // ── ERROR HANDLING: 429 Too Many Requests ──
      if (response.status === 429) {
        const retryAfter = data.retryAfter || 60;
        setFormError(`Too many login attempts. Please wait ${retryAfter} seconds before trying again.`);
        setLoading(false);
        return;
      }

      // ── ERROR HANDLING: 500+ Server Errors ──
      if (response.status >= 500) {
        setFormError('We are experiencing technical difficulties. Please try again later.');
        setLoading(false);
        return;
      }

      // ── Extract token ──
      const token =
        data.token ||
        data.accessToken ||
        data.data?.accessToken ||
        data.data?.token;

      if (!token) {
        setFormError('Invalid credentials. Please try again.');
        trackFailedAttempt();
        setLoading(false);
        return;
      }

      const userData = data.user || data.data || data;
      const user = {
        userId: Number(userData.userId || userData.user_id || 0),
        email: userData.email || email,
        role: userData.role || 'merchant',
        businessName: userData.businessName || userData.business_name || '',
      };

      // Session duration based on "Remember me"
      const duration = rememberMe
        ? REMEMBER_ME_DURATION_SECONDS
        : SESSION_DURATION_SECONDS;

      const expiryTime = Date.now() + duration * 1000;

      localStorage.setItem('xecoflow_token', token);
      localStorage.setItem('token_expiry', String(expiryTime));
      localStorage.setItem('session_start', String(Date.now()));
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('user_role', user.role);

      // Cookie
      const isSecure = process.env.NODE_ENV === 'production';
      document.cookie = `auth_token=${token}; path=/; max-age=${duration}; SameSite=Lax;${isSecure ? ' Secure;' : ''}`;

      // Clear failed attempts
      localStorage.removeItem(getAttemptKey(email));
      setAttemptsRemaining(MAX_LOGIN_ATTEMPTS);
      setIsLocked(false);

      await log(
        ActivityActions.LOGIN,
        `Successful login for ${user.email} (Role: ${user.role})`
      );

      showToast('success', 'Welcome Back!', `Signed in as ${user.role}`);

      setTimeout(() => {
        router.push(user.role === 'developer' ? '/developer/dashboard' : '/dashboard');
      }, 400);

    } catch (err: any) {
      console.error('Login error:', err);
      
      // ── SPECIFIC ERROR MESSAGES ──
      if (err.name === 'AbortError' || err.message?.includes('abort')) {
        setFormError('Request timed out. Please check your connection and try again.');
      } else if (err.name === 'TypeError' || err.message?.includes('fetch')) {
        setFormError('Unable to connect to server. Please check your internet connection.');
      } else {
        setFormError('Something went wrong. Please try again or contact support if the issue persists.');
      }
      
      await log(
        'Failed login attempt',
        `Failed login for ${email}: ${err.message || 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0a2540] dark:to-[#0f1f3a] flex items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Toasts */}
      {toasts.map((t) => (
        <Toast
          key={t.id}
          type={t.type}
          title={t.title}
          message={t.message}
          onClose={() => removeToast(t.id)}
        />
      ))}

      <div className="w-full max-w-[1000px] flex flex-col lg:flex-row bg-white dark:bg-[#0f1f3a] rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
        
        {/* ── LEFT PANEL ── */}
        <div className="lg:w-1/2 bg-[#0a2540] p-8 sm:p-10 md:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden min-h-[400px] lg:min-h-[520px]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-[#0a2540] to-emerald-900/20" />
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col h-full justify-between">
            {/* Brand */}
            <div>
              <Link href="/" className="inline-block">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Xeco<span className="text-emerald-400">Flow</span>
                </h1>
              </Link>
            </div>

            {/* ── FIXED: Hero Text with "Automated compliance." on ONE LINE ── */}
            <div className="space-y-4 py-6 lg:py-8">
              <h2 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-white leading-[1.2] tracking-tight">
                <div className="w-full">Smart payments.</div>
                <div className="w-full text-emerald-400 whitespace-nowrap">Automated compliance.</div>
                <div className="w-full text-lg sm:text-xl xl:text-2xl font-medium text-slate-300 mt-1">
                  for African businesses.
                </div>
              </h2>
              <div className="text-slate-400 text-sm sm:text-base max-w-sm leading-relaxed space-y-1 mt-2">
                <div>Accept M-PESA, Airtel Money, and cards while</div>
                <div>XecoFlow handles your cashflow and tax filing</div>
                <div>on autopilot.</div>
              </div>
            </div>

            {/* ── Accepted Channels ── */}
            <div className="flex flex-col gap-2.5 pt-4 border-t border-white/10">
              <span className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase tracking-[0.15em]">
                Accepted Channels
              </span>
              
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                <span className="bg-white/5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors text-center whitespace-nowrap">
                  M-PESA
                </span>
                <span className="bg-white/5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors text-center whitespace-nowrap">
                  Airtel Money
                </span>
                <span className="bg-white/5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors text-center whitespace-nowrap">
                  Visa
                </span>
                <span className="bg-white/5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors text-center whitespace-nowrap">
                  Mastercard
                </span>
                <span className="bg-white/5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors text-center whitespace-nowrap">
                  Banks
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="lg:w-1/2 p-6 sm:p-8 md:p-10 lg:p-12 bg-white dark:bg-[#0f1f3a] flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8">
              <Link href="/" className="inline-block">
                <h1 className="text-2xl font-bold text-[#0a2540] dark:text-white tracking-tight">
                  Xeco<span className="text-emerald-500">Flow</span>
                </h1>
              </Link>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Sign in to your XecoFlow account
              </p>
            </div>

            {/* ── FORM-LEVEL ERROR ── */}
            {formError && (
              <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3.5 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Error</p>
                  <p className="text-sm text-red-600 dark:text-red-300">{formError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* ── EMAIL FIELD ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      emailError ? 'text-red-400' : 'text-gray-400'
                    }`}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                      if (formError) setFormError('');
                    }}
                    placeholder="Enter your email address"
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#1a2a4a] border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50 text-gray-900 dark:text-white ${
                      emailError
                        ? 'border-red-300 dark:border-red-700 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                    required
                    autoFocus
                    disabled={isLocked || loading}
                    autoComplete="email"
                  />
                </div>
                {emailError && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* ── PASSWORD FIELD ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      passwordError ? 'text-red-400' : 'text-gray-400'
                    }`}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                      if (formError) setFormError('');
                    }}
                    placeholder="Enter your password"
                    className={`w-full pl-10 pr-11 py-3 bg-gray-50 dark:bg-[#1a2a4a] border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50 text-gray-900 dark:text-white ${
                      passwordError
                        ? 'border-red-300 dark:border-red-700 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-gray-200 dark:border-gray-700 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                    required
                    disabled={isLocked || loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    disabled={isLocked || loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {passwordError}
                  </p>
                )}
              </div>

              {/* ── REMEMBER ME & FORGOT PASSWORD ── */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={isLocked || loading}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Remember for 30 days
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* ── ATTEMPTS REMAINING ── */}
              {!isLocked && attemptsRemaining < MAX_LOGIN_ATTEMPTS && attemptsRemaining > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    {attemptsRemaining} login attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
                  </span>
                </div>
              )}

              {/* ── SUBMIT BUTTON ── */}
              {isLocked ? (
                <div className="w-full py-3.5 bg-gray-400 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                  <Clock className="w-4 h-4" />
                  Try again in {formatLockoutTime(lockoutTimeLeft)}
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
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

            {/* ── FOOTER ── */}
            <div className="mt-6 space-y-3.5">
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                New to XecoFlow?{' '}
                <Link
                  href="/signup"
                  className="font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 inline-flex items-center gap-1"
                >
                  Create account
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </p>
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="text-indigo-500 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-indigo-500 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-shrink {
          animation: shrink linear forwards;
        }
      `}</style>
    </div>
  );
}