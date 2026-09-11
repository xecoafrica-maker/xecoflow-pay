// src/app/(auth)/forgot-password/page.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Mail, Hash, ArrowRight, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [merchantId, setMerchantId] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchantId.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Could not process your request. Please try again.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
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
                Reset your
                <br />
                password
                <br />
                <span className="text-emerald-400">securely.</span>
              </h2>
              <p className="text-slate-400 text-base max-w-sm">
                Enter your Merchant ID and email. We'll send you a link to reset your password.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap pt-4 border-t border-white/10">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Security</span>
              <div className="flex items-center gap-3 text-sm text-slate-300">
                <span className="bg-white/5 px-3 py-1 rounded-full text-xs">Encrypted</span>
                <span className="bg-white/5 px-3 py-1 rounded-full text-xs">Secure link</span>
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
                {!submitted ? 'Forgot password?' : 'Check your inbox'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {!submitted
                  ? 'Enter your Merchant ID and email to receive a reset link.'
                  : 'If your details match our records, you will receive a reset link shortly.'}
              </p>
            </div>

            {/* Error banner */}
            {error && !submitted && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Merchant ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Merchant ID
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={merchantId}
                      onChange={(e) => {
                        setMerchantId(e.target.value.replace(/\D/g, ''));
                        if (error) setError('');
                      }}
                      placeholder="e.g. 250084"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      required
                      autoFocus
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Find this on your dashboard or any receipt from XecoFlow.
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      required
                      disabled={loading}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Use the email associated with your merchant account.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={!email || !merchantId || loading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send reset link <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-6">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 max-w-sm mx-auto">
                    We've received your request. If the details match our records, a password reset link will arrive at{' '}
                    <strong className="text-gray-900">{email}</strong> shortly.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setEmail('');
                        setMerchantId('');
                        setError('');
                      }}
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      try again
                    </button>
                    .
                  </p>
                </div>
              </div>
            )}

            {/* Sign in link */}
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