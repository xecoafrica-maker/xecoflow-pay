// src/app/(auth)/reset-password/page.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const linkInvalid = !token || !email;

  // ─── Password strength ─────────────────────────────────────────
  const strength = (() => {
    if (!newPassword) return { score: 0, label: '', color: '' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (/[A-Za-z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword)) score++;
    if (/[@$!%*#?&]/.test(newPassword)) score++;

    if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score === 2) return { score, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 3) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  })();

  const passwordsMatch = !!(newPassword && confirmPassword && newPassword === confirmPassword);
  const passwordsDontMatch = !!(confirmPassword && newPassword !== confirmPassword);

  // ─── Auto-redirect after success ───────────────────────────────
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => router.push('/login'), 2500);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (passwordsDontMatch) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('Password must be at least 8 characters and contain both letters and numbers.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.message || 'Could not reset your password. Please try again.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">

        {/* ── LEFT PANEL – Brand ── */}
        <div className="lg:w-1/2 bg-[#0a2540] p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden min-h-[400px]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-[#0a2540] to-emerald-900/20" />
          <div className="absolute top-[-100px] right-[-100px] w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-100px] left-[-100px] w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <Link href="/" className="inline-block">
                <h1 className="text-2xl font-bold text-white">
                  Xeco<span className="text-emerald-400">Flow</span>
                </h1>
              </Link>
            </div>

            <div className="space-y-4 py-8">
              <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                Create a new
                <br />
                password
                <br />
                <span className="text-emerald-400">for your account.</span>
              </h2>
              <p className="text-slate-400 text-base max-w-sm">
                Choose a strong password to keep your account secure.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap pt-4 border-t border-white/10">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Security</span>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="bg-white/5 px-3 py-1 rounded-full text-xs">Encrypted</span>
                <span className="bg-white/5 px-3 py-1 rounded-full text-xs">One-time link</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL – Form ── */}
        <div className="lg:w-1/2 p-8 lg:p-12 bg-white">
          <div className="max-w-sm mx-auto w-full">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8">
              <Link href="/" className="inline-block">
                <h1 className="text-2xl font-bold text-[#0a2540]">
                  Xeco<span className="text-emerald-500">Flow</span>
                </h1>
              </Link>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {linkInvalid
                  ? 'Invalid reset link'
                  : success
                    ? 'Password updated!'
                    : 'Set new password'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {linkInvalid
                  ? 'This link is missing required information.'
                  : success
                    ? 'You can now sign in with your new password.'
                    : 'Your new password must be at least 8 characters.'}
              </p>
            </div>

            {/* ── Invalid Link State ── */}
            {linkInvalid && (
              <div className="space-y-5">
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Link is incomplete</p>
                    <p className="text-sm text-red-600 mt-1">
                      This password reset link is missing a token or email. Please request a new one.
                    </p>
                  </div>
                </div>
                <Link
                  href="/forgot-password"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2"
                >
                  Request new reset link <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* ── Success State ── */}
            {!linkInvalid && success && (
              <div className="text-center space-y-4 py-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <p className="text-sm text-gray-600 max-w-sm mx-auto">
                  Your password has been reset successfully. Redirecting you to sign in…
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/10"
                >
                  Sign in <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {/* ── Form State ── */}
            {!linkInvalid && !success && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700">Error</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                )}

                {/* Email reminder */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <p className="text-xs text-slate-600 truncate">
                    Resetting password for <strong className="text-slate-900">{email}</strong>
                  </p>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    New password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Enter new password"
                      className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      required
                      minLength={8}
                      autoFocus
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {newPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{ width: `${(strength.score / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-medium min-w-[50px] text-right">
                        {strength.label}
                      </span>
                    </div>
                  )}

                  <p className="mt-1 text-xs text-gray-400">
                    At least 8 characters, with letters and numbers.
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="Confirm new password"
                      className={`w-full pl-10 pr-11 py-3 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all ${
                        passwordsDontMatch
                          ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                          : passwordsMatch
                            ? 'border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-500'
                            : 'border-gray-200 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2"
                      tabIndex={-1}
                    >
                      {showConfirm ? (
                        <EyeOff className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                  {passwordsDontMatch && (
                    <p className="text-xs text-red-500 mt-1.5">Passwords do not match.</p>
                  )}
                  {passwordsMatch && (
                    <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!newPassword || !confirmPassword || loading || passwordsDontMatch}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      Reset password <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-gray-500">
              Remember your password?{' '}
              <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Wrap in Suspense (required for useSearchParams in Next.js App Router) ──
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}